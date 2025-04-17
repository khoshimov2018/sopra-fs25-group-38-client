"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types";
import { ApplicationError } from "@/types/error";
import {
  Button,
  Card,
  Typography,
  Descriptions,
  Tag,
  message,
  Breadcrumb,
  Spin,
  Form,
  Input,
  DatePicker,
  Space,
  Modal
} from "antd";
import { formatDate } from "@/utils/date";
import Link from "next/link";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface EditFormValues {
  email: string;
  birthday: dayjs.Dayjs | null;
}

const { Title } = Typography;

/**
 * Component for rendering user profile content
 */
const UserProfileContent: React.FC<{
  loading: boolean;
  error: string | null;
  user: User | null;
  isOwnProfile: boolean;
  isEditing: boolean;
  onBackClick: () => void;
  onEditClick: () => void;
}> = ({ loading, error, user, isOwnProfile, isEditing, onBackClick, onEditClick }) => {
  // Loading state
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: '10px' }}>Loading user profile...</div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="error-container" style={{ textAlign: 'center', padding: '20px' }}>
        <Typography.Text type="danger" style={{ fontSize: '16px' }}>
          {error}
        </Typography.Text>
        <div style={{ marginTop: '20px' }}>
          <Button type="primary" onClick={onBackClick}>
            Return to Users List
          </Button>
        </div>
      </div>
    );
  }
  
  // No user data state
  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Typography.Text>No user data available</Typography.Text>
      </div>
    );
  }
  
  // User profile content
  return (
    <>
      <Descriptions
        bordered
        column={1}
        labelStyle={{ fontWeight: 'bold', width: '150px', color: 'white' }}
        contentStyle={{ whiteSpace: 'pre-wrap' }}
      >
        <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
        <Descriptions.Item label="Name">{user.name ?? "N/A"}</Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={user.status === "ONLINE" ? "green" : "red"}>
            {user.status ?? "UNKNOWN"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Creation Date">
          {user.creationDate ? formatDate(user.creationDate, true) : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Birth Date">
          {user.birthday ? formatDate(user.birthday) : "Not provided"}
        </Descriptions.Item>
      </Descriptions>
      {isOwnProfile && !isEditing && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Button
            onClick={onEditClick}
            type="primary"
            size="large"
            icon={<EditOutlined />}
          >
            Edit My Profile
          </Button>
        </div>
      )}
    </>
  );
};

const UserProfile: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const apiService = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const localStorageKey = `updatedUserData_${userId}`;
  const [form] = Form.useForm();

  const verifyAuth = () => {
    const effectiveToken = token ?? localStorage.getItem("token");
    if (!effectiveToken) {
      messageApi.error("Please login to view user profiles");
      router.push("/login");
      return false;
    }
    return true;
  };

  const handleBackToUsers = () => {
    router.push("/users");
  };

  const fetchCurrentUser = async (effectiveToken: string) => {
    try {
      const users = await apiService.get<User[]>('/users');
      const loggedInUser = users.find(u => u.token === effectiveToken);
      if (loggedInUser?.id) {
        setCurrentUserId(String(loggedInUser.id));
      } else {
        console.warn("Could not identify current user - token may be invalid");
      }
    } catch (e) {
      console.error("Error fetching current user:", e);
    }
  };

  const handleFetchError = (err: unknown) => {
    console.error("Error fetching user profile:", err);
    if (err instanceof Error) {
      if (err.message.includes("404")) {
        setError("User not found. The requested user profile does not exist.");
      } else if (/401|403/.test(err.message)) {
        messageApi.error("Your session has expired. Please login again.");
        clearToken();
        localStorage.removeItem("token");
        router.push("/login");
      } else {
        setError(`Failed to load user profile: ${err.message}`);
      }
    } else {
      setError("An unexpected error occurred. Please try again later.");
    }
  };

  const mergeWithCachedData = (userData: User): User => {
    const cachedStr = localStorage.getItem(localStorageKey);
    if (!cachedStr) return userData;
    
    try {
      const cached = JSON.parse(cachedStr) as User;
      return {
        ...userData,
        email: cached.email ?? userData.email,
        birthday: cached.birthday ?? userData.birthday
      };
    } catch {
      console.error("Error parsing cached user data");
      return userData;
    }
  };

  const fetchUserProfile = async () => {
    const effectiveToken = token ?? localStorage.getItem("token") ?? "";
    try {
      setLoading(true);
      setError(null);
      const userData = await apiService.get<User>(`/users/${userId}`);
      const mergedUser = mergeWithCachedData(userData);
      setUser(mergedUser);
      
      if (effectiveToken) {
        await fetchCurrentUser(effectiveToken);
      }
    } catch (err) {
      handleFetchError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!verifyAuth()) return;
    fetchUserProfile();
  }, [userId, token]);

  const isOwnProfile = useMemo(
    () => String(currentUserId) === String(userId),
    [currentUserId, userId]
  );

  const handleEditClick = () => {
    if (user) {
      form.setFieldsValue({
        email: user.email ?? "",
        birthday: user.birthday ? dayjs(user.birthday) : null
      });
    }
    setIsEditing(true);
  };

  const prepareUpdateData = (values: EditFormValues, user: User) => ({
    id: user.id,
    email: values.email,
    name: user.name ?? "",
    status: user.status,
    birthday: values.birthday ? values.birthday.format("YYYY-MM-DD") : null,
    password: "PROTECTED"
  });

  const handleUpdateError = (err: unknown) => {
    console.error("Error updating profile:", err);
    messageApi.destroy();
    if (err instanceof Error) {
      const msg = err.message;
      if (msg.includes("404")) {
        messageApi.error("User not found. Please try again.");
      } else if (msg.includes("409")) {
        messageApi.error("Email already exists. Please use a different email address.");
        form.setFields([{ name: 'email', errors: ['This email is already taken. Please use another one.'] }]);
      } else if (msg.includes("400")) {
        messageApi.error("Invalid data. Please check your inputs.");
        try {
          const info = JSON.parse((err as ApplicationError).info || "{}");
          if (info.body?.details) {
            Object.entries(info.body.details).forEach(([field, errorMsg]) => {
              form.setFields([{ name: field, errors: [String(errorMsg)] }]);
            });
          }
        } catch {
          console.error("Could not parse error details");
        }
      } else if (/401|403/.test(msg)) {
        messageApi.error("You are not authorized to edit this profile.");
        setIsEditing(false);
      } else if (msg.includes("Network")) {
        messageApi.error("Network error. Please check your connection and try again.");
      } else {
        messageApi.error(`Failed to update profile: ${msg}`);
      }
    } else {
      messageApi.error("An unexpected error occurred. Please try again.");
    }
  };

  const updateProfile = async (values: EditFormValues) => {
    if (!user?.id) {
      messageApi.error("User data is not available");
      return;
    }
    messageApi.loading("Updating profile...");
    const data = prepareUpdateData(values, user);
    try {
      await apiService.put<User>(`/users/${user.id}`, data);
      await fetchUserProfile();
      messageApi.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      handleUpdateError(err);
    }
  };

  return (
    <div className="card-container">
      {contextHolder}
      <Card
        title={
          <div>
            <Breadcrumb
              items={[
                { title: <Link style={{ color: 'white' }} href="/users">Users</Link> },
                { title: user?.email ?? "User Profile" }
              ]}
              style={{ marginBottom: '12px' }}
            />
            <Title level={3}>User Profile</Title>
          </div>
        }
        extra={
          <Space>
            <Button onClick={handleBackToUsers} icon={<ArrowLeftOutlined />}>
              Back to Users
            </Button>
          </Space>
        }
        style={{ width: '80%', maxWidth: 800 }}
      >
        <UserProfileContent 
          loading={loading}
          error={error}
          user={user}
          isOwnProfile={isOwnProfile}
          isEditing={isEditing}
          onBackClick={handleBackToUsers}
          onEditClick={handleEditClick}
        />
      </Card>
      <Modal
        title="Edit Profile"
        open={isEditing}
        onCancel={() => setIsEditing(false)}
        footer={null}
        destroyOnClose
        style={{ top: 20 }}
        className="black-theme-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={updateProfile}
          className="dark-form"
        >
          <Form.Item
            name="email"
            label={<span style={{ color: 'white' }}>Email</span>}
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
            tooltip="Please enter a valid email address"
          >
            <Input
              placeholder="Enter your email"
              style={{ background: 'black', color: 'white', borderColor: '#555' }}
            />
          </Form.Item>
          <Form.Item
            name="birthday"
            label={<span style={{ color: 'white' }}>Birthday (Optional)</span>}
          >
            <DatePicker
              format="YYYY-MM-DD"
              placeholder="Select your birthday"
              style={{ width: '100%', background: 'black', color: 'white', borderColor: '#555' }}
              popupStyle={{ backgroundColor: 'black' }}
              className="dark-date-picker"
            />
          </Form.Item>
          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsEditing(false)} style={{ borderColor: '#555' }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" style={{ background: '#1668dc' }}>
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserProfile;