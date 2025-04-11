"use client";

import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User, UserLogin } from "@/types/user";
import { Form, Input, App, message as antMessage } from "antd";
import { useMessage } from '@/hooks/useMessage';
import Link from "next/link";
import styles from "@/styles/theme/layout.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import componentStyles from "@/styles/theme/components.module.css";
import Logo from "@/components/Logo";
import Button from "@/components/Button";

/**
 * Login page component
 * Displays a login form with email and password fields
 */
const Login: React.FC = () => {
  const apiService = useApi();
  const [form] = Form.useForm();
  const { set: setToken } = useLocalStorage<string>("token", "");
  const { message, contextHolder } = useMessage();

  /**
   * Handles the login form submission
   * @param values - The form values (email and password)
   */
  const handleLogin = async (values: UserLogin) => {
    try {
      message.loading("Connecting to server...");
      
      // Call the API service to login
      const { userService } = apiService;
      if (!userService) {
        throw new Error("User service not available");
      }
      const response = await userService.loginUser(values);

      // Store token and redirect
      if (response && response.token) {
        message.success("Connected to server successfully!");
        
        // Set token in localStorage directly as a string, not JSON
        localStorage.setItem("token", response.token);
        
        // Also set via the hook for React state management
        setToken(response.token);
        
        message.success("Login successful!");
        
        // Navigate to main page
        setTimeout(() => {
          message.loading("Redirecting to main page...");
          window.location.href = "/main";
        }, 500);
      } else {
        // This would only happen if the server didn't include a token in the response
        console.error("Login response missing token:", response);
        message.error("Login failed: No authentication token received from server");
      }
    } catch (error) {
      // Clear any loading message
      message.destroy();
      
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          message.error("Invalid email or password.");
        } else if (error.message.includes("404")) {
          message.error("Email not found. Please register first.");
        } else if (error.message.includes("Network") || error.message.includes("fetch") || error.message.includes("CORS")) {
          message.error("Cannot connect to server. Please ensure the server is running and CORS is properly configured.");
        } else {
          message.error(`Login failed: ${error.message}`);
        }
      } else {
        message.error("Login failed. Please try again.");
      }
    }
  };

  return (
    <App>
      {contextHolder}
      <div className={`${styles.pageContainer} ${backgroundStyles.loginBackground}`}>
        {/* Logo in top left corner */}
        <Logo />
        
        {/* Centered login form */}
        <div className={styles.centeredContainer}>
          <div className={componentStyles.formContainer}>
            <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Sign In</h2>
            <Form
            form={form}
            name="login"
            onFinish={handleLogin}
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
              name="password"
              label="Password"
              className={componentStyles.inputField}
              required={false}
              rules={[{ required: true, message: "Please input your password!" }]}
            >
              <Input.Password placeholder="Enter your password" className={componentStyles.input} style={{ color: '#1E1E1E' }} />
            </Form.Item>
            
            <Form.Item className={componentStyles.buttonContainer}>
              <Button type="submit">Sign In</Button>
            </Form.Item>
            
            <div className={componentStyles.linkContainer}>
              <Link href="/register" className={componentStyles.link}>Register</Link>
            </div>
          </Form>
          </div>
        </div>
      </div>
    </App>
  );
};

export default Login;