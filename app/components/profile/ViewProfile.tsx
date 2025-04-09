import React from 'react';
import styles from '@/styles/profile.module.css';
import { UserProfile } from '@/types/profile';
import { Tag } from 'antd';

interface ViewProfileProps {
  user: UserProfile | null;
}

const ViewProfile: React.FC<ViewProfileProps> = ({ user }) => {
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (!user) {
    return (
      <div className={styles.profileCard} style={{ border: 'none' }}>
        <div className={styles.cardSection}>
          <div className={styles.detailsLabel}>Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileCard} style={{ border: 'none' }}>
      {/* Name section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Name</div>
        <div className={styles.detailsValue}>{user.name || 'Not specified'}</div>
      </div>
      
      {/* Email section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Email</div>
        <div className={styles.detailsValue}>{user.email || 'Not specified'}</div>
      </div>
      
      {/* Birthday section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Birthday</div>
        <div className={styles.detailsValue}>{user.birthday ? formatDate(user.birthday) : 'Not specified'}</div>
      </div>
      
      {/* Study Level section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Study Level</div>
        <div className={styles.detailsValue}>{user.studyLevel || 'Not specified'}</div>
      </div>

      {/* Study Style section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Study Style</div>
        <div className={styles.detailsValue}>{user.studyStyle || 'Not specified'}</div>
      </div>
      
      {/* Study Goals section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Study Goals</div>
        <div className={styles.detailsValue}>
          {user.formattedStudyGoals && user.formattedStudyGoals.length > 0 ? (
            <div className={styles.tagContainer}>
              {user.formattedStudyGoals.map((goal, index) => (
                <Tag key={`goal-${index}`} color="blue" style={{ margin: '2px' }}>{goal}</Tag>
              ))}
            </div>
          ) : (
            user.studyGoals || 'Not specified'
          )}
        </div>
      </div>
      
{/* Bio section removed as requested */}
      
      {/* Courses section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Courses</div>
        {user.userCourses && user.userCourses.length > 0 ? (
          <div className={styles.studyLevelContainer}>
            {user.userCourses.map((course, index) => (
              <div key={`course-${index}`} className={styles.studyLevelRow}>
                <div className={styles.studyLevelLeft}>
                  <span className={styles.studyLevelSubject}>{course.courseName}</span>
                  <span className={styles.studyLevelRight}> ({course.knowledgeLevel})</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.detailsValue}>No courses added</div>
        )}
      </div>
    </div>
  );
};

export default ViewProfile;