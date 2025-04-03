import React from 'react';
import { EditOutlined } from '@ant-design/icons';
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
        className={styles.editButton} 
        onClick={onEditToggle}
      >
        <span>{isEditing ? 'Save' : 'Edit'}</span>
        <EditOutlined className={styles.editIcon} />
      </button>
    </div>
  );
};

export default ProfileHeader;