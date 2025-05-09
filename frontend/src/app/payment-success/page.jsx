import { useEffect, useState } from 'react';
import axios from 'axios';

const PaymentSuccess = () => {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      const paymentReference = new URLSearchParams(window.location.search).get('reference');
      if (!paymentReference) {
        setError('No payment reference found.');
        return;
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5002';
        const response = await axios.post(`${backendUrl}/api/transactions/payment/status`, {
          reference: paymentReference,
        });
        setPaymentStatus(response.data);
      } catch (err) {
        setError('Failed to fetch payment status.');
        console.error('Error fetching payment status:', err);
      }
    };

    fetchPaymentStatus();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (paymentStatus === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="payment-success">
      {paymentStatus.success ? (
        <div>
          <h1>Payment Successful!</h1>
          <p>Your payment for {paymentStatus.amount} has been successfully processed.</p>
          <p>Subscription ID: {paymentStatus.subscriptionId}</p>
          <p>Payment Reference: {paymentStatus.reference}</p>
        </div>
      ) : (
        <div>
          <h1>Payment Failed</h1>
          <p>There was an issue with your payment. Please try again later.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;
