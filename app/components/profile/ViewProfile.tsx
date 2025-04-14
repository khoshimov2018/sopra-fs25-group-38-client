import React from 'react';
import styles from '@/styles/profile.module.css';
import { UserProfile } from '@/types/profile';

interface ViewProfileProps {
  user: UserProfile;
}

const ViewProfile: React.FC<ViewProfileProps> = ({ user }) => {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={styles.profileCard} style={{ border: 'none' }}>
      {/* Name section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Name</div>
        <div className={styles.detailsValue}>{user.name}</div>
      </div>
      
      {/* Email section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Email</div>
        <div className={styles.detailsValue}>{user.email}</div>
      </div>
      
      {/* Study Level section - always shown */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Study Level</div>
        <div className={styles.detailsValue}>
          {user.studyLevel || "Not specified"}
        </div>
      </div>
      
      {/* Study Goals section (if available) */}
      {user.studyGoals && (
        <div className={styles.cardSection}>
          <div className={styles.detailsLabel}>Study Goals</div>
          <div className={styles.detailsValue}>
            {typeof user.studyGoals === 'string' 
              ? user.studyGoals 
              : Array.isArray(user.studyGoals) 
                ? user.studyGoals.join(', ') 
                : ''}
          </div>
        </div>
      )}
      
      {/* Availability section (if available) */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Availability</div>
        <div className={styles.detailsValue}>
          {!user.availability ? 'Not specified' :
           user.availability === 'MORNING' ? 'Morning' : 
           user.availability === 'AFTERNOON' ? 'Afternoon' : 
           user.availability === 'EVENING' ? 'Evening' : user.availability}
        </div>
      </div>
      
      {/* Bio section (if available) */}
      {user.bio && (
        <div className={styles.cardSection}>
          <div className={styles.detailsLabel}>Bio</div>
          <div className={styles.detailsValue}>{user.bio}</div>
        </div>
      )}
      
      {/* Courses section - handles both userCourses and studyLevels */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Courses</div>
        <div className={styles.studyLevelContainer}>
          {user.userCourses && user.userCourses.length > 0 ? (
            // If userCourses exists, display from there
            user.userCourses.map((course, index) => (
              <div key={`course-${index}`} className={styles.studyLevelRow}>
                <div className={styles.studyLevelLeft}>
                  <span className={styles.studyLevelSubject}>{course.courseName}</span>
                  <span className={styles.studyLevelRight}> ({course.knowledgeLevel})</span>
                </div>
              </div>
            ))
          ) : user.studyLevels && user.studyLevels.length > 0 ? (
            // If only studyLevels exists, display from there
            user.studyLevels.map((level, index) => (
              <div key={`level-${index}`} className={styles.studyLevelRow}>
                <div className={styles.studyLevelLeft}>
                  <span className={styles.studyLevelSubject}>{level.subject}</span>
                  <span className={styles.studyLevelRight}> ({level.level})</span>
                </div>
              </div>
            ))
          ) : (
            // If neither exists, show a message
            <div>No courses specified</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;