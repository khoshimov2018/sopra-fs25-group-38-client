import React from 'react';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import styles from '@/styles/profile.module.css';

interface ProfileHeaderProps {
  isEditing: boolean;
  onEditToggle: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  isEditing,
  onEditToggle
}) => {
  return (
    <div className={styles.profileHeader}>
      <h1 className={styles.profileTitle}>Profile</h1>
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
    </div>
  );
};

export default ProfileHeader;