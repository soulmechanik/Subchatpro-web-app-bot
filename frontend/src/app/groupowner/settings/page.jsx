'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './settings.module.scss';
import Layout from '@/components/Layouts/groupownerLayout/Layout';

const SettingsPage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    telegramUsername: '',
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/groupowner/settings`,
          { withCredentials: true }
        );
        setProfile(res.data);
        setFormData(res.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('bankDetails.')) {
      const bankField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [bankField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/groupowner/settings`,
        formData,
        { withCredentials: true }
      );
      setProfile(res.data.updatedProfile);
      setEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <Layout>
      <div className={styles.settingsContainer}>
        <h1 className={styles.title}>Profile Settings</h1>

        <div className={styles.card}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Phone Number</label>
            <input
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Telegram Username</label>
            <input
              name="telegramUsername"
              value={formData.telegramUsername}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Bank Account Name</label>
            <input
              name="bankDetails.accountHolderName"
              value={formData.bankDetails.accountHolderName}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Bank Account Number</label>
            <input
              name="bankDetails.accountNumber"
              value={formData.bankDetails.accountNumber}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Bank Name</label>
            <input
              name="bankDetails.bankName"
              value={formData.bankDetails.bankName}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>

          <div className={styles.actions}>
            {editing ? (
              <>
                <button onClick={handleUpdate} className={styles.saveBtn}>Save</button>
                <button onClick={() => setEditing(false)} className={styles.cancelBtn}>Cancel</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className={styles.editBtn}>Edit Profile</button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
