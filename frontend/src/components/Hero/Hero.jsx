'use client'
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheckCircle, FiUsers, FiDollarSign, FiActivity } from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import Link from 'next/link';
import styles from './Hero.module.scss';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Hero = () => {
  // Chart data
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Revenue',
        data: [1200, 1900, 3000, 2500, 4200],
        backgroundColor: '#07ba4f',
        borderRadius: 6
      }
    ]
  };

  const memberData = {
    labels: ['Free', 'Premium'],
    datasets: [
      {
        data: [35, 65],
        backgroundColor: ['#333', '#07ba4f'],
        borderWidth: 0
      }
    ]
  };

  return (
    <section className={styles.hero}>
      {/* Animated background elements */}
      <div className={styles.heroBackground} />
      <div className={styles.gridPattern} />
      
      <div className={styles.heroContainer}>
        {/* Badge with Motion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={styles.heroBadge}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" className={styles.telegramIcon}>
            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
          </svg>
          <span>Telegram Monetization Platform</span>
        </motion.div>

        {/* Main Content Grid */}
        <div className={styles.heroGrid}>
          {/* Text Content */}
          <div className={styles.heroContent}>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={styles.heroTitle}
            >
              Turn Your <span className={styles.gradientText}>Telegram Group</span><br />
              Into a <span className={styles.gradientText}>Revenue Stream</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className={styles.heroSubtitle}
            >
              SubChat provides everything you need to monetize your Telegram community
              with automated payments, member management, and real-time analytics.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className={styles.heroCta}
            >
              <Link href="/login" className={styles.primaryButton}>
                Get Started Now <FiArrowRight className={styles.buttonIcon} />
              </Link>
              <Link href="/login" className={styles.secondaryButton}>
                Explore Features
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className={styles.heroFeatures}
            >
              {[
                "Automated subscription payments",
                "Real-time revenue analytics",
                "Member access control",
                "Telegram bot integration"
              ].map((feature, index) => (
                <div key={index} className={styles.heroFeature}>
                  <FiCheckCircle className={styles.featureIcon} />
                  <span>{feature}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Dashboard Visualization */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={styles.dashboardContainer}
          >
            <div className={styles.dashboard}>
              {/* Dashboard Header */}
              <div className={styles.dashboardHeader}>
                <h3>Group Analytics</h3>
                <div className={styles.timeFilter}>Last 30 days</div>
              </div>

              {/* Stats Row */}
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <FiUsers className={styles.statIcon} />
                  <div>
                    <div className={styles.statValue}>1,248</div>
                    <div className={styles.statLabel}>Total Members</div>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <FiDollarSign className={styles.statIcon} />
                  <div>
                    <div className={styles.statValue}>$3,842</div>
                    <div className={styles.statLabel}>Monthly Revenue</div>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <FiActivity className={styles.statIcon} />
                  <div>
                    <div className={styles.statValue}>89%</div>
                    <div className={styles.statLabel}>Retention</div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className={styles.chartsContainer}>
                <div className={styles.barChart}>
                  <Bar 
                    data={revenueData} 
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.1)' } },
                        x: { grid: { color: 'rgba(255,255,255,0.1)' } }
                      }
                    }}
                  />
                </div>
                <div className={styles.doughnutChart}>
                  <Doughnut 
                    data={memberData} 
                    options={{
                      cutout: '70%',
                      plugins: { legend: { position: 'bottom' } }
                    }}
                  />
                </div>
              </div>

              {/* Recent Messages Preview */}
              <div className={styles.messagesPreview}>
                <div className={styles.previewHeader}>Recent Activity</div>
                {[
                  { user: "Alex M.", action: "subscribed to Premium", time: "2 min ago" },
                  { user: "Sarah K.", action: "renewed subscription", time: "15 min ago" },
                  { user: "Group", action: "248 new messages", time: "1 hr ago" }
                ].map((item, index) => (
                  <div key={index} className={styles.messageItem}>
                    <div className={styles.messageAvatar}></div>
                    <div className={styles.messageContent}>
                      <span className={styles.messageUser}>{item.user}</span> {item.action}
                      <div className={styles.messageTime}>{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;