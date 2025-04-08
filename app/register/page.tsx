"use client";

import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Form, Input, App, Select, Space } from "antd";
import { useMessage } from '@/hooks/useMessage';
import Link from "next/link";
import styles from "@/styles/theme/layout.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import componentStyles from "@/styles/theme/components.module.css";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import { useEffect, useState } from "react";

const { Option } = Select;

interface FormFieldProps {
  email: string;
  name: string;
  password: string;
  studyLevel: string;
  studyGoals: string[];
  courseSelections: { courseId: number; knowledgeLevel: string }[];
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

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiService.get<Course[]>("/courses");
        setAvailableCourses(res);
      } catch (err) {
        console.error("Failed to fetch courses", err);
      }
    };
    fetchCourses();
  }, []);

  const handleRegister = async (values: FormFieldProps) => {
    try {
      message.loading("Creating account...");

      const filteredSelections = courseSelections.filter(sel => sel.courseId !== null);

      const payload = {
        ...values,
        courseSelections: filteredSelections
      };

      const response = await apiService.post<User>("/users/register", payload);
      console.log("Registration successful:", response);

      if (response.token) {
        localStorage.setItem("token", response.token);
        setToken(response.token);
        message.success("Registration successful!");
        setTimeout(() => {
          window.location.href = "/main";
        }, 500);
      } else {
        throw new Error("No token returned from backend");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      message.destroy();
      const err = error?.message || "";
      if (err.includes("409")) {
        message.error("Email already taken.");
      } else if (err.includes("400") && err.toLowerCase().includes("email")) {
        message.error("Email is required.");
      } else if (err.includes("400") && err.toLowerCase().includes("password")) {
        message.error("Password is required.");
      } else if (err.includes("fetch") || err.includes("Network")) {
        message.error("Server not reachable. Is backend running?");
      } else {
        message.error("Registration failed. Please try again.");
      }
    }
  };

  return (
    <App>
      {contextHolder}
      <div className={`${styles.pageContainer} ${backgroundStyles.loginBackground}`}>
        <Logo />
        <div className={styles.centeredContainer}>
          <div className={componentStyles.formContainer}>
            <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Register</h2>
            <Form
              form={form}
              name="register"
              onFinish={handleRegister}
              layout="vertical"
            >
              <Form.Item name="email" label="Email" rules={[
                { required: true, message: "Please input your email!" },
                { type: 'email', message: "Please enter a valid email address!" }
              ]}>
                <Input placeholder="Enter your email" />
              </Form.Item>

              <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please input your name!" }]}>
                <Input placeholder="Enter your name" />
              </Form.Item>

              <Form.Item name="password" label="Password" rules={[{ required: true, message: "Please input your password!" }]}>
                <Input.Password placeholder="Enter your password" />
              </Form.Item>

              <Form.Item
                name="studyLevel"
                label="Study Level"
                rules={[{ required: true, message: "Please select your study level!" }]}
              >
                <Select placeholder="Select your study level">
                  <Option value="Bachelor">Bachelor</Option>
                  <Option value="Master">Master</Option>
                  <Option value="PhD">PhD</Option>
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
                >
                  <Option value="exam prep">Exam Prep</Option>
                  <Option value="project work">Project Work</Option>
                  <Option value="homework">Homework</Option>
                  <Option value="general understanding">General Understanding</Option>
                  <Option value="presentation">Presentation</Option>
                </Select>
              </Form.Item>


              {/* Course Selection */}
              <label style={{ fontWeight: 500 }}>Select Courses and Knowledge Level</label>
              {courseSelections.map((entry, index) => (
                <Space key={index} style={{ marginBottom: 8 }} direction="horizontal">
                  <Select
                    placeholder="Select Course"
                    value={entry.courseId ?? undefined}
                    onChange={(value) => {
                      const updated = [...courseSelections];
                      updated[index].courseId = value;
                      setCourseSelections(updated);
                    }}
                    style={{ minWidth: 160 }}
                  >
                    {availableCourses.map(course => (
                      <Option key={course.id} value={course.id}>{course.courseName}</Option>
                    ))}
                  </Select>

                  <Select
                    value={entry.knowledgeLevel}
                    onChange={(level) => {
                      const updated = [...courseSelections];
                      updated[index].knowledgeLevel = level;
                      setCourseSelections(updated);
                    }}
                    style={{ minWidth: 160 }}
                  >
                    <Option value="BEGINNER">Beginner</Option>
                    <Option value="INTERMEDIATE">Intermediate</Option>
                    <Option value="ADVANCED">Advanced</Option>
                  </Select>

                  <Button type="button" onClick={() => {
                    const updated = [...courseSelections];
                    updated.splice(index, 1);
                    setCourseSelections(updated);
                  }}>Remove</Button>
                </Space>
              ))}
              <Button type="button" onClick={() =>
                setCourseSelections([...courseSelections, { courseId: null, knowledgeLevel: "BEGINNER" }])
              }>
                + Add Course
              </Button>

              <Form.Item className={componentStyles.buttonContainer}>
                <Button type="submit">Register</Button>
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
