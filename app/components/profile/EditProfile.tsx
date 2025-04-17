import React, { useEffect, useState } from 'react';
import styles from '@/styles/profile.module.css';
import componentStyles from '@/styles/theme/components.module.css';
import { Form, Input, Select, Row, Col, Divider } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { UserProfile } from '@/types/profile';
import { ProfileKnowledgeLevel, UserAvailability } from '@/types/user';
import Button from '@/components/Button';
import { useApi } from '@/hooks/useApi';

const { Option } = Select;

interface EditProfileProps {
  user: UserProfile;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onStudyLevelChange: (index: number, field: 'subject' | 'grade' | 'level', value: string) => void;
  onAddStudyLevel: () => void;
  onRemoveStudyLevel: (index: number) => void;
  onSave: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ 
  user,
  onInputChange,
  onStudyLevelChange,
  onAddStudyLevel,
  onRemoveStudyLevel,
  onSave
}) => {
  const apiService = useApi();
  const [availableCourses, setAvailableCourses] = useState<{id: number, courseName: string}[]>([]);
  const [form] = Form.useForm();
  
  // Fetch available courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Use courseService to fetch courses if available
        const { courseService } = apiService;
        if (courseService) {
          const courses = await courseService.getCourses();
          if (courses && courses.length > 0) {
            setAvailableCourses(courses);
          }
        }
      } catch (err) {
        console.error("Failed to fetch courses for profile editing", err);
      }
    };
    
    fetchCourses();
  }, [apiService]);

  // Apply form values from user object
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        bio: user.bio,
        studyLevel: user.studyLevel,
        studyGoals: Array.isArray(user.studyGoals) 
          ? user.studyGoals 
          : typeof user.studyGoals === 'string' 
            ? user.studyGoals.split(',').map(g => g.trim()) 
            : [],
        availability: user.availability,
        // No need to set courses as they are handled separately
      });
    }
  }, [user, form]);

  // Prepare course selections for display
  const getCourseSelections = () => {
    // Prefer userCourses if available, otherwise use studyLevels
    if (user.userCourses && user.userCourses.length > 0) {
      return user.userCourses.map(course => ({
        courseId: course.courseId,
        knowledgeLevel: course.knowledgeLevel
      }));
    } else if (user.studyLevels && user.studyLevels.length > 0) {
      return user.studyLevels.map(level => {
        // Try to find matching course by name
        const courseId = availableCourses.find(c => 
          c.courseName.toLowerCase() === level.subject.toLowerCase()
        )?.id || 0;
        
        // Convert level string to enum value
        let knowledgeLevel = ProfileKnowledgeLevel.BEGINNER;
        switch (level.level.toLowerCase()) {
          case 'intermediate':
            knowledgeLevel = ProfileKnowledgeLevel.INTERMEDIATE;
            break;
          case 'advanced':
          case 'expert':
            knowledgeLevel = ProfileKnowledgeLevel.ADVANCED;
            break;
        }
        
        return {
          courseId,
          knowledgeLevel
        };
      });
    }
    return [];
  };

  // Handle study goals change
  const handleStudyGoalsChange = (values: string[]) => {
    // Create a synthetic event to use with onInputChange
    // If values array is empty, set to empty string to avoid leading comma issue
    const fakeEvent = {
      target: {
        name: 'studyGoals',
        value: values.length > 0 ? values.join(', ') : ''
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
  };

  // Handle study level change
  const handleStudyLevelSelectChange = (value: string) => {
    // Create a synthetic event to use with onInputChange
    const fakeEvent = {
      target: {
        name: 'studyLevel',
        value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
  };

  // Handle availability change
  const handleAvailabilityChange = (value: string) => {
    // Log the actual value for debugging
    console.log("Selected availability:", value);
    
    // Make sure the value is one of the enum values
    let availabilityValue: UserAvailability;
    switch(value) {
      case "MORNING":
        availabilityValue = UserAvailability.MORNING;
        break;
      case "AFTERNOON":
        availabilityValue = UserAvailability.AFTERNOON;
        break;
      case "EVENING":
        availabilityValue = UserAvailability.EVENING;
        break;
      default:
        console.warn("Unknown availability value:", value);
        availabilityValue = value as UserAvailability;
    }
    
    // Create a synthetic event to use with onInputChange
    const fakeEvent = {
      target: {
        name: 'availability',
        value: availabilityValue
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    console.log("Setting availability to:", availabilityValue);
    onInputChange(fakeEvent);
  };

  // Handle course selection change
  const handleCourseChange = (index: number, courseId: number) => {
    // Skip validation if selecting empty course (courseId = 0)
    if (courseId !== 0) {
      // Check if this course is already selected in another row
      const isDuplicate = (user.userCourses || []).some((course, i) => 
        i !== index && course.courseId === courseId
      );
      
      if (isDuplicate) {
        // Find the course name for better error message
        const courseName = availableCourses.find(c => c.id === courseId)?.courseName || `Course #${courseId}`;
        
        // Use antdMessage instead of potentially undefined message
        const antdMessage = require('antd').message;
        antdMessage.error(`"${courseName}" is already selected. Please choose a different course.`);
        
        // Reset the selection to the previous value or empty (0)
        const previousCourseId = user.userCourses && user.userCourses[index] 
          ? user.userCourses[index].courseId 
          : 0;
          
        // If the previous value was also a duplicate somehow, just reset to empty
        if ((user.userCourses || []).some((course, i) => 
            i !== index && course.courseId === previousCourseId && previousCourseId !== 0)) {
          courseId = 0;
        } else {
          courseId = previousCourseId;
        }
      }
    }
    
    const selectedCourse = availableCourses.find(c => c.id === courseId);
    const courseName = selectedCourse?.courseName || '';
  
    const updatedUserCourses = [...(user.userCourses || [])];
    updatedUserCourses[index] = {
      ...updatedUserCourses[index],
      courseId,
      courseName
    };
  
    onInputChange({
      target: {
        name: "userCourses",
        value: updatedUserCourses
      }
    } as any);
  };
  
  
  

  // Handle knowledge level change
  const handleKnowledgeLevelChange = (index: number, value: ProfileKnowledgeLevel) => {
    let levelString = 'Beginner';
    if (value === ProfileKnowledgeLevel.INTERMEDIATE) levelString = 'Intermediate';
    else if (value === ProfileKnowledgeLevel.ADVANCED) levelString = 'Advanced';

    onStudyLevelChange(index, 'level', levelString);

    const updatedUserCourses = [...(user.userCourses || [])];
    updatedUserCourses[index] = {
      ...updatedUserCourses[index],
      knowledgeLevel: value
    };

    onInputChange({
      target: {
        name: 'userCourses',
        value: updatedUserCourses
      }
    } as any);
  };

  return (
    <div className={styles.profileFormContainer}>
      {/* Fixed header (not sticky) */}
      <div style={{
        position: 'relative',
        background: 'white',
        padding: '15px 0',
        borderBottom: '1px solid #eee',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, color: '#333' }}>Edit Profile</h2>
      </div>
      <Form
        form={form}
        layout="vertical"
        style={{ width: '100%' }}
        onFinish={() => {
          // Validate for duplicate courses before proceeding
          const userCourses = user.userCourses || [];
          const validCourses = userCourses.filter(course => course.courseId !== 0);
          
          // Check for duplicate course IDs
          const uniqueCourseIds = new Set();
          const duplicateCourses = [];
          
          validCourses.forEach(course => {
            if (uniqueCourseIds.has(course.courseId)) {
              duplicateCourses.push(
                availableCourses.find(c => c.id === course.courseId)?.courseName || `Course #${course.courseId}`
              );
            } else {
              uniqueCourseIds.add(course.courseId);
            }
          });
          
          if (duplicateCourses.length > 0) {
            const antdMessage = require('antd').message;
            antdMessage.error(
              <div>
                <div>You have selected some courses multiple times:</div>
                <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                  {duplicateCourses.map((course, idx) => (
                    <li key={idx}>{course}</li>
                  ))}
                </ul>
                <div style={{ marginTop: '8px' }}>Please select each course only once.</div>
              </div>
            );
            return;
          }
          
          // Check for empty selections if at least one course is required
          const emptySelections = userCourses.some(course => course.courseId === 0);
          if (validCourses.length === 0 && emptySelections) {
            const antdMessage = require('antd').message;
            antdMessage.error("Please select at least one course");
            return;
          }
          
          form.validateFields()
            .then(() => {
              onSave();
            })
            .catch(info => {
              console.log('Validation Failed:', info);
            });
        }}
        autoComplete="off"
        requiredMark={false} // We'll handle our own required markers with *
        scrollToFirstError // Auto-scroll to first validation error
      >
        <div style={{ marginBottom: '16px', color: '#ff4d4f' }}>
          Fields marked with * are required
        </div>
        {/* Name input */}
        <Form.Item 
          name="name" 
          label={<span style={{ fontWeight: 'bold' }}>Name <span style={{ color: '#ff4d4f' }}>*</span></span>}
          rules={[{ required: true, message: "Please input your name!" }]}
          help="Your full name will be visible to other students"
        >
          <Input 
            placeholder="Enter your name" 
            className={componentStyles.input}
            onChange={onInputChange}
            name="name"
            value={user.name || ''}
            size="large"
          />
        </Form.Item>
        
        {/* Email input */}
        <Form.Item 
          name="email" 
          label={<span style={{ fontWeight: 'bold' }}>Email</span>}
          rules={[
            { required: true, message: "Please input your email!" },
            { type: 'email', message: "Please enter a valid email address!" }
          ]}
          help={<span style={{ color: '#777' }}>Email cannot be changed after registration</span>}
        >
          <Input 
            placeholder="Enter your email" 
            className={componentStyles.input}
            onChange={onInputChange}
            name="email"
            value={user.email || ''}
            disabled // Email shouldn't be changeable
            size="large"
            style={{ backgroundColor: '#f5f5f5' }}
          />
        </Form.Item>
        
        {/* Study Level dropdown */}
        <Form.Item
          name="studyLevel"
          label={<span style={{ fontWeight: 'bold' }}>Study Level <span style={{ color: '#ff4d4f' }}>*</span></span>}
          rules={[{ required: true, message: "Please select your study level!" }]}
          help="Your current academic or study level"
        >
          <Select 
            placeholder="Select your study level" 
            className={componentStyles.input}
            onChange={handleStudyLevelSelectChange}
            popupMatchSelectWidth={false}
            value={user.studyLevel || undefined}
            size="large"
          >
            <Option value="Bachelor">Bachelor</Option>
            <Option value="Master">Master</Option>
            <Option value="PhD">PhD</Option>
            <Option value="Self-Study">Self-Study</Option>
          </Select>
        </Form.Item>
        
        {/* Study Goals multi-select */}
        <Form.Item
          name="studyGoals"
          label={<span style={{ fontWeight: 'bold' }}>Study Goals <span style={{ color: '#ff4d4f' }}>*</span></span>}
          rules={[{ required: true, message: "Please select at least one study goal!" }]}
          help="What do you want to achieve with your studies?"
        >
          <Select
            mode="multiple"
            placeholder="Select your goals"
            allowClear
            className={componentStyles.input}
            style={{ width: '100%' }}
            onChange={handleStudyGoalsChange}
            maxTagCount={2}
            maxTagTextLength={10}
            maxTagPlaceholder={(omittedValues) => `+ ${omittedValues.length} more`}
            popupMatchSelectWidth={false}
            value={Array.isArray(user.studyGoals) 
              ? user.studyGoals 
              : typeof user.studyGoals === 'string' 
                ? user.studyGoals.split(',').map(g => g.trim()) 
                : []}
            size="large"
          >
            <Option value="Pass exams">Pass exams</Option>
            <Option value="Maintain GPA">Maintain GPA</Option>
            <Option value="Complete assignments">Complete assignments</Option>
            <Option value="Deep understanding">Deep understanding</Option>
            <Option value="Career preparation">Career preparation</Option>
          </Select>
        </Form.Item>
        
        {/* Availability dropdown */}
        <Form.Item
          name="availability"
          label={<span style={{ fontWeight: 'bold' }}>Availability <span style={{ color: '#ff4d4f' }}>*</span></span>}
          help="When are you typically available to study with partners?"
          rules={[{ required: true, message: "Please select your availability!" }]}
        >
          <Select
            placeholder="When are you available to study?"
            className={componentStyles.input}
            onChange={handleAvailabilityChange}
            value={user.availability || undefined}
            size="large"
          >
            <Option value="MORNING">Morning</Option>
            <Option value="AFTERNOON">Afternoon</Option>
            <Option value="EVENING">Evening</Option>
          </Select>
        </Form.Item>
        
        {/* Bio textarea */}
        <Form.Item
          name="bio"
          label={<span style={{ fontWeight: 'bold' }}>Bio</span>}
          help="Tell other students about yourself, your interests and strengths"
        >
          <Input.TextArea
            placeholder="Tell us a bit about yourself..."
            className={componentStyles.input}
            onChange={onInputChange}
            name="bio"
            value={user.bio || ''}
            autoSize={{ minRows: 3, maxRows: 6 }}
            style={{ 
              padding: '12px', 
              fontSize: '15px',
              borderRadius: '8px',
              resize: 'vertical'
            }}
          />
        </Form.Item>
        
        {/* Course Selection Section - Matching registration form */}
        <Form.Item 
          label={<span style={{ fontWeight: 'bold' }}>Courses <span style={{ color: '#ff4d4f' }}>*</span></span>}
          required 
          style={{ marginBottom: 0 }}
          help="Select courses that you're interested in studying"
        >
          <div style={{ 
            color: 'rgba(0, 0, 0, 0.45)', 
            fontSize: '14px', 
            marginBottom: '16px'
          }}>
            Please select courses and your knowledge level
          </div>
          
          {(user.studyLevels && user.studyLevels.length > 0 ? user.studyLevels : 
            user.userCourses && user.userCourses.length > 0 ? 
              user.userCourses.map(course => ({
                subject: course.courseName || String(course.courseId),
                grade: "N/A",
                level: course.knowledgeLevel || "Beginner"
              })) : []
          ).map((level, index) => {
            // Find course ID if available
            const courseId = user.userCourses && user.userCourses[index] 
              ? user.userCourses[index].courseId 
              : availableCourses.find(c => c.courseName.toLowerCase() === level.subject.toLowerCase())?.id || 0;
              
            // Map level string to enum value
            let knowledgeLevel = ProfileKnowledgeLevel.BEGINNER;
            if (level.level.toLowerCase().includes('intermediate')) {
              knowledgeLevel = ProfileKnowledgeLevel.INTERMEDIATE;
            } else if (level.level.toLowerCase().includes('advanced') || level.level.toLowerCase().includes('expert')) {
              knowledgeLevel = ProfileKnowledgeLevel.ADVANCED;
            } else if (user.userCourses && user.userCourses[index]) {
              knowledgeLevel = user.userCourses[index].knowledgeLevel as ProfileKnowledgeLevel;
            }
              
            return (
              <Row 
                key={index} 
                gutter={[8, 16]} 
                style={{ marginBottom: 16 }}
                align="middle"
              >
                <Col span={11}>
                  <Select
                    placeholder="Select Course"
                    value={courseId || undefined}
                    onChange={(value) => handleCourseChange(index, value)}
                    style={{ width: '100%' }}
                    className={componentStyles.input}
                    popupMatchSelectWidth={false}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option?.children ? option.children.toString().toLowerCase().includes(input.toLowerCase()) : false
                    }
                  >
                    {availableCourses.map(course => {
                      // Check if this course is already selected in any other row
                      const isSelected = (user.userCourses || []).some((userCourse, i) => 
                        i !== index && userCourse.courseId === course.id
                      );
                      
                      return (
                        <Option 
                          key={course.id} 
                          value={course.id} 
                          disabled={isSelected}
                        >
                          {course.courseName} {isSelected && '(already selected)'}
                        </Option>
                      );
                    })}
                  </Select>
                </Col>
                <Col span={9}>
                  <Select
                    value={knowledgeLevel}
                    onChange={(level) => handleKnowledgeLevelChange(index, level as ProfileKnowledgeLevel)}
                    style={{ width: '100%' }}
                    className={componentStyles.input}
                    popupMatchSelectWidth={false}
                  >
                    <Option value={ProfileKnowledgeLevel.BEGINNER}>Beginner</Option>
                    <Option value={ProfileKnowledgeLevel.INTERMEDIATE}>Intermediate</Option>
                    <Option value={ProfileKnowledgeLevel.ADVANCED}>Advanced</Option>
                  </Select>
                </Col>
                <Col span={4} style={{ display: 'flex', alignItems: 'center' }}>
                  {(user.studyLevels?.length > 1 || user.userCourses?.length > 1) && (
                    <Button 
                      type="button" 
                      onClick={() => onRemoveStudyLevel(index)}
                    >
                      <MinusCircleOutlined />
                    </Button>
                  )}
                </Col>
              </Row>
            );
          })}
          
          <Form.Item style={{ marginTop: 16, marginBottom: 24 }}>
            <Button 
              type="button" 
              onClick={onAddStudyLevel}
            >
              <PlusOutlined style={{ marginRight: 8 }} /> Add Course
            </Button>
          </Form.Item>
        </Form.Item>
        
        <Divider style={{ margin: '24px 0' }} />
        
        {/* Submit button for form */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', marginBottom: '16px' }}>
          <button
            type="submit"
            className={componentStyles.button}
            style={{ maxWidth: '200px' }}
          >
            Save Changes
          </button>
        </div>
      </Form>
    </div>
  );
};

export default EditProfile;