import React from 'react';
import styles from '@/styles/profile.module.css';
import { UserProfile } from '@/types/profile';
import { Form, Input, DatePicker, Select, Button, Row, Col, Divider } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

interface EditProfileProps {
  user: UserProfile;
  availableCourses?: Array<{id: number, courseName: string}>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string | string[]) => void;
  onCourseChange: (index: number, field: 'courseId' | 'knowledgeLevel', value: any) => void;
  onAddCourse: () => void;
  onRemoveCourse: (index: number) => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ 
  user,
  availableCourses = [],
  onInputChange,
  onSelectChange,
  onCourseChange,
  onAddCourse,
  onRemoveCourse
}) => {
  // Study goals options based on registration form
  const studyGoalsOptions = [
    { value: 'Pass exams', label: 'Pass exams' },
    { value: 'Maintain GPA', label: 'Maintain GPA' },
    { value: 'Complete assignments', label: 'Complete assignments' },
    { value: 'Deep understanding', label: 'Deep understanding' },
    { value: 'Career preparation', label: 'Career preparation' },
  ];

  // Study level options based on registration form
  const studyLevelOptions = [
    { value: 'Bachelor', label: 'Bachelor' },
    { value: 'Master', label: 'Master' },
    { value: 'PhD', label: 'PhD' },
    { value: 'Self-Study', label: 'Self-Study' },
  ];

  // Knowledge level options
  const knowledgeLevelOptions = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
  ];

  return (
    <div className={styles.profileCard}>
      <Form layout="vertical" className={styles.editForm}>
        {/* Name input */}
        <Form.Item 
          label="Name *" 
          required
          className={styles.formItem}
        >
          <Input
            name="name"
            value={user.name || ''}
            onChange={onInputChange}
            placeholder="Your name"
            className={styles.input}
          />
        </Form.Item>
        
        {/* Email input - Read only as it can't be changed */}
        <Form.Item 
          label="Email *" 
          required
          className={styles.formItem}
          help="Email cannot be changed"
        >
          <Input
            name="email"
            type="email"
            value={user.email || ''}
            disabled={true}
            readOnly={true}
            placeholder="Your email"
            className={`${styles.input} ${styles.disabledInput}`}
          />
        </Form.Item>
        
        {/* Birthday input with proper date format */}
        <Form.Item 
          label="Birthday" 
          className={styles.formItem}
          help="Format: YYYY-MM-DD"
        >
          <Input
            name="birthday"
            type="date"
            value={user.birthday || ''}
            onChange={onInputChange}
            className={styles.input}
            placeholder="YYYY-MM-DD"
            max={new Date().toISOString().split('T')[0]} // Prevents future dates
          />
        </Form.Item>
        
        {/* Study Level section */}
        <Form.Item 
          label="Study Level *" 
          required
          className={styles.formItem}
        >
          <Select
            value={user.studyLevel || undefined}
            onChange={(value) => onSelectChange('studyLevel', value)}
            placeholder="Select your study level"
            className={styles.select}
          >
            {studyLevelOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        </Form.Item>
        
        {/* Study Style section */}
        <Form.Item 
          label="Study Style" 
          className={styles.formItem}
        >
          <Input
            name="studyStyle"
            value={user.studyStyle || ''}
            onChange={onInputChange}
            placeholder="Describe your study style (e.g., 'Visual learner, group study')"
            className={styles.input}
          />
        </Form.Item>

        {/* Study Goals section */}
        <Form.Item 
          label="Study Goals *" 
          required
          className={styles.formItem}
        >
          <Select
            mode="multiple"
            value={user.formattedStudyGoals || []}
            onChange={(value) => onSelectChange('studyGoals', value)}
            placeholder="Select your goals"
            className={styles.select}
            maxTagCount={3}
          >
            {studyGoalsOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        </Form.Item>
        
        {/* Availability section - Required by server */}
        <Form.Item 
          label="Availability *"
          required
          className={styles.formItem}
        >
          <Select
            value={user.availability || 'WEEKDAYS'}
            onChange={(value) => onSelectChange('availability', value)}
            placeholder="Select your availability"
            className={styles.select}
          >
            <Option value="WEEKDAYS">Weekdays</Option>
            <Option value="WEEKENDS">Weekends</Option>
            <Option value="EVENINGS">Evenings</Option>
            <Option value="ANYTIME">Anytime</Option>
          </Select>
        </Form.Item>
        
        {/* Knowledge Level - Required by server but hidden as requested */}
        <Form.Item 
          style={{ display: 'none' }}
          label="Overall Knowledge Level *"
          required
          className={styles.formItem}
        >
          <Select
            value={user.knowledgeLevel || 'INTERMEDIATE'}
            onChange={(value) => onSelectChange('knowledgeLevel', value)}
            placeholder="Select your knowledge level"
            className={styles.select}
          >
            <Option value="BEGINNER">Beginner</Option>
            <Option value="INTERMEDIATE">Intermediate</Option>
            <Option value="ADVANCED">Advanced</Option>
          </Select>
        </Form.Item>

        {/* Bio section removed as requested */}

        {/* Courses section */}
        <Form.Item 
          label="Courses *" 
          required
          className={styles.formItem}
          help="At least one course with a valid selection is required"
        >
          <div className={styles.coursesContainer}>
            {(user.userCourses || []).map((course, index) => (
              <Row key={`course-${index}`} gutter={8} className={styles.courseRow}>
                <Col span={12}>
                  <Select
                    value={course.courseId}
                    onChange={(value) => onCourseChange(index, 'courseId', value)}
                    placeholder="Select a course"
                    className={styles.courseSelect}
                    status={!course.courseId ? 'error' : undefined}
                    required
                  >
                    {availableCourses.map(c => (
                      <Option key={c.id} value={c.id}>{c.courseName}</Option>
                    ))}
                  </Select>
                </Col>
                <Col span={10}>
                  <Select
                    value={course.knowledgeLevel}
                    onChange={(value) => onCourseChange(index, 'knowledgeLevel', value)}
                    placeholder="Select level"
                    className={styles.courseSelect}
                    required
                  >
                    {knowledgeLevelOptions.map(option => (
                      <Option key={option.value} value={option.value}>{option.label}</Option>
                    ))}
                  </Select>
                </Col>
                <Col span={2}>
                  {(user.userCourses || []).length > 1 && (
                    <Button 
                      type="text" 
                      danger
                      icon={<MinusCircleOutlined />} 
                      onClick={() => onRemoveCourse(index)}
                    />
                  )}
                </Col>
              </Row>
            ))}
            
            <Button 
              type="dashed" 
              onClick={onAddCourse} 
              className={styles.addButton}
              icon={<PlusOutlined />}
            >
              Add Course
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EditProfile;