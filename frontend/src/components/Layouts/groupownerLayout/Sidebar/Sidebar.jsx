// components/Sidebar/index.jsx
'use client';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import Link from 'next/link';
import { 
  Dashboard, 
  Group, 
  Payments, 
  Settings,
  ExitToApp
} from '@mui/icons-material';
import styles from './Sidebar.module.scss';

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Members', icon: <Group />, path: '/members' },
  { text: 'Payments', icon: <Payments />, path: '/payments' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
];

export default function Sidebar({ onItemClick }) {
  return (
    <div className={styles.sidebarContainer}>
      <div className={styles.logoContainer}>
        <img 
          src="/images/logo.png" 
          alt="Company Logo" 
          className={styles.logo}
        />
      </div>
      
      <List className={styles.menuList}>
        {menuItems.map((item) => (
          <Link href={item.path} key={item.text} passHref>
            <ListItem 
              button 
              className={styles.menuItem}
              onClick={onItemClick}
            >
              <ListItemIcon className={styles.menuIcon}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ variant: 'subtitle2' }}
              />
            </ListItem>
          </Link>
        ))}
      </List>
      
      <div className={styles.footer}>
        <ListItem button className={styles.logoutButton}>
          <ListItemIcon className={styles.menuIcon}>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{ variant: 'subtitle2' }}
          />
        </ListItem>
      </div>
    </div>
  );
}