"use client";

import React, { useEffect, useState } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useMessage } from "@/hooks/useMessage";
import { AdminService } from "@/api/services/adminService";
import { CourseService } from "@/api/services/courseService";
import { CourseGetDTO } from "@/types/dto";
import { App, Typography, Table, Modal, Input, Form, Tabs } from "antd";
import type { ColumnsType } from "antd/es/table";
import mainStyles from "@/styles/main.module.css";
import styles from "@/styles/theme/layout.module.css";
import Button from "@/components/Button";
import { LogoutOutlined } from "@ant-design/icons";
import DeleteAccountModal from "@/components/DeleteAccountModal"; 


const { Title } = Typography;

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface ReportedUser {
  reason: string;
  reportedId: number;
  reporterId: number;
  reportedName?: string;
  reporterName?: string;
}

interface BlockedUser {
  blockerId: number;
  blockedUserId: number;
  blockerName?: string;
  blockedName?: string;
}

interface UserInfo{
  id: number;
  name: string;
  email?: string;
  status?: string;
  studyGoals?: string[];
  studyLevel?: string;
  creationDate?: number[];
  userCourses?: {
    courseId: number;
    courseName: string;
    knowledgeLevel: string;
  }[];
}

interface Course {
  id: number;
  name: string;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
  const AdminPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const adminService = new AdminService(apiService.apiService);
    const courseService = new CourseService(apiService.apiService);
    const { message, contextHolder } = useMessage();
  
    const [reportedUsers, setReportedUsers] = useState<ReportedUser[]>([]);
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [selectedProfileRole, setSelectedProfileRole] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const [selectedProfile, setSelectedProfile] = useState<UserInfo | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const { clear: clearToken } =
      useLocalStorage<string>("token", "");

    const [courses, setCourses] = useState<CourseGetDTO[]>([]);
    const [form] = Form.useForm();
      
  /* ------------------------------------------------------------------ */
  /* Id -> Name method                                                  */
  /* ------------------------------------------------------------------ */
    const fetchUserName = async (userId: number): Promise<string> => {
      try {
        const user = await adminService.getUserById(userId);
        return user.name; 
      } catch (error) {
        console.error(`Failed to fetch user name for ID ${userId}:`, error);
        return "Unknown";
      }
    };

  /* ------------------------------------------------------------------ */
  /* Course method                                                  */
  /* ------------------------------------------------------------------ */
    const fetchCourses = async () => {
      try {
        const courseList = await courseService.getAllCourses();
        setCourses(courseList);
      } catch {
        message.error("Failed to fetch courses");
      }
    };

    const handleAddCourse = async (courseName: string) => {
      try {
        await courseService.createCourse(courseName);
        message.success("Course added successfully");
        form.resetFields();
        fetchCourses();
      } catch {
        message.error("Failed to add course");
      }
    };

  /* ------------------------------------------------------------------ */
  /* helper_create data format                                          */
  /* ------------------------------------------------------------------ */
  const formatCreationDate = (dateArray?: number[]) => {
    if (!dateArray) return "Unknown";
    const [year, month, day] = dateArray;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };
  
  /* ------------------------------------------------------------------
     LOAD Courses | Reported, Blocked USER                                          
  ------------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      try {
        const reports = await adminService.getReportedUsers();
        const blocks = await adminService.getBlockedUsers();
        const courseList = await courseService.getCourses();

        const reportsWithNames = await Promise.all(reports.map(async (report) => ({
          ...report,
          reportedName: await fetchUserName(report.reportedId),
          reporterName: await fetchUserName(report.reporterId),
        })));
  
        const blocksWithNames = await Promise.all(blocks.map(async (block) => ({
          ...block,
          blockerName: await fetchUserName(block.blockerId),
          blockedName: await fetchUserName(block.blockedUserId),
        })));
  
        setReportedUsers(reportsWithNames);
        setBlockedUsers(blocksWithNames);
        setCourses(courseList);

      } catch (err) {
        console.error("Failed to load reported users:", err);
        message.error("Failed to load reported users");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

      /* ------------------------------------------------------------------
     OPEN SELECTED USER PROFILE                                         
  ------------------------------------------------------------------ */
  const handleProfileClick = async (userId: number, role: string) => {
    const user = await adminService.getUserById(userId);
    setSelectedProfile(user);
    setSelectedProfileRole(role);
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

      /* ------------------------------------------------------------------
     DELETE SELECTED USER                                          
  ------------------------------------------------------------------ */
  const handleUserSelect = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setIsModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedUserId !== null) {
      await adminService.deleteUser(selectedUserId);
      
      // update reported user(remove deleted user)
      setReportedUsers(users => users.filter(u => u.reportedId !== selectedUserId));
      
      // update blocked/blocker user(remove deleted user)
      setBlockedUsers(users => 
        users.filter(u => u.blockerId !== selectedUserId && u.blockedUserId !== selectedUserId)
      );
      
      message.success(`Deleted user ID: ${selectedUserId}`);
      setIsModalVisible(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Rendering: Block, Report Table                                    */
  /* ------------------------------------------------------------------ */
  const reportColumns: ColumnsType<ReportedUser> = [
    { title: "Reason", dataIndex: "reason", key: "reason" },
    { 
      title: "Reporter ID", 
      key: "reporterId",
      render: (_, record) => (
        <button 
          onClick={() => handleProfileClick(record.reporterId, "Reporter")}
          onKeyDown={(e) => e.key === 'Enter' && handleProfileClick(record.reporterId, "Reporter")}
          tabIndex={0}
          style={{ background: "none", border: "none", color: "#1677ff", cursor: "pointer", padding: 0, textDecoration: "underline" }}
        >
          {record.reporterId}
        </button>
      )
    },
    { title: "Reporter Name", dataIndex: "reporterName", key: "reporterName" },
    { title: "Reported ID", 
      key: "reportedId",
      render: (_, record) => (
        <button 
          onClick={() => handleProfileClick(record.reportedId, "Reported")}
          onKeyDown={(e) => e.key === 'Enter' && handleProfileClick(record.reportedId, "Reported")}
          tabIndex={0}
          style={{ background: "none", border: "none", color: "#1677ff", cursor: "pointer", padding: 0, textDecoration: "underline" }}
        >
          {record.reportedId}
        </button>
      )
    },
    { title: "Reported Name", dataIndex: "reportedName", key: "reportedName" },  
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button type="link" danger onClick={() => handleUserSelect(record.reportedId, record.reportedName ?? "Unknown")}>
          Delete
        </Button>
      ),
    },
  ];

  const blockColumns: ColumnsType<BlockedUser> = [
    { title: "Blocker ID", 
      key: "blockerId",
      render: (_, block) => (
        <button 
          onClick={() => handleProfileClick(block.blockerId, "Blocker")}
          onKeyDown={(e) => e.key === 'Enter' && handleProfileClick(block.blockerId, "Blocker")}
          tabIndex={0}
          style={{ background: "none", border: "none", color: "#1677ff", cursor: "pointer", padding: 0, textDecoration: "underline" }}
        >
          {block.blockerId}
        </button>
      )
    },
    { title: "Blocker Name", dataIndex: "blockerName", key: "blockerName" },
    { title: "Blocked User ID", 
      key: "blockedUserId",
      render: (_, block) => (
        <button 
          onClick={() => handleProfileClick(block.blockedUserId, "Blocked")}
          onKeyDown={(e) => e.key === 'Enter' && handleProfileClick(block.blockedUserId, "Blocked")}
          tabIndex={0}
          style={{ background: "none", border: "none", color: "#1677ff", cursor: "pointer", padding: 0, textDecoration: "underline" }}
        >
          {block.blockedUserId}
        </button>
      )
    },
    { title: "Blocked Name", dataIndex: "blockedName", key: "blockedName" },
  ];

  /* ------------------------------------------------------------------ */
  /*  Rendering: Admin page                                             */
  /* ------------------------------------------------------------------ */
  return (
    <App>
      {contextHolder}
      <div className={styles.mainContainer}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "40px 10%" }}>
        <h2 style={{ color: "#000" }}>Admin Dashboard</h2>
          <button
                  className={mainStyles.iconButton}
                  onClick={() => {
                    localStorage.removeItem("token");
                    clearToken();
                    router.push("/login");
                  }}
                >
                  <LogoutOutlined />
                </button>
        </div>

      <div style={{ width: "80%", margin: "0 auto" }}>
        {/* --- Tab Component --- */}
        <Tabs
        defaultActiveKey="courses"
        type="card" 
        tabBarStyle={{ fontWeight: 600, fontSize: 16 }} 
        items={[
          {
            key: 'courses',
            label: 'Courses',
            children: (
              <div style={{ marginTop: 24 }} className="admin-tab-content">
                  <div style={{ width: "80%", margin: "0 auto", marginBottom: 48 }} className="adminTableWrapper">
                  {/* <div style={{ width: "80%", marginLeft: "40px", marginBottom: 48 }} className="adminTableWrapper"> */}
                  <Title level={4} style={{ color: "#000" }}>Course Management</Title>

                  <Form layout="inline" form={form} onFinish={({ courseName }) => handleAddCourse(courseName)} style={{ marginBottom: 20 }}>
                    <Form.Item name="courseName" rules={[{ required: true, message: 'Course name required' }]}>
                      <Input placeholder="Course Name" />
                    </Form.Item>
                    <Form.Item>
                      <Button htmlType="submit" type="primary">Add Course</Button>
                    </Form.Item>
                  </Form>

                  <Table
                    columns={[
                      { title: "ID", dataIndex: "id", key: "id" },
                      { title: "Name", dataIndex: "courseName", key: "courseName" },
                    ]}
                    dataSource={courses}
                    rowKey="id"
                    pagination={false}
                    rowClassName={() => styles.adminTableRow}
                  />
                </div>
              </div>
            )
          },
          {
            key: 'User Management',
            label: 'User Management',
            children: (
              <div style={{ marginTop: 24 }} className="admin-tab-content">
                <div style = {{ width: "80%", margin: "0 auto" }} className="adminTableWrapper">
                  <Title level={4} style={{ color: "#000" }}>Reported Users</Title>
                  <Table
                    columns={reportColumns}
                    dataSource={reportedUsers}
                    rowKey="id"
                    pagination={false}
                    loading={isLoading}
                    rowClassName={() => styles.adminTableRow}
                    />
                  </div>
          
                <div style = {{ width: "80%", margin: "0 auto" }} className="adminTableWrapper">
                  <Title level={4} style={{ marginTop: 48, color: "#000" }}>Blocked Users</Title>
                  <Table
                    columns={blockColumns}
                    dataSource={blockedUsers}
                    rowKey={(row) => `${row.blockerId}-${row.blockedUserId}`}
                    pagination={false}
                    rowClassName={() => styles.adminTableRow}
                  />
                </div>
              </div>
            )
          }
        ]}
      /> 
      </div>       

        <Modal
          title={<span style={{ fontSize: "22px", fontWeight: "bold", color: "#000" }}>
            {selectedProfileRole} User Profile</span>}
          open={isProfileModalOpen}
          onCancel={closeProfileModal}
          footer={null}
          className="custom-profile-modal"
        >
          {selectedProfile && (
            <ul style={{
              background: "#fff",
              padding: "28px 28px 28px 70px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              color: "#000",
              fontSize: "18px",
              lineHeight: "1.8",
            }}>
                <li><strong>ID:</strong> {selectedProfile.id}</li>
                <li><strong>Name:</strong> {selectedProfile.name}</li>
                <li><strong>Email:</strong> {selectedProfile.email}</li>
                <li><strong>Creation Date:</strong> {formatCreationDate(selectedProfile.creationDate)}</li>
                <li><strong>Status:</strong> {selectedProfile.status}</li>
                <li><strong>Study Goals:</strong> {selectedProfile.studyGoals?.join(", ") ?? "None"}</li>
                <li><strong>Study Level:</strong> {selectedProfile.studyLevel}</li>
                <li><strong>Courses:</strong> {selectedProfile.userCourses?.map(c => c.courseName).join(", ") ?? "None"}</li>
              </ul>
          )}
        </Modal>

        <DeleteAccountModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onConfirm={handleConfirmDelete}
          mode = "admin"
          targetName={`ID: ${selectedUserId} (${selectedUserName})`}
        />
      </div>
    </App>
  );
  
};

export default AdminPage;
