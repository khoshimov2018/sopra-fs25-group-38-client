import React, { useState } from 'react';
import { EditOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from '@/styles/profile.module.css';

interface ProfileHeaderProps {
  isEditing: boolean;
  onEditToggle: () => void;
  onDeleteAccount: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  isEditing,
  onEditToggle,
  onDeleteAccount
}) => {
  return (
    <div className={styles.profileHeader}>
      <h1 className={styles.profileTitle}>Profile</h1>
      <div className={styles.headerButtonsContainer}>
        <button 
          className={`${styles.editButton} ${isEditing ? styles.saveButton : ''}`} 
          onClick={onEditToggle}
          aria-label={isEditing ? 'Save profile changes' : 'Edit profile'}
        >
          <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
          {isEditing ? 
            <SaveOutlined className={styles.editIcon} /> : 
            <EditOutlined className={styles.editIcon} />
          }
        </button>
        {!isEditing && (
          <button 
            className={styles.deleteButton} 
            onClick={onDeleteAccount}
            aria-label="Delete account"
          >
            <span>Delete Account</span>
            <DeleteOutlined className={styles.deleteIcon} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;