import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Container,
  Typography,
  Grid,
  TablePagination,
  Snackbar,
  Alert,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import axios from 'axios';
import UploadIcon from '@mui/icons-material/Upload';

const API_URL = 'http://localhost:5000/api'; // Backend URL

const TransactionTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success', 'error'

  useEffect(() => {
    fetchTransactions();
  }, [page, rowsPerPage]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/transactions`, {
        params: {
          page: page + 1, // Backend expects 1-based page index
          limit: rowsPerPage,
        },
      });
      console.log('API Response:', response.data);
      setTransactions(response.data.transactions || []);
      setTotalTransactions(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        await axios.post(`${API_URL}/transactions/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        handleSnackbarOpen('File uploaded successfully');
        fetchTransactions();
      } catch (error) {
        console.error('Error uploading file:', error);
        handleSnackbarOpen('Error uploading file', 'error');
      }
    }
  };

  const handleAddTransaction = () => {
    setIsEdit(false);
    setCurrentTransaction({ date: '', description: '', amount: '', currency: '' });
    setOpen(true);
  };

  const handleEditTransaction = (transaction) => {
    setIsEdit(true);
    setCurrentTransaction(transaction);
    setOpen(true);
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await axios.delete(`${API_URL}/transactions/${id}`);
      handleSnackbarOpen('Transaction deleted successfully');
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      handleSnackbarOpen('Error deleting transaction', 'error');
    }
  };

  const handleSaveTransaction = async () => {
    try {
      if (isEdit) {
        await axios.put(`${API_URL}/transactions/${currentTransaction._id}`, currentTransaction);
        handleSnackbarOpen('Transaction updated successfully');
      } else {
        await axios.post(`${API_URL}/transactions`, currentTransaction);
        handleSnackbarOpen('Transaction added successfully');
      }
      fetchTransactions();
      setOpen(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
      handleSnackbarOpen('Error saving transaction', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentTransaction((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSnackbarOpen = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Transaction Management
      </Typography>
      <Grid container spacing={2} justifyContent="space-between" alignItems="center">
        <Grid item>
          <Button variant="contained" color="primary" component="label" startIcon={<UploadIcon />}>
            Upload CSV
            <input type="file" hidden onChange={handleUpload} />
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="secondary" onClick={handleAddTransaction}>
            Add Transaction
          </Button>
        </Grid>
      </Grid>
      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Converted Amount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>{transaction.currency}</TableCell>
                  <TableCell>{transaction.convertedAmount}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEditTransaction(transaction)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="secondary" onClick={() => handleDeleteTransaction(transaction._id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={totalTransactions}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            name="date"
            value={currentTransaction?.date || ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            name="description"
            value={currentTransaction?.description || ''}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            name="amount"
            value={currentTransaction?.amount || ''}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Currency"
            type="text"
            fullWidth
            name="currency"
            value={currentTransaction?.currency || ''}
            onChange={handleChange}
          />
          {isEdit && currentTransaction?.convertedAmount && (
            <TextField
              margin="dense"
              label="Converted Amount"
              type="text"
              fullWidth
              value={currentTransaction.convertedAmount}
              InputProps={{
                readOnly: true,
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveTransaction} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        action={
          <Button color="inherit" onClick={handleSnackbarClose}>
            Close
          </Button>
        }
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TransactionTable;