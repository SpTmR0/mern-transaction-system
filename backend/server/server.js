import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import transactionRoutes from './src/routes/transactionRoutes.js';
import errorMiddleware from './src/middlewares/errorMidlleware.js';
import cors from 'cors';

const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1); // Exit the process with status code 1 indicating an error
}
const app= express();

app.use(cors())
// Async function to connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000
    });
    console.log('Connected to MongoDB Atlas!');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // You could implement retry logic or other error-handling mechanisms here
    process.exit(1); // Exit the application if the connection fails
  } finally {
    console.log('MongoDB connection attempt finished');
    // Any cleanup or final actions can be performed here
  }
};

connectDB();

// Middleware setup
app.use(express.json()); // For parsing application/json


// Define routes
app.use('/api/transactions', transactionRoutes);


// Global error handler
app.use(errorMiddleware);


app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

