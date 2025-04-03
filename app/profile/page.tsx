"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useMessage } from '@/hooks/useMessage';
import { UserProfile } from "@/types/profile";
import Link from "next/link";
import Logo from "@/components/Logo";
import { UserOutlined, MessageOutlined, FilterOutlined, LogoutOutlined } from "@ant-design/icons";
import styles from "@/styles/profile.module.css";
import mainStyles from "@/styles/main.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import ProfileContent from "@/components/profile";

const ProfilePage = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const { message, contextHolder } = useMessage();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [editableUser, setEditableUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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
      // Save changes using our dedicated save function
      handleSaveProfile();
    } else {
      // Enter edit mode
      setIsEditing(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    // In a real implementation, this would open a file picker dialog
    // and allow the user to select an image to upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        
        // In a real implementation, we would upload the file to a server
        // and get a URL back
        // For demo purposes, we're using a local object URL
        const imageUrl = URL.createObjectURL(file);
        
        if (editableUser) {
          setEditableUser({
            ...editableUser,
            profileImage: imageUrl
          });
          
          message.success("Profile photo updated successfully");
        }
      }
    };
    
    input.click();
  };
  
  const handleSaveProfile = () => {
    if (!editableUser) return;
    
    // Validate required fields
    if (!editableUser.name || !editableUser.email) {
      message.error("Name and email are required fields");
      return;
    }
    
    // In a real implementation, we would send the updated profile to the server
    // For demo purposes, we're just updating the local state
    setCurrentUser(editableUser);
    setIsEditing(false);
    message.success("Profile updated successfully");
  };

  const handleAddTag = () => {
    if (!editableUser) return;
    const newTags = editableUser.tags ? [...editableUser.tags, ''] : [''];
    setEditableUser({
      ...editableUser,
      tags: newTags
    });
  };

  const handleRemoveTag = (index: number) => {
    if (!editableUser || !editableUser.tags) return;
    const newTags = [...editableUser.tags];
    newTags.splice(index, 1);
    setEditableUser({
      ...editableUser,
      tags: newTags
    });
  };

  const handleAddStudyLevel = () => {
    if (!editableUser) return;
    const newLevel = { subject: '', grade: '', level: '' };
    const newLevels = editableUser.studyLevels ? [...editableUser.studyLevels, newLevel] : [newLevel];
    setEditableUser({
      ...editableUser,
      studyLevels: newLevels
    });
  };

  const handleRemoveStudyLevel = (index: number) => {
    if (!editableUser || !editableUser.studyLevels) return;
    const newLevels = [...editableUser.studyLevels];
    newLevels.splice(index, 1);
    setEditableUser({
      ...editableUser,
      studyLevels: newLevels
    });
  };

  if (loading || !currentUser) {
    return (
      <div>
        {contextHolder}
        <div className={backgroundStyles.loginBackground}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div>Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  // Render the header with navigation
  const header = (
    <div className={mainStyles.header}>
      <Link href="/main" className={mainStyles.logoLink}>
        <Logo className={mainStyles.headerLogo} />
      </Link>
      <div className={mainStyles.headerRight}>
        <Link href="/profile">
          <button className={mainStyles.iconButton}>
            <UserOutlined />
          </button>
        </Link>
        <Link href="/messages">
          <button className={mainStyles.iconButton}>
            <MessageOutlined />
          </button>
        </Link>
        <button className={mainStyles.iconButton} onClick={handleFilterClick}>
          <FilterOutlined />
        </button>
        <button className={mainStyles.iconButton} onClick={handleLogout}>
          <LogoutOutlined />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {contextHolder}
      <div className={backgroundStyles.loginBackground}>
        <div className={styles.profileContainer}>
          {header}
          <ProfileContent
            currentUser={currentUser}
            editableUser={editableUser}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
            onImageUpload={handleImageUpload}
            onInputChange={handleInputChange}
            onTagChange={handleTagChange}
            onStudyLevelChange={handleStudyLevelChange}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onAddStudyLevel={handleAddStudyLevel}
            onRemoveStudyLevel={handleRemoveStudyLevel}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;