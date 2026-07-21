export default async function handler(req, res) {
    // Security check: Only allow POST requests (form submissions)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Extract the data sent from the front-end form
    const { name, phone, email, message } = req.body;

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
                subject: `New Lead: ${name} - Texas Pavers & Patios`,
                html: `
          <div style="font-family: sans-serif; padding: 20px; color: #111;">
            <h2 style="color: #D4AF37; text-transform: uppercase;">New Consultation Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Project Vision:</strong><br/> ${message}</p>
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