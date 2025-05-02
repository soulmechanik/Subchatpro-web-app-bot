const axios = require('axios');
require('dotenv').config();

// This is where your Paystack Secret Key goes
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Function to create the transfer recipient
const createTransferRecipient = async (accountHolderName, accountNumber, bankName) => {
  try {
    const response = await axios.post(
      'https://api.paystack.co/transferrecipient',
      {
        type: 'nuban',  // You may need to change this depending on the bank
        name: accountHolderName,
        account_number: accountNumber,
        bank_code: getBankCode(bankName),  // Get this function for your bank
        currency: 'NGN'
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to create transfer recipient:', error.response?.data || error.message);
  }
};

// Function to initiate the transfer
const initiateTransfer = async (recipientCode, amountInKobo, description) => {
  try {
    const response = await axios.post(
      'https://api.paystack.co/transfer',
      {
        source: 'balance',  // 'balance' for your Paystack balance or 'subaccount' for Paystack subaccounts
        amount: amountInKobo,
        recipient: recipientCode,
        reason: description || 'Payment for group subscription',
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Transfer Successful:', response.data);
  } catch (error) {
    console.error('❌ Transfer failed:', error.response?.data || error.message);
  }
};

// Helper function to get the bank code (replace with correct bank codes)
const getBankCode = (bankName) => {
  const bankCodes = {
    'Zenith Bank': '057',  // Zenith Bank valid for test mode
    'First Bank': '011',   // Example for First Bank
    'Access Bank': '044',  // Example for Access Bank
    // Add more valid bank codes here
  };
  return bankCodes[bankName] || '057'; // Default to Zenith Bank if unknown
};

// Main function to test the transfer
const main = async () => {
  console.log('✅ MongoDB connected for testing');
  
  // Simulate fetching from database (use your own database query here)
  const bankDetails = {
    accountHolderName: 'Owa Rotimi Emmanuel',
    accountNumber: '2209119206',
    bankName: 'Zenith Bank'  // Ensure this is a valid test bank name
  };

  console.log('ℹ️ Original Bank details found:', bankDetails);

  // Create the recipient with test bank details
  const recipient = await createTransferRecipient(bankDetails.accountHolderName, bankDetails.accountNumber, bankDetails.bankName);

  if (recipient) {
    console.log('✅ Recipient Created:', recipient);
    // Now initiate the transfer
    const amountInNaira = 4750;  // Amount to transfer after platform fee
    const description = 'Test Payment for group subscription';
    await initiateTransfer(recipient.recipient_code, amountInNaira * 100, description); // Convert to Kobo
  } else {
    console.log('❌ No recipient created. Aborting transfer.');
  }

  console.log('🔌 MongoDB disconnected');
};

// Run the main function
main();
