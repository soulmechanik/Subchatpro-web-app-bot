'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import styles from './verifyEmail.module.scss';

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const id = searchParams.get('id');
  
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();

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

    if (!token || !id) {
      setStatus('missingParams');
      setMessage('Missing token or ID in the verification link.');
    } else {
      verifyEmail();
    }
  }, [token, id]);

  return (
    <div className={styles.verifyContainer}>
      {/* Display states based on status */}
      {status === 'loading' && <p className={styles.loading}>Verifying...</p>}
      {status === 'success' && (
        <div className={styles.card}>
          <h1>✅ Email Verified!</h1>
          <p>{message}</p>
          <Link href="/login" className={styles.button}>
            Go to Login Page
          </Link>
        </div>
      )}
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
      {status === 'alreadyVerified' && (
        <div className={styles.card}>
          <h1>✅ Email Already Verified</h1>
          <p>Your email is already verified. Feel free to log in.</p>
          <Link href="/login" className={styles.button}>
            Go to Login Page
          </Link>
        </div>
      )}
      {status === 'missingParams' && (
        <div className={styles.cardError}>
          <h1>❌ Missing Token or ID</h1>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
