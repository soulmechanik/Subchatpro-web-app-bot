'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import styles from './Transactions.module.scss';
import Layout from '../../../components/Layouts/groupownerLayout/Layout';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL; // Use environment variable here

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token') || getCookie('token');
        
        if (!token) {
          throw new Error('Authentication required. Please login.');
        }

        const response = await axios.get(`${API_BASE_URL}/api/transactions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        if (!response.data?.transactions) {
          throw new Error('Invalid data format received from server');
        }

        setTransactions(response.data.transactions);
      } catch (err) {
        console.error('Transaction fetch error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load transactions');
        
        if (err.response?.status === 401) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [router]);

  const getCookie = (name) => {
    if (typeof document !== 'undefined') {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    }
    return null;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₦0.00';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(parseFloat(amount) / 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const StatusBadge = ({ status }) => {
    const statusMap = {
      success: { color: '#10B981', label: 'Completed' },
      active: { color: '#10B981', label: 'Active' },
      pending: { color: '#F59E0B', label: 'Pending' },
      failed: { color: '#EF4444', label: 'Failed' },
      expired: { color: '#EF4444', label: 'Expired' },
      default: { color: '#9CA3AF', label: 'Unknown' }
    };

    const { color, label } = statusMap[status?.toLowerCase()] || statusMap.default;

    return (
      <span className={styles.statusBadge} style={{ '--status-color': color }}>
        {label}
      </span>
    );
  };

  const SubscriptionTypeBadge = ({ type }) => {
    const typeMap = {
      new: { color: '#3B82F6', label: 'New' },
      renewal: { color: '#8B5CF6', label: 'Renewal' },
      default: { color: '#9CA3AF', label: 'Subscription' }
    };

    const { color, label } = typeMap[type?.toLowerCase()] || typeMap.default;

    return (
      <span className={styles.typeBadge} style={{ '--type-color': color }}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading transaction history...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <svg className={styles.errorIcon} viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <h3>Transaction Error</h3>
            <p>{error}</p>
            <div className={styles.buttonGroup}>
              <button onClick={() => window.location.reload()} className={styles.primaryButton}>
                Try Again
              </button>
              <button onClick={() => router.push('/dashboard')} className={styles.secondaryButton}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Transaction History</h1>
          <p className={styles.subtitle}>
            {transactions.length > 0 
              ? `${transactions.length} transactions found` 
              : 'All transactions will appear here'}
          </p>
        </header>

        {transactions.length === 0 ? (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} viewBox="0 0 24 24">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
            </svg>
            <h3>No Transactions Yet</h3>
            <p>When payments are processed, they will appear here</p>
          </div>
        ) : (
          <div className={styles.transactionList}>
            {transactions.map((txn) => (
              <div key={txn._id} className={styles.transactionCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.userInfo}>
                    <h3>{txn.subscriberName || txn.name || 'Customer'}</h3>
                    <p>{txn.subscriberEmail || txn.email || 'No email provided'}</p>
                  </div>
                  <div className={styles.amount}>{formatCurrency(txn.amount)}</div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.detailRow}>
                    <span>Group</span>
                    <strong>{txn.groupName || 'General Group'}</strong>
                  </div>
                  
                  <div className={styles.detailRow}>
                    <span>Date</span>
                    <strong>{formatDate(txn.paidAt || txn.createdAt)}</strong>
                  </div>
                  
                  <div className={styles.detailRow}>
                    <span>Payment Method</span>
                    <strong>
                      {txn.channel ? 
                        txn.channel.charAt(0).toUpperCase() + txn.channel.slice(1) : 
                        'Unknown'}
                    </strong>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.badgeGroup}>
                    <StatusBadge status={txn.status} />
                    <SubscriptionTypeBadge type={txn.subscriptionType} />
                  </div>
                  <span className={styles.reference}>
                    Ref: {txn.paystackRef || txn._id?.slice(-6) || 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Transactions;
