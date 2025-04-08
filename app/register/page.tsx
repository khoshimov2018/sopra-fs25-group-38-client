"use client";

import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Form, Input, App, message as antMessage } from "antd";
import { useMessage } from '@/hooks/useMessage';
import Link from "next/link";
import styles from "@/styles/theme/layout.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import componentStyles from "@/styles/theme/components.module.css";
import Logo from "@/components/Logo";
import Button from "@/components/Button";

interface FormFieldProps {
  email: string;
  name: string;
  password: string;
}

const Register: React.FC = () => {
  const apiService = useApi();
  const [form] = Form.useForm();
  const { set: setToken } = useLocalStorage<string>("token", "");
  const { message, contextHolder } = useMessage();

  const handleRegister = async (values: FormFieldProps) => {
    try {
      message.loading("Creating account...");
      console.log("Attempting registration with:", values.email);
      
      // Call the API service to register new user
      const response = await apiService.post<User>("/users/register", values);
      console.log("Registration response:", response);

      // Store registration credentials to use for auto-login
      const credentials = {
        email: values.email,
        password: values.password
      };

      // Registration succeeded - now immediately login to set the status to ONLINE
      try {
        console.log("Auto-logging in to set status to ONLINE");
        
        // Auto-login with the same credentials
        const loginResponse = await apiService.post<User>("/login", credentials);
        console.log("Auto-login response:", loginResponse);
        
        if (loginResponse.token) {
          console.log("Setting token from login:", loginResponse.token);
          
          // Set token directly without JSON.stringify to avoid double-encoding
          localStorage.setItem("token", loginResponse.token);
          
          // Also set via the hook for React state
          setToken(loginResponse.token);
          
          message.success("Registration successful! You are now online.");
          console.log("Redirecting to main page");
          
          // More forceful navigation with a delay to ensure token is saved
          setTimeout(() => {
            message.loading("Redirecting to main page...");
            window.location.href = "/main";
          }, 500);
        } else {
          // Even if auto-login fails, we can still proceed with the registration token
          console.warn("Auto-login didn't return a token, using registration token instead");
          
          // Fall back to registration token
          if (response.token) {
            localStorage.setItem("token", response.token);
            setToken(response.token);
            
            message.success("Registration successful!");
            setTimeout(() => {
              window.location.href = "/main";
            }, 500);
          } else {
            console.error("No token received in registration response");
            message.error("Error: Registration failed. Please try again later.");
          }
        }
      } catch (loginError) {
        console.error("Auto-login failed:", loginError);
        
        // Fall back to registration token if available
        if (response.token) {
          console.log("Using registration token instead");
          localStorage.setItem("token", response.token);
          setToken(response.token);
          
          message.success("Registration successful! (Login failed, please log in manually to appear online)");
          setTimeout(() => {
            window.location.href = "/main";
          }, 500);
        } else {
          console.error("No token received in registration response");
          message.error("Error: Registration failed. Please try again later.");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      // Clear any loading message
      message.destroy();
      
      if (error instanceof Error) {
        // Display appropriate error message based on response
        if (error.message.includes("409")) {
          message.error("Error: Email is already taken. Please use a different email address.");
        } else if (error.message.includes("400") && error.message.toLowerCase().includes("email")) {
          message.error("Error: Email cannot be empty.");
        } else if (error.message.includes("400") && error.message.toLowerCase().includes("password")) {
          message.error("Error: Password cannot be empty.");
        } else if (error.message.includes("400")) {
          message.error("Error: Both email and password are required.");
        } else if (error.message.includes("Network") || error.message.includes("fetch") || error.message.includes("CORS")) {
          message.error("Error: Registration failed. Please try again later.");
          console.info("Network/CORS issue: If you're developing locally, make sure your backend server is running at http://localhost:8080 and has CORS configured.");
        } else {
          message.error("Error: Registration failed. Please try again later.");
          console.error("Detailed error:", error.message);
        }
      } else {
        console.error("An unknown error occurred during registration.");
        message.error("Error: Registration failed. Please try again later.");
      }
    }
  };

  return (
    <App>
      {contextHolder}
      <div className={`${styles.pageContainer} ${backgroundStyles.loginBackground}`}>
        {/* Logo in top left corner */}
        <Logo />
        
        {/* Centered registration form */}
        <div className={styles.centeredContainer}>
          <div className={componentStyles.formContainer}>
            <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Register</h2>
            <Form
            form={form}
            name="register"
            onFinish={handleRegister}
            layout="vertical"
          >
            <Form.Item
              name="email"
              label="Email"
              className={componentStyles.inputField}
              required={false}
              rules={[
                { required: true, message: "Please input your email!" },
                { type: 'email', message: "Please enter a valid email address!" }
              ]}
            >
              <Input placeholder="Enter your email" className={componentStyles.input} style={{ color: '#1E1E1E' }} />
            </Form.Item>
            
            <Form.Item
              name="name"
              label="Name"
              className={componentStyles.inputField}
              required={false}
              rules={[{ required: true, message: "Please input your name!" }]}
            >
              <Input placeholder="Enter your name" className={componentStyles.input} style={{ color: '#1E1E1E' }} />
            </Form.Item>
            
            <Form.Item
              name="password"
              label="Password"
              className={componentStyles.inputField}
              required={false}
              rules={[{ required: true, message: "Please input your password!" }]}
            >
              <Input.Password placeholder="Enter your password" className={componentStyles.input} style={{ color: '#1E1E1E' }} />
            </Form.Item>
            
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
