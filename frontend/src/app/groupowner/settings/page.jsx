'use client'

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './settings.module.scss';
import Layout from '@/components/Layouts/groupownerLayout/Layout';
import { FiSearch, FiLoader } from 'react-icons/fi';

const SettingsPage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bankList, setBankList] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [bankSearchTerm, setBankSearchTerm] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveStatus, setResolveStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

  // Fetch profile and banks on first load
  useEffect(() => {
    const fetchProfileAndBanks = async () => {
      try {
        setLoading(true);

        const [profileRes, banksRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/groupowner/settings`, {
            withCredentials: true,
          }),
          axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/paystack/banks`, {
            withCredentials: true,
          }),
        ]);

        const profileData = profileRes.data;
        const banksData = banksRes.data.data;

        // Remove duplicate banks by code and name
        const uniqueBanks = banksData.reduce((acc, bank) => {
          const exists = acc.some(b => b.code === bank.code && b.name === bank.name);
          if (!exists) {
            acc.push(bank);
          }
          return acc;
        }, []);

        setProfile(profileData);
        setBankList(uniqueBanks);
        setFilteredBanks(uniqueBanks);

        setFormData({
          name: profileData.name || '',
          phoneNumber: profileData.phoneNumber || '',
          telegramUsername: profileData.telegramUsername || '',
          bankDetails: {
            accountNumber: profileData.bankDetails?.accountNumber || '',
            bankName: profileData.bankDetails?.bankName || '',
            accountHolderName: profileData.bankDetails?.accountHolderName || '',
          },
        });
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndBanks();
  }, []);

  // Filter banks based on search term
  useEffect(() => {
    if (bankSearchTerm) {
      const filtered = bankList.filter(bank =>
        bank.name.toLowerCase().includes(bankSearchTerm.toLowerCase())
      );
      setFilteredBanks(filtered);
    } else {
      setFilteredBanks(bankList);
    }
  }, [bankSearchTerm, bankList]);

  // Resolve account name if editing and bank/account changes
  useEffect(() => {
    const resolveAccount = async () => {
      const { accountNumber, bankName } = formData.bankDetails;
      if (!editing || accountNumber.length !== 10 || !bankName) return;

      const selectedBank = bankList.find((b) => b.name === bankName);
      if (!selectedBank) return;

      try {
        setResolving(true);
        setResolveStatus('Resolving account name...');
        
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/paystack/verify-account`,
          {
            account_number: accountNumber,
            bank_code: selectedBank.code,
          },
          { withCredentials: true }
        );

        const accountName = response.data.data.account_name;
        setFormData((prev) => ({
          ...prev,
          bankDetails: {
            ...prev.bankDetails,
            accountHolderName: accountName,
          },
        }));
        setResolveStatus('✅ Account resolved successfully.');
      } catch (err) {
        console.error('Error resolving account:', err);
        setFormData((prev) => ({
          ...prev,
          bankDetails: {
            ...prev.bankDetails,
            accountHolderName: '',
          },
        }));
        setResolveStatus('❌ Unable to resolve account. Please check details.');
      } finally {
        setResolving(false);
      }
    };

    resolveAccount();
  }, [formData.bankDetails.accountNumber, formData.bankDetails.bankName, editing, bankList]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('bankDetails.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [field]: value,
          ...(field !== 'accountHolderName' && { accountHolderName: '' }),
        },
      }));
      setResolveStatus('');
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBankSelect = (bank) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        bankName: bank.name,
        bankCode: bank.code
      }
    }));
    setBankSearchTerm(bank.name);
    setShowBankDropdown(false);
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/groupowner/settings`,
        formData,
        { withCredentials: true }
      );
      setProfile(res.data.updatedProfile);
      setEditing(false);
      setResolveStatus('');
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <Layout>
      <div className={styles.settingsContainer}>
        <h1 className={styles.title}>Profile Settings</h1>

        <div className={styles.card}>
          {/* Name */}
          <div className={styles.formGroup}>
            <label>Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>

          {/* Phone Number */}
          <div className={styles.formGroup}>
            <label>Phone Number</label>
            <input
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>

          {/* Telegram Username */}
          <div className={styles.formGroup}>
            <label>Telegram Username</label>
            <input
              name="telegramUsername"
              value={formData.telegramUsername}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>

          {/* Account Number */}
          <div className={styles.formGroup}>
            <label>Bank Account Number</label>
            <input
              name="bankDetails.accountNumber"
              value={formData.bankDetails.accountNumber}
              onChange={handleChange}
              disabled={!editing}
              maxLength={10}
            />
          </div>

          {/* Bank Name */}
          <div className={styles.formGroup}>
            <label>Bank Name</label>
            <div className={styles.bankSearchContainer}>
              <div className={styles.bankSearchInput}>
                <FiSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search for your bank"
                  value={bankSearchTerm || formData.bankDetails.bankName}
                  onChange={(e) => {
                    setBankSearchTerm(e.target.value);
                    if (!formData.bankDetails.bankName || e.target.value !== formData.bankDetails.bankName) {
                      setFormData(prev => ({
                        ...prev,
                        bankDetails: {
                          ...prev.bankDetails,
                          bankName: '',
                          bankCode: ''
                        }
                      }));
                    }
                    setShowBankDropdown(true);
                  }}
                  onFocus={() => setShowBankDropdown(true)}
                  disabled={!editing}
                />
              </div>
              {showBankDropdown && editing && filteredBanks.length > 0 && (
                <div className={styles.bankDropdown}>
                  {filteredBanks.map((bank) => (
                    <div
                      key={`${bank.code}-${bank.name}`}
                      className={styles.bankOption}
                      onClick={() => handleBankSelect(bank)}
                    >
                      {bank.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Account Holder Name */}
          <div className={styles.formGroup}>
            <label>Account Holder Name</label>
            <input
              name="bankDetails.accountHolderName"
              value={formData.bankDetails.accountHolderName}
              disabled
            />
            {editing && (
              <div className={styles.resolveStatus}>
                {resolving ? (
                  <span className={styles.loadingText}>
                    <FiLoader className={styles.spinner} /> {resolveStatus}
                  </span>
                ) : (
                  resolveStatus && <span>{resolveStatus}</span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            {editing ? (
              <>
                <button
                  onClick={handleUpdate}
                  className={styles.saveBtn}
                  disabled={resolving || submitting}
                >
                  {submitting ? (
                    <>
                      <FiLoader className={styles.spinner} /> Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: profile.name || '',
                      phoneNumber: profile.phoneNumber || '',
                      telegramUsername: profile.telegramUsername || '',
                      bankDetails: {
                        accountNumber: profile.bankDetails?.accountNumber || '',
                        bankName: profile.bankDetails?.bankName || '',
                        accountHolderName: profile.bankDetails?.accountHolderName || '',
                      },
                    });
                    setResolveStatus('');
                    setBankSearchTerm('');
                  }}
                  className={styles.cancelBtn}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className={styles.editBtn}>
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;