'use client'

import styles from './forgotpassword.module.scss'
import { useState } from 'react'
import Link from 'next/link'
import Header from '../../../components/Header/Header'

export default function ForgotpasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5002"; // fallback to localhost

      const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Check your email for a password reset link.')
      } else {
        setMessage(data.message || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('An error occurred. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className={styles.resetWrapper}>
        <form onSubmit={handleSubmit} className={styles.resetForm}>
          <h1 className={styles.title}>Forgot Your Password?</h1>
          <p className={styles.subtitle}>We'll send you a link to reset it</p>

          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          {message && <p className={styles.message}>{message}</p>}

          <p className={styles.backLink}>
            <Link href="/login"><span>Back to Login</span></Link>
          </p>
        </form>
      </div>
    </>
  )
}
