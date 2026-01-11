const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartsensrty')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  address: { type: String },
  password: { type: String, required: true },
  profileImage: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// Contact Schema
const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  relation: { type: String, required: true },
  phone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Contact = mongoose.model('Contact', contactSchema);

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, mobile, address, password, profileImage } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      mobile,
      address,
      password: hashedPassword,
      profileImage,
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to verify JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Profile route
app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile route
app.put('/api/profile', auth, async (req, res) => {
  try {
    const { name, email, mobile, address } = req.body;
    
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user,
      { name, email, mobile, address },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Placeholder routes for other APIs
app.get('/api/contacts', auth, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.user });
    res.json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/contacts', auth, async (req, res) => {
  try {
    const { name, relation, phone } = req.body;
    const contact = new Contact({
      userId: req.user,
      name,
      relation,
      phone,
    });
    await contact.save();
    res.status(201).json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/contacts/:id', auth, async (req, res) => {
  try {
    const { name, relation, phone } = req.body;
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.user },
      { name, relation, phone },
      { new: true }
    );
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/contacts/:id', auth, async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, userId: req.user });
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Chat route for Mistral AI
app.post('/api/chat', auth, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    // Prepare the prompt for Mistral AI with safety context
    const systemPrompt = `You are Smart Sentry, an AI safety assistant for a personal safety app. 
    Your role is to provide helpful, accurate information about personal safety, emergency procedures, and app features.
    
    Key guidelines:
    - Always prioritize user safety
    - Provide clear, actionable advice for emergencies
    - Be empathetic and supportive
    - Reference app features when relevant (SOS, trusted contacts, location sharing)
    - If user is in immediate danger, urge them to use SOS feature
    - Keep responses concise but informative
    - Use the provided context about user's profile and contacts when relevant
    
    User context: ${JSON.stringify(context)}
    `;
    
    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model: 'mistral-medium',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const aiResponse = response.data.choices[0].message.content;
    
    res.json({
      response: aiResponse,
      offline: false,
      model: 'mistral-ai'
    });
  } catch (error) {
    console.error('Mistral API error:', error.response?.data || error.message);
    res.status(500).json({ 
      response: "I'm having trouble connecting right now. For emergencies, please use the SOS feature.",
      offline: true,
      model: 'fallback'
    });
  }
});

app.post('/api/sos/start', auth, (req, res) => {
  res.json({ message: 'SOS logged' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} and accessible at http://192.168.1.6:${PORT}`);
});