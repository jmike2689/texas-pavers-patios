export default async function handler(req, res) {
    // Security check: Only allow POST requests (form submissions)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Extract the data sent from the front-end form
    const body = req.body || {};
    const { formType, name, phone, email, message, botcheck } = body;

    // HONEYPOT CHECK: Bots fill the hidden field. Pretend it worked, but don't send the email.
    if (botcheck) {
        return res.status(200).json({ success: true });
    }

    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Escape anything a visitor typed before putting it in the email
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const row = (label, value) => `<p><strong>${label}:</strong> ${esc(value) || '-'}</p>`;
    const isApplication = formType === 'application';

    const subject = isApplication
        ? `New Job Application: ${String(name).slice(0, 80)} - Texas Pools and Pavers`
        : `New Lead: ${String(name).slice(0, 80)} - Texas Pools and Pavers`;

    const details = isApplication
        ? `
            <h2 style="color: #D4AF37; text-transform: uppercase;">New Job Application</h2>
            ${row('Name', name)}
            ${row('Phone', phone)}
            ${row('Email', email)}
            ${row('City / Area', body.city)}
            ${row('Type of Work', body.position)}
            ${row('Experience', body.experience)}
            ${row("Driver's License", body.license)}
            ${row('Reliable Transportation', body.transport)}
            <p><strong>About Their Experience:</strong><br/> ${esc(message).replace(/\n/g, '<br/>') || '-'}</p>`
        : `
            <h2 style="color: #D4AF37; text-transform: uppercase;">New Consultation Request</h2>
            ${row('Name', name)}
            ${row('Phone', phone)}
            ${row('Email', email)}
            <p><strong>Project Vision:</strong><br/> ${esc(message).replace(/\n/g, '<br/>')}</p>`;

    try {
        // Send the data directly to Resend's API
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'leads@prosynctech.dev', // Your verified agency domain
                to: 'texaspaverspatios@gmail.com', // The client's receiving email
                subject,
                html: `
          <div style="font-family: sans-serif; padding: 20px; color: #111;">
            ${details}
            <hr style="border: 1px solid #eee; margin-top: 30px;" />
            <p style="font-size: 12px; color: #888;">Powered by ProSync Tech Solutions</p>
          </div>
        `
            })
        });

        if (response.ok) {
            return res.status(200).json({ success: true });
        } else {
            const errorData = await response.json();
            return res.status(400).json({ error: errorData });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
