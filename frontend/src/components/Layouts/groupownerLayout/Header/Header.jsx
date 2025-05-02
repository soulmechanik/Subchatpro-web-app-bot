// components/Header/index.jsx
'use client';
import { Avatar, Badge, IconButton, Typography } from '@mui/material';
import { Notifications, Search } from '@mui/icons-material';
import styles from './Header.module.scss';

export default function Header() {
  return (
    <div className={styles.header}>
      <div className={styles.searchBar}>
        <IconButton>
          <Search className={styles.searchIcon} />
        </IconButton>
        <input 
          type="text" 
          placeholder="Search..." 
          className={styles.searchInput}
        />
      </div>
      
      <div className={styles.userSection}>
        <IconButton className={styles.notificationButton}>
          <Badge badgeContent={4} color="error">
            <Notifications className={styles.notificationIcon} />
          </Badge>
        </IconButton>
        
        <div className={styles.userProfile}>
          <Avatar 
            src="/images/avatar.jpg" 
            className={styles.avatar}
          />
          <Typography variant="subtitle1" className={styles.userName}>
            John Doe
          </Typography>
        </div>
      </div>
    </div>
  );
}