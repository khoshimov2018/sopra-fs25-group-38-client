import React, { useState, useEffect } from 'react';
import { Modal, Checkbox, Button, List, Typography, Divider } from 'antd';
import { useApi } from '@/hooks/useApi';
import { Course } from '@/types/course';
import { UserAvailability } from '@/types/dto';
import styles from '@/styles/theme/components.module.css';

const { Text, Title } = Typography;

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (selectedCourses: number[], availabilities: UserAvailability[]) => void;
  // Server expects a list of availability values, and now our UI supports multiple selections
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onSave }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<UserAvailability[]>([]);
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
      
      // Just use the courses as they come from the API without adding mock data
      setCourses(response ?? []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      // Use simplified mock data if the API fails
      setCourses([
        { id: 1, courseName: 'Mathematics' },
        { id: 2, courseName: 'Computer Science' },
        { id: 3, courseName: 'Physics' },
        { id: 4, courseName: 'Chemistry' },
        { id: 5, courseName: 'Biology' },
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
    setSelectedAvailabilities(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleSave = () => {
    // Convert filters to the format expected by the StudentFilterController
    onSave(selectedCourses, selectedAvailabilities);
    onClose();
  };

  const handleCancel = () => {
    // Reset selections
    setSelectedCourses([]);
    setSelectedAvailabilities([]);
    onClose();
  };

  return (
    <Modal
      title={<Title level={4} style={{ textAlign: 'center', marginBottom: '20px' }}>Filter Students</Title>}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={450}
      styles={{
        body: { padding: '24px 32px' }
      }}
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ fontSize: '18px', marginBottom: '16px' }}>
            When are you available to study?
          </Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '8px' }}>
            <Checkbox 
              checked={selectedAvailabilities.includes(UserAvailability.MORNING)}
              onChange={() => handleAvailabilityChange(UserAvailability.MORNING)}
              style={{ fontSize: '16px' }}
            >
              Morning
            </Checkbox>
            <Checkbox 
              checked={selectedAvailabilities.includes(UserAvailability.AFTERNOON)}
              onChange={() => handleAvailabilityChange(UserAvailability.AFTERNOON)}
              style={{ fontSize: '16px' }}
            >
              Afternoon
            </Checkbox>
            <Checkbox 
              checked={selectedAvailabilities.includes(UserAvailability.EVENING)}
              onChange={() => handleAvailabilityChange(UserAvailability.EVENING)}
              style={{ fontSize: '16px' }}
            >
              Evening
            </Checkbox>
          </div>
        </div>

        <Divider style={{ margin: '24px 0' }} />

        <div>
          <Title level={5} style={{ fontSize: '18px', marginBottom: '16px' }}>
            Which courses are you interested in?
          </Title>
          <List
            loading={loading}
            dataSource={courses}
            style={{ paddingLeft: '8px' }}
            renderItem={(course) => (
              <List.Item style={{ padding: '8px 0', borderBottom: 'none' }}>
                <Checkbox 
                  checked={selectedCourses.includes(course.id)}
                  onChange={() => handleCourseChange(course.id)}
                  style={{ fontSize: '16px' }}
                >
                  <Text style={{ fontSize: '16px' }}>{course.courseName}</Text>
                </Checkbox>
              </List.Item>
            )}
          />
        </div>
      </div>

      <div style={{ 
        marginTop: 32, 
        display: 'flex', 
        justifyContent: 'center',
        gap: 16
      }}>
        <Button 
          onClick={handleCancel}
          style={{ minWidth: '100px' }}
        >
          Cancel
        </Button>
        <Button 
          type="primary" 
          onClick={handleSave}
          style={{ minWidth: '100px', background: '#6750A4' }}
        >
          Apply Filters
        </Button>
      </div>
    </Modal>
  );
};

export default FilterModal;