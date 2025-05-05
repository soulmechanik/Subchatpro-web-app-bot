'use client'
import React, { useState } from 'react';
import styles from './Header.module.scss';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Link from 'next/link';
import { motion } from 'framer-motion';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={styles.logo}
        >
          <span className={styles.logoText}>SubChat</span>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <ul className={styles.navList}>
            <motion.li whileHover={{ scale: 1.05 }}>
              <Link href="/" className={styles.navLink}>Home</Link>
            </motion.li>
            <motion.li whileHover={{ scale: 1.05 }}>
              <Link href="/about" className={styles.navLink}>About Us</Link>
            </motion.li>
            <motion.li whileHover={{ scale: 1.05 }}>
              <Link href="/pricing" className={styles.navLink}>Pricing</Link>
            </motion.li>
            <motion.li whileHover={{ scale: 1.05 }}>
              <Link href="/contact" className={styles.navLink}>Contact Us</Link>
            </motion.li>
          </ul>
        </nav>

        {/* Auth Buttons - Desktop */}
        <div className={styles.authButtons}>
          <motion.div whileHover={{ scale: 1.03 }}>
            <Link href="/login" className={styles.loginButton}>Log In</Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }}>
            <Link href="/login" className={styles.demoButton}>Get Started</Link>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <motion.button 
          whileTap={{ scale: 0.95 }}
          className={styles.mobileMenuButton} 
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={styles.mobileMenu}
        >
          <nav>
            <ul className={styles.mobileNavList}>
              {[
                { href: "/", text: "Home" },
                { href: "/about", text: "About Us" },
                { href: "/pricing", text: "Pricing" },
                { href: "/contact", text: "Contact Us" },
                { href: "/login", text: "Log In" },
                { href: "/login", text: "Start Free Trial" }
              ].map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={item.href} className={styles.mobileNavLink}>
                    {item.text}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>
        </motion.div>
      )}
    </header>
  );
};

export default Header;