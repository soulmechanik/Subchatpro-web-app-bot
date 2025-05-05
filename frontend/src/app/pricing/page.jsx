'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './pricing.module.scss';
import { 
  CheckCircle, Star, Bolt, AutoAwesome,
  TrendingUp, RocketLaunch, Payment, Telegram,
  East, Diamond, Celebration, PriceChange,
  Savings, Percent, Groups
} from '@mui/icons-material';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import Link from 'next/link'

export default function Pricing() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState(0);
  const [subscriptionPrice, setSubscriptionPrice] = useState('5,000');
  const [rawPrice, setRawPrice] = useState(5000);
  const [earnings, setEarnings] = useState(4750);
  const [fee, setFee] = useState(250);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handlePriceChange = (e) => {
    // Get raw value without commas
    let value = e.target.value.replace(/,/g, '');
    
    // Remove leading zeros
    value = value.replace(/^0+/, '');
    
    // If empty, set to 0
    if (value === '') {
      setSubscriptionPrice('');
      setRawPrice(0);
      setFee(0);
      setEarnings(0);
      return;
    }
    
    // Parse to number
    const numValue = parseInt(value, 10) || 0;
    
    // Update raw price for calculations
    setRawPrice(numValue);
    
    // Format with commas for display
    const formattedValue = formatNumber(numValue);
    setSubscriptionPrice(formattedValue);
    
    // Calculate fee and earnings
    const calculatedFee = numValue * 0.05;
    setFee(calculatedFee);
    setEarnings(numValue - calculatedFee);
  };

  const handleBlur = () => {
    if (rawPrice === 0) {
      setSubscriptionPrice('0');
    } else if (subscriptionPrice === '') {
      setSubscriptionPrice('5,000');
      setRawPrice(5000);
      setFee(250);
      setEarnings(4750);
    }
  };

  const features = [
    {
      icon: <Bolt className={styles.featureIcon} />,
      title: "Instant Access",
      description: "Users get immediate entry after payment"
    },
    {
      icon: <Groups className={styles.featureIcon} />,
      title: "Auto Management",
      description: "Automatically add/remove members"
    },
    {
      icon: <Payment className={styles.featureIcon} />,
      title: "Secure Payments",
      description: "Paystack integration handles transactions"
    },
    {
      icon: <TrendingUp className={styles.featureIcon} />,
      title: "Growth Tools",
      description: "Built-in features to grow your community"
    }
  ];

  const testimonials = [
    {
      quote: "SubChatPro tripled my Telegram group revenue in just 2 months!",
      author: "Sarah K., Fitness Coach"
    },
    {
      quote: "Finally a solution that handles payments AND member management automatically.",
      author: "David T., Crypto Trader"
    },
    {
      quote: "The 5% fee is more than fair for the value and time saved.",
      author: "Amina B., Content Creator"
    }
  ];

  return (
    <>
    <Header/>
    <div className={styles.pricingPage}>
      {/* Pricing Hero */}
      <section className={styles.pricingHero}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={styles.heroContent}
        >
          <div className={styles.badge}>
            <Diamond className={styles.badgeIcon} />
            <span>Transparent Pricing</span>
          </div>
          <h1>
            <span>Free</span> for Creators.<br />
            Only <span>5%</span> per Transaction.
          </h1>
          <p className={styles.subtitle}>
            SubChatPro is completely free for creators, coaches, entrepreneurs and any Telegram group owners to use. 
            We only charge a small 5% fee on successful transactions.
          </p>
          <div className={styles.ctaContainer}>
  <Link href="/login">
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={styles.primaryCta}
    >
      Get Started <East />
    </motion.button>
  </Link>
 
</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={styles.heroIllustration}
        >
          <div className={styles.illustrationContainer}>
            <PriceChange className={styles.priceIcon} />
            <Percent className={styles.percentIcon} />
            <Celebration className={styles.celebrationIcon} />
          </div>
        </motion.div>
      </section>

  {/* Pricing Calculator */}
  <section className={styles.calculatorSection}>
        <div className={styles.sectionHeader}>
          <h2>Fee <span>Calculator</span></h2>
          <p>See exactly how much you'll earn</p>
        </div>

        <motion.div 
          className={styles.calculatorCard}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.calculatorVisual}>
            <div className={styles.amountInput}>
              <label>Subscription Price</label>
              <div className={styles.inputWrapper}>
                <span>₦</span>
                <input 
                  type="text" 
                  placeholder="5,000" 
                  value={subscriptionPrice}
                  onChange={handlePriceChange}
                  onBlur={handleBlur}
                  min="100"
                />
              </div>
            </div>

            <div className={styles.calculationBreakdown}>
              <div className={styles.calculationRow}>
                <span>Your Earnings</span>
                <span className={styles.earnings}>₦{formatNumber(earnings)}</span>
              </div>
              <div className={styles.calculationRow}>
                <span>SubChatPro Fee (5%)</span>
                <span className={styles.fee}>₦{formatNumber(fee)}</span>
              </div>
              <div className={styles.divider} />
              <div className={styles.calculationRow}>
                <span>Total Charged to Member</span>
                <span className={styles.total}>₦{subscriptionPrice === '' ? '0' : subscriptionPrice}</span>
              </div>
            </div>
          </div>

          <div className={styles.calculatorInfo}>
            <h3>Transparent Pricing</h3>
            <p>
              The 5% fee covers payment processing, platform maintenance, 
              and continuous feature development. No hidden costs.
            </p>
            <ul className={styles.benefitsList}>
              <li><CheckCircle /> No setup fees</li>
              <li><CheckCircle /> No monthly charges</li>
              <li><CheckCircle /> No withdrawal fees</li>
              <li><CheckCircle /> No hidden costs</li>
            </ul>
          </div>
        </motion.div>
      </section>

      {/* Value Proposition */}
      <section className={styles.valueSection}>
        <div className={styles.sectionHeader}>
          <h2>Unmatched <span>Value</span></h2>
          <p>What you get with our simple 5% transaction fee</p>
        </div>

        <div className={styles.valueGrid}>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className={`${styles.valueCard} ${activeFeature === index ? styles.active : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10 }}
              onClick={() => setActiveFeature(index)}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={styles.iconWrapper}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className={styles.activeIndicator} />
            </motion.div>
          ))}
        </div>
      </section>

    

      {/* Testimonials */}
      <section className={styles.testimonialsSection}>
        <div className={styles.sectionHeader}>
          <h2>What <span>Creators</span> Say</h2>
          <p>Hear from those already using SubChatPro</p>
        </div>

        <div className={styles.testimonialsGrid}>
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className={styles.testimonialCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <div className={styles.quoteMark}>"</div>
              <p className={styles.quote}>{testimonial.quote}</p>
              <div className={styles.author}>{testimonial.author}</div>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={styles.starIcon} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <motion.div
          className={styles.ctaCard}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <RocketLaunch className={styles.ctaIcon} />
          <h2>Ready to Monetize Your Community?</h2>
          <p>Start earning from your Telegram group today with our simple 5% fee structure</p>
          <Link href="/login">
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
    <Footer/>
    </>
  );
}