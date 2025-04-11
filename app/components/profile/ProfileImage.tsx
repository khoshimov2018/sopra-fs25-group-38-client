import React from 'react';
import { CameraOutlined } from '@ant-design/icons';
import styles from '@/styles/profile.module.css';
import { UserProfile } from '@/types/profile';

interface ProfileImageProps {
  currentUser: UserProfile;
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
  const profileImage = isEditing && editableUser ? editableUser.profileImage : currentUser.profileImage;
  
  return (
    <div className={styles.profileImageSection}>
      <div className={styles.profileImageCard}>
        <div className={styles.imageContainer}>
          {profileImage ? (
            <img 
              src={profileImage} 
              alt="Profile" 
              className={styles.profileImage}
            />
          ) : (
            <div className={styles.placeholderImage}>
              <svg 
                className={styles.placeholderIcon} 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
          )}
          {isEditing && (
            <button 
              className={styles.uploadButton} 
              onClick={onImageUpload}
            >
              <CameraOutlined /> {profileImage ? 'Change Photo' : 'Add Photo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileImage;