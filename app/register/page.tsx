"use client";

import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User, UserRegistration, ProfileKnowledgeLevel } from "@/types/user";
import { CourseSelection } from "@/types/course";
import { Form, Input, App, Select, Row, Col, Divider } from "antd";
import { useMessage } from '@/hooks/useMessage';
import Link from "next/link";
import styles from "@/styles/theme/layout.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import componentStyles from "@/styles/theme/components.module.css";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import { useEffect, useState } from "react";
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
  const [courseSelections, setCourseSelections] = useState<CourseSelection[]>([
    { courseId: 0, knowledgeLevel: ProfileKnowledgeLevel.BEGINNER }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only fetch courses if we don't already have them
    if (availableCourses.length > 0) return;
    
    const fetchCourses = async () => {
      try {
        const res = await apiService.apiService.get<Course[]>("/courses");
        if (res && res.length > 0) {
          setAvailableCourses(res);
        }
      } catch (err) {
        console.error("Failed to fetch courses", err);
        message.error("Failed to load courses. Please try again.");
      }
    };
    
    fetchCourses();
    
    // Removed dependencies to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegister = async (values: FormFieldProps) => {
    try {
      setIsLoading(true);
      message.loading("Creating account...");

      // Filter out any course selections with courseId = 0 (unselected)
      const filteredSelections = courseSelections
        .filter(sel => sel.courseId !== 0);

      // Check if at least one course is selected
      if (filteredSelections.length === 0) {
        message.error("Please select at least one course");
        setIsLoading(false);
        return;
      }

      // The backend might expect studyGoals as an array, so let's try sending it as is
      // Don't join into a string as the backend probably expects an array of strings
      
      // Create a structured payload that matches backend expectations
      const payload: UserRegistration = {
        name: values.name,
        email: values.email,
        password: values.password,
        studyLevel: values.studyLevel,
        studyGoals: values.studyGoals, // Send as array, not as string
        courseSelections: filteredSelections
      };

      console.log("Registration payload:", JSON.stringify(payload, null, 2));

      // Send registration request and handle possible empty response
      const response = await apiService.apiService.post<User>("/users/register", payload);
      console.log("Registration successful:", response);
      
      // Ensure we have a valid response object
      if (!response) {
        throw new Error("Server returned an empty response");
      }

      // Store registration credentials to use for auto-login
      const credentials = {
        email: values.email,
        password: values.password
      };

      // Try to auto-login with the same credentials
      try {
        console.log("Auto-logging in after registration");
        const loginResponse = await apiService.apiService.post<User>("/login", credentials as UserLogin);
        
        if (loginResponse && loginResponse.token) {
          console.log("Auto-login successful, setting token");
          localStorage.setItem("token", loginResponse.token);
          setToken(loginResponse.token);
          
          message.success("Registration successful! You are now online.");
          setTimeout(() => {
            window.location.href = "/main";
          }, 500);
        } else {
          // Fall back to registration token if auto-login didn't return a token
          if (response.token) {
            console.log("Using registration token instead");
            localStorage.setItem("token", response.token);
            setToken(response.token);
            
            message.success("Registration successful!");
            setTimeout(() => {
              window.location.href = "/main";
            }, 500);
          } else {
            throw new Error("No token returned from backend");
          }
        }
      } catch (loginError) {
        console.error("Auto-login failed:", loginError);
        
        // Fall back to registration token if available
        if (response.token) {
          console.log("Auto-login failed, using registration token");
          localStorage.setItem("token", response.token);
          setToken(response.token);
          
          message.success("Registration successful! (Login failed, please log in manually to appear online)");
          setTimeout(() => {
            window.location.href = "/main";
          }, 500);
        } else {
          throw new Error("No token returned from backend");
        }
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
      if (err.includes("409") || err.includes("Conflict") || err.includes("already exists")) {
        message.error("Email already taken. Please use a different email address.");
        
        // Focus the email field for better UX
        form.setFields([
          {
            name: 'email',
            errors: ['This email is already registered. Please use a different email.']
          }
        ]);
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

  const handleCourseChange = (index: number, value: number) => {
    const updated = [...courseSelections];
    updated[index].courseId = value;
    setCourseSelections(updated);
  };

  const handleKnowledgeLevelChange = (index: number, level: ProfileKnowledgeLevel) => {
    const updated = [...courseSelections];
    updated[index].knowledgeLevel = level;
    setCourseSelections(updated);
  };

  const addCourseSelection = () => {
    setCourseSelections([...courseSelections, { courseId: 0, knowledgeLevel: ProfileKnowledgeLevel.BEGINNER }]);
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
                  { type: 'email', message: "Please enter a valid email address!" },
                  { 
                    validator: async (_, value) => {
                      if (!value || !value.includes('@')) return Promise.resolve();
                      
                      try {
                        // Get the userService from the hook result
                        const { userService } = apiService;
                        
                        if (!userService) {
                          return Promise.resolve();
                        }
                        
                        try {
                          // Check if the email exists
                          const exists = await userService.emailExists(value);
                          
                          if (exists) {
                            return Promise.reject('This email is already registered. Please use a different email.');
                          }
                          
                          return Promise.resolve();
                        } catch (apiError) {
                          // Log the error but continue with form submission
                          console.warn("Email validation API error:", apiError);
                          // Don't block registration if email check fails
                          return Promise.resolve();
                        }
                      } catch (error) {
                        // If the API call fails, we still allow the form submission
                        // The server-side validation will catch duplicate emails
                        console.warn("Could not validate email:", error);
                        return Promise.resolve();
                      }
                    },
                    validateTrigger: 'onBlur' // Only validate when field loses focus
                  }
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
                      >
                        {availableCourses.map(course => (
                          <Option key={course.id} value={course.id}>{course.courseName}</Option>
                        ))}
                      </Select>
                    </Col>
                    <Col span={9}>
                      <Select
                        value={entry.knowledgeLevel}
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
                      {courseSelections.length > 1 && (
                        <Button 
                          type="button" 
                          onClick={() => removeCourseSelection(index)}
                          style={{ minWidth: 'auto', padding: '0 8px' }}
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
                  >
                    <PlusOutlined style={{ marginRight: 8 }} /> Add Course
                  </Button>
                </Form.Item>
              </Form.Item>
              
              <Divider style={{ margin: '24px 0' }} />
              
              <Form.Item className={componentStyles.buttonContainer}>
                <Button type="submit" disabled={isLoading}>Register</Button>
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