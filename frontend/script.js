let sessionId = '';
let otpExpiryTime = 2 * 60 * 1000; // 2 minutes in milliseconds
let otpGeneratedTime = 0; // To track when the OTP was generated

async function sendOTP() {
  const phoneNumber = document.getElementById('phoneNumber').value;
  const response = await fetch(`/send-otp?phoneNumber=${phoneNumber}`);
  const data = await response.json();

  if (data.Status === 'Success') {
    sessionId = data.Details;
    otpGeneratedTime = Date.now(); // Record the OTP generation time
    document.getElementById('otpSection').style.display = 'block';
    document.getElementById('message').innerText = 'OTP sent successfully!';
    document.getElementById('resendButton').style.display = 'none'; // Hide resend button initially
  } else {
    document.getElementById('message').innerText = 'Please Try Again After 24 Hours';
  }
}

async function verifyOTP() {
  const otp = document.getElementById('otp').value;
  const currentTime = Date.now();

  if (currentTime - otpGeneratedTime > otpExpiryTime) {
    // If OTP expired, show message and Resend OTP button
    document.getElementById('message').innerText = 'OTP has expired. Please request a new OTP.';
    document.getElementById('resendButton').style.display = 'block';
    return;
  }

  const response = await fetch(`/verify-otp?sessionId=${sessionId}&otp=${otp}`);
  const data = await response.json();

  if (data.Status === 'Success') {
    document.getElementById('message').innerText = 'OTP verified successfully!';
  } else {
    document.getElementById('message').innerText = 'Invalid OTP. Please try again.';
  }
}
