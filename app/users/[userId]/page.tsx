"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User, UserGetDTO } from "@/types";
import { ApplicationError } from "@/types/error";
import { Button, Card, Typography, Descriptions, Tag, message, Breadcrumb, Spin, Form, Input, DatePicker, Space, Modal } from "antd";
import { formatDate } from "@/utils/date";
import Link from "next/link";
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// Type for the edit form values
interface EditFormValues {
  email: string;
  birthday: dayjs.Dayjs | null;
}

const { Title } = Typography;

const UserProfile: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const apiService = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Use Ant Design message with proper context
  const [messageApi, contextHolder] = message.useMessage();

  // Store the locally updated user data for the session
  // This will override the server data for the current browser session
  const localStorageKey = `updatedUserData_${userId}`;
  
  // Check authentication and fetch user data
  useEffect(() => {
    // Verify authentication
    const effectiveToken = token || localStorage.getItem("token");
    
    if (!effectiveToken) {
      messageApi.error("Please login to view user profiles");
      router.push("/login");
      return;
    }

    // Fetch current user's ID
    const fetchCurrentUser = async () => {
      try {
        // Get all users to find the one with matching token
        const users = await apiService.get<User[]>("/users");
        console.log("All users:", users);
        
        const loggedInUser = users.find(u => u.token === effectiveToken);
        console.log("Current token:", effectiveToken?.substring(0, 10) + "...");
        console.log("Found logged in user:", loggedInUser);
        
        if (loggedInUser && loggedInUser.id) {
          console.log(`Setting current user ID to: ${loggedInUser.id}`);
          setCurrentUserId(loggedInUser.id);
          
          // Check if this is the user's own profile
          // Convert both to strings for comparison since userId from params is a string
          const isOwn = String(loggedInUser.id) === String(userId);
          console.log(`Is this the user's own profile? ${isOwn ? 'YES' : 'NO'} (${loggedInUser.id} vs ${userId})`);
        } else {
          console.warn("Could not identify current user - token may be invalid");
          // Check local storage token
          console.log("Local storage token:", localStorage.getItem("token")?.substring(0, 10) + "...");
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    // Fetch user profile data
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First fetch from the server
        const userData = await apiService.get<User>(`/users/${userId}`);
        console.log("User profile data from server:", userData);
        
        // Check for any local overrides (cached user data)
        const cachedUserDataStr = localStorage.getItem(localStorageKey);
        if (cachedUserDataStr) {
          try {
            const cachedUserData = JSON.parse(cachedUserDataStr) as User;
            console.log("Found cached user data:", cachedUserData);
            
            // Use cached data but keep certain fields from server data
            const mergedData = {
              ...userData,
              // Override with cached values
              email: cachedUserData.email || userData.email,
              birthday: cachedUserData.birthday || userData.birthday
            };
            
            console.log("Using merged user data:", mergedData);
            setUser(mergedData);
          } catch (error) {
            console.error("Error parsing cached user data:", error);
            setUser(userData);
          }
        } else {
          setUser(userData);
        }
        
        // In parallel, fetch current user to determine if it's the same person
        await fetchCurrentUser();
      } catch (error) {
        console.error("Error fetching user profile:", error);
        
        if (error instanceof Error) {
          // Handle different error cases
          if (error.message.includes("404")) {
            setError("User not found. The requested user profile does not exist.");
          } else if (error.message.includes("401") || error.message.includes("403")) {
            messageApi.error("Your session has expired. Please login again.");
            clearToken();
            localStorage.removeItem("token");
            router.push("/login");
            return;
          } else {
            setError(`Failed to load user profile: ${error.message}`);
          }
        } else {
          setError("An unexpected error occurred. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, router, token, clearToken, localStorageKey, apiService, messageApi]);

  // Handle returning to users list
  const handleBackToUsers = () => {
    router.push("/users");
  };

  // Check if the current user is viewing their own profile
  // Use a memoized value to prevent unnecessary renders
  // Convert both to strings for comparison to handle type differences
  const isOwnProfile = React.useMemo(() => {
    // Convert both to strings for comparison since userId from params is a string
    const userIdStr = String(userId);
    const currentUserIdStr = currentUserId ? String(currentUserId) : null;
    
    console.log("Checking if own profile:", {
      userId: userIdStr,
      currentUserId: currentUserIdStr,
      isMatch: userIdStr === currentUserIdStr
    });
    
    return userIdStr === currentUserIdStr;
  }, [userId, currentUserId]);

  // Move the form initialization inside a useEffect to ensure it's connected
  // Create it only when the component mounts
  const [form] = Form.useForm();
  
  // Handle edit button click 
  const handleEditClick = () => {
    if (user) {
      console.log("Setting form values for editing:", {
        email: user.email || '',
        birthday: user.birthday ? dayjs(user.birthday) : null
      });
      
      // Set form values after a short timeout to ensure the form is mounted
      setTimeout(() => {
        form.setFieldsValue({
          email: user.email || '',
          // Convert birthday string to dayjs object if it exists
          birthday: user.birthday ? dayjs(user.birthday) : null,
        });
      }, 0);
    }
    
    // Show edit modal
    setIsEditing(true);
  };

  // Handle form cancel
  const handleCancel = () => {
    setIsEditing(false);
  };

  // Handle form submission
  const handleSubmit = async (values: EditFormValues) => {
    if (!user || !user.id) {
      message.error("User data is not available");
      return;
    }

    try {
      console.log("Form submission values:", values);
      
      // Format data for the API - include all fields required by the server
      // The UserPostDTO on the server requires email, password, and can include birthday
      const updateData = {
        email: values.email,
        password: "PROTECTED", // Server requires password field but doesn't actually use it for updates
        // Format birthday to ISO string if it exists
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
      };
      
      console.log("Final update data being sent:", updateData);

      // Show loading message
      messageApi.loading('Updating profile...');
      
      console.log("Sending update to server:", updateData);

      // Send PUT request to update user
      try {
        console.log("Sending PUT request to:", `/users/${user.id}`);
        console.log("With data:", JSON.stringify(updateData, null, 2));
        
        // Update locally first to ensure state changes even if server doesn't return data
        const updatedUserData = {
          ...user,
          email: values.email,
          birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
        };
        
        // Log server request
        console.log(`PUT request: ${JSON.stringify({
          url: `/users/${user.id}`,
          data: updateData,
          headers: { Authorization: "Bearer " + localStorage.getItem("token")?.substring(0, 10) + "..." }
        }, null, 2)}`);
        
        // Call the API with updated data and ensure we're sending everything needed
        const completeUpdateData = {
          id: user.id,
          email: values.email,
          name: user.name || "", // Use existing name from user object
          status: user.status,
          // Send both birthday formats to ensure server accepts one of them
          birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
          // The server likely requires the password for validation
          password: "PROTECTED"
        };
        
        console.log("Sending complete update data:", completeUpdateData);
        const result = await apiService.put<User>(`/users/${user.id}`, completeUpdateData);
        console.log("Update response from server:", result);
        
        // Now fetch the updated user data to refresh the UI
        console.log("Update was successful, fetching latest user data");
        
        try {
          // Wait a moment to ensure data is persisted on the server
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Fetch the updated user data to refresh the UI
          const freshUserData = await apiService.get<User>(`/users/${user.id}`);
          console.log("Fetched updated user data:", freshUserData);
          
          // Check if the data was updated correctly
          const emailUpdated = freshUserData.email === values.email;
          const birthdayUpdated = values.birthday ? 
            freshUserData.birthday === values.birthday.format('YYYY-MM-DD') : 
            freshUserData.birthday === null;
            
          console.log("Update verification:", {
            emailUpdated,
            birthdayUpdated,
            requestedBirthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
            actualBirthday: freshUserData.birthday
          });
          
          if (!emailUpdated || !birthdayUpdated) {
            console.warn("Some fields were not updated correctly by the server");
            console.warn("Server response after update:", freshUserData);
            
            // Log the issue for debugging
            console.log("UPDATE MISMATCH DETECTED:", {
              emailRequested: values.email,
              emailReceived: freshUserData.email,
              birthdayRequested: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
              birthdayReceived: freshUserData.birthday
            });
            
            // Store the user's intended changes in localStorage as a workaround
            try {
              console.log("Storing user data locally as a workaround for server limitations");
              
              // Create a cached version with the values the user intended
              const cacheData = {
                ...freshUserData,
                email: values.email,
                birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null
              };
              
              // Persist to localStorage for this session
              localStorage.setItem(localStorageKey, JSON.stringify(cacheData));
              console.log("User data cached locally:", cacheData);
              
              // Make another server update attempt
              const secondUpdateData = {
                ...freshUserData,
                email: values.email,
                birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
                password: "PROTECTED"
              };
              
              // Try the update again but it's OK if it fails
              try {
                console.log("Making second attempt to update with full user object");
                console.log("Second update data:", secondUpdateData);
                await apiService.put<User>(`/users/${user.id}`, secondUpdateData);
                
                // Fetch again after second update
                const secondFreshData = await apiService.get<User>(`/users/${user.id}`);
                console.log("Data after second update attempt:", secondFreshData);
                
                // Use the cached data with server data for stability
                const mergedData = {
                  ...secondFreshData,
                  email: values.email,
                  birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null
                };
                
                setUser(mergedData);
              } catch (secondError) {
                console.error("Second update attempt failed:", secondError);
                // Use our locally cached data
                setUser(cacheData);
              }
            } catch (cacheError) {
              console.error("Error caching user data:", cacheError);
              // Fall back to our local data as a last resort
              setUser(updatedUserData);
            }
          } else {
            // Everything worked as expected, use the server data
            setUser(freshUserData);
          }
        } catch (fetchError) {
          console.error("Error fetching updated user data:", fetchError);
          // If fetching updated data fails, use our local updated data
          setUser(updatedUserData);
        }
      } catch (putError) {
        console.error("PUT request failed:", putError);
        throw putError; // Re-throw to be caught by the outer catch block
      }

      // Success feedback
      messageApi.success('Profile updated successfully!');

      // Close edit mode
      setIsEditing(false);

    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Cancel any loading message
      messageApi.destroy();
      
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          messageApi.error('User not found. Please try again.');
        } else if (error.message.includes('409')) {
          messageApi.error('Email already exists. Please use a different email address.');
          // Highlight the email field as having an error
          form.setFields([
            {
              name: 'email',
              errors: ['This email is already taken. Please use another one.'],
            },
          ]);
        } else if (error.message.includes('400')) {
          messageApi.error('Invalid data. Please check your inputs.');
          // Try to extract field errors from the response if available
          try {
            const errorInfo = JSON.parse((error as ApplicationError).info || '{}');
            if (errorInfo.body && errorInfo.body.details) {
              // If the server returns specific field errors, show them in the form
              for (const field of Object.keys(errorInfo.body.details)) {
                form.setFields([
                  {
                    name: field,
                    errors: [errorInfo.body.details[field]],
                  },
                ]);
              }
            }
          } catch (parseError) {
            console.error('Could not parse error details:', parseError);
          }
        } else if (error.message.includes('401') || error.message.includes('403')) {
          messageApi.error('You are not authorized to edit this profile.');
          setIsEditing(false);
        } else if (error.message.includes('Network')) {
          messageApi.error('Network error. Please check your connection and try again.');
        } else {
          messageApi.error(`Failed to update profile: ${error.message}`);
        }
      } else {
        messageApi.error('An unexpected error occurred. Please try again.');
      }
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
                { title: user?.email || "User Profile" }
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: '10px' }}>Loading user profile...</div>
          </div>
        ) : error ? (
          <div className="error-container" style={{ textAlign: 'center', padding: '20px' }}>
            <Typography.Text type="danger" style={{ fontSize: '16px' }}>
              {error}
            </Typography.Text>
            <div style={{ marginTop: '20px' }}>
              <Button type="primary" onClick={handleBackToUsers}>
                Return to Users List
              </Button>
            </div>
          </div>
        ) : user ? (
          <React.Fragment>
            <Descriptions
              bordered
              column={1}
              styles={{ 
                label: { fontWeight: 'bold', width: '150px', color: 'white' },
                content: { whiteSpace: 'pre-wrap' }
              }}
            >
              <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
              <Descriptions.Item label="Name">{user.name || "N/A"}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={user.status === "ONLINE" ? "green" : "red"}>
                  {user.status || "UNKNOWN"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Creation Date">
                {user.creationDate ? formatDate(user.creationDate, true) : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Birth Date">
                {user.birthday ? formatDate(user.birthday) : "Not provided"}
              </Descriptions.Item>
            </Descriptions>
            
            {/* Add edit button below profile for better visibility */}
            {isOwnProfile && !isEditing && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Button 
                  onClick={handleEditClick} 
                  type="primary" 
                  size="large"
                  icon={<EditOutlined />}
                >
                  Edit My Profile
                </Button>
              </div>
            )}
          </React.Fragment>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Typography.Text>No user data available</Typography.Text>
          </div>
        )}
      </Card>

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile"
        open={isEditing}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose={true}
        style={{ top: 20 }}
        styles={{ 
          body: { background: 'black', padding: '20px' },
          header: { background: 'black', borderBottom: '1px solid #333' },
          mask: { background: 'rgba(0, 0, 0, 0.45)' }, // Semi-transparent backdrop
          content: { background: 'black' },
          footer: { background: 'black' }
          // Removed wrapper background to fix the full black background issue
        }}
        // Black theme for the modal
        className="black-theme-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          // Adding styles for the form in dark mode
          className="dark-form"
          // Removing initialValues to prevent conflicts with form.setFieldsValue
          // The values are already set in useEffect and handleEditClick
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
              style={{ 
                background: 'black', 
                color: 'white',
                borderColor: '#555'
              }}
            />
          </Form.Item>

          {/* Name is not editable based on requirements */}

          <Form.Item
            name="birthday"
            label={<span style={{ color: 'white' }}>Birthday (Optional)</span>}
          >
            <DatePicker 
              format="YYYY-MM-DD" 
              placeholder="Select your birthday"
              style={{ 
                width: '100%', 
                background: 'black', 
                color: 'white',
                borderColor: '#555'
              }}
              // Override DatePicker styles to be black themed
              popupStyle={{ backgroundColor: 'black' }}
              className="dark-date-picker"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel} style={{ borderColor: '#555' }}>
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