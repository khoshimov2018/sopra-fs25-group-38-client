import React, { useState } from 'react';
import styles from '@/styles/profile.module.css';
import { UserProfile } from '@/types/profile';
import ProfileHeader from './ProfileHeader';
import ProfileImage from './ProfileImage';
import ViewProfile from './ViewProfile';
import EditProfile from './EditProfile';
import ProfilePreviewModal from './ProfilePreviewModal';

interface ProfileContentProps {
  currentUser: UserProfile;
  editableUser: UserProfile | null;
  isEditing: boolean;
  userId?: string;
  onEditToggle: () => void;
  onDeleteAccount: () => void;
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
  userId,
  onEditToggle,
  onDeleteAccount,
  onImageUpload,
  onInputChange,
  onTagChange,
  onStudyLevelChange,
  onAddTag,
  onRemoveTag,
  onAddStudyLevel,
  onRemoveStudyLevel
}) => {
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  // Show preview modal
  const handlePreview = () => {
    setPreviewModalVisible(true);
  };

  // Close preview modal
  const handleClosePreview = () => {
    setPreviewModalVisible(false);
  };

  // Save and publish from preview mode
  const handleSaveAndPublish = () => {
    onEditToggle(); 
    setPreviewModalVisible(false);
  };

  return (
    <div className={styles.content}>
      <ProfileHeader
        isEditing={isEditing}
        onEditToggle={onEditToggle}
        onDeleteAccount={onDeleteAccount}
        onPreview={isEditing && editableUser ? handlePreview : undefined}
        userId={userId}
      />
      
      <div className={styles.profileGrid}>
        <div className={styles.profileCard}>
          {isEditing && editableUser ? (
            // Edit mode
            <div className={styles.profileWithSidebar}>
              <div className={styles.profileSidebar}>
                <ProfileImage
                  currentUser={currentUser}
                  editableUser={editableUser}
                  isEditing={true}
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
                  onPreview={handlePreview}
                />
              </div>
            </div>
          ) : (
            <div className={styles.profileWithSidebar}>
              <div className={styles.profileSidebar}>
                <ProfileImage 
                  currentUser={currentUser}
                  editableUser={editableUser}
                  isEditing={false}
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

      {/* Profile Preview Modal */}
      {editableUser && (
        <ProfilePreviewModal
          visible={previewModalVisible}
          user={editableUser}
          onClose={handleClosePreview}
          onSave={handleSaveAndPublish}
        />
      )}
    </div>
  );
};

export default ProfileContent;