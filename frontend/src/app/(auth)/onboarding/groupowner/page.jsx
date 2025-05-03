'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowRight, FiCheck, FiUser, FiCreditCard, FiUsers, FiInfo } from 'react-icons/fi';
import styles from './groupowner.module.scss';

export default function GroupOwnerRegistration() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
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
    // Get token from localStorage or cookies
    const storedToken = localStorage.getItem('token') || document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
    
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
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

    // Clear error when user types
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
    
    if (!token) {
      setError('Authentication token missing. Please login again.');
      setLoading(false);
      return;
    }

    if (!validateStep(3)) {
      setLoading(false);
      return;
    }

    try {
      // First onboard the user
      const userRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/groupowner/onboard`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          telegramUsername: formData.telegramUsername,
          accountHolderName: formData.bankDetails.accountHolderName,
          accountNumber: formData.bankDetails.accountNumber,
          bankName: formData.bankDetails.bankName
        }),
      });

      if (!userRes.ok) {
        const errorData = await userRes.json();
        throw new Error(errorData.message || 'User onboarding failed');
      }

      // Then create the group
      const groupRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/groupowner/creategroup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          groupName: formData.groupName,
          telegramGroupLink: formData.telegramGroupLink,
          telegramGroupId: formData.telegramGroupId,
          description: formData.description || '',
          category: formData.category,
          subscriptionFrequency: formData.subscriptionFrequency,
          subscriptionPrice: formData.subscriptionPrice,
          currency: formData.currency
        }),
      });
      

      if (!groupRes.ok) {
        const errorData = await groupRes.json();
        throw new Error(errorData.message || 'Group creation failed');
      }

      router.push('/groupowner/overview');
    } catch (err) {
      setError(err.message);
      console.error('Registration Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.onboardingWrapper}>
        <div className={styles.loadingContainer}>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.onboardingWrapper}>
      <div className={styles.heroBackground} />
      <div className={styles.gridPattern} />

      <div className={styles.progressBar}>
        {[1, 2, 3].map((s, i) => (
          <div key={s} className={`${styles.progressStep} ${step >= s ? styles.active : ''}`}>
            <div className={styles.stepNumber}>{s}</div>
            <p>{['Personal Info', 'Group Info', 'Subscription & Bank'][i]}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <p>{error}</p>
          <button onClick={() => setError(null)} className={styles.closeError}>
            &times;
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.onboardingForm}>
        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className={styles.formStep}>
            <div className={styles.formHeader}>
              <FiUser className={styles.stepIcon} />
              <h2 className={styles.title}>Personal Information</h2>
              <p className={styles.subtitle}>Tell us who you are</p>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`${styles.inputField} ${formErrors.name ? styles.errorInput : ''}`}
                required
              />
              {formErrors.name && <span className={styles.errorText}>{formErrors.name}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`${styles.inputField} ${formErrors.phoneNumber ? styles.errorInput : ''}`}
                required
              />
              {formErrors.phoneNumber && <span className={styles.errorText}>{formErrors.phoneNumber}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Telegram Username (optional)</label>
              <input
                type="text"
                name="telegramUsername"
                placeholder="@yourusername"
                value={formData.telegramUsername}
                onChange={handleChange}
                className={styles.inputField}
              />
            </div>

            <button type="button" onClick={nextStep} className={styles.nextButton}>
              Continue <FiArrowRight />
            </button>
          </div>
        )}

        {/* STEP 2: Group Info */}
        {step === 2 && (
          <div className={styles.formStep}>
            <div className={styles.formHeader}>
              <FiUsers className={styles.stepIcon} />
              <h2 className={styles.title}>Telegram Group Information</h2>
              <p className={styles.subtitle}>Details about your group</p>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Group Name</label>
              <input
                type="text"
                name="groupName"
                value={formData.groupName}
                onChange={handleChange}
                className={`${styles.inputField} ${formErrors.groupName ? styles.errorInput : ''}`}
                required
              />
              {formErrors.groupName && <span className={styles.errorText}>{formErrors.groupName}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Telegram Group Link</label>
              <input
                type="url"
                name="telegramGroupLink"
                placeholder="https://t.me/yourgroup"
                value={formData.telegramGroupLink}
                onChange={handleChange}
                className={`${styles.inputField} ${formErrors.telegramGroupLink ? styles.errorInput : ''}`}
                required
              />
              {formErrors.telegramGroupLink && <span className={styles.errorText}>{formErrors.telegramGroupLink}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Telegram Group ID</label>
              <input
                type="text"
                name="telegramGroupId"
                placeholder="e.g., -1001234567890"
                value={formData.telegramGroupId}
                onChange={handleChange}
                className={`${styles.inputField} ${formErrors.telegramGroupId ? styles.errorInput : ''}`}
                required
              />
              {formErrors.telegramGroupId && <span className={styles.errorText}>{formErrors.telegramGroupId}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Group Description (optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={styles.inputField}
                rows={3}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Group Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`${styles.inputField} ${styles.selectField} ${formErrors.category ? styles.errorInput : ''}`}
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              {formErrors.category && <span className={styles.errorText}>{formErrors.category}</span>}
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={prevStep} className={styles.backButton}>
                Back
              </button>
              <button type="button" onClick={nextStep} className={styles.nextButton}>
                Continue <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Subscription + Bank */}
        {step === 3 && (
          <div className={styles.formStep}>
            <div className={styles.formHeader}>
              <FiCreditCard className={styles.stepIcon} />
              <h2 className={styles.title}>Subscription & Bank Details</h2>
              <p className={styles.subtitle}>Set your subscription and where to get paid</p>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Subscription Frequency</label>
              <select
                name="subscriptionFrequency"
                value={formData.subscriptionFrequency}
                onChange={handleChange}
                className={`${styles.inputField} ${styles.selectField} ${formErrors.subscriptionFrequency ? styles.errorInput : ''}`}
                required
              >
                <option value="">Select frequency</option>
                {frequencies.map(f => (
                  <option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
              {formErrors.subscriptionFrequency && <span className={styles.errorText}>{formErrors.subscriptionFrequency}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className={`${styles.inputField} ${styles.selectField}`}
                required
              >
                {currencies.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name} ({curr.code})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Subscription Price</label>
              <input
                type="number"
                name="subscriptionPrice"
                value={formData.subscriptionPrice}
                onChange={handleChange}
                className={`${styles.inputField} ${formErrors.subscriptionPrice ? styles.errorInput : ''}`}
                placeholder="Enter amount"
                required
              />
              {formErrors.subscriptionPrice && <span className={styles.errorText}>{formErrors.subscriptionPrice}</span>}
              <div className={styles.feeNote}>
                <FiInfo className={styles.infoIcon} />
                <span>We charge a 5% service fee from your subscription price</span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Bank Name</label>
              <input
                type="text"
                name="bankDetails.bankName"
                value={formData.bankDetails.bankName}
                onChange={handleChange}
                className={`${styles.inputField} ${formErrors['bankDetails.bankName'] ? styles.errorInput : ''}`}
                required
              />
              {formErrors['bankDetails.bankName'] && <span className={styles.errorText}>{formErrors['bankDetails.bankName']}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Account Number</label>
              <input
                type="text"
                name="bankDetails.accountNumber"
                value={formData.bankDetails.accountNumber}
                onChange={handleChange}
                className={`${styles.inputField} ${formErrors['bankDetails.accountNumber'] ? styles.errorInput : ''}`}
                required
              />
              {formErrors['bankDetails.accountNumber'] && <span className={styles.errorText}>{formErrors['bankDetails.accountNumber']}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Account Holder's Name</label>
              <input
                type="text"
                name="bankDetails.accountHolderName"
                value={formData.bankDetails.accountHolderName}
                onChange={handleChange}
                className={`${styles.inputField} ${formErrors['bankDetails.accountHolderName'] ? styles.errorInput : ''}`}
                required
              />
              {formErrors['bankDetails.accountHolderName'] && <span className={styles.errorText}>{formErrors['bankDetails.accountHolderName']}</span>}
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={prevStep} className={styles.backButton}>
                Back
              </button>
              <button type="submit" disabled={loading} className={styles.submitButton}>
                {loading ? 'Submitting...' : 'Complete Registration'} <FiCheck />
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}