import React from 'react';
import styles from '@/styles/profile.module.css';
import { UserProfile } from '@/types/profile';
import ProfileHeader from './ProfileHeader';
import ProfileImage from './ProfileImage';
import ViewProfile from './ViewProfile';
import EditProfile from './EditProfile';

interface ProfileContentProps {
  currentUser: UserProfile;
  editableUser: UserProfile | null;
  isEditing: boolean;
  onEditToggle: () => void;
  onImageUpload: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onTagChange: (index: number, value: string) => void;
  onStudyLevelChange: (index: number, field: 'subject' | 'grade' | 'level', value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (index: number) => void;
  onAddStudyLevel: () => void;
  onRemoveStudyLevel: (index: number) => void;
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  currentUser,
  editableUser,
  isEditing,
  onEditToggle,
  onImageUpload,
  onInputChange,
  onTagChange,
  onStudyLevelChange,
  onAddTag,
  onRemoveTag,
  onAddStudyLevel,
  onRemoveStudyLevel
}) => {
  return (
    <div className={styles.content}>
      <ProfileHeader isEditing={isEditing} onEditToggle={onEditToggle} />
      
      <div className={styles.profileGrid}>
        <div className={styles.profileCard}>
          {isEditing && editableUser ? (
            <div className={styles.profileWithSidebar}>
              <div className={styles.profileSidebar}>
                <ProfileImage 
                  currentUser={currentUser}
                  editableUser={editableUser}
                  isEditing={isEditing}
                  onImageUpload={onImageUpload}
                />
              </div>
              <div className={styles.profileContent}>
                <EditProfile 
                  user={editableUser}
                  onInputChange={onInputChange}
                  onStudyLevelChange={onStudyLevelChange}
                  onAddStudyLevel={onAddStudyLevel}
                  onRemoveStudyLevel={onRemoveStudyLevel}
                  onSave={onEditToggle}
                />
              </div>
            </div>
          ) : (
            <div className={styles.profileWithSidebar}>
              <div className={styles.profileSidebar}>
                <ProfileImage 
                  currentUser={currentUser}
                  editableUser={editableUser}
                  isEditing={isEditing}
                  onImageUpload={onImageUpload}
                />
              </div>
              <div className={styles.profileContent}>
                <ViewProfile user={currentUser} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileContent;