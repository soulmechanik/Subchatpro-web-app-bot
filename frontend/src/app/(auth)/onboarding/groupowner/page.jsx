'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowRight, FiCheck, FiUser, FiCreditCard, FiUsers, FiInfo } from 'react-icons/fi';
import axios from 'axios';
import styles from './groupowner.module.scss';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';

export default function GroupOwnerRegistration() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    telegramUsername: '',
    groupName: '',
    telegramGroupLink: '',
    telegramGroupId: '',
    description: '',
    category: '',
    subscriptionFrequency: '',
    subscriptionPrice: '',
    currency: 'NGN',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
    }
  });

  const categories = [
    'technology',
    'entertainment',
    'business',
    'education',
    'health',
    'lifestyle',
    'sports',
    'other'
  ];

  const frequencies = ['monthly', 'quarterly', 'biannual', 'annual'];
  const currencies = [
    { code: 'NGN', name: 'Nigeria Naira' },
    { code: 'GHC', name: 'Ghana Cedis' }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`,
          { withCredentials: true }
        );
        const user = response.data;
        console.log('✅ User fetched:', user);
  
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          phoneNumber: user.phoneNumber || '',
          telegramUsername: user.telegramUsername || '',
        }));
      } catch (error) {
        console.error('⚠️ Error fetching user data:', error);
        router.push('/login');
      }
    };
  
    fetchUser();
  }, [router]);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('bankDetails.')) {
      const bankField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [bankField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (currentStep) => {
    const errors = {};
    
    if (currentStep === 1) {
      if (!formData.name) errors.name = 'Name is required';
      if (!formData.phoneNumber) errors.phoneNumber = 'Phone number is required';
    }
    
    if (currentStep === 2) {
      if (!formData.groupName) errors.groupName = 'Group name is required';
      if (!formData.telegramGroupLink) errors.telegramGroupLink = 'Telegram link is required';
      if (!formData.telegramGroupId) errors.telegramGroupId = 'Telegram group ID is required';
      if (!formData.category) errors.category = 'Category is required';
    }
    
    if (currentStep === 3) {
      if (!formData.subscriptionFrequency) errors.subscriptionFrequency = 'Frequency is required';
      if (!formData.subscriptionPrice || isNaN(formData.subscriptionPrice)) {
        errors.subscriptionPrice = 'Valid price is required';
      }
      if (!formData.bankDetails.bankName) errors['bankDetails.bankName'] = 'Bank name is required';
      if (!formData.bankDetails.accountNumber) errors['bankDetails.accountNumber'] = 'Account number is required';
      if (!formData.bankDetails.accountHolderName) errors['bankDetails.accountHolderName'] = 'Account holder name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    if (!validateStep(3)) {
      setLoading(false);
      return;
    }
  
    try {
      const userRes = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/groupowner/onboard`,
        {
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          telegramUsername: formData.telegramUsername,
          accountHolderName: formData.bankDetails.accountHolderName,
          accountNumber: formData.bankDetails.accountNumber,
          bankName: formData.bankDetails.bankName,
        },
        { withCredentials: true }
      );
  
      console.log('✅ Onboard successful:', userRes.data);
  
      // 🔥 Check if profile exists, not status
      if (!userRes.data || !userRes.data.profile) {
        throw new Error('User onboarding failed');
      }
  
      const groupRes = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/groupowner/creategroup`,
        {
          groupName: formData.groupName,
          telegramGroupLink: formData.telegramGroupLink,
          telegramGroupId: formData.telegramGroupId,
          description: formData.description || '',
          category: formData.category,
          subscriptionFrequency: formData.subscriptionFrequency,
          subscriptionPrice: formData.subscriptionPrice,
          currency: formData.currency,
        },
        { withCredentials: true }
      );
  
      console.log('✅ Group created successfully:', groupRes.data);
  
      if (!groupRes.data || !groupRes.data.group) {
        throw new Error('Group creation failed');
      }
  
      // 🚀 Finally redirect
      router.push('/groupowner/overview');
  
    } catch (err) {
      console.error('❌ Registration Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  
  
  
  return (

    <>
    <Header/>
    <div className={styles.container}>
      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: `${(step / 3) * 100}%` }} />
      </div>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        {step === 1 && (
          <div className={styles.step}>
            <div className={styles.stepHeader}>
              <div className={styles.stepIndicator}>1</div>
              <h2 className={styles.stepTitle}>Personal Information</h2>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Full Name</label>
              <input
                className={`${styles.formInput} ${formErrors.name ? styles.error : ''}`}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              {formErrors.name && <span className={styles.errorMessage}>{formErrors.name}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone Number</label>
              <input
                className={`${styles.formInput} ${formErrors.phoneNumber ? styles.error : ''}`}
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
              {formErrors.phoneNumber && <span className={styles.errorMessage}>{formErrors.phoneNumber}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Telegram Username</label>
              <input
                className={styles.formInput}
                type="text"
                name="telegramUsername"
                value={formData.telegramUsername}
                onChange={handleChange}
              />
            </div>
            
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.nextButton}
                onClick={nextStep}
              >
                Next <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.step}>
            <div className={styles.stepHeader}>
              <div className={styles.stepIndicator}>2</div>
              <h2 className={styles.stepTitle}>Group Information</h2>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Group Name</label>
              <input
                className={`${styles.formInput} ${formErrors.groupName ? styles.error : ''}`}
                type="text"
                name="groupName"
                value={formData.groupName}
                onChange={handleChange}
                required
              />
              {formErrors.groupName && <span className={styles.errorMessage}>{formErrors.groupName}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Telegram Group Link</label>
              <input
                className={`${styles.formInput} ${formErrors.telegramGroupLink ? styles.error : ''}`}
                type="text"
                name="telegramGroupLink"
                value={formData.telegramGroupLink}
                onChange={handleChange}
                required
              />
              {formErrors.telegramGroupLink && <span className={styles.errorMessage}>{formErrors.telegramGroupLink}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Telegram Group ID</label>
              <input
                className={`${styles.formInput} ${formErrors.telegramGroupId ? styles.error : ''}`}
                type="text"
                name="telegramGroupId"
                value={formData.telegramGroupId}
                onChange={handleChange}
                required
              />
              {formErrors.telegramGroupId && <span className={styles.errorMessage}>{formErrors.telegramGroupId}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category</label>
              <select
                className={`${styles.formSelect} ${formErrors.category ? styles.error : ''}`}
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              {formErrors.category && <span className={styles.errorMessage}>{formErrors.category}</span>}
            </div>
            
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.prevButton}
                onClick={prevStep}
              >
                Previous
              </button>
              <button
                type="button"
                className={styles.nextButton}
                onClick={nextStep}
              >
                Next <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.step}>
            <div className={styles.stepHeader}>
              <div className={styles.stepIndicator}>3</div>
              <h2 className={styles.stepTitle}>Payment Information</h2>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Subscription Frequency</label>
              <select
                className={`${styles.formSelect} ${formErrors.subscriptionFrequency ? styles.error : ''}`}
                name="subscriptionFrequency"
                value={formData.subscriptionFrequency}
                onChange={handleChange}
                required
              >
                <option value="">Select frequency</option>
                {frequencies.map((freq) => (
                  <option key={freq} value={freq}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </option>
                ))}
              </select>
              {formErrors.subscriptionFrequency && <span className={styles.errorMessage}>{formErrors.subscriptionFrequency}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Subscription Price</label>
              <input
                className={`${styles.formInput} ${formErrors.subscriptionPrice ? styles.error : ''}`}
                type="number"
                name="subscriptionPrice"
                value={formData.subscriptionPrice}
                onChange={handleChange}
                required
              />
              {formErrors.subscriptionPrice && <span className={styles.errorMessage}>{formErrors.subscriptionPrice}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Currency</label>
              <select
                className={styles.formSelect}
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Bank Details</h3>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Bank Name</label>
              <input
                className={`${styles.formInput} ${formErrors['bankDetails.bankName'] ? styles.error : ''}`}
                type="text"
                name="bankDetails.bankName"
                value={formData.bankDetails.bankName}
                onChange={handleChange}
                required
              />
              {formErrors['bankDetails.bankName'] && <span className={styles.errorMessage}>{formErrors['bankDetails.bankName']}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Account Number</label>
              <input
                className={`${styles.formInput} ${formErrors['bankDetails.accountNumber'] ? styles.error : ''}`}
                type="text"
                name="bankDetails.accountNumber"
                value={formData.bankDetails.accountNumber}
                onChange={handleChange}
                required
              />
              {formErrors['bankDetails.accountNumber'] && <span className={styles.errorMessage}>{formErrors['bankDetails.accountNumber']}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Account Holder Name</label>
              <input
                className={`${styles.formInput} ${formErrors['bankDetails.accountHolderName'] ? styles.error : ''}`}
                type="text"
                name="bankDetails.accountHolderName"
                value={formData.bankDetails.accountHolderName}
                onChange={handleChange}
                required
              />
              {formErrors['bankDetails.accountHolderName'] && <span className={styles.errorMessage}>{formErrors['bankDetails.accountHolderName']}</span>}
            </div>
            
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.prevButton}
                onClick={prevStep}
              >
                Previous
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span>Submitting</span>
                    <FiCheck />
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <FiArrowRight />
                  </>
                )}
              </button>
            </div>
            
            {error && <div className={styles.errorAlert}>{error}</div>}
          </div>
        )}
      </form>
    </div>
    <Footer/>
    </>
  );
}