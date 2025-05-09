'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FiCompass, FiLayers, FiUsers, FiSettings,
  FiChevronRight, FiPlus, FiHash, FiSearch,
  FiBell, FiHelpCircle, FiChevronDown, FiMenu
} from 'react-icons/fi'
import styles from './Layout.module.scss'

export default function ModernLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  const handleNavClick = (navKey, route) => {
    setActiveNav(navKey)
    setMobileMenuOpen(false)
    router.push(route)
  }

  return (
    <div className={styles.layoutContainer}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <button 
          className={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <FiMenu size={20} />
        </button>
        <div className={styles.mobileLogo}>SubChat</div>
      </header>

      {/* Sidebar */}
      <aside 
        className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''} ${mobileMenuOpen ? styles.mobileOpen : ''}`}
      >
        <button 
          className={styles.collapseButton}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <FiChevronRight className={`${styles.collapseIcon} ${sidebarCollapsed ? styles.rotated : ''}`} />
        </button>

        <div className={styles.logoContainer}>
          {!sidebarCollapsed ? (
            <span className={styles.logoFull}>SubChatpro</span>
          ) : (
            <span className={styles.logoCollapsed}>S</span>
          )}
        </div>

        <nav className={styles.primaryNav}>
          <NavItem 
            icon={<FiCompass />}
            label="Dashboard"
            active={activeNav === 'dashboard'}
            collapsed={sidebarCollapsed}
            onClick={() => handleNavClick('dashboard', '/groupowner/overview')}
          />
          <NavItem 
            icon={<FiLayers />}
            label="Transactions"
            active={activeNav === 'transactions'}
            collapsed={sidebarCollapsed}
            onClick={() => handleNavClick('transactions', '/groupowner/transactions')}
          />
          <NavItem 
            icon={<FiUsers />}
            label="Groups"
            active={activeNav === 'groups'}
            collapsed={sidebarCollapsed}
            onClick={() => handleNavClick('groups', '/groupowner/groups')}
          />
          <NavItem 
            icon={<FiSettings />}
            label="Settings"
            active={activeNav === 'settings'}
            collapsed={sidebarCollapsed}
            onClick={() => handleNavClick('settings', '/groupowner/settings')}
          />
        </nav>

       

        <div className={styles.userProfile}>
          <div className={styles.avatar}>G-O</div>
          {!sidebarCollapsed && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>Owner</span>
              <span className={styles.userRole}>G-O</span>
            </div>
          )}
          {!sidebarCollapsed && (
            <button className={styles.profileMenuButton}>
              <FiChevronDown size={16} />
            </button>
          )}
        </div>
      </aside>

      <div className={styles.contentArea}>
        <header className={styles.desktopHeader}>
          <div className={styles.searchBar}>
            <FiSearch className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search anything..."
              className={styles.searchInput}
            />
            <div className={styles.searchShortcut}>⌘K</div>
          </div>

        </header>

        <main className={styles.mainContent}>
          {children}
        </main>
      </div>

      {mobileMenuOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}

function NavItem({ icon, label, count, active, collapsed, onClick }) {
  return (
    <button
      className={`${styles.navItem} ${active ? styles.active : ''}`}
      onClick={onClick}
    >
      <div className={styles.navIcon}>{icon}</div>
      {!collapsed && (
        <>
          <span className={styles.navLabel}>{label}</span>
          {count && <span className={styles.navCount}>{count}</span>}
        </>
      )}
    </button>
  )
}

function WorkspaceItem({ name, icon, color, collapsed }) {
  return (
    <button className={styles.workspaceItem}>
      <div 
        className={styles.workspaceIcon}
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      {!collapsed && (
        <span className={styles.workspaceName}>{name}</span>
      )}
    </button>
  )
}
