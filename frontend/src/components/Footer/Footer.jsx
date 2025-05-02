// components/Footer/Footer.jsx
import React from 'react';
import styles from './Footer.module.scss';
import { FiTwitter, FiGithub, FiLinkedin, FiMail } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        
        {/* Logo and description */}
        <div className={styles.brandColumn}>
          <div className={styles.logo}>SubChat</div>
          <p className={styles.tagline}>
            The premium Telegram monetization platform for creators.
          </p>
          <div className={styles.socialLinks}>
            <a href="#" aria-label="Twitter"><FiTwitter /></a>
            <a href="#" aria-label="GitHub"><FiGithub /></a>
            <a href="#" aria-label="LinkedIn"><FiLinkedin /></a>
            <a href="#" aria-label="Email"><FiMail /></a>
          </div>
        </div>

        {/* Links columns */}
        <div className={styles.linksColumns}>
          <div className={styles.linksColumn}>
            <h3 className={styles.columnTitle}>Product</h3>
            <ul>
              <li><a href="#">Features</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">API</a></li>
              <li><a href="#">Integrations</a></li>
            </ul>
          </div>

          <div className={styles.linksColumn}>
            <h3 className={styles.columnTitle}>Company</h3>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          <div className={styles.linksColumn}>
            <h3 className={styles.columnTitle}>Resources</h3>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Community</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Status</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className={styles.copyright}>
        <p>© {new Date().getFullYear()} SubChat. All rights reserved.</p>
        <div className={styles.legalLinks}>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;