'use client'
import { useEffect } from 'react'
import { FiCheckCircle, FiMail, FiArrowRight, FiExternalLink } from 'react-icons/fi'
import { useSearchParams } from 'next/navigation'
import styles from './success.module.scss'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const groupName = searchParams.get('group') || 'your group'
  const email = searchParams.get('email') || 'your email'

  useEffect(() => {
    // Track conversion or analytics here
    console.log('Payment successful for:', email)
  }, [email])

  return (
    <div className={styles.successContainer}>
      <div className={styles.successCard}>
        {/* Success Icon */}
        <div className={styles.successIcon}>
          <FiCheckCircle />
        </div>

        {/* Main Content */}
        <h1 className={styles.successTitle}>Payment Successful!</h1>
        <p className={styles.successMessage}>
          You're now subscribed to <strong>{groupName}</strong>. Check your email at <strong>{email}</strong> for confirmation and next steps.
        </p>

        {/* Next Steps */}
        <div className={styles.nextSteps}>
          <h2 className={styles.stepsTitle}>What happens next?</h2>
          <ul className={styles.stepsList}>
            <li>
              <FiMail className={styles.stepIcon} />
              <span>Check your email for the Telegram group invite</span>
            </li>
            <li>
              <FiArrowRight className={styles.stepIcon} />
              <span>Join before the link expires in 24 hours</span>
            </li>
          </ul>
        </div>

        {/* Support Section */}
        <div className={styles.supportSection}>
          <p>Need help joining the group?</p>
          <a 
            href="mailto:support@subchat.com" 
            className={styles.supportLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact Support <FiExternalLink className={styles.linkIcon} />
          </a>
        </div>
      </div>
    </div>
  )
}