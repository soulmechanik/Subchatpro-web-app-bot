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
          <div className={styles.orbit}>
            <div className={styles.orbitCircle}></div>
            <div className={styles.orbitCircle}></div>
            <div className={styles.orbitCircle}></div>
            <div className={styles.centralBall}></div>
          </div>
          <h2 className={styles.title}>Verifying your payment...</h2>
          <p className={styles.subtitle}>Please wait while we process your transaction</p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className={styles.successContainer}>
          <div className={styles.confetti}></div>
          <div className={styles.confetti}></div>
          <div className={styles.confetti}></div>
          <div className={styles.confetti}></div>
          <div className={styles.confetti}></div>
          
          <div className={styles.checkmark}>
            <svg className={styles.checkmarkIcon} viewBox="0 0 52 52">
              <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
              <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          
          <h2 className={styles.title}>🎉 Payment Successful!</h2>
          <p className={styles.subtitle}>Thank you for your payment. Your subscription is now active!</p>

          {groupLink && (
            <a
              href={groupLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.joinButton}
            >
              <span>Join Group</span>
              <svg className={styles.buttonIcon} viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
              </svg>
            </a>
          )}
        </div>
      )}

      {status === 'failed' && (
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            <svg viewBox="0 0 52 52">
              <circle className={styles.errorCircle} cx="26" cy="26" r="25" fill="none"/>
              <path className={styles.errorLine1} d="M16 16 36 36" fill="none"/>
              <path className={styles.errorLine2} d="M16 36 36 16" fill="none"/>
            </svg>
          </div>
          <h2 className={styles.title}>⚠️ Payment Failed or Incomplete</h2>
          <p className={styles.subtitle}>We couldn't verify your payment. Please try again or contact support.</p>
          <button className={styles.retryButton}>
            Try Again
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            <svg viewBox="0 0 52 52">
              <circle className={styles.errorCircle} cx="26" cy="26" r="25" fill="none"/>
              <path className={styles.errorExclamation} d="M26 15v16" fill="none"/>
              <circle className={styles.errorDot} cx="26" cy="37" r="2"/>
            </svg>
          </div>
          <h2 className={styles.title}>❌ Error Verifying Payment</h2>
          <p className={styles.subtitle}>{errorMessage}</p>
          <button className={styles.retryButton}>
            Retry Verification
          </button>
        </div>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className={styles.loading}>
        <div className={styles.orbit}>
          <div className={styles.orbitCircle}></div>
          <div className={styles.orbitCircle}></div>
          <div className={styles.orbitCircle}></div>
          <div className={styles.centralBall}></div>
        </div>
        <h2 className={styles.title}>Loading...</h2>
      </div>
    }>
      <PaymentChecker />
    </Suspense>
  );
}