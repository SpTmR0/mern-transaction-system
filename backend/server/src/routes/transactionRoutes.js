import express from 'express';
import multer from 'multer';
import { uploadFile, getTransactions, insertTransaction, updateTransaction, deleteTransaction } from '../controllers/transactionController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', getTransactions);
router.post('/', insertTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
