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
  return (
    <div className={styles.profileImageSection}>
      <div className={styles.imageContainer}>
        <img 
          src={isEditing && editableUser ? editableUser.profileImage : currentUser.profileImage} 
          alt={currentUser.name || "Profile"} 
          className={styles.profileImage}
        />
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