import React from 'react';
import styles from '@/styles/profile.module.css';
import { UserProfile } from '@/types/profile';

interface EditProfileProps {
  user: UserProfile;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onTagChange: (index: number, value: string) => void;
  onStudyLevelChange: (index: number, field: 'subject' | 'grade' | 'level', value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (index: number) => void;
  onAddStudyLevel: () => void;
  onRemoveStudyLevel: (index: number) => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ 
  user,
  onInputChange,
  onTagChange,
  onStudyLevelChange,
  onAddTag,
  onRemoveTag,
  onAddStudyLevel,
  onRemoveStudyLevel
}) => {
  return (
    <div className={styles.profileCard} style={{ border: 'none' }}>
      {/* Personal Information Section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Personal Information</div>
        
        {/* Name input */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label className={styles.inputLabel}>Name*</label>
            <input
              className={styles.formInput}
              name="name"
              value={user.name || ''}
              onChange={onInputChange}
            />
          </div>
        </div>
        
        {/* Email input */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label className={styles.inputLabel}>Email*</label>
            <input
              className={styles.formInput}
              name="email"
              type="email"
              value={user.email || ''}
              onChange={onInputChange}
            />
          </div>
        </div>
        
        {/* Birthday input */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label className={styles.inputLabel}>Birthday</label>
            <input
              className={styles.formInput}
              name="birthday"
              type="date"
              value={user.birthday || ''}
              onChange={onInputChange}
            />
          </div>
        </div>
      </div>
      
      {/* Bio Section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Bio</div>
        <textarea
          className={styles.formTextarea}
          name="bio"
          value={user.bio || ''}
          onChange={onInputChange}
          placeholder="Tell other students about yourself..."
          rows={3}
        />
      </div>
      
      {/* Study Style Section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Study Style</div>
        <input
          className={styles.formInput}
          name="studyStyle"
          value={user.studyStyle || ''}
          onChange={onInputChange}
          placeholder="e.g., Visual learner, group study, etc."
        />
      </div>
      
      {/* Goal Section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Goal</div>
        <input
          className={styles.formInput}
          name="goal"
          value={user.goal || ''}
          onChange={onInputChange}
          placeholder="What is your academic goal?"
        />
      </div>
      
      {/* Tags Section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Tags</div>
        <div className={styles.tagsEditContainer}>
          {user.tags && user.tags.map((tag, index) => (
            <div className={styles.tagInputRow} key={`tag-row-${index}`}>
              <input
                className={styles.tagInput}
                value={tag}
                onChange={(e) => onTagChange(index, e.target.value)}
                placeholder="Add a tag"
              />
              {index > 0 && (
                <button
                  className={styles.removeButton}
                  onClick={() => onRemoveTag(index)}
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          className={styles.addButton}
          onClick={onAddTag}
          type="button"
        >
          + Add Tag
        </button>
      </div>
      
      {/* Study Levels Section */}
      <div className={styles.cardSection}>
        <div className={styles.detailsLabel}>Study Levels</div>
        <div className={styles.studyLevelsContainer}>
          {user.studyLevels && user.studyLevels.map((level, index) => (
            <div className={styles.studyLevelEditRow} key={`level-row-${index}`}>
              {/* Subject field */}
              <div className={styles.studyLevelField}>
                <label className={styles.inputLabel}>Course*</label>
                <input
                  className={styles.studyLevelInput}
                  value={level.subject}
                  onChange={(e) => onStudyLevelChange(index, 'subject', e.target.value)}
                  placeholder="e.g., Mathematics"
                />
              </div>
              
              {/* Level field */}
              <div className={styles.studyLevelField}>
                <label className={styles.inputLabel}>Study Level*</label>
                <input
                  className={styles.studyLevelInput}
                  value={level.level}
                  onChange={(e) => onStudyLevelChange(index, 'level', e.target.value)}
                  placeholder="e.g., Beginner, Advanced"
                />
              </div>
              
              {/* Remove button */}
              {index > 0 && (
                <button
                  className={styles.removeStudyLevelButton}
                  onClick={() => onRemoveStudyLevel(index)}
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          className={styles.addButton}
          onClick={onAddStudyLevel}
          type="button"
        >
          + Add Course
        </button>
      </div>
    </div>
  );
};

export default EditProfile;