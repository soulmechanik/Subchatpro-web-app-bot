'use client'

import styles from './register.module.scss'
import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header/Header'
import axios from 'axios'
import { motion } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'
import CircularProgress from '@mui/material/CircularProgress'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[!@#$%^&*]/.test(password),
    match: password === confirmPassword && confirmPassword.length > 0
  }

  const allValid = Object.values(rules).every(Boolean)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
  
    if (!allValid || !role) {
      if (!role) setError('Please select a role.')
      return
    }
  
    setLoading(true)
    setError('')
  
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`, {
        email,
        password,
        role
      })
  
      console.log('Registration Success:', response.data)
      setSuccess(true)
    } catch (err) {
      console.error('Error during registration:', err)
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const RuleItem = ({ label, valid }) => (
    <li className={valid ? styles.valid : styles.invalid}>
      <span className={styles.ruleIcon}>{valid ? '✓' : '•'}</span>
      <span>{label}</span>
    </li>
  )

  return (
    <>
      <Header />
      <div className={styles.registerWrapper}>
        <div className={styles.heroBackground} />
        <div className={styles.gridPattern} />
        
        <form onSubmit={handleSubmit} className={styles.registerForm}>
          <div className={styles.formHeader}>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.title}
            >
              Create Account
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={styles.subtitle}
            >
              Start your monetization journey today
            </motion.p>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.inputLabel}>Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.inputField}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.inputField}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.inputLabel}>Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={styles.inputField}
            />
          </div>

          <ul className={styles.rules}>
            <RuleItem label="At least 8 characters" valid={rules.length} />
            <RuleItem label="One uppercase letter" valid={rules.upper} />
            <RuleItem label="One number" valid={rules.number} />
            <RuleItem label="One symbol (!@#$%^&*)" valid={rules.symbol} />
            <RuleItem label="Passwords match" valid={rules.match} />
          </ul>

          <div className={styles.inputGroup}>
            <label htmlFor="role" className={styles.inputLabel}>Who are you?</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className={styles.select}
            >
              <option value="">Select your role</option>
              <option value="GroupOwner">Group Owner</option>
              <option value="GroupSubscriber">Subscriber</option>
            </select>
          </div>

          {(!allValid && submitted) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.error}
            >
              Please meet all password requirements.
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.error}
            >
              {error}
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              <>
                Get Started <FiArrowRight className={styles.arrowIcon} />
              </>
            )}
          </button>

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.successMessage}
            >
              <p>Registration successful! Please check your email at <strong>{email}</strong> to verify your account.</p>
              <Link href="/login" className={styles.loginLink}>
                Back to Login
              </Link>
            </motion.div>
          )}

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <p className={styles.switch}>
            Already have an account?{' '}
            <Link href="/login">
              <span className={styles.link}>Log in</span>
            </Link>
          </p>
        </form>
      </div>
    </>
  )
}