import React from 'react';
import { Modal } from 'antd';
import styles from '@/styles/main.module.css';
import componentStyles from '@/styles/theme/components.module.css';
import { UserProfile } from '@/types/profile';

interface ProfilePreviewModalProps {
  visible: boolean;
  user: UserProfile;
  onClose: () => void;
  onSave: () => void;
}

const ProfilePreviewModal: React.FC<ProfilePreviewModalProps> = ({
  visible,
  user,
  onClose,
  onSave
}) => {
  // Format study goals properly
  const studyGoals = typeof user.studyGoals === 'string'
    ? user.studyGoals.split(',').map(g => g.trim()).filter(Boolean)
    : user.studyGoals ?? [];

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

  return (
    <Modal
      open={visible}
      title="Preview - How Others Will See Your Profile"
      onCancel={onClose}
      width={1000}
      centered
      footer={[
        <button
          key="back"
          onClick={onClose}
          style={{
            marginRight: '10px',
            padding: '8px 16px',
            background: 'white',
            border: '1px solid #6750A4',
            color: '#6750A4',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Back to Edit
        </button>,
        <button
          key="submit"
          onClick={onSave}
          style={{
            padding: '8px 16px',
            background: '#6750A4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Save & Publish
        </button>
      ]}
    >
      <div style={{ padding: '12px 16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ margin: '0', color: '#0369a1' }}>
          This is a preview of how your profile will appear to other students on the main page.
        </p>
      </div>

      <div className={styles.profileContainer} style={{ padding: '0', maxWidth: '100%' }}>
        <div className={styles.profileImageContainer} style={{ height: '450px', flex: '0.8' }}>
          {user.profileImage || user.profilePicture ? (
            <img
              src={user.profileImage || user.profilePicture}
              alt={user.name || 'Profile'}
              className={styles.profileImage}
              style={{ position: 'relative', maxHeight: '450px' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '450px',
              background: 'linear-gradient(135deg, #8e7cc3 0%, #6750A4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px'
            }}>
              <svg
                style={{
                  width: '120px',
                  height: '120px',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
          )}
        </div>

        <div className={styles.rightSection} style={{ flex: '1.2' }}>
          <div className={`${styles.card} ${styles.profileCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.dragHandle}></div>
            </div>

            <div className={styles.cardSection}>
              <div className={styles.detailsLabel}>Name</div>
              <div className={styles.detailsValue}>
                {user.name || 'Not specified'}
              </div>
            </div>

            <div className={styles.cardSection}>
              <div className={styles.detailsLabel}>Study Level</div>
              <div className={styles.detailsValue}>
                {user.studyLevel || 'Not specified'}
              </div>
            </div>

            <div className={styles.cardSection}>
              <div className={styles.detailsLabel}>Study Goals</div>
              <div className={styles.tagContainer}>
                {studyGoals.map((goal) => (
                  <span key={`tag-${goal}`} className={styles.tag}>
                    {goal}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.cardSection}>
              <div className={styles.detailsLabel}>Availability</div>
              <div className={styles.detailsValue}>
                {availabilityText}
              </div>
            </div>

            {user.bio && (
              <div className={styles.cardSection}>
                <div className={styles.detailsLabel}>Bio</div>
                <div className={styles.detailsValue}>
                  {user.bio}
                </div>
              </div>
            )}

            <div className={styles.cardSection}>
              <div className={styles.detailsLabel}>Courses</div>
              <div className={styles.studyLevelContainer}>
                {user.userCourses?.map((course) => (
                  <div key={`course-${course.courseId}`} className={styles.studyLevelRow}>
                    <div className={styles.studyLevelLeft}>
                      <span className={styles.studyLevelSubject}>{course.courseName}</span>
                      <span className={styles.studyLevelRight}> ({course.knowledgeLevel})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </Modal>
  );
};

export default ProfilePreviewModal;