const express = require('express');
const path = require('path');
const otpHandler = require('./backend/otpHandler');

const app = express();
const PORT = 3000;

// Serve the index.html file at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Serve other static files (CSS, JS)
app.use(express.static(path.join(__dirname, 'frontend')));

// Endpoint to send OTP
app.get('/send-otp', otpHandler.sendOTP);

// Endpoint to verify OTP
app.get('/verify-otp', otpHandler.verifyOTP);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
