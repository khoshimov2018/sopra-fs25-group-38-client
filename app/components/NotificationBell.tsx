"use client";

import React, { useEffect, useState } from 'react';
import { Badge, Popover, List, Typography, Button } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { NotificationGetDTO } from '@/types';
import { useApi } from '@/hooks/useApi';
import { NotificationService } from '@/api/services/notificationService';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

interface NotificationBellProps {
  userId: number;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<NotificationGetDTO[]>([]);
  const [open, setOpen] = useState(false);
  const apiService = useApi();
  const notificationService = new NotificationService(apiService.apiService);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getUnreadNotificationsForUser(userId);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const handleNotificationClick = async (notification: NotificationGetDTO) => {
    try {
      await notificationService.markNotificationAsRead(notification.id);
      
      if (notification.type === 'MATCH') {
        router.push('/chat');
      } else if (notification.type === 'LIKE') {
        router.push('/main');
      } else if (notification.type === 'MESSAGE') {
  
        router.push(`/chat?channelId=${notification.relatedEntityId}`);
      }
      
      setNotifications(notifications.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllNotificationsAsRead(userId);
      setNotifications([]);
      setOpen(false);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const content = (
    <div style={{ width: 300 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong>Notifications</Text>
        {notifications.length > 0 && (
          <Button 
            type="text" 
            size="small" 
            icon={<CheckOutlined />} 
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </div>
      <List
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item 
            key={item.id}
            onClick={() => handleNotificationClick(item)}
            style={{ cursor: 'pointer', padding: '8px', borderRadius: '4px', margin: '4px 0', background: item.read ? 'transparent' : '#f0f0f0' }}
          >
            <List.Item.Meta
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>{item.type}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {new Date(item.creationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </div>
              }
              description={item.message}
            />
          </List.Item>
        )}
        locale={{ emptyText: "No new notifications" }}
        style={{ maxHeight: 300, overflow: 'auto' }}
      />
    </div>
  );

  return (
    <Popover 
      content={content} 
      title={null} 
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Badge count={notifications.length} size="small" overflowCount={9} style={{ fontSize: '12px' }}>
        <BellOutlined style={{ fontSize: '20px', color: 'black' }} />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;