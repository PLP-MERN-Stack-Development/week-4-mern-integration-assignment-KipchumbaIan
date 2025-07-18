const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Import routes
const postRoutes = require('./routes/posts');
const categoryRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use(errorHandler);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});