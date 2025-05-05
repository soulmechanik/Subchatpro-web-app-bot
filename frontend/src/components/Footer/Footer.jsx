'use client';

import { motion } from 'framer-motion';
import styles from './Footer.module.scss';
import {
  Twitter,
  Instagram,
  Telegram,
  LinkedIn,
  WhatsApp,
  Facebook,
  Email,
  Phone,
 
  LocationOn
} from '@mui/icons-material';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [

    { icon: <Instagram />, name: 'Instagram', url: 'Instagram.com/subchatpro' },
    { icon: <Telegram />, name: 'Telegram', url: 'https://t.me/subchatpro' },
    { icon: <LinkedIn />, name: 'LinkedIn', url: 'https://linkedin.com/company/subchatpro' },
    { icon: <WhatsApp />, name: 'WhatsApp', url: 'https://wa.me/2341234567890' },
    { icon: <Facebook />, name: 'Facebook', url: 'TikTok.com/subchatpro' }
  ];

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { name: 'Features', url: '/features' },
        { name: 'Pricing', url: '/pricing' },
        { name: 'Integrations', url: '/integrations' },
        { name: 'Roadmap', url: '/roadmap' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', url: '/docs' },
        { name: 'API Reference', url: '/api' },
        { name: 'Guides', url: '/guides' },
        { name: 'Blog', url: '/blog' }
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', url: '/about' },
        { name: 'Careers', url: '/careers' },
        { name: 'Contact', url: '/contact' },
        { name: 'Press', url: '/press' }
      ]
    }
  ];

  return (
    <footer className={styles.footer}>
      {/* Top Section */}
      <div className={styles.topSection}>
        <div className={styles.container}>
          {/* Logo and Description */}
          <motion.div 
            className={styles.brandSection}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.logo}>SubChat<span>Pro</span></div>
            <p className={styles.tagline}>
              The complete solution for monetizing your Telegram community.
            </p>
            
            {/* Social Links */}
            <div className={styles.socialLinks}>
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Footer Links */}
          <div className={styles.linksSection}>
            {footerLinks.map((section, index) => (
              <motion.div 
                key={index}
                className={styles.linkGroup}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <h3 className={styles.linkTitle}>{section.title}</h3>
                <ul className={styles.linkList}>
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href={link.url} className={styles.linkItem}>
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            {/* Contact Info */}
            <motion.div 
              className={styles.contactGroup}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className={styles.linkTitle}>Contact</h3>
              <ul className={styles.contactList}>
                <li>
                  <Email className={styles.contactIcon} />
                  <span>hello@subchatpro.com</span>
                </li>
                <li>
                  <Phone className={styles.contactIcon} />
                  <span>08104886969</span>
                </li>
                <li>
                  <LocationOn className={styles.contactIcon} />
                  <span>Lagos, Nigeria</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className={styles.bottomSection}>
        <div className={styles.container}>
          <div className={styles.copyright}>
            © {currentYear} SubChatPro. All rights reserved.
          </div>
          
          <div className={styles.legalLinks}>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/cookies">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}