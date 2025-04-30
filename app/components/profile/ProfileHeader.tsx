import React from 'react';
import { EditOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from '@/styles/profile.module.css';

interface ProfileHeaderProps {
  isEditing: boolean;
  onEditToggle: () => void;
  onDeleteAccount: () => void;
  userId?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  isEditing,
  onEditToggle,
  onDeleteAccount,
  userId
}) => {
  return (
    <div className={styles.profileHeader}>
      <h1 className={styles.profileTitle}>Profile</h1>
      <div className={styles.headerButtonsContainer}>
        {!userId && (
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
          )}
        {!userId && !isEditing && (
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