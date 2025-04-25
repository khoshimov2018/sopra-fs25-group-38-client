"use client"; 

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import Button from "antd/lib/button";
import Card from "antd/lib/card";
import Table from "antd/lib/table";
import Tag from "antd/lib/tag"; 
import message from "antd/lib/message";
import Typography from "antd/lib/typography";
import type { TableProps } from "antd";
import { formatDate } from "@/utils/date";
import { getApiDomain } from "@/utils/domain";

const { Title } = Typography;

// Columns for the antd table of User objects
const columns: TableProps<User>["columns"] = [
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    render: (text) => <Typography.Text strong>{text}</Typography.Text>,
  },
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status) => (
      <Tag color={status === "ONLINE" ? "green" : "red"}>
        {status}
      </Tag>
    ),
  },
  {
    title: "Creation Date",
    dataIndex: "creationDate",
    key: "creationDate",
    render: (date) => (date ? formatDate(date) : "N/A"),
  },
  {
    title: "Action",
    key: "action",
    render: (_, record) => (
      <Button type="link" disabled={!record.id}>
        {record.id ? "View Profile" : "No Profile"}
      </Button>
    ),
  },
];

const UsersList: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");

  const handleLogout = async (): Promise<void> => {
    const token = localStorage.getItem("token");
    console.log("Logging out from users page with token:", token);
  
    try {
      if (token) {
        const response = await fetch(`${getApiDomain()}/users/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        message.success("Logged out successfully!");
      }
    } catch (error) {
      console.warn("Logout API call failed:", error);
    }
  
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    clearToken(); 
    router.push("/login");
  };
  
  
  

  const handleProfileView = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  useEffect(() => {
    // Debug the token value when mounting this component
    console.log("Token in users page (from hook):", token);
    
    // Check token directly from localStorage - redundant precaution
    const localStorageToken = localStorage.getItem("token");
    console.log("Token in localStorage:", localStorageToken);
    
    // Get token from localStorage directly without JSON.parse
    // The token is stored directly, not as a JSON string
    const effectiveToken = token || localStorageToken;
    console.log("Effective token used:", effectiveToken ? effectiveToken.substring(0, 8) + '...' : 'none');
    
    // Check if token exists from any source
    if (!effectiveToken) {
      console.error("No token found - redirecting to login");
      message.error("Please login to view users");
      window.location.href = "/login";
      return;
    }
    
    // If we get here, we have a token
    const fetchUsers = async () => {
      try {
        // Log before making the API call
        console.log("Making GET request to /users with token:", effectiveToken);
        
        const users: User[] = await apiService.apiService.get<User[]>("/users");
        console.log("Successfully fetched users data:", users);
        setUsers(users);
      } catch (error) {
        console.error("Error in fetchUsers:", error);
        
        if (error instanceof Error) {
          // If unauthorized (401) or forbidden (403), redirect to login
          if (error.message.includes("401") || error.message.includes("403")) {
            console.error("Authorization error - redirecting to login");
            message.error("Your session has expired. Please login again.");
            clearToken();
            localStorage.removeItem("token");
            window.location.href = "/login";
          } else {
            message.error(`Failed to fetch users: ${error.message}`);
          }
        } else {
          console.error("An unknown error occurred while fetching users.");
          message.error("Failed to fetch users. Please try again.");
        }
      }
    };

    fetchUsers();
  }, [token, clearToken, apiService]);

  return (
    <div className="card-container">
      <Card 
        title={<Title level={3}>User Directory</Title>}
        extra={
          <Button onClick={handleLogout} type="primary" danger>
            Logout
          </Button>
        }
        style={{ width: '80%', maxWidth: 1000 }}
        {...(!users && { children: <div style={{ textAlign: 'center', padding: '20px' }}>Loading users...</div> })}
      >
        {users && (
          <Table<User>
            columns={columns}
            dataSource={users}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            onRow={(record) => ({
              onClick: () => handleProfileView(record.id ?? ""),
              style: { cursor: "pointer" }
            })}
          />
        )}
      </Card>
    </div>
  );
};

export default UsersList;
