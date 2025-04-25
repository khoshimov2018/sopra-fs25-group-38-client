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
    
  }, []);

  /**
   * Validate course selections
   * @param selections 
   * @returns
   */
  const validateCourseSelections = (selections: CourseSelection[]) => {
    // Filter out any course selections with courseId = 0 (unselected)
    const filteredSelections = selections.filter(sel => sel.courseId !== 0);

    // Check if at least one course is selected
    if (filteredSelections.length === 0) {
      return { 
        isValid: false, 
        filteredSelections,
        error: "Please select at least one course" 
      };
    }
    
    // Check for duplicate courses
    const uniqueCourseIds = new Set<number>();
    const duplicateCourses: number[] = [];
    
    filteredSelections.forEach(course => {
      if (uniqueCourseIds.has(course.courseId)) {
        duplicateCourses.push(course.courseId);
      } else {
        uniqueCourseIds.add(course.courseId);
      }
    });
    
    if (duplicateCourses.length > 0) {
      return { 
        isValid: false, 
        filteredSelections,
        error: "You have selected some courses multiple times. Please select each course only once." 
      };
    }

    return { 
      isValid: true, 
      filteredSelections,
      error: null 
    };
  };

  /**
   * Create registration payload
   * @param values 
   * @param filteredSelections 
   * @returns 
   */
  const createRegistrationPayload = (values: FormFieldProps, filteredSelections: CourseSelection[]): UserRegistration => {
    return {
      name: values.name,
      email: values.email,
      password: values.password,
      studyLevel: values.studyLevel,
      studyGoals: values.studyGoals,
      courseSelections: filteredSelections
    };
  };

  /**
   * Process successful registration
   * @param response 
   * @param credentials 
   */
  const processSuccessfulRegistration = async (
    response: User, 
    credentials: { email: string; password: string }
  ) => {
    try {
      // Try to auto-login with the same credentials
      console.log("Auto-logging in after registration");
      const loginResponse = await apiService.apiService.post<User>("/login", credentials as UserLogin);
      
      if (loginResponse?.token) {
        handleSuccessfulLogin(loginResponse.token, "Registration successful! You are now online.");
        return;
      }
      
      // Fall back to registration token if auto-login didn't return a token
      if (response.token) {
        handleSuccessfulLogin(response.token, "Registration successful!");
        return;
      }
      
      throw new Error("No token returned from backend");
    } catch (loginError) {
      console.error("Auto-login failed:", loginError);
      
      // Fall back to registration token if available
      if (response.token) {
        handleSuccessfulLogin(
          response.token, 
          "Registration successful! (Login failed, please log in manually to appear online)"
        );
        return;
      }
      
      throw new Error("No token returned from backend");
    }
  };

  /**
   * Handle successful login process
   * @param token 
   * @param successMessage
   */
  const handleSuccessfulLogin = (token: string, successMessage: string) => {
    console.log("Setting token and redirecting");
    localStorage.setItem("token", token);
    setToken(token);
    
    message.success(successMessage);
    setTimeout(() => {
      window.location.href = "/main";
    }, 500);
  };

  /**
   * Handle registration error
   * @param error
   */
  const handleRegistrationError = (error: unknown) => {
    console.error("Registration error:", error);
    
    if (error instanceof Error) {
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
      if ('info' in error) {
        try {
          const errorInfo = JSON.parse((error as any).info);
          console.error("Error info:", errorInfo);
        } catch (e) {
          if (e instanceof Error) {
            console.error("Error parsing info:", e.message);
          }
          console.error("Error info (not JSON):", (error as any).info);
        }
      }
      
      message.destroy();
      setIsLoading(false);
      
      const err = error.message ?? "";
      console.log("Error message:", err);
      
      displayUserFriendlyError(err);
    } else {
      message.error("Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  /**
   * Display user-friendly error based on error message
   * @param errorMessage 
   */
  const displayUserFriendlyError = (errorMessage: string) => {
    if (errorMessage.includes("409") || errorMessage.includes("Conflict") || errorMessage.includes("already exists")) {
      handleEmailAlreadyExists();
    } else if (errorMessage.includes("400")) {
      handleBadRequestError(errorMessage);
    } else if (errorMessage.includes("parse")) {
      message.error("There was an error processing the server response. Please try again.");
    } else if (errorMessage.includes("empty response")) {
      message.error("The server returned an empty response. Please try again.");
    } else if (errorMessage.includes("fetch") || errorMessage.includes("Network")) {
      message.error("Server not reachable. Is backend running?");
    } else {
      message.error("Registration failed. Please try again.");
    }
  };

  const handleEmailAlreadyExists = () => {
    message.error("Email already taken. Please use a different email address.");
    
    
    form.setFields([
      {
        name: 'email',
        errors: ['This email is already registered. Please use a different email.']
      }
    ]);
  };

  /**
   * Handle bad request errors with specific field messages
   * @param errorMessage 
   */
  const handleBadRequestError = (errorMessage: string) => {
    const lowerCaseError = errorMessage.toLowerCase();
    
    if (lowerCaseError.includes("email")) {
      message.error("Email is required or invalid.");
    } else if (lowerCaseError.includes("password")) {
      message.error("Password is required or too short (minimum 8 characters).");
    } else if (lowerCaseError.includes("study level")) {
      message.error("Study level is required.");
    } else if (lowerCaseError.includes("study goals")) {
      message.error("Study goals are required.");
    } else if (lowerCaseError.includes("course")) {
      message.error("At least one course selection is required.");
    } else if (lowerCaseError.includes("invalid input data")) {
      message.error("Please check all required fields are filled correctly.");
    } else {
      // Generic message for other 400 errors
      message.error("Invalid input data. Please check all fields and try again.");
    }
  };

  const handleRegister = async (values: FormFieldProps) => {
    try {
      setIsLoading(true);
      message.loading("Creating account...");

      // Validate course selections
      const validation = validateCourseSelections(courseSelections);
      if (!validation.isValid) {
        message.error(validation.error);
        setIsLoading(false);
        return;
      }

      // Create payload
      const payload = createRegistrationPayload(values, validation.filteredSelections);
      console.log("Registration payload:", JSON.stringify(payload, null, 2));

      // Send registration request
      const response = await apiService.apiService.post<User>("/users/register", payload);
      console.log("Registration successful:", response);
      
      // Ensure we have a valid response object
      if (!response) {
        throw new Error("Server returned an empty response");
      }

      // Store registration credentials for auto-login
      const credentials = {
        email: values.email,
        password: values.password
      };

      // Process registration and handle login
      await processSuccessfulRegistration(response, credentials);
    } catch (error) {
      handleRegistrationError(error);
    }
  };

  const handleCourseChange = (index: number, value: number) => {
    // Check if this course is already selected in another row
    const isDuplicate = courseSelections.some((course, i) => 
      i !== index && course.courseId === value && value !== 0
    );
    
    if (isDuplicate) {
      // Find the course name for better error message
      const courseName = availableCourses.find(c => c.id === value)?.courseName ?? `Course #${value}`;
      
      message.error(`"${courseName}" is already selected. Please choose a different course.`);
      
      // Reset the selection to the previous value or empty
      const previousValue = courseSelections[index].courseId;
      
      if (courseSelections.some((course, i) => 
          i !== index && course.courseId === previousValue && previousValue !== 0)) {
        value = 0;
      } else {
        value = previousValue;
      }
    }
    
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
    const hasUnselectedCourse = courseSelections.some(course => course.courseId === 0);
    
    if (hasUnselectedCourse) {
      message.warning("Please select a course in the existing empty field before adding another one.");
      return;
    }
    
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
                      if (!value?.includes('@')) return Promise.resolve();
                      
                      // Using optional chaining with a more concise approach
                      const exists = await apiService.apiService?.userService?.emailExists(value);
                      if (exists) {
                        return Promise.reject(new Error('This email is already registered. Please use a different email.'));
                      }
                      
                      return Promise.resolve();
                    },
                    validateTrigger: 'onBlur'
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
                  <Row key={`course-${index}-${entry.courseId}`} gutter={[8, 16]} style={{ marginBottom: 16 }}>
                    <Col span={11}>
                      <Select
                        placeholder="Select Course"
                        value={entry.courseId ?? undefined}
                        onChange={(value) => handleCourseChange(index, value)}
                        style={{ width: '100%' }}
                        className={componentStyles.input}
                        popupMatchSelectWidth={false}
                      >
                        {availableCourses.map(course => {
                          // Check if this course is already selected in any other row
                          const isSelected = courseSelections.some((selection, i) => 
                            i !== index && selection.courseId === course.id
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