"use client";

import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Form, Input, message } from "antd";
import Link from "next/link";

interface FormFieldProps {
  username: string;
  name: string;
  password: string;
}

const Register: React.FC = () => {
  const apiService = useApi();
  const [form] = Form.useForm();
  const { set: setToken } = useLocalStorage<string>("token", "");

  const handleRegister = async (values: FormFieldProps) => {
    try {
      message.loading("Creating account...");
      console.log("Attempting registration with:", values.username);
      
      // Call the API service to register new user
      const response = await apiService.post<User>("/users", values);
      console.log("Registration response:", response);

      // Store registration credentials to use for auto-login
      const credentials = {
        username: values.username,
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
          console.log("Redirecting to /users");
          
          // More forceful navigation with a delay to ensure token is saved
          setTimeout(() => {
            message.loading("Redirecting to user page...");
            window.location.href = "/users";
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
              window.location.href = "/users";
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
            window.location.href = "/users";
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
          message.error("Error: Username is already taken. Please choose a different username.");
        } else if (error.message.includes("400") && error.message.toLowerCase().includes("username")) {
          message.error("Error: Username cannot be empty.");
        } else if (error.message.includes("400") && error.message.toLowerCase().includes("password")) {
          message.error("Error: Password cannot be empty.");
        } else if (error.message.includes("400")) {
          message.error("Error: Both username and password are required.");
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
    <div className="register-container">
      <Card title="Register" style={{ width: 400, borderRadius: 8 }}>
        <Form
          form={form}
          name="register"
          size="large"
          variant="outlined"
          onFinish={handleRegister}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Error: Username cannot be empty." }]}
          >
            <Input placeholder="Enter username" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Error: Name cannot be empty." }]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Error: Password cannot be empty." }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="register-button">
              Register
            </Button>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ textAlign: 'center' }}>
              Already have an account? <Link href="/login">Login</Link>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
