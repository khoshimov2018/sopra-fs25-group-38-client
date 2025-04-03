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
    <div className={styles.profileCard}>
      {/* Name input */}
      <div className={styles.formField} style={{top: '18px'}}>
        <label className={styles.inputLabel}>Name*</label>
        <input
          className={styles.formInput}
          name="name"
          value={user.name || ''}
          onChange={onInputChange}
          placeholder="Your name"
        />
      </div>
      
      {/* Email input */}
      <div className={styles.formField} style={{top: '94px'}}>
        <label className={styles.inputLabel}>Email*</label>
        <input
          className={styles.formInput}
          name="email"
          type="email"
          value={user.email || ''}
          onChange={onInputChange}
          placeholder="Your email"
        />
      </div>
      
      {/* Birthday input */}
      <div className={styles.formField} style={{top: '164px'}}>
        <label className={styles.inputLabel}>Birthday</label>
        <input
          className={styles.formInput}
          name="birthday"
          type="date"
          value={user.birthday || ''}
          onChange={onInputChange}
        />
      </div>
      
      {/* Goal Section */}
      <div className={styles.formField} style={{top: '234px'}}>
        <label className={styles.inputLabel}>Study Goal*</label>
        <input
          className={styles.formInput}
          name="goal"
          value={user.goal || ''}
          onChange={onInputChange}
          placeholder="To pass all of my courses"
        />
      </div>
      
      {/* Courses and Study Level Section */}
      <div style={{position: 'absolute', width: '850px', height: '189px', left: '85px', top: '304px'}}>
        <div className={styles.studyLevelField} style={{position: 'absolute', left: '0', top: '0'}}>
          <label className={styles.inputLabel} style={{width: '380px'}}>Courses*</label>
        </div>
        
        <div className={styles.studyLevelField} style={{position: 'absolute', left: '420px', top: '0'}}>
          <label className={styles.inputLabel} style={{width: '350px'}}>Study Level*</label>
        </div>
        
        {user.studyLevels && user.studyLevels.map((level, index) => (
          <div key={`level-row-${index}`} style={{position: 'absolute', top: `${index * 41 + 30}px`}}>
            {/* Course input */}
            <input
              className={styles.studyLevelInput}
              style={{position: 'absolute', left: '0', width: '380px'}}
              value={level.subject}
              onChange={(e) => onStudyLevelChange(index, 'subject', e.target.value)}
              placeholder={index === 0 ? "Informatics 2" : index === 1 ? "Computational Linguistics" : ""}
            />
            
            {/* Level input */}
            <input
              className={styles.studyLevelInput}
              style={{position: 'absolute', left: '420px', width: '350px'}}
              value={level.level}
              onChange={(e) => onStudyLevelChange(index, 'level', e.target.value)}
              placeholder={index === 0 ? "Beginner" : index === 1 ? "Advanced" : ""}
            />
          </div>
        ))}
        
        <button
          className={styles.addButton}
          onClick={onAddStudyLevel}
          type="button"
          style={{position: 'absolute', top: '190px', left: '0', width: '150px'}}
        >
          + Add Course
        </button>
      </div>
    </div>
  );
};

export default EditProfile;