'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import styles from './PaymentSuccess.module.scss';

function PaymentChecker() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref');

  const [status, setStatus] = useState('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [groupLink, setGroupLink] = useState('');

  useEffect(() => {
    if (!reference && !trxref) return;

    const verifyPayment = async () => {
      try {
        const paymentReference = reference || trxref;

        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/transactions/payment/status`,
          { reference: paymentReference },
          { withCredentials: true }
        );

        console.log('✅ Payment verification result:', res.data);

        if (res.data?.payment?.status === 'success') {
          setStatus('success');
          setGroupLink(res.data.payment.groupLink || '');
        } else {
          setStatus('failed');
        }
      } catch (err) {
        console.error('❌ Error verifying payment:', err);
        setStatus('error');
        setErrorMessage(err.response?.data?.message || 'An unexpected error occurred.');
      }
    };

    verifyPayment();
  }, [reference, trxref]);

  return (
    <div className={styles.container}>
      {status === 'checking' && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <h2>Verifying your payment...</h2>
          <p>Please wait a moment.</p>
        </div>
      )}

      {status === 'success' && (
        <div className={styles.message}>
          <h2>🎉 Payment Successful!</h2>
          <p>Thank you for your payment. Your subscription is now active!</p>

          {groupLink && (
            <a
              href={groupLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.joinButton}
            >
              Join Group
            </a>
          )}
          {/* If you want you can add a note if no groupLink, but it's not necessary */}
        </div>
      )}

      {status === 'failed' && (
        <div className={styles.message}>
          <h2>⚠️ Payment Failed or Incomplete</h2>
          <p>We couldn't verify your payment. Please try again or contact support.</p>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.message}>
          <h2>❌ Error Verifying Payment</h2>
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <h2>Loading...</h2>
      </div>
    }>
      <PaymentChecker />
    </Suspense>
  );
}
