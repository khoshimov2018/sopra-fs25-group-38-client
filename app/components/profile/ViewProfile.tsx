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
      
      {/* Birthday section (if available) */}
      {user.birthday && (
        <div className={styles.cardSection}>
          <div className={styles.detailsLabel}>Birthday</div>
          <div className={styles.detailsValue}>{formatDate(user.birthday)}</div>
        </div>
      )}
      
      {/* Bio section (if available) */}
      {user.bio && (
        <div className={styles.cardSection}>
          <div className={styles.detailsLabel}>Bio</div>
          <div className={styles.detailsValue}>{user.bio}</div>
        </div>
      )}
      
      {/* Study Style section (if available) */}
      {user.studyStyle && (
        <div className={styles.cardSection}>
          <div className={styles.detailsLabel}>Study Style</div>
          <div className={styles.detailsValue}>{user.studyStyle}</div>
        </div>
      )}
      
      {/* Goal section (if available) */}
      {user.goal && (
        <div className={styles.cardSection}>
          <div className={styles.detailsLabel}>Goal</div>
          <div className={styles.detailsValue}>{user.goal}</div>
        </div>
      )}
      
      {/* Tags section (if available) */}
      {user.tags && user.tags.length > 0 && (
        <div className={styles.cardSection}>
          <div className={styles.detailsLabel}>Tags</div>
          <div className={styles.tagContainer}>
            {user.tags.map((tag, index) => (
              <span key={`tag-${index}`} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>
      )}
      
      {/* Study Levels section (if available) */}
      {user.studyLevels && user.studyLevels.length > 0 && (
        <div className={styles.cardSection}>
          <div className={styles.detailsLabel}>Study Levels</div>
          <div className={styles.studyLevelContainer}>
            {user.studyLevels.map((level, index) => (
              <div key={`level-${index}`} className={styles.studyLevelRow}>
                <div className={styles.studyLevelLeft}>
                  <span className={styles.studyLevelGrade}>{level.grade}</span>
                  <span className={styles.studyLevelSubject}>{level.subject}</span>
                  <span className={styles.studyLevelRight}> ({level.level})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewProfile;