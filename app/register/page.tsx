"use client";

import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User, CourseSelection } from "@/types/user";
import { Form, Input, App, Select, Row, Col, Divider } from "antd";
import { useMessage } from '@/hooks/useMessage';
import Link from "next/link";
import styles from "@/styles/theme/layout.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import componentStyles from "@/styles/theme/components.module.css";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import React, { useEffect, useState, useRef } from "react";
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

interface FormFieldProps {
  email: string;
  name: string;
  password: string;
  studyLevel: string;
  studyGoals: string[];
  // Note: courseSelections are handled separately via state
}

interface Course {
  id: number;
  courseName: string;
}

const Register: React.FC = () => {
  const apiService = useApi();
  const [form] = Form.useForm();
  const { set: setToken } = useLocalStorage<string>("token", "");
  const { message, contextHolder } = useMessage();
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [courseSelections, setCourseSelections] = useState<{ courseId: number | null; knowledgeLevel: string }[]>([
    { courseId: null, knowledgeLevel: "BEGINNER" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const isFetchingCourses = useRef(false);

  // Immediately fetch courses when component mounts
  useEffect(() => {
    let isActive = true;
    
    const fetchCourses = async () => {
      console.log("Attempting to fetch courses");
      
      // Prevent multiple fetches but don't check availableCourses.length
      // This ensures we always attempt to fetch on first mount
      if (isFetchingCourses.current) {
        console.log("Already fetching courses, skipping");
        return;
      }
      
      try {
        console.log("Fetching courses from API");
        isFetchingCourses.current = true;
        
        const res = await apiService.get<Course[]>("/courses");
        console.log("Courses fetched successfully:", res?.length);
        
        if (isActive) {
          setAvailableCourses(res || []);
        }
      } catch (err) {
        console.error("Failed to fetch courses", err);
        // Only log error, don't show message to user
        // We'll retry silently
      } finally {
        isFetchingCourses.current = false;
      }
    };
    
    // Call fetchCourses immediately
    fetchCourses();
    
    // Also set up an interval to retry if courses failed to load initially
    const retryInterval = setInterval(() => {
      if (availableCourses.length === 0 && !isFetchingCourses.current && isActive) {
        console.log("No courses loaded yet, retrying...");
        fetchCourses();
      } else if (availableCourses.length > 0) {
        // Clear interval once courses are loaded
        clearInterval(retryInterval);
      }
    }, 3000); // Retry every 3 seconds
    
    // Clean up function
    return () => {
      isActive = false;
      clearInterval(retryInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegister = async (values: FormFieldProps) => {
    try {
      setIsLoading(true);
      message.loading("Creating account...");

      // Filter out any course selections with null courseId
      const filteredSelections = courseSelections
        .filter(sel => sel.courseId !== null)
        .map(sel => ({
          courseId: sel.courseId as number,
          knowledgeLevel: sel.knowledgeLevel
        }));

      // Check if at least one course is selected
      if (filteredSelections.length === 0) {
        message.error("Please select at least one course");
        setIsLoading(false);
        return;
      }

      // Convert studyGoals array to string as the server expects
      // The server's User entity has studyGoals as a string, not an array
      const studyGoalsString = values.studyGoals.join(", ");
      
      // Create a structured payload that matches backend expectations
      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        studyLevel: values.studyLevel,
        studyGoals: studyGoalsString, // Send as string to match server expectations
        courseSelections: filteredSelections.map(selection => ({
          courseId: selection.courseId,
          knowledgeLevel: selection.knowledgeLevel
        }))
      };

      console.log("Registration payload:", JSON.stringify(payload, null, 2));

      // Send registration request and handle possible empty response
      const response = await apiService.post<User>("/users/register", payload);
      console.log("Registration successful:", response);
      
      // Ensure we have a valid response object
      if (!response) {
        throw new Error("Server returned an empty response");
      }

      // The server returns a token directly from registration, so we'll use that
      if (response && response.token) {
        console.log("Registration successful, setting token");
        // Store token in both localStorage and React state
        localStorage.setItem("token", response.token);
        setToken(response.token);
        
        // Notify user of success and redirect
        message.success("Registration successful! You are now logged in.");
        setTimeout(() => {
          window.location.href = "/main";
        }, 500);
      } else {
        // This shouldn't happen if the server is working correctly
        console.error("Registration succeeded but no token was returned");
        message.warning("Registration successful, but you need to log in manually.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
      if (error.info) {
        try {
          const errorInfo = JSON.parse(error.info);
          console.error("Error info:", errorInfo);
        } catch (e) {
          console.error("Error info (not JSON):", error.info);
        }
      }
      
      message.destroy();
      setIsLoading(false);
      
      const err = error?.message || "";
      console.log("Error message:", err);
      
      // Handle various error scenarios with user-friendly messages
      if (err.includes("409")) {
        message.error("Email already taken.");
      } else if (err.includes("400")) {
        // For 400 Bad Request, check specific field errors
        if (err.toLowerCase().includes("email")) {
          message.error("Email is required or invalid.");
        } else if (err.toLowerCase().includes("password")) {
          message.error("Password is required or too short (minimum 8 characters).");
        } else if (err.toLowerCase().includes("study level")) {
          message.error("Study level is required.");
        } else if (err.toLowerCase().includes("study goals")) {
          message.error("Study goals are required.");
        } else if (err.toLowerCase().includes("course")) {
          message.error("At least one course selection is required.");
        } else if (err.toLowerCase().includes("invalid input data")) {
          message.error("Please check all required fields are filled correctly.");
        } else {
          // Generic message for other 400 errors
          message.error("Invalid input data. Please check all fields and try again.");
        }
      } else if (err.includes("parse")) {
        message.error("There was an error processing the server response. Please try again.");
      } else if (err.includes("empty response")) {
        message.error("The server returned an empty response. Please try again.");
      } else if (err.includes("fetch") || err.includes("Network")) {
        message.error("Server not reachable. Is backend running?");
      } else {
        message.error("Registration failed. Please try again.");
      }
    }
  };

  const handleCourseChange = (index: number, value: number | null) => {
    const updated = [...courseSelections];
    updated[index].courseId = value;
    setCourseSelections(updated);
  };

  const handleKnowledgeLevelChange = (index: number, level: string) => {
    const updated = [...courseSelections];
    updated[index].knowledgeLevel = level;
    setCourseSelections(updated);
  };

  const addCourseSelection = () => {
    setCourseSelections([...courseSelections, { courseId: null, knowledgeLevel: "BEGINNER" }]);
  };

  const removeCourseSelection = (index: number) => {
    if (courseSelections.length > 1) {
      const updated = [...courseSelections];
      updated.splice(index, 1);
      setCourseSelections(updated);
    } else {
      message.info("You need at least one course selection");
    }
  };

  // Show loading indicator if courses aren't loaded yet
  const isCourseLoading = availableCourses.length === 0;

  return (
    <App>
      {contextHolder}
      <div className={`${styles.pageContainer} ${backgroundStyles.loginBackground}`} style={{ 
        overflowY: 'auto',
        width: "100vw",
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
        padding: '60px 20px'
      }}>
        <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
          <Logo />
        </div>
        
        <div style={{ 
          width: "100%",
          maxHeight: "550px",
          maxWidth: "1000px",
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          marginBottom: '60px'
        }}>
          <div className={componentStyles.formContainer} style={{ 
            maxWidth: '500px', 
            width: '100%',
            maxHeight: '800vh',
            overflowY: 'auto',
            margin: '0 auto',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            paddingBottom: '40px'
          }}>
            <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Register</h2>
            <Form
              form={form}
              name="register"
              onFinish={handleRegister}
              layout="vertical"
              style={{ width: '100%' }}
            >
              {/* Basic Information */}
              <Form.Item 
                name="email" 
                label="Email" 
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: 'email', message: "Please enter a valid email address!" }
                ]}
              >
                <Input placeholder="Enter your email" className={componentStyles.input} />
              </Form.Item>

              <Form.Item 
                name="name" 
                label="Name" 
                rules={[{ required: true, message: "Please input your name!" }]}
              >
                <Input placeholder="Enter your name" className={componentStyles.input} />
              </Form.Item>

              <Form.Item 
                name="password" 
                label="Password" 
                rules={[
                  { required: true, message: "Please input your password!" },
                  { min: 8, message: "Password must be at least 8 characters long" }
                ]}
              >
                <Input.Password placeholder="Enter your password" className={componentStyles.input} />
              </Form.Item>

              <Form.Item
                name="studyLevel"
                label="Study Level"
                rules={[{ required: true, message: "Please select your study level!" }]}
              >
                <Select 
                  placeholder="Select your study level" 
                  className={componentStyles.input}
                  popupMatchSelectWidth={false}
                >
                  <Option value="Bachelor">Bachelor</Option>
                  <Option value="Master">Master</Option>
                  <Option value="PhD">PhD</Option>
                  <Option value="Self-Study">Self-Study</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="studyGoals"
                label="Study Goals"
                rules={[{ required: true, message: "Please select at least one study goal!" }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select your goals"
                  allowClear
                  className={componentStyles.input}
                  style={{ width: '100%' }}
                  maxTagCount={2}
                  maxTagTextLength={10}
                  maxTagPlaceholder={(omittedValues) => `+ ${omittedValues.length} more`}
                  popupMatchSelectWidth={false}
                >
                  <Option value="Pass exams">Pass exams</Option>
                  <Option value="Maintain GPA">Maintain GPA</Option>
                  <Option value="Complete assignments">Complete assignments</Option>
                  <Option value="Deep understanding">Deep understanding</Option>
                  <Option value="Career preparation">Career preparation</Option>
                </Select>
              </Form.Item>

              {/* Course Selection Section */}
              <Form.Item label="Courses" required style={{ marginBottom: 0 }}>
                <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '14px', marginBottom: '16px' }}>
                  Please select courses and your knowledge level
                </div>
                
                {isCourseLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ marginBottom: '10px' }}>Loading available courses...</div>
                    <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                      This may take a moment. Please wait...
                    </div>
                  </div>
                ) : (
                  <>
                    {courseSelections.map((entry, index) => (
                      <Row key={index} gutter={[8, 16]} style={{ marginBottom: 16 }}>
                        <Col span={11}>
                          <Select
                            placeholder="Select Course"
                            value={entry.courseId ?? undefined}
                            onChange={(value) => handleCourseChange(index, value)}
                            style={{ width: '100%' }}
                            className={componentStyles.input}
                            popupMatchSelectWidth={false}
                            loading={isCourseLoading}
                            disabled={isCourseLoading}
                            status={!entry.courseId && courseSelections.length === 1 ? 'error' : undefined}
                          >
                            {availableCourses.map(course => (
                              <Option key={course.id} value={course.id}>{course.courseName}</Option>
                            ))}
                          </Select>
                        </Col>
                        <Col span={9}>
                          <Select
                            value={entry.knowledgeLevel}
                            onChange={(level) => handleKnowledgeLevelChange(index, level)}
                            style={{ width: '100%' }}
                            className={componentStyles.input}
                            popupMatchSelectWidth={false}
                            disabled={isCourseLoading}
                          >
                            <Option value="BEGINNER">Beginner</Option>
                            <Option value="INTERMEDIATE">Intermediate</Option>
                            <Option value="ADVANCED">Advanced</Option>
                          </Select>
                        </Col>
                        <Col span={4} style={{ display: 'flex', alignItems: 'center' }}>
                          {courseSelections.length > 1 && (
                            <Button 
                              type="button" 
                              onClick={() => removeCourseSelection(index)}
                              style={{ minWidth: 'auto', padding: '0 8px' }}
                              disabled={isCourseLoading}
                            >
                              <MinusCircleOutlined />
                            </Button>
                          )}
                        </Col>
                      </Row>
                    ))}
                    
                    <Form.Item style={{ marginTop: 16, marginBottom: 24 }}>
                      <Button 
                        type="button" 
                        onClick={addCourseSelection}
                        style={{ display: 'flex', alignItems: 'center' }}
                        disabled={isCourseLoading}
                      >
                        <PlusOutlined style={{ marginRight: 8 }} /> Add Course
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.Item>
              
              <Divider style={{ margin: '24px 0' }} />
              
              <Form.Item className={componentStyles.buttonContainer}>
                <Button type="submit" disabled={isLoading || isCourseLoading}>
                  {isCourseLoading ? "Loading Courses..." : "Register"}
                </Button>
              </Form.Item>

              <div className={componentStyles.linkContainer}>
                Already have an account? <Link href="/login" className={componentStyles.link}>Login</Link>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </App>
  );
};

export default Register;