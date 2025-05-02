'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import styles from './resend-verification.module.scss';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleResendVerification = async (e) => {
    e.preventDefault();

    setStatus('loading');
    try {
      const res = await axios.post('http://localhost:5002/api/auth/resend-verification', { email });
      setStatus('success');
      setMessage(res.data.message);
    } catch (error) {
      console.error('Error resending email:', error.response?.data || error);
      setStatus('error');
      setMessage(error.response?.data?.message || 'Something went wrong.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Resend Verification Email</h1>
        <form onSubmit={handleResendVerification}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className={styles.button}>
            Resend Email
          </button>
        </form>

        {status === 'loading' && <p>Sending...</p>}
        {status === 'success' && <p>{message}</p>}
        {status === 'error' && <p>{message}</p>}
      </div>
    </div>
  );
}
