import React from 'react';
import styles from '@/styles/profile.module.css';
import { UserProfile } from '@/types/profile';

interface ViewProfileProps {
  user: UserProfile;
}

const ViewProfile: React.FC<ViewProfileProps> = ({ user }) => {
  // Compute study goals text
  let studyGoalsText = '';
  if (user.studyGoals) {
    if (typeof user.studyGoals === 'string') {
      studyGoalsText = user.studyGoals;
    } else if (Array.isArray(user.studyGoals)) {
      studyGoalsText = user.studyGoals.join(', ');
    }
  }

  // Compute availability text
  const availabilityText = (() => {
    if (!user.availability) return 'Not specified';
    switch (user.availability) {
      case 'MORNING':
        return 'Morning';
      case 'AFTERNOON':
        return 'Afternoon';
      case 'EVENING':
        return 'Evening';
      default:
        return user.availability;
    }
  })();

  // Compute courses section content
  let coursesContent: React.ReactNode;
  if (user.userCourses && user.userCourses.length > 0) {
    coursesContent = user.userCourses.map(course => (
      <div key={course.courseName} className={styles.studyLevelRow}>
        <div className={styles.studyLevelLeft}>
          <span className={styles.studyLevelSubject}>{course.courseName}</span>
          <span className={styles.studyLevelRight}> ({course.knowledgeLevel})</span>
        </div>
      </div>
    ));
  } else if (user.studyLevels && user.studyLevels.length > 0) {
    coursesContent = user.studyLevels.map(level => (
      <div key={level.subject} className={styles.studyLevelRow}>
        <div className={styles.studyLevelLeft}>
          <span className={styles.studyLevelSubject}>{level.subject}</span>
          <span className={styles.studyLevelRight}> ({level.level})</span>
        </div>
      </div>
    ));
  } else {
    coursesContent = <div>No courses specified</div>;
  }

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
          {user.studyLevel ?? 'Not specified'}
        </div>
      </div>

      {/* Study Goals section (if available) */}
      {user.studyGoals && (
        <div className={styles.cardSection}>
          <div className={styles.detailsLabel}>Study Goals</div>
          <div className={styles.detailsValue}>{studyGoalsText}</div>
        </div>
      )}

      {/* Availability section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Availability</div>
        <div className={styles.detailsValue}>{availabilityText}</div>
      </div>

      {/* Bio section (if available) */}
      {user.bio && (
        <div className={styles.cardSection}>
          <div className={styles.detailsLabel}>Bio</div>
          <div className={styles.detailsValue}>{user.bio}</div>
        </div>
      )}

      {/* Courses section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Courses</div>
        <div className={styles.studyLevelContainer}>
          {coursesContent}
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;
