// app/renew/[subscriptionId]/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import styles from './renewal.module.scss';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL; 

export default function RenewalPage() {
  const params = useParams();
  const subscriptionId = params?.subscriptionId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/subscribe/${subscriptionId}/renewal-details`
        );
        
        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Invalid response format');
        }
        
        setData({
          ...response.data.data,
          amount: response.data.data.amount
        });
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    };

    if (subscriptionId) fetchData();
  }, [subscriptionId]);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const response = await axios.post(
        `${API_BASE}/subscribe/${subscriptionId}/initialize-renewal`,
        {}, // Empty body since we're using URL params
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      window.location.href = response.data.paymentUrl;
    } catch (err) {
      console.error('Payment error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Payment initialization failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Loading subscription details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className={styles.primaryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Renew Your Subscription</h1>
        <p>Continue uninterrupted access to premium content</p>
      </div>

      <div className={styles.paymentCard}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Group:</span>
          <span className={styles.detailValue}>{data?.groupName || 'N/A'}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Amount:</span>
          <span className={styles.amount}>
            ₦{data?.amount?.toLocaleString('en-NG', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Expired On:</span>
          <span className={styles.detailValue}>
            {data?.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={!data || isProcessing}
        className={styles.primaryButton}
      >
        {isProcessing ? (
          <>
            <span className={styles.spinner}></span>
            Processing...
          </>
        ) : (
          'Proceed to Payment'
        )}
      </button>

      <div className={styles.securityNote}>
        <svg className={styles.lockIcon} viewBox="0 0 24 24">
          <path d="M12 1C8.676 1 6 3.676 6 7v1H4v14h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
        </svg>
        <span>Payments are securely processed by Paystack</span>
      </div>
    </div>
  );
}