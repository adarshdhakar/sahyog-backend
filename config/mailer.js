const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (email, message) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Sahyog - Volunteer Registration',
        text: message,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error; 
    }
};

module.exports = sendEmail;