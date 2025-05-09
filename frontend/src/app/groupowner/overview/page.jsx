'use client'
import { useEffect, useState } from 'react'
import ModernLayout from '@/components/Layouts/groupownerLayout/Layout'
import { 
  FiDollarSign, FiUsers, FiRefreshCw, FiCreditCard,
  FiArrowUp, FiArrowDown, FiPlus, FiMessageSquare,
  FiLink, FiActivity, FiPieChart, FiBarChart2, FiLoader
} from 'react-icons/fi'
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import styles from './overview.module.scss'
import axiosInstance from '@/utils/axiosInstance';


const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0
  }).format(amount).replace('NGN', '₦')
}

function SummaryCard({ icon, title, value, change, trend }) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.cardIcon}>{icon}</div>
      <div className={styles.cardContent}>
        <span className={styles.cardTitle}>{title}</span>
        <span className={styles.cardValue}>{value}</span>
        <div className={`${styles.cardTrend} ${trend === 'up' ? styles.up : styles.down}`}>
          {trend === 'up' ? <FiArrowUp /> : <FiArrowDown />}
          <span>{change}</span>
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ item }) {
  return (
    <div className={styles.activityItem}>
      <div className={styles.avatar}>{item.user.charAt(0)}</div>
      <div className={styles.activityContent}>
        <div className={styles.activityText}>
          <strong>{item.user}</strong> {item.action} {item.plan}
        </div>
        <div className={styles.activityTime}>{item.time}</div>
      </div>
      <div className={`${styles.activityBadge} ${item.action === 'payment failed' ? styles.error : ''}`}>
        {item.action}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)


  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get('/api/groupowner/overview'); // 👈 use axiosInstance
        setDashboardData(response.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <ModernLayout>
        <div className={styles.loadingContainer}>
          <FiLoader className={styles.spinner} />
          <p>Loading dashboard data...</p>
        </div>
      </ModernLayout>
    )
  }

  if (error) {
    return (
      <ModernLayout>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>Error: {error}</p>
        </div>
      </ModernLayout>
    )
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  // Prepare chart data (NO DIVISION BY 100)
  const revenueData = dashboardData?.revenueTrend.map(item => ({
    name: item.month,
    revenue: item.revenue // Use raw value
  })) || []

  const subscriptionTiers = dashboardData?.subscriptionTiers.map(tier => ({
    name: tier.tier,
    value: tier.count
  })) || []

  const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1']

  return (
    <ModernLayout>
      <div className={styles.dashboard}>
        {/* Summary Cards */}
        <div className={styles.summaryGrid}>
        <SummaryCard 
  icon={<FiDollarSign />}
  title="Total Earnings"
  value={formatCurrency((dashboardData?.summary.totalEarnings || 0) / 100)}
  change="+0%"
  trend="up"
/>
          <SummaryCard 
            icon={<FiUsers />}
            title="Active Subscribers"
            value={dashboardData?.summary.activeSubscribers.toLocaleString() || '0'}
            change="+0%"
            trend="up"
          />
          <SummaryCard 
            icon={<FiRefreshCw />}
            title="Renewal Rate"
            value={`${dashboardData?.summary.renewalRate || 0}%`}
            change="+0%"
            trend="up"
          />
         <SummaryCard 
  icon={<FiCreditCard />}
  title="Pending Payout"
  value={formatCurrency((dashboardData?.summary.pendingPayout || 0) / 100)}
  change="+0%"
  trend="up"
/>
        </div>

        {/* Charts Section */}
        <div className={styles.chartsSection}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <FiActivity />
              <h3>Revenue Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <FiPieChart />
              <h3>Subscription Tiers</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={subscriptionTiers}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {subscriptionTiers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.activitySection}>
          <h3>Recent Activity</h3>
          <div className={styles.activityList}>
            {dashboardData?.recentActivity.map((item, index) => (
              <ActivityItem 
                key={index}
                item={{
                  user: item.user,
                  action: item.action,
                  plan: item.amount,
                  time: formatDate(item.date)
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </ModernLayout>
  )
}