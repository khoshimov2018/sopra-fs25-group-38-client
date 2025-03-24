"use client";

import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Form, Input, message } from "antd";
import Link from "next/link";

interface FormFieldProps {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const apiService = useApi();
  const [form] = Form.useForm();
  const { set: setToken } = useLocalStorage<string>("token", "");

  const handleLogin = async (values: FormFieldProps) => {
    try {
      message.loading("Connecting to server...");
      console.log("Attempting login with:", values.username);
      
      // Call the API service to login
      const response = await apiService.post<User>("/login", values);
      console.log("Login response:", response);

      // Store token and redirect
      if (response.token) {
        console.log("Setting token:", response.token);
        message.success("Connected to server successfully!");
        
        // Set token directly without JSON.stringify to avoid double-encoding
        localStorage.setItem("token", response.token);
        
        // Also set via the hook for React state
        setToken(response.token);
        
        message.success("Login successful!");
        console.log("Redirecting to /users");
        
        // More forceful navigation with a small delay
        setTimeout(() => {
          message.loading("Redirecting to user page...");
          window.location.href = "/users";
        }, 500);
      } else {
        console.error("No token received in login response");
        message.error("Login failed: No authentication token received");
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Clear any loading message
      message.destroy();
      
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          message.error("Invalid username or password.");
        } else if (error.message.includes("404")) {
          message.error("Username not found. Please register first.");
        } else if (error.message.includes("Network") || error.message.includes("fetch") || error.message.includes("CORS")) {
          message.error("Cannot connect to server. Please ensure the server is running and CORS is properly configured.");
          console.info("If you're developing locally, make sure your backend server is running at http://localhost:8080 and has CORS configured.");
        } else {
          message.error(`Login failed: ${error.message}`);
        }
      } else {
        console.error("An unknown error occurred during login.");
        message.error("Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="login-container">
      <Card title="Login" style={{ width: 400, borderRadius: 8 }}>
        <Form
          form={form}
          name="login"
          size="large"
          variant="outlined"
          onFinish={handleLogin}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input placeholder="Enter username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="login-button">
              Login
            </Button>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ textAlign: 'center' }}>
              Don&apos;t have an account? <Link href="/register">Register</Link>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
