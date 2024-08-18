import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function convertCurrencyToINR(amount, currency) {
  try {
    // Fetch the latest exchange rates relative to INR
    const response = await axios.get(process.env.API_URL);
    
    // Extract the exchange rates from the response data
    const rates = response.data.conversion_rates; // Correct key based on your response
    
    // Retrieve the exchange rate for the given currency
    const rate = rates[currency];
    
    // Check if the rate is undefined
    if (rate === undefined) {
      console.error(`Exchange rate for ${currency} not found`);
      return amount; // Return the original amount if currency is not found
    }

    // Convert the amount from the input currency to INR
    const convertedAmount = amount / rate;
    
    return convertedAmount;
  } catch (error) {
    // Log any errors that occur during the API request
    console.error('Error fetching currency rates:', error.message);
    
    // Return the original amount if there's an error
    return amount;
  }
}
