'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './about.module.scss';
import { 
  Bolt, Group, Dashboard, Security, Public,
  LooksOne, LooksTwo, Looks3, Looks4, Looks5, Looks6,
  ExpandMore, ExpandLess, Telegram, Payment, AccountCircle,
  ArrowRightAlt, CheckCircle, Star, East, TrendingUp,
  AutoAwesome, RocketLaunch, MonetizationOn
} from '@mui/icons-material';
import Header from '@/components/Header/Header';

const AboutUsPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <Bolt className={styles.featureIcon} />,
      title: "Auto-add users after payment",
      description: "No more manual adding. Subscribers get instant access upon payment.",
      color: '#4cc9f0'
    },
    {
      icon: <Group className={styles.featureIcon} />,
      title: "Auto-remove expired users",
      description: "Automatically clean up your group when subscriptions expire.",
      color: '#f72585'
    },
    {
      icon: <Dashboard className={styles.featureIcon} />,
      title: "Simple dashboard",
      description: "Easily manage all your subscribers in one intuitive interface.",
      color: '#7209b7'
    },
    {
      icon: <Security className={styles.featureIcon} />,
      title: "Secure payments",
      description: "Paystack integration ensures safe, reliable transactions.",
      color: '#3a86ff'
    },
    {
      icon: <Public className={styles.featureIcon} />,
      title: "Built for Africa",
      description: "Designed with African creators & businesses in mind.",
      color: '#4361ee'
    }
  ];

  const steps = [
    { icon: <LooksOne />, title: "Register account", description: "Create your SubChatPro account on our website & add Subchatprobot to your Telegram group as admin" },
    {
        icon: <LooksTwo />,
        title: "Connect Telegram",
        description: "Add the bot to your Telegram group. After adding it, Subchatprobot will send you your Group ID, which you'll need to complete your registration on our website."
      },
    { icon: <Looks3 />, title: "Configure group", description: "Set up your paid group parameters" },
    { icon: <Looks4 />, title: "Payment setup", description: "paystack is automatically integrated for seamsless Transactions " },
    { icon: <Looks5 />, title: "Set pricing", description: "Define your subscription plans" },
    { icon: <Looks6 />, title: "Share link", description: "Distribute your unique payment link" }
  ];

  const faqs = [
    {
      question: "What is SubChatPro?",
      answer: "SubChatPro automates access to Telegram groups through payments. Users are added after payment and removed when subscriptions expire."
    },
    {
      question: "How do I get started?",
      answer: "Sign up, connect your Telegram bot, set your group link, and integrate Paystack to get your custom payment link."
    },
    {
      question: "What payment methods work?",
      answer: "Paystack supports cards, bank transfers, and other local payment methods across Africa."
    },
    {
      question: "Is my group secure?",
      answer: "Absolutely. We only use Telegram's official Bot API to manage access, never storing your chats."
    },
    {
      question: "Can I set different plans?",
      answer: "Yes! Create weekly, monthly, or custom subscription plans with different pricing."
    }
  ];

  return (

    <>
    <Header/>
    <div className={styles.aboutPage}>
      {/* Hero Section */}
      <section className={styles.aboutIntro}>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
    className={styles.aboutIntroContent}
  >
    <div className={styles.badge}>
      <RocketLaunch className={styles.badgeIcon} />
      <span>Telegram Monetization Platform</span>
    </div>
    <h1 className={styles.aboutTitle}>
      About <span>SubChatPro</span>
    </h1>
    <div className={styles.aboutDescription}>
      <p>
        SubChatPro is the easiest way to monetize your Telegram community. We help creators, 
        coaches, communities, and businesses manage paid access to their private Telegram 
        groups — without the manual stress.
      </p>
      <p>
        With seamless integration to Paystack and Telegram Bot API, SubChatPro automatically 
        adds users once they pay and removes them when their subscription expires. Whether 
        you're running a content channel, VIP group, or private community, SubChatPro gives 
        you the tools to focus on delivering value while we handle access control.
      </p>
    </div>
    <motion.div 
      className={styles.statsContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className={styles.statItem}>
        <TrendingUp className={styles.statIcon} />
        <div>
          <h3>100%</h3>
          <p>Automated</p>
        </div>
      </div>
      <div className={styles.statItem}>
        <Security className={styles.statIcon} />
        <div>
          <h3>Secure</h3>
          <p>Payments</p>
        </div>
      </div>
      <div className={styles.statItem}>
        <AutoAwesome className={styles.statIcon} />
        <div>
          <h3>Easy</h3>
          <p>Setup</p>
        </div>
      </div>
    </motion.div>
  </motion.div>
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.8, delay: 0.2 }}
    className={styles.aboutIllustration}
  >
    <div className={styles.illustrationContainer}>
      <Telegram className={styles.telegramIcon} />
      <Payment className={styles.paymentIcon} />
      <Dashboard className={styles.dashboardIcon} />
    </div>
  </motion.div>
</section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2>Why Choose <span>SubChatPro</span></h2>
          <p>Powerful features designed for Telegram community monetization</p>
        </div>
        
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className={styles.featureCard}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                borderColor: hoveredCard === index ? feature.color : 'transparent'
              }}
            >
              <div 
                className={styles.iconWrapper}
                style={{ backgroundColor: `${feature.color}20` }}
              >
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <motion.div
                className={styles.hoverIndicator}
                animate={{
                  width: hoveredCard === index ? '100%' : '0%',
                  backgroundColor: feature.color
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <h2>How It <span>Works</span></h2>
          <p>Get set up in minutes and start earning from your community</p>
        </div>
        
        <div className={styles.stepsContainer}>
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className={styles.stepCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={styles.stepNumber}>
                {step.icon}
              </div>
              <div className={styles.stepContent}>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={styles.stepConnector}>
                  <ArrowRightAlt />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <h2>Frequently Asked <span>Questions</span></h2>
          <p>Everything you need to know about SubChatPro</p>
        </div>
        
        <div className={styles.faqContainer}>
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className={`${styles.faqItem} ${activeFaq === index ? styles.active : ''}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div
                className={styles.faqQuestion}
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              >
                <h3>
                  <CheckCircle className={styles.faqIcon} />
                  {faq.question}
                </h3>
                {activeFaq === index ? <ExpandLess /> : <ExpandMore />}
              </div>
              <AnimatePresence>
                {activeFaq === index && (
                  <motion.div
                    className={styles.faqAnswer}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p>{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
  <motion.div
    className={styles.ctaCard}
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
  >
    <TrendingUp className={styles.ctaIcon} />
    <h2>Ready to Monetize Your Telegram Community?</h2>
    <p>Join hundreds of creators who are already earning with SubChatPro</p>
    <Link href="/register">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={styles.ctaButton}
      >
        Get Started Now <East />
      </motion.button>
    </Link>
  </motion.div>
</section>
    </div>
    </>
  );
};

export default AboutUsPage;