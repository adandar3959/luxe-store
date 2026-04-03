const Newsletter = require('../models/newsletter');
const nodemailer = require('nodemailer');

// Get all subscribers (Admin Only)
exports.getSubscribers = async (req, res) => {
    try {
        const list = await Newsletter.find().sort({ subscribedAt: -1 });
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Send Mass Email (Admin Only)
exports.sendMassEmail = async (req, res) => {
    const { subject, message } = req.body;

    try {
        const subscribers = await Newsletter.find();
        
        if (subscribers.length === 0) {
            return res.status(400).json({ message: "No subscribers found to email." });
        }

        const emails = subscribers.map(s => s.email);

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"LUXE Clothing" <${process.env.EMAIL_USER}>`,
            bcc: emails,
            subject: subject,
            text: message,
            html: `<div style="font-family: Arial; padding: 20px;">${message}</div>`
        });

        res.status(200).json({ message: "Newsletter sent to all subscribers!" });

    } catch (err) {
        console.error("Mail Error:", err);
        res.status(500).json({ message: "Failed to send email: " + err.message });
    }
};

// Delete Subscriber
exports.deleteSubscriber = async (req, res) => {
    try {
        await Newsletter.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Subscriber removed." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Public Subscribe
exports.subscribe = async (req, res) => {
    try {
        const { email } = req.body;
        const existing = await Newsletter.findOne({ email });
        if (existing) return res.status(400).json({ message: "Already subscribed!" });

        const newSubscriber = new Newsletter({ email });
        await newSubscriber.save();
        res.status(201).json({ message: "Subscribed successfully!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
