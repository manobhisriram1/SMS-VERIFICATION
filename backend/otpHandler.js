const axios = require('axios');
const fs = require('fs');
const path = require('path');
const API_KEY = '3f684a2e-a0e2-11ef-8b17-0200cd936042'; // Your actual API key

// Define CSV file path for storing phone number data
const CSV_FILE_PATH = path.join(__dirname, 'otp_requests.csv');

// Function to read and parse CSV data
function readCSV() {
    if (!fs.existsSync(CSV_FILE_PATH)) return {};
    const data = fs.readFileSync(CSV_FILE_PATH, 'utf8').trim().split('\n');
    const records = {};
    data.forEach(line => {
        const [phoneNumber, count, lastRequest] = line.split(',');
        records[phoneNumber] = {
            count: parseInt(count),
            lastRequest: parseInt(lastRequest),
        };
    });
    return records;
}

// Function to save updated data to the CSV file
function saveToCSV(records) {
    const data = Object.entries(records)
        .map(([phoneNumber, { count, lastRequest }]) => `${phoneNumber},${count},${lastRequest}`)
        .join('\n');
    fs.writeFileSync(CSV_FILE_PATH, data, 'utf8');
}

// Send OTP with request limit check
exports.sendOTP = async (req, res) => {
    const phoneNumber = req.query.phoneNumber;
    const records = readCSV();

    // Initialize record if phoneNumber is new
    if (!records[phoneNumber]) {
        records[phoneNumber] = { count: 0, lastRequest: 0 };
    }

    const now = Date.now();
    const timeSinceLastRequest = now - records[phoneNumber].lastRequest;

    // Reset count if it's been over 24 hours
    if (timeSinceLastRequest >= 24 * 60 * 60 * 1000) {
        records[phoneNumber].count = 0;
    }

    // Check if the user has exceeded the daily limit of 3 requests
    if (records[phoneNumber].count >= 3) {
        return res.status(429).json({ error: 'You have exceeded the limit of 3 OTP requests in 24 hours.' });
    }

    // Update count and lastRequest timestamp
    records[phoneNumber].count += 1;
    records[phoneNumber].lastRequest = now;
    saveToCSV(records);

    try {
        const response = await axios.get(`https://2factor.in/API/V1/${API_KEY}/SMS/${phoneNumber}/AUTOGEN`);
        res.json(response.data); // Return session ID to frontend
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};

// Verify OTP with expiration check
exports.verifyOTP = async (req, res) => {
    const { sessionId, otp } = req.query;
    const phoneNumber = req.query.phoneNumber;

    try {
        const response = await axios.get(`https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessionId}/${otp}`);
        if (response.data.Status === 'Success') {
            res.json(response.data); // OTP verified successfully
        } else {
            res.status(400).json({ error: 'Invalid OTP. Please try again.' });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
};
