// controllers/paystackController.js

const axios = require('axios');

exports.getBanks = async (req, res) => {
  try {
    const response = await axios.get('https://api.paystack.co/bank', {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch banks' });
  }
};

exports.verifyBankAccount = async (req, res) => {
  const { account_number, bank_code } = req.body;

  // Validate input
  if (!account_number || !bank_code) {
    return res.status(400).json({ error: 'Both account_number and bank_code are required' });
  }

  if (typeof account_number !== 'string' || typeof bank_code !== 'string') {
    return res.status(400).json({ error: 'account_number and bank_code must be strings' });
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    // Paystack returns status false on failure, handle that explicitly
    if (response.data.status === false) {
      return res.status(400).json({
        error: 'Verification failed',
        message: response.data.message || 'Unknown error from Paystack'
      });
    }

    // Success, send data to client
    res.json(response.data);
  } catch (error) {
    // Log detailed error info for debugging
    console.error('Error verifying bank account:', {
      message: error.message,
      responseData: error.response?.data,
      status: error.response?.status
    });

    // Return useful info for frontend, but not sensitive details
    res.status(500).json({
      error: 'Failed to verify account details',
      details: error.response?.data?.message || error.message
    });
  }
};
