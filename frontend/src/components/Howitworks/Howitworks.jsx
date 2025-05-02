'use client'
import { motion, useAnimation } from 'framer-motion';
import { FiUser, FiDollarSign, FiKey, FiUsers, FiMessageSquare, FiArrowRight } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import styles from './Howitworks.module.scss';

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  const controls = useAnimation();

  const steps = [
    {
      icon: <FiUser size={24} />,
      title: "Create Your Group",
      description: "Set up your exclusive Telegram group and configure access settings",
      color: "#07ba4f",
      visualization: (
        <div className={styles.visualizationCreate}>
          <div className={styles.telegramIconLarge} />
          <motion.div 
            className={styles.groupCreation}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.groupSettings}>
              <div className={styles.settingItem}>
                <div className={styles.settingToggle} />
                <span>Private Group</span>
              </div>
              <div className={styles.settingItem}>
                <div className={styles.settingToggle} />
                <span>Subscription Required</span>
              </div>
            </div>
          </motion.div>
        </div>
      )
    },
    {
      icon: <FiDollarSign size={24} />,
      title: "Set Pricing",
      description: "Choose your monthly or one-time payment amount",
      color: "#00d2ff",
      visualization: (
        <div className={styles.visualizationPricing}>
          <div className={styles.priceOptions}>
            {['$4.99', '$9.99', '$19.99'].map((price, i) => (
              <motion.div
                key={i}
                className={styles.priceCard}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <div className={styles.priceValue}>{price}</div>
                <div className={styles.priceLabel}>per month</div>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      icon: <FiKey size={24} />,
      title: "Share Access",
      description: "Distribute your unique SubChat link to your audience",
      color: "#a18cd1",
      visualization: (
        <div className={styles.visualizationShare}>
          <div className={styles.linkBox}>
            <div className={styles.linkText}>subchat.com/yourgroup</div>
            <button className={styles.copyButton}>Copy</button>
          </div>
          <div className={styles.socialIcons}>
            {['Twitter', 'Telegram', 'Email'].map((platform, i) => (
              <motion.div
                key={i}
                className={styles.socialIcon}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                {platform}
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      icon: <FiUsers size={24} />,
      title: "Members Join",
      description: "Subscribers gain instant access after payment",
      color: "#ff8a00",
      visualization: (
        <div className={styles.visualizationMembers}>
          <div className={styles.memberAvatars}>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className={styles.memberAvatar}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                style={{ backgroundImage: `url(https://i.pravatar.cc/150?img=${i + 10})` }}
              />
            ))}
          </div>
          <div className={styles.memberCounter}>
            +<span className={styles.counterNumber}>248</span> new members
          </div>
        </div>
      )
    },
    {
      icon: <FiMessageSquare size={24} />,
      title: "Engage Community",
      description: "Focus on content while we handle payments & access",
      color: "#ff00ff",
      visualization: (
        <div className={styles.visualizationEngage}>
          <div className={styles.messageStream}>
            {[
              "Welcome to the group!",
              "New content posted!",
              "Q&A session starting soon"
            ].map((msg, i) => (
              <motion.div
                key={i}
                className={styles.messageBubble}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.15 }}
              >
                {msg}
              </motion.div>
            ))}
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    controls.start({
      x: activeStep * -100 + '%',
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    });
  }, [activeStep, controls]);

  return (
    <section className={styles.howItWorks}>
      <div className={styles.container}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={styles.header}
        >
          <h2 className={styles.title}>
            <span className={styles.gradientText}>How SubChat Works</span>
          </h2>
          <p className={styles.subtitle}>
            Monetizing your Telegram community has never been easier
          </p>
        </motion.div>

        {/* Interactive Process Flow */}
        <div className={styles.processFlow}>
          {/* Step Cards */}
          <div className={styles.stepCards}>
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className={`${styles.stepCard} ${activeStep === index ? styles.active : ''}`}
                onClick={() => setActiveStep(index)}
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                style={{ borderColor: step.color }}
              >
                <div 
                  className={styles.cardIcon}
                  style={{ backgroundColor: `${step.color}20`, color: step.color }}
                >
                  {step.icon}
                </div>
                <div className={styles.cardContent}>
                  <h3 style={{ color: step.color }}>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Visualization Area */}
          <div className={styles.visualizationContainer}>
            <motion.div 
              className={styles.visualizationTrack}
              animate={controls}
            >
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className={styles.visualizationStep}
                  style={{ width: '100%' }}
                >
                  {step.visualization}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Progress Indicators */}
        <div className={styles.progressIndicators}>
          {steps.map((_, index) => (
            <button
              key={index}
              className={`${styles.progressDot} ${activeStep === index ? styles.active : ''}`}
              onClick={() => setActiveStep(index)}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className={styles.cta}
        >
          <button className={styles.ctaButton}>
            Get Started in Minutes
            <FiArrowRight className={styles.arrowIcon} />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;