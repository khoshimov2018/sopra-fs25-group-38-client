import React from 'react';
import styles from '@/styles/profile.module.css';
import { UserProfile } from '@/types/profile';
import ProfileHeader from './ProfileHeader';
import ProfileImage from './ProfileImage';
import ViewProfile from './ViewProfile';
import EditProfile from './EditProfile';

interface ProfileContentProps {
  currentUser: UserProfile | null;
  editableUser: UserProfile | null;
  availableCourses?: Array<{id: number, courseName: string}>;
  isEditing: boolean;
  onEditToggle: () => void;
  onImageUpload: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string | string[]) => void;
  onCourseChange: (index: number, field: 'courseId' | 'knowledgeLevel', value: any) => void;
  onAddCourse: () => void;
  onRemoveCourse: (index: number) => void;
  onDeleteAccount?: () => void;
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  currentUser,
  editableUser,
  availableCourses = [],
  isEditing,
  onEditToggle,
  onImageUpload,
  onInputChange,
  onSelectChange,
  onCourseChange,
  onAddCourse,
  onRemoveCourse,
  onDeleteAccount
}) => {
  // Try to load from cache first if we're still loading
  const cachedProfileData = typeof window !== 'undefined' ? localStorage.getItem("cachedUserProfile") : null;
  const cachedProfile = cachedProfileData ? JSON.parse(cachedProfileData) as UserProfile : null;
  
  // Show loading or empty state with cached data if available
  if (!currentUser) {
    if (cachedProfile) {
      // Use cached data while loading the fresh data
      return (
        <div className={styles.content}>
          <div className={styles.profileHeader}>
            <h1 className={styles.profileTitle}>Profile</h1>
            {/* No edit button shown during loading from cache */}
          </div>
          <div className={styles.profileGrid}>
            <div className={styles.profileCard}>
              <ProfileImage 
                currentUser={cachedProfile}
                isEditing={false}
                onImageUpload={() => {}}
              />
              <div className={styles.profileDetailsSection}>
                <ViewProfile user={cachedProfile} />
                <div className={styles.loadingOverlay}>
                  <p>Refreshing profile data...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // No cached data available, show loading state
    return (
      <div className={styles.content}>
        <div className={styles.profileHeader}>
          <h1 className={styles.profileTitle}>Profile</h1>
          {/* No edit button shown during loading */}
        </div>
        <div className={styles.profileGrid}>
          <div className={styles.profileCard}>
            <div className={styles.loadingProfile}>
              <p>Loading profile information...</p>
              <p>Please wait while we retrieve your data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <ProfileHeader isEditing={isEditing} onEditToggle={onEditToggle} />
      
      <div className={styles.profileGrid}>
        <div className={styles.profileCard}>
          <ProfileImage 
            currentUser={currentUser}
            editableUser={editableUser}
            isEditing={isEditing}
            onImageUpload={onImageUpload}
          />
          
          <div className={styles.profileDetailsSection}>
            {isEditing && editableUser ? (
              <EditProfile 
                user={editableUser}
                availableCourses={availableCourses}
                onInputChange={onInputChange}
                onSelectChange={onSelectChange}
                onCourseChange={onCourseChange}
                onAddCourse={onAddCourse}
                onRemoveCourse={onRemoveCourse}
              />
            ) : (
              <ViewProfile user={currentUser} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileContent;