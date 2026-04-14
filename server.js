const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // GitHub Pages se request allow karne ke liye

// OTP store karne ke liye (temporary)
const otpStore = {};

// Gmail transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'TUMHARI_GMAIL@gmail.com',     // apni gmail daalo
    pass: 'TUMHARA_APP_PASSWORD'          // Gmail App Password (neeche explain hai)
  }
});

// OTP generate function
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
}

// Route 1: OTP bhejo
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required' });
  }

  const otp = generateOTP();
  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minute expiry
  };

  try {
    await transporter.sendMail({
      from: 'TUMHARI_GMAIL@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Your OTP Code</h2>
          <p style="font-size: 32px; font-weight: bold; color: #4F46E5;">${otp}</p>
          <p>Yeh OTP 5 minutes mein expire ho jaayega.</p>
        </div>
      `
    });

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Email send failed' });
  }
});

// Route 2: OTP verify karo
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore[email];

  if (!record) {
    return res.status(400).json({ success: false, message: 'OTP not found' });
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  delete otpStore[email];
  res.json({ success: true, message: 'OTP verified!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
