const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const QRCode = require('qrcode');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request Body:', req.body);
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    console.log('=== MongoDB Connection Setup ===');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resq';
    console.log('Attempting to connect to MongoDB at:', mongoURI);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    console.log('MongoDB Connected Successfully');
    
    // Test the connection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

  } catch (error) {
    console.error('=== MongoDB Connection Error ===');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Handle MongoDB connection errors after initial connection
mongoose.connection.on('error', err => {
  console.error('=== MongoDB Runtime Error ===');
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    code: err.code
  });
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, attempting to reconnect...');
  connectDB();
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

// Connect to MongoDB before starting the server
connectDB().then(async () => {
  // Initialize models
  require('./models/MedicalInfo');
  
  // Routes
  app.use('/api/auth', require('./routes/auth.js'));
  app.use('/api/medical', require('./routes/medical.js'));

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('=== Global Error Handler ===');
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
}); 