"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useMessage } from "@/hooks/useMessage";
import { AdminService } from "@/api/services/adminService";
import { App, Typography, Table, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import styles from "@/styles/theme/layout.module.css";
import Button from "@/components/Button";
import { LogoutOutlined } from "@ant-design/icons";


const { Title } = Typography;

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface ReportedUser {
  id: number;
  reason: string;
  reportDate: string;
  reportedId: number;
  reporterId: number;
}

interface BlockedUser {
  blockerId: number;
  blockedUserId: number;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
  const AdminPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const adminService = new AdminService(apiService.apiService);
    const { message, contextHolder } = useMessage();
  
    const [reportedUsers, setReportedUsers] = useState<ReportedUser[]>([]);
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

  /* ------------------------------------------------------------------
     LOAD Reported, Blocked USER                                          
  ------------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      try {
        const users = await adminService.getReportedUsers();
        const blocked = await adminService.getBlockedUsers();

        setReportedUsers(users);
        setBlockedUsers(blocked);

      } catch (err) {
        message.error("Failed to load reported users");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

      /* ------------------------------------------------------------------
     DELETE SELECTED USER                                          
  ------------------------------------------------------------------ */
  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    setIsModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedUserId !== null) {
      await adminService.deleteUser(selectedUserId);
      setReportedUsers(users => users.filter(u => u.reportedId !== selectedUserId));
      message.success(`Deleted user ID: ${selectedUserId}`);
      setIsModalVisible(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Rendering: Block, Report Table                                    */
  /* ------------------------------------------------------------------ */
  const reportColumns: ColumnsType<ReportedUser> = [
    { title: "Reason", dataIndex: "reason", key: "reason" },
    { title: "Reported User ID", dataIndex: "reportedId", key: "reportedId" },
    { title: "Reporter ID", dataIndex: "reporterId", key: "reporterId" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button type="link" danger onClick={() => handleUserSelect(record.reportedId)}>
          Delete
        </Button>
      ),
    },
  ];

  const blockColumns: ColumnsType<BlockedUser> = [
    { title: "Blocker ID", dataIndex: "blockerId", key: "blockerId" },
    { title: "Blocked User ID", dataIndex: "blockedUserId", key: "blockedUserId" },
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
            className={styles.iconButton}
            onClick={() => {
              localStorage.removeItem("token");
              router.push("/login");
            }}
            aria-label="Logout"
          >
            <LogoutOutlined />
          </button>
        </div>
  
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
  
        <Modal
          title={<span style={{ color: "#000" }}>Confirm Deletion</span>}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onOk={handleConfirmDelete}
          okText="Delete this user"
          okButtonProps={{ danger: true }}
        >
          <p style={{ color: "#000" }}>
            Are you sure you want to delete user ID: {selectedUserId ?? "?"}
          </p>
        </Modal>
      </div>
    </App>
  );
  
};

export default AdminPage;
