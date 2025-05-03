'use client'

import styles from './login.module.scss'
import { useState } from 'react'
import Link from 'next/link'
import Header from '../../../components/Header/Header'
import axios from 'axios'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import { useRouter } from 'next/navigation'
import { FiArrowRight } from 'react-icons/fi'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5002"; // fallback to localhost

      const response = await axios.post(
        `${backendUrl}/api/auth/login`, // Use the dynamic backend URL
        { email, password },
        { withCredentials: true } // ✅ Store cookies from backend
      )

      const { token, role, userId, onboarded } = response.data

      // Optional: store if you use it for client-side auth headers
      localStorage.setItem('token', token)
      localStorage.setItem('role', role)
      localStorage.setItem('userId', userId)

      console.log("✅ Token:", token)
      console.log("🆔 UserID:", userId)
      console.log("🎭 Role:", role)

      if (onboarded) {
        router.push(`/${role.toLowerCase()}/overview`)
      } else {
        router.push('/onboarding')
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'Login failed. Please try again.'

      if (serverMessage.includes('verify your email')) {
        setError('Please verify your email before logging in.')
      } else if (serverMessage.includes('Invalid credentials')) {
        setError('Invalid email or password.')
      } else {
        setError(serverMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className={styles.loginWrapper}>
        <div className={styles.heroBackground} />
        <div className={styles.gridPattern} />

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.formHeader}>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.title}
            >
              Welcome Back
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={styles.subtitle}
            >
              Log in to manage your Telegram monetization
            </motion.p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.error}
            >
              {error}
            </motion.div>
          )}

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
            <div className={styles.passwordField}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.inputField}
              />
              <IconButton
                onClick={togglePasswordVisibility}
                className={styles.eyeIcon}
                tabIndex={-1}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </div>
          </div>

          <div className={styles.forgotPassword}>
            <Link href="/forgot-password">
              <span className={styles.link}>Forgot your password?</span>
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              <>
                Continue <FiArrowRight className={styles.arrowIcon} />
              </>
            )}
          </button>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <p className={styles.switch}>
            Don't have an account?{' '}
            <Link href="/register">
              <span className={styles.link}>Create account</span>
            </Link>
          </p>
        </form>
      </div>
    </>
  )
}
