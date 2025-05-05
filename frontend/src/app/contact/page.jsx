'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import styles from './contact.module.scss';
import { 
  Email, Phone, LocationOn, East, Telegram, WhatsApp
} from '@mui/icons-material';
import Header from '@/components/Header/Header';

export default function Contact() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/login');
  };

  return (
    <>
      <Header />
      <div className={styles.contactPage}>
        {/* Modern Hero Section */}
        <section className={styles.heroSection}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={styles.heroContent}
          >
            <h1>Contact <span>Us</span></h1>
            <p className={styles.subtitle}>
              We'd love to hear from you! Reach out through any channel below.
            </p>
          </motion.div>
        </section>

        {/* Contact Cards Grid */}
        <section className={styles.contactGrid}>
          {/* Contact Methods */}
          <div className={styles.contactMethods}>
            <motion.div 
              className={styles.contactCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Email className={styles.contactIcon} />
              <h3>Email</h3>
              <p>For general inquiries</p>
              <a href="mailto:hello@subchatpro.com" className={styles.contactLink}>
                hello@subchatpro.com <East />
              </a>
            </motion.div>
            
            <motion.div 
              className={styles.contactCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <WhatsApp className={styles.contactIcon} />
              <h3>WhatsApp</h3>
              <p>For quick responses</p>
              <a href="https://wa.me/2341234567890" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                +234 123 456 7890 <East />
              </a>
            </motion.div>
            
            <motion.div 
              className={styles.contactCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Telegram className={styles.contactIcon} />
              <h3>Telegram</h3>
              <p>For community support</p>
              <a href="https://t.me/subchatpro" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                @subchatpro <East />
              </a>
            </motion.div>
            
            <motion.div 
              className={styles.contactCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <LocationOn className={styles.contactIcon} />
              <h3>Office</h3>
              <p>Lagos, Nigeria</p>
              <a href="https://goo.gl/maps/example" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                View on Map <East />
              </a>
            </motion.div>
          </div>
        </section>

        {/* Modern CTA */}
        <section className={styles.ctaSection}>
          <motion.div
            className={styles.ctaCard}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of creators monetizing their communities with SubChatPro</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={styles.ctaButton}
              onClick={handleGetStarted}
            >
              Create Your Account <East />
            </motion.button>
          </motion.div>
        </section>
      </div>
    </>
  );
}
