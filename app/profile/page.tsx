"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useMessage } from '@/hooks/useMessage';
import { User } from "@/types/user";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import { UserOutlined, MessageOutlined, FilterOutlined, LogoutOutlined, EditOutlined, CameraOutlined } from "@ant-design/icons";
import styles from "@/styles/profile.module.css";
import mainStyles from "@/styles/main.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import Button from "@/components/Button";
import FormInput from "@/components/FormInput";
import FormContainer from "@/components/FormContainer";

// Extended user profile interface
interface UserProfile extends User {
  studyStyle?: string;
  goal?: string;
  tags?: string[];
  studyLevels?: {
    subject: string;
    grade: string;
    level: string;
  }[];
  profileImage?: string;
  bio?: string;
}

const ProfilePage = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const { message, contextHolder } = useMessage();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableUser, setEditableUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return;

    // Check for token
    const localStorageToken = localStorage.getItem("token");
    const effectiveToken = token || localStorageToken;
    
    if (!effectiveToken) {
      message.error("Please login to access your profile");
      router.push("/login");
      return;
    }

    // For demo purposes, using mock data
    // In production, we would fetch user data from API
    const mockUserProfile: UserProfile = {
      id: "current-user",
      name: "John Doe",
      email: "john.doe@example.com",
      token: effectiveToken,
      status: "ONLINE",
      creationDate: "2023-01-15",
      birthday: "1995-05-20",
      studyStyle: "Focused, Morning Person",
      goal: "To become a proficient developer and pass all exams",
      tags: ["Coffee lover", "Tech enthusiast", "CS Major"],
      studyLevels: [
        { subject: "Mathematics", grade: "A", level: "Advanced" },
        { subject: "Computer Science", grade: "A+", level: "Expert" },
        { subject: "Physics", grade: "B", level: "Intermediate" }
      ],
      profileImage: "https://placehold.co/600x800/2c2c2c/white.png?text=John+Doe",
      bio: "I'm a passionate computer science student looking for study partners in mathematics and physics."
    };

    setCurrentUser(mockUserProfile);
    setEditableUser(mockUserProfile);
    setLoading(false);
    
  }, []);

  const handleLogout = async () => {
    try {
      message.success("Logging out...");
      // In production, call the logout endpoint
      if (currentUser && currentUser.id) {
        try {
          await apiService.post(`/users/${currentUser.id}/logout`, {});
        } catch (error) {
          console.warn("Logout API call failed, but proceeding with local logout", error);
        }
      }
      
      // Clear token and redirect to login
      localStorage.removeItem("token");
      clearToken();
      
      // Use window.location for a hard refresh to ensure clean state
      window.location.href = "/login";
    } catch (error) {
      console.error("Error during logout:", error);
      localStorage.removeItem("token");
      clearToken();
      window.location.href = "/login";
    }
  };

  const handleFilterClick = () => {
    message.info("Filter options would be shown here");
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      setCurrentUser(editableUser);
      message.success("Profile updated successfully");
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editableUser) return;
    
    const { name, value } = e.target;
    setEditableUser({
      ...editableUser,
      [name]: value
    });
  };

  const handleTagChange = (index: number, value: string) => {
    if (!editableUser || !editableUser.tags) return;
    
    const newTags = [...editableUser.tags];
    newTags[index] = value;
    
    setEditableUser({
      ...editableUser,
      tags: newTags
    });
  };

  const handleStudyLevelChange = (index: number, field: 'subject' | 'grade' | 'level', value: string) => {
    if (!editableUser || !editableUser.studyLevels) return;
    
    const newLevels = [...editableUser.studyLevels];
    newLevels[index] = {
      ...newLevels[index],
      [field]: value
    };
    
    setEditableUser({
      ...editableUser,
      studyLevels: newLevels
    });
  };

  const handleImageUpload = () => {
    message.info("Image upload functionality would be implemented here");
  };

  if (loading || !currentUser) {
    return React.createElement('div', null, [
      contextHolder,
      React.createElement('div', { className: backgroundStyles.loginBackground, key: 'bg' }, [
        React.createElement('div', { 
          style: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }, 
          key: 'loading-container' 
        }, [
          React.createElement('div', { key: 'loading-text' }, 'Loading profile...')
        ])
      ])
    ]);
  }

  // Rendering profile content
  const header = React.createElement('div', { className: mainStyles.header, key: 'header' }, [
    React.createElement(Link, { href: '/main', className: mainStyles.logoLink, key: 'logo-link' }, [
      React.createElement(Logo, { className: mainStyles.headerLogo, key: 'logo' })
    ]),
    React.createElement('div', { className: mainStyles.headerRight, key: 'header-right' }, [
      React.createElement(Link, { href: '/profile', key: 'profile-link' }, [
        React.createElement('button', { className: mainStyles.iconButton, key: 'profile-btn' }, [
          React.createElement(UserOutlined, { key: 'user-icon' })
        ])
      ]),
      React.createElement(Link, { href: '/messages', key: 'messages-link' }, [
        React.createElement('button', { className: mainStyles.iconButton, key: 'message-btn' }, [
          React.createElement(MessageOutlined, { key: 'message-icon' })
        ])
      ]),
      React.createElement('button', { 
        className: mainStyles.iconButton, 
        onClick: handleFilterClick, 
        key: 'filter-btn' 
      }, [
        React.createElement(FilterOutlined, { key: 'filter-icon' })
      ]),
      React.createElement('button', { 
        className: mainStyles.iconButton, 
        onClick: handleLogout, 
        key: 'logout-btn' 
      }, [
        React.createElement(LogoutOutlined, { key: 'logout-icon' })
      ])
    ])
  ]);

  // Profile header with title and edit button
  const profileHeader = React.createElement('div', { className: styles.profileHeader, key: 'profile-header' }, [
    React.createElement('h1', { className: styles.profileTitle, key: 'title' }, 'Profile'),
    React.createElement('button', { 
      className: styles.editButton, 
      onClick: handleEditToggle, 
      key: 'edit-btn' 
    }, [
      React.createElement('span', { key: 'edit-text' }, isEditing ? 'Save' : 'Edit'),
      React.createElement(EditOutlined, { className: styles.editIcon, key: 'edit-icon' })
    ])
  ]);

  // Profile image section
  const profileImage = React.createElement('div', { className: styles.profileImageSection, key: 'profile-image' }, [
    React.createElement('div', { className: styles.imageContainer, key: 'image-container' }, [
      React.createElement('img', { 
        src: currentUser.profileImage, 
        alt: currentUser.name || "Profile", 
        className: styles.profileImage, 
        key: 'img' 
      }),
      isEditing && React.createElement('button', { 
        className: styles.uploadButton, 
        onClick: handleImageUpload, 
        key: 'upload-btn' 
      }, [
        React.createElement(CameraOutlined, { key: 'camera-icon' }),
        ' Change Photo'
      ])
    ])
  ]);

  // Profile details in view mode
  const renderViewMode = () => {
    return React.createElement('div', { className: styles.profileCard, style: { border: 'none' }, key: 'card' }, [
      // Name section
      React.createElement('div', { className: styles.cardSection, key: 'name-section' }, [
        React.createElement('div', { className: styles.detailsLabel, key: 'name-label' }, 'Name'),
        React.createElement('div', { className: styles.detailsValue, key: 'name-value' }, currentUser.name)
      ]),
      
      // Email section
      React.createElement('div', { className: styles.cardSection, key: 'email-section' }, [
        React.createElement('div', { className: styles.detailsLabel, key: 'email-label' }, 'Email'),
        React.createElement('div', { className: styles.detailsValue, key: 'email-value' }, currentUser.email)
      ]),
      
      // Birthday section (if available)
      currentUser.birthday && React.createElement('div', { className: styles.cardSection, key: 'bday-section' }, [
        React.createElement('div', { className: styles.detailsLabel, key: 'bday-label' }, 'Birthday'),
        React.createElement('div', { className: styles.detailsValue, key: 'bday-value' }, 
          new Date(currentUser.birthday).toLocaleDateString()
        )
      ]),
      
      // Bio section (if available)
      currentUser.bio && React.createElement('div', { className: styles.cardSection, key: 'bio-section' }, [
        React.createElement('div', { className: styles.detailsLabel, key: 'bio-label' }, 'Bio'),
        React.createElement('div', { className: styles.detailsValue, key: 'bio-value' }, currentUser.bio)
      ]),
      
      // Study Style section (if available)
      currentUser.studyStyle && React.createElement('div', { className: styles.cardSection, key: 'style-section' }, [
        React.createElement('div', { className: styles.detailsLabel, key: 'style-label' }, 'Study Style'),
        React.createElement('div', { className: styles.detailsValue, key: 'style-value' }, currentUser.studyStyle)
      ]),
      
      // Goal section (if available)
      currentUser.goal && React.createElement('div', { className: styles.cardSection, key: 'goal-section' }, [
        React.createElement('div', { className: styles.detailsLabel, key: 'goal-label' }, 'Goal'),
        React.createElement('div', { className: styles.detailsValue, key: 'goal-value' }, currentUser.goal)
      ]),
      
      // Tags section (if available)
      currentUser.tags && currentUser.tags.length > 0 && React.createElement('div', { className: styles.cardSection, key: 'tags-section' }, [
        React.createElement('div', { className: styles.detailsLabel, key: 'tags-label' }, 'Tags'),
        React.createElement('div', { className: styles.tagContainer, key: 'tags-container' }, 
          currentUser.tags.map((tag, index) => 
            React.createElement('span', { key: `tag-${index}`, className: styles.tag }, tag)
          )
        )
      ]),
      
      // Study Levels section (if available)
      currentUser.studyLevels && currentUser.studyLevels.length > 0 && React.createElement('div', { className: styles.cardSection, key: 'levels-section' }, [
        React.createElement('div', { className: styles.detailsLabel, key: 'levels-label' }, 'Study Levels'),
        React.createElement('div', { className: styles.studyLevelContainer, key: 'levels-container' }, 
          currentUser.studyLevels.map((level, index) => 
            React.createElement('div', { key: `level-${index}`, className: styles.studyLevelRow }, [
              React.createElement('div', { className: styles.studyLevelLeft, key: `level-left-${index}` }, [
                React.createElement('span', { className: styles.studyLevelGrade, key: `grade-${index}` }, level.grade),
                React.createElement('span', { className: styles.studyLevelSubject, key: `subject-${index}` }, level.subject),
                React.createElement('span', { className: styles.studyLevelRight, key: `level-right-${index}` }, ` (${level.level})`)
              ])
            ])
          )
        )
      ])
    ]);
  };

  // Main content
  const content = React.createElement('div', { className: styles.content, key: 'content' }, [
    profileHeader,
    React.createElement('div', { className: styles.profileGrid, key: 'grid' }, [
      React.createElement('div', { className: styles.profileCard, style: { border: 'none' }, key: 'main-card' }, [
        profileImage,
        React.createElement('div', { className: styles.profileDetailsSection, key: 'details' }, [
          isEditing ? 
            // Edit mode - form inputs will be added in a separate implementation
            React.createElement('div', { className: styles.editForm, key: 'edit-form' }, 'Loading edit form...') : 
            // View mode
            renderViewMode()
        ])
      ])
    ])
  ]);

  return React.createElement('div', null, [
    contextHolder,
    React.createElement('div', { className: backgroundStyles.loginBackground, key: 'bg' }, [
      React.createElement('div', { className: styles.profileContainer, key: 'container' }, [
        header,
        content
      ])
    ])
  ]);
};

export default ProfilePage;