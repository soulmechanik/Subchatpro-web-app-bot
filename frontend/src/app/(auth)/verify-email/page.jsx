'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import styles from './verifyEmail.module.scss';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const id = searchParams.get('id');
  
  // Managing states
  const [status, setStatus] = useState('loading'); // loading, success, error, alreadyVerified, missingParams
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Handle email verification on component mount
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5002/api/auth/verify-email?token=${token}&id=${id}`
        );
        setStatus('success');
        setMessage(res.data.message);
      } catch (error) {
        console.error('Verification failed:', error.response?.data || error);

        // Check if the message includes 'already verified' for re-verification handling
        if (error.response?.data?.message.includes('already verified')) {
          setStatus('alreadyVerified');
        } else {
          setStatus('error');
          setMessage(
            error.response?.data?.message || 'Something went wrong during verification.'
          );
        }
      }
    };

    // If token and id are missing, set error state
    if (!token || !id) {
      setStatus('missingParams');
      setMessage('Missing token or ID in the verification link.');
    } else {
      verifyEmail();
    }
  }, [token, id]);

  return (
    <div className={styles.verifyContainer}>
      {/* Display loading state while processing the verification */}
      {status === 'loading' && <p className={styles.loading}>Verifying...</p>}

      {/* Display success message when email is verified successfully */}
      {status === 'success' && (
        <div className={styles.card}>
          <h1>✅ Email Verified!</h1>
          <p>{message}</p>
          <Link href="/login" className={styles.button}>
            Go to Login Page
          </Link>
        </div>
      )}

      {/* Display error message if verification failed */}
      {status === 'error' && (
        <div className={styles.cardError}>
          <h1>❌ Verification Failed</h1>
          <p>{message}</p>
          <button
            className={styles.button}
            onClick={() => router.push('/resend-verification')}
          >
            Resend Verification Email
          </button>
        </div>
      )}

      {/* Handle already verified email scenario */}
      {status === 'alreadyVerified' && (
        <div className={styles.card}>
          <h1>✅ Email Already Verified</h1>
          <p>Your email is already verified. Feel free to log in.</p>
          <Link href="/login" className={styles.button}>
            Go to Login Page
          </Link>
        </div>
      )}

      {/* Display missing token or ID error */}
      {status === 'missingParams' && (
        <div className={styles.cardError}>
          <h1>❌ Missing Token or ID</h1>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
