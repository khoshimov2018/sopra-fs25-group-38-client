import React, { useState, useEffect } from 'react';
import { Modal, Checkbox, Radio, Button, List, Typography, Space, Divider } from 'antd';
import { useApi } from '@/hooks/useApi';
import { Course } from '@/types/course';
import { UserAvailability } from '@/types/dto';
import styles from '@/styles/theme/components.module.css';

const { Text, Title } = Typography;

// Extended course interface for UI display
interface CourseDisplay extends Course {
  description?: string;
  students?: number;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (selectedCourses: number[], availability: UserAvailability | null) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onSave }) => {
  const [courses, setCourses] = useState<CourseDisplay[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [availability, setAvailability] = useState<UserAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  
  const apiService = useApi();

  useEffect(() => {
    if (visible) {
      fetchCourses();
    }
  }, [visible]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Get the courseService from the hook result
      const { courseService } = apiService;
      
      if (!courseService) {
        throw new Error("Course service not available");
      }
      
      const response = await courseService.getCourses();
      
      // Convert Course[] to CourseDisplay[] by adding UI-specific fields
      const coursesWithDisplay = (response || []).map(course => ({
        ...course,
        description: `${course.courseName} course description`,
        students: Math.floor(Math.random() * 200) + 50 // Mock student count
      }));
      setCourses(coursesWithDisplay);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      // Use mock data if the API fails
      setCourses([
        { id: 1, courseName: 'Mathematics', description: 'Advanced mathematics courses', students: 120 },
        { id: 2, courseName: 'Computer Science', description: 'Programming and algorithms', students: 150 },
        { id: 3, courseName: 'Physics', description: 'Theoretical and applied physics', students: 80 },
        { id: 4, courseName: 'Chemistry', description: 'Organic and inorganic chemistry', students: 90 },
        { id: 5, courseName: 'Biology', description: 'Life sciences and ecology', students: 110 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (courseId: number) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  const handleAvailabilityChange = (value: UserAvailability) => {
    setAvailability(value);
  };

  const handleSave = () => {
    // Convert filters to the format expected by the StudentFilterController
    onSave(selectedCourses, availability);
    onClose();
  };

  const handleCancel = () => {
    // Reset selections
    setSelectedCourses([]);
    setAvailability(null);
    onClose();
  };

  return (
    <Modal
      title={<Title level={4}>Filter Students</Title>}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 10 }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>Availability</Title>
          <Radio.Group 
            onChange={(e) => handleAvailabilityChange(e.target.value)} 
            value={availability}
          >
            <Space direction="vertical">
              <Radio value={UserAvailability.MORNING}>Morning</Radio>
              <Radio value={UserAvailability.AFTERNOON}>Afternoon</Radio>
              <Radio value={UserAvailability.EVENING}>Evening</Radio>
            </Space>
          </Radio.Group>
        </div>

        <Divider />

        <div>
          <Title level={5}>Select Courses</Title>
          <List
            loading={loading}
            dataSource={courses}
            renderItem={(course) => (
              <List.Item>
                <Checkbox 
                  checked={selectedCourses.includes(course.id)}
                  onChange={() => handleCourseChange(course.id)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Text style={{ marginRight: 10 }}>{course.courseName}</Text>
                      {course.students && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {course.students}+ students
                        </Text>
                      )}
                    </div>
                    {course.description && (
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        {course.description}
                      </Text>
                    )}
                  </div>
                </Checkbox>
              </List.Item>
            )}
          />
        </div>
      </div>

      <div style={{ 
        marginTop: 24, 
        display: 'flex', 
        justifyContent: 'flex-end',
        gap: 12
      }}>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button 
          type="primary" 
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
};

export default FilterModal;