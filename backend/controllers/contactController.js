const ContactMessage = require('../models/ContactMessage');

exports.submitContactMessage = async (req, res) => {
  try {
    const { firstName, lastName, email, message } = req.body;
    
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const newMessage = new ContactMessage({
      firstName,
      lastName,
      email,
      message
    });

    await newMessage.save();

    res.status(201).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};
