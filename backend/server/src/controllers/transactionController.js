import mongoose from 'mongoose';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import moment from 'moment';
import Transaction from '../models/transactionModel.js';
import { convertCurrencyToINR } from '../utils/currencyConverter.js';

const upload = multer({ dest: 'uploads/' });

export const uploadFile = async (req, res) => {
  const file = req.file;

  if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
  }

  const results = [];
  const rows = [];

  const parseResults = new Promise((resolve, reject) => {
      const promises = [];

      fs.createReadStream(file.path)
      .pipe(csvParser())
      .on('data', (row) => {
          const rowPromise = (async () => {
              try {
                  // console.log('Parsed row:', row);

                  const { Date: transactionDate, Description, Amount, Currency } = row;

                  if (!transactionDate) {
                      console.error('Date field is missing or undefined');
                      return;
                  }

                  const parsedDate = moment(transactionDate, 'DD-MM-YYYY').toDate();
                  // console.log('Parsed date:', parsedDate);

                  if (isNaN(parsedDate.getTime())) {
                      console.error('Invalid date format:', transactionDate);
                      return;
                  }

                  const amount = parseFloat(Amount);
                  // console.log('Parsed amount:', amount);

                  if (isNaN(amount) || amount <= 0) {
                      console.error('Invalid amount:', Amount);
                      return;
                  }

                  if (!Currency) {
                      console.error('Currency is missing or undefined');
                      return;
                  }

                  try {
                      const convertedAmount = await convertCurrencyToINR(amount, Currency);

                      rows.push({
                          date: parsedDate,
                          description: Description,
                          amount: amount,
                          currency: Currency,
                          convertedAmount,
                      });
                      

                  } catch (conversionError) {
                      console.error('Currency conversion error:', conversionError);
                    
                  }

              } catch (rowError) {
                  console.error('Error processing row:', rowError);
                  
              }
          })();

          promises.push(rowPromise);
      })
      .on('end', async () => {
          try {
            
              await Promise.all(promises);
              resolve(rows);
          } catch (error) {
              reject(error);
          }
      })
      .on('error', (streamError) => {
          reject(streamError);
      });
  });

  try {
      const processedResults = await parseResults;

      if (processedResults.length > 0) {
          try {
              await Transaction.insertMany(processedResults);
              fs.unlinkSync(file.path); 
              res.status(201).json({ message: 'File processed and transactions saved' });
          } catch (dbError) {
              console.error('Database error:', dbError);
              res.status(500).json({ message: 'Error saving transactions', error: dbError.message });
          }
      } else {
          res.status(400).json({ message: 'No valid transactions to save' });
      }
  } catch (parseError) {
      console.error('File processing error:', parseError);
      res.status(500).json({ message: 'Error processing file', error: parseError.message });
  }
};


// export const getTransactions = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         if (page < 1 || limit < 1) return res.status(400).json({ message: 'Invalid pagination parameters' });

//         const transactions = await Transaction.find()
//             .skip((page - 1) * limit)
//             .limit(limit);
//         res.status(200).json(transactions);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

export const insertTransaction = async (req, res) => {
    try {
        const { date, description, amount, currency } = req.body;

        if (!date || !amount || !currency) {
            return res.status(400).json({ message: 'Date, amount, and currency are required' });
        }

        const parsedDate = moment(date, 'DD-MM-YYYY').toDate();

        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const convertedAmount = await convertCurrencyToINR(parsedAmount, currency);

        const transaction = new Transaction({
            date: parsedDate,
            description,
            amount: parsedAmount,
            currency,
            convertedAmount,
        });

        const savedTransaction = await transaction.save();
        res.status(201).json(savedTransaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// export const insertTransaction = async (req, res) => {
//     try {
//         const transaction = new Transaction(req.body);
//         const savedTransaction = await transaction.save();
//         res.status(201).json(savedTransaction);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

export const updateTransaction = async (req, res) => {
    try {
        const transactionId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(400).json({ message: 'Invalid transaction ID' });
        }

        const updatedTransaction = await Transaction.findByIdAndUpdate(transactionId, req.body, { new: true });
        if (!updatedTransaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.status(200).json(updatedTransaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const transactionId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(400).json({ message: 'Invalid transaction ID' });
        }

        const deletedTransaction = await Transaction.findByIdAndDelete(transactionId);
        if (!deletedTransaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.status(204).json({ message: 'Transaction deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// export const getTransactions = async (req, res) => {
//   try {
//       const { startDate, endDate, minAmount, maxAmount, description } = req.query;

//       const filter = {};

//       // Date Range Filtering
//       if (startDate || endDate) {
//           filter.date = {};
//           if (startDate) {
//               filter.date.$gte = new Date(startDate); // Parsing startDate as ISO 8601
//           }
//           if (endDate) {
//               filter.date.$lte = new Date(endDate); // Parsing endDate as ISO 8601
//           }
//       }

//       // Amount Range Filtering
//       if (minAmount || maxAmount) {
//           filter.amount = {};
//           if (minAmount) {
//               filter.amount.$gte = parseFloat(minAmount);
//           }
//           if (maxAmount) {
//               filter.amount.$lte = parseFloat(maxAmount);
//           }
//       }

//       // Description Filtering
//       if (description) {
//           filter.description = { $regex: description, $options: 'i' }; // Case-insensitive regex match
//       }

//       const page = parseInt(req.query.page) || 1;
//       const limit = parseInt(req.query.limit) || 10;
//       if (page < 1 || limit < 1) return res.status(400).json({ message: 'Invalid pagination parameters' });

//       const transactions = await Transaction.find(filter)
//           .skip((page - 1) * limit)
//           .limit(limit);

//       res.status(200).json(transactions);
//   } catch (error) {
//       res.status(500).json({ message: error.message });
//   }
// };

export const getTransactions = async (req, res) => {
  try {
    const { startDate, endDate, minAmount, maxAmount, description } = req.query;

    const filter = {};

    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate); 
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate); 
      }
    }

    
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) {
        filter.amount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        filter.amount.$lte = parseFloat(maxAmount);
      }
    }

    
    if (description) {
      filter.description = { $regex: description, $options: 'i' }; 
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (page < 1 || limit < 1) return res.status(400).json({ message: 'Invalid pagination parameters' });

    
    const totalCount = await Transaction.countDocuments(filter);


    const transactions = await Transaction.find(filter)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      total: totalCount,
      transactions: transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



