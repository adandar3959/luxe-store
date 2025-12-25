const Newsletter = require('../models/newsletter');
const nodemailer = require('nodemailer');

// 1. Save subscriber (Public)
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

// 2. Get all subscribers (Admin Only)
exports.getSubscribers = async (req, res) => {
    try {
        const list = await Newsletter.find().sort({ subscribedAt: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3. Send Mass Email (Admin Only)
exports.sendMassEmail = async (req, res) => {
    const { subject, message } = req.body;
    try {
        const subscribers = await Newsletter.find();
        const emails = subscribers.map(s => s.email);

        // Setup Nodemailer (Use your Gmail or SMTP)
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: '"LUXE Clothing" <noreply@luxe.com>',
            bcc: emails, // Use BCC so subscribers can't see each other's emails
            subject: subject,
            text: message,
            html: `<b>${message}</b>`
        });

        res.json({ message: "Emails sent to all subscribers!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Add this to your newsletter controller
exports.deleteSubscriber = async (req, res) => {
    try {
        await Newsletter.findByIdAndDelete(req.params.id);
        res.json({ message: "Subscriber removed." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};