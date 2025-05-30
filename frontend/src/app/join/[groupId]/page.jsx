'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  FiLoader,
  FiUser,
  FiMail,
  FiPhone,
  FiArrowRight,
  FiSend
} from 'react-icons/fi';
import styles from './joingroup.module.scss';
import Header from '../../../components/Header/Header';

export default function JoinGroupPage() {
  const params = useParams();
  const groupId = params?.groupId;

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [telegramUsernameError, setTelegramUsernameError] = useState('');

  const [subscriberInfo, setSubscriberInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    telegramUsername: ''
  });

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/groups/${groupId}`);
        const contentType = res.headers.get('content-type');

        if (!res.ok) {
          const errData = contentType?.includes('application/json')
            ? await res.json()
            : { message: await res.text() };
          throw new Error(errData.message || 'Failed to fetch group info');
        }

        const data = await res.json();
        setGroup(data);
      } catch (err) {
        console.error('Error fetching group:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

  const formatNairaAmount = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('NGN', '₦');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'telegramUsername') {
      if (value.includes('@')) {
        setTelegramUsernameError("Please remove the '@' symbol from your username.");
      } else {
        setTelegramUsernameError('');
      }
    }

    setSubscriberInfo({
      ...subscriberInfo,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (telegramUsernameError) {
      alert('Please correct the Telegram username before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...subscriberInfo,
        groupId,
        amount: group.subscriptionPrice,
        callback_url: `${window.location.origin}/payment-success`

      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscribe/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Payment initiation failed');
      }

   window.location.href = data.authorization_url;


    } catch (err) {
      console.error('Error during subscription:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FiLoader className={styles.spinner} />
        <p>Loading group information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Group Header */}
          <div className={styles.groupHeader}>
            <h1 className={styles.groupTitle}>Join {group.groupName}</h1>
            <p className={styles.groupDescription}>{group.description}</p>
            <div className={styles.pricingBadge}>
              {formatNairaAmount(group.subscriptionPrice)} / {group.subscriptionFrequency}
            </div>
          </div>

          {/* Join Form */}
          <form onSubmit={handleSubmit} className={styles.joinForm}>
            {/* Full Name */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <FiUser className={styles.inputIcon} />
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={subscriberInfo.fullName}
                onChange={handleChange}
                required
                className={styles.inputField}
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <FiMail className={styles.inputIcon} />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={subscriberInfo.email}
                onChange={handleChange}
                required
                className={styles.inputField}
                placeholder="your@email.com"
              />
            </div>

            {/* Phone */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <FiPhone className={styles.inputIcon} />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={subscriberInfo.phone}
                onChange={handleChange}
                required
                className={styles.inputField}
                placeholder="08012345678"
              />
            </div>

        {/* Telegram Username */}
<div className={styles.inputGroup}>
  <label className={styles.inputLabel}>
    <FiSend className={styles.inputIcon} />
    Telegram Username <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>(without @)</span>
  </label>
  <input
    type="text"
    name="telegramUsername"
    value={subscriberInfo.telegramUsername}
    onChange={handleChange}
    required
    className={`${styles.inputField} ${telegramUsernameError ? styles.inputError : ''}`}
    placeholder="e.g. johndoe"
  />
  <div className={styles.telegramInstructions}>
    <p>⚠️ We need your Telegram username to grant access!</p>
    <p>➡️ Go to Telegram settings → Set your @username</p>
    <p>✅ Then return to complete payment.</p>
  </div>
  {telegramUsernameError && (
    <p className={styles.errorText}>{telegramUsernameError}</p>
  )}
</div>

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || !!telegramUsernameError}
            >
              {isSubmitting ? (
                <>
                  <FiLoader className={styles.buttonSpinner} />
                  Processing...
                </>
              ) : (
                <>
                  Continue to Payment
                  <FiArrowRight className={styles.buttonIcon} />
                </>
              )}
            </button>
          </form>

          {/* Security Assurance */}
          <div className={styles.securityNote}>
            <div className={styles.securityBadge}>🔒 Secure</div>
            <p>Your information is protected and payments are encrypted</p>
          </div>
        </div>
      </div>
    </>
  );
}
