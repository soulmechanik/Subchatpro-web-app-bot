const axios = require('axios');

const verifyPaystackPayment = async (reference) => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    return response.data; // contains status, data, etc.
  } catch (error) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    return { status: false };
  }
};

module.exports = verifyPaystackPayment;
