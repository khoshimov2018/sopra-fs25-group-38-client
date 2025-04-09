import React from 'react';
import { CameraOutlined, UserOutlined } from '@ant-design/icons';
import styles from '@/styles/profile.module.css';
import { UserProfile } from '@/types/profile';
import { Avatar } from 'antd';

interface ProfileImageProps {
  currentUser: UserProfile | null;
  editableUser?: UserProfile | null;
  isEditing: boolean;
  onImageUpload: () => void;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  currentUser,
  editableUser,
  isEditing,
  onImageUpload
}) => {
  // Handle null case
  if (!currentUser) {
    return (
      <div className={styles.profileImageSection}>
        <div className={styles.imageContainer}>
          <Avatar size={150} icon={<UserOutlined />} />
        </div>
      </div>
    );
  }

  const profilePicture = isEditing && editableUser 
    ? editableUser.profilePicture 
    : currentUser.profilePicture;
    
  return (
    <div className={styles.profileImageSection}>
      <div className={styles.imageContainer}>
        {profilePicture ? (
          <img 
            src={profilePicture} 
            alt={currentUser.name || "Profile"} 
            className={styles.profileImage}
          />
        ) : (
          <Avatar
            size={150}
            icon={<UserOutlined />}
            className={styles.profileImage}
          />
        )}
        {isEditing && (
          <button 
            className={styles.uploadButton} 
            onClick={onImageUpload}
          >
            <CameraOutlined /> Change Photo
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileImage;