const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const apiRoutes = require('./routes');

dotenv.config();

const app = express();

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*';

app.use(
  cors({
    origin: corsOrigin,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Scorer-Token',
      'X-Admin-Token',
    ],
  })
);
// Bumped from the 100kb default so photo uploads (base64 data URLs) fit
// comfortably. Matches MAX_PHOTO_LENGTH in utils/photo.js.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ message: 'GullyScore API is running' });
});

app.get('/health', (req, res) => {
  res.status(200).send('Server is running');
});

app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
