import React, { useEffect, useState } from 'react';
import { Modal, Typography, Divider } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import Button from './Button';
import styles from '@/styles/theme/components.module.css';

const { Title, Text, Paragraph } = Typography;

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
  pageName: 'main' | 'profile' | 'chat' | 'users' | 'register';
}

const InfoModal: React.FC<InfoModalProps> = ({ 
  visible, 
  onClose, 
  pageName
}) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  const getContent = () => {
    switch(pageName) {
      case 'profile':
        return (
          <>
            <Title level={4}>Profile Management</Title>
            <Paragraph>
              Welcome to your profile page where you can customize how you present yourself to potential study partners.
            </Paragraph>
            
            <Divider />
            
            <Title level={5}>Profile Information</Title>
            <ul>
              <li>
                <Text strong>Personal Details:</Text>
                <Text> Update your name, profile picture, and bio to tell others about yourself.</Text>
              </li>
              <li>
                <Text strong>Study Level:</Text>
                <Text> Indicate your overall academic level to help find appropriate matches.</Text>
              </li>
              <li>
                <Text strong>Study Goals:</Text>
                <Text> Add tags representing what you hope to achieve with a study partner.</Text>
              </li>
              <li>
                <Text strong>Availability:</Text>
                <Text> Set your preferred study time (morning, afternoon, or evening).</Text>
              </li>
              <li>
                <Text strong>Courses:</Text>
                <Text> Add the courses you're studying and indicate your knowledge level for each.</Text>
              </li>
            </ul>
            
            <Divider />
            
            <Title level={5}>Editing Your Profile</Title>
            <ul>
              <li>
                <Text strong>Edit Mode:</Text>
                <Text> Click the "Edit Profile" button to make changes to your information.</Text>
              </li>
              <li>
                <Text strong>Profile Picture:</Text>
                <Text> Upload a new profile image by clicking on your current picture.</Text>
              </li>
              <li>
                <Text strong>Adding Courses:</Text>
                <Text> Click "Add Course" to include more subjects you're studying.</Text>
              </li>
              <li>
                <Text strong>Adding Goals:</Text>
                <Text> Click "Add Goal" to include additional study objectives.</Text>
              </li>
              <li>
                <Text strong>Save Changes:</Text>
                <Text> After editing, click "Save Profile" to update your information.</Text>
              </li>
            </ul>
            
            <Divider />
            
            <Title level={5}>Account Management</Title>
            <ul>
              <li>
                <Text strong>View Others' Profiles:</Text>
                <Text> When viewing another user's profile, you'll see their information but can't edit it.</Text>
              </li>
              <li>
                <Text strong>Delete Account:</Text>
                <Text> The "Delete Account" button permanently removes your account and all associated data.</Text>
              </li>
            </ul>
          </>
        );

      case 'main':
        return (
          <>
            <Title level={4}>Welcome to StudyBuddy</Title>
            <Paragraph>
              This is the main matching page where you can find study partners based on your preferences.
            </Paragraph>
            
            <Divider />
            
            <Title level={5}>How to Use</Title>
            <ul>
              <li>
                <Text strong>Browse Profiles:</Text>
                <Text> View potential study partners one at a time.</Text>
              </li>
              <li>
                <Text strong>Like or Dislike:</Text>
                <Text> Use the buttons at the bottom to express your interest.</Text>
              </li>
              <li>
                <Text strong>Button Color Coding:</Text>
                <Text> The Like/Dislike buttons change color to indicate your previous choices, even after refreshing the page. A highlighted Like button means you've previously liked this user, while a highlighted Dislike button means you've previously disliked them.</Text>
              </li>
              <li>
                <Text strong>Filter Students:</Text>
                <Text> Click the filter icon in the top bar to find students with specific courses or availability.</Text>
              </li>
              <li>
                <Text strong>Matching:</Text>
                <Text> When you like someone who has also liked you, it's a match! You'll receive a notification and can start chatting.</Text>
              </li>
              <li>
                <Text strong>Previously Liked Users:</Text>
                <Text> Users you've already liked won't appear again when you refresh or return to this page.</Text>
              </li>
            </ul>
            
            <Divider />
            
            <Title level={5}>Navigation</Title>
            <ul>
              <li>
                <Text strong>Notifications:</Text>
                <Text> The bell icon shows new matches and messages.</Text>
              </li>
              <li>
                <Text strong>Profile:</Text>
                <Text> View and edit your profile through the user icon.</Text>
              </li>
              <li>
                <Text strong>Chat:</Text>
                <Text> Access your conversations through the message icon.</Text>
              </li>
              <li>
                <Text strong>Logout:</Text>
                <Text> Sign out using the logout icon.</Text>
              </li>
            </ul>
          </>
        );
        case 'chat':
      return (
        <>
          <Title level={4}>Chat System Overview</Title>
          <Paragraph>
            StudyBuddy provides three kinds of conversations so you can get help
            from AI, talk 1-on-1, or collaborate in groups.
          </Paragraph>

          <Divider />

          <Title level={5}>1. AI Advisor</Title>
          <ul>
            <li>
              <Text strong>Ask Anything:</Text>{' '}
              <Text>
                click the <Text keyboard>Suggestion</Text> bubble to start a free-form Q &amp; A with the AI.
              </Text>
            </li>
            <li>
              <Text strong>Generate Study Plan:</Text>{' '}
              <Text>
                hit <Text keyboard>Scheduler</Text> and the AI builds a tailored weekly schedule based on
                <em>your</em> profile.
              </Text>
            </li>
            <li>
              <Text type="secondary">
                The AI channel is always listed first and never goes offline.
              </Text>
            </li>
          </ul>

          <Divider />

          <Title level={5}>2. Individual Chats</Title>
          <ul>
            <li>
              <Text strong>Automatic Channel:</Text>{' '}
              <Text>
                whenever two students match, a private 1-on-1 chat is created for you.
              </Text>
            </li>
            <li>
              <Text strong>Online Indicator:</Text>{' '}
              <Text>green&nbsp;● means your partner is currently online.</Text>
            </li>
            <li>
              <Text strong>Report / Block:</Text>{' '}
              <Text>
                click the <Text keyboard>✕</Text> button in the chat header if a conversation
                becomes inappropriate.
              </Text>
            </li>
            <li>
              <Text strong>Create Group:</Text>{' '}
              <Text>
                use the <Text keyboard>＋</Text> button to start a group with this partner and other matches.
              </Text>
            </li>
          </ul>

          <Divider />

          <Title level={5}>3. Group Chats</Title>
          <ul>
            <li>
              <Text strong>Made from an Individual Chat:</Text>{' '}
              <Text>
                press <Text keyboard>＋</Text>, give the group a name, and invite matched students.
              </Text>
            </li>
            <li>
              <Text strong>Add Members Later:</Text>{' '}
              <Text>
                open the group, hit <Text keyboard>＋</Text> again, and pick more matches to join.
              </Text>
            </li>
            <li>
              <Text strong>Only Matched Students:</Text>{' '}
              <Text>
                for safety, you can <em>only</em> add people you’ve already matched with.
              </Text>
            </li>
          </ul>
        </>
      );
      default:
        return <Text>Information about this page is not available.</Text>;
    }
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <InfoCircleOutlined style={{ fontSize: '20px', color: '#6750A4' }} />
          <span>How to Use This Page</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="ok" onClick={onClose} className={styles.primaryButton}>
          Got it!
        </Button>
      ]}
      width={600}
      styles={{
        body: { padding: '24px 32px', maxHeight: '70vh', overflowY: 'auto' }
      }}
    >
      {getContent()}
    </Modal>
  );
};

export default InfoModal;