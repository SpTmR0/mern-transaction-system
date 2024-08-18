import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  convertedAmount: { type: Number, required: true },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;

