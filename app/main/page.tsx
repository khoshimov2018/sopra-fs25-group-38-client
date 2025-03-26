"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useMessage } from '@/hooks/useMessage';
import { User } from "@/types/user";
import { App, Button as AntButton } from "antd";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import { UserOutlined, MessageOutlined, FilterOutlined } from "@ant-design/icons";
import styles from "@/styles/main.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import Button from "@/components/Button";


// Mocked user profile data for now
// This would be replaced with API data in production
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
}

const MainPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const { message, contextHolder } = useMessage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);

  // Mock data - would come from API in production
  const mockProfiles: UserProfile[] = [
    {
      id: "1",
      name: "Sakura Noriaki",
      email: "sakura@example.com",
      token: null,
      status: "ONLINE",
      studyStyle: "Casual, Just Feel Free",
      goal: "To pass whole exams in this semester",
      tags: ["Life recorder", "Firefighter", "Semester Freshwoman"],
      studyLevels: [
        { subject: "Mathematics", grade: "A", level: "Expert" },
        { subject: "SoPra", grade: "A", level: "Beginner" },
        { subject: "Informatics", grade: "A", level: "Beginner" }
      ],
      profileImage: "https://placehold.co/600x800/5f9ea0/white.png?text=Sakura"
    },
    {
      id: "2",
      name: "Takashi Yamamoto",
      email: "takashi@example.com",
      token: null,
      status: "ONLINE",
      studyStyle: "Focused, Collaborative",
      goal: "Maintain 4.0 GPA and understand core concepts",
      tags: ["Night owl", "Coffee lover", "CS Major"],
      studyLevels: [
        { subject: "Computer Science", grade: "A", level: "Expert" },
        { subject: "Physics", grade: "B", level: "Intermediate" },
        { subject: "English", grade: "A", level: "Advanced" }
      ],
      profileImage: "https://placehold.co/600x800/9370db/white.png?text=Takashi"
    },
    {
      id: "3",
      name: "Emma Wilson",
      email: "emma@example.com",
      token: null,
      status: "ONLINE",
      studyStyle: "Structured, Morning Person",
      goal: "Complete all assignments one week before deadline",
      tags: ["Early bird", "Organized", "Biology Focus"],
      studyLevels: [
        { subject: "Biology", grade: "A", level: "Expert" },
        { subject: "Chemistry", grade: "A", level: "Advanced" },
        { subject: "Statistics", grade: "B", level: "Intermediate" }
      ],
      profileImage: "https://placehold.co/600x800/ff6347/white.png?text=Emma"
    }
  ];

  useEffect(() => {
    // First check if we're in a browser environment (needed for Next.js)
    if (typeof window === 'undefined') return;

    // Check for token in various places to ensure we have it
    const localStorageToken = localStorage.getItem("token");
    const effectiveToken = token || localStorageToken;
    
    console.log("Main page token check:", !!effectiveToken);
    
    if (!effectiveToken) {
      console.log("No token found, redirecting to login");
      message.error("Please login to access this page");
      router.push("/login");
      return;
    }

    // Load mock profiles for now - only do this once
    if (profiles.length === 0) {
      console.log("Setting mock profiles");
      setProfiles(mockProfiles);
    }

    // For this demo, we'll skip the API call and use a mock current user
    if (!currentUser) {
      console.log("Setting mock current user");
      // Create a mock current user
      const mockCurrentUser: User = {
        id: "current-user",
        name: "Current User",
        email: "current@example.com",
        token: effectiveToken,
        status: "ONLINE"
      };
      setCurrentUser(mockCurrentUser);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    // For demonstration purposes, we're just going to show a filter menu
    // This is what appears to happen in the sample image when clicking the filter icon
    message.info("Filter options would be shown here");
  };
  
  const actualLogout = async () => {
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

  const handleLike = () => {
    message.success(`You liked ${profiles[currentProfileIndex].name}`);
    showNextProfile();
  };

  const handleDislike = () => {
    message.info(`You disliked ${profiles[currentProfileIndex].name}`);
    showNextProfile();
  };

  const showNextProfile = () => {
    if (currentProfileIndex < profiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
    } else {
      // When we've shown all profiles, loop back to the first one
      // In production, you'd fetch more profiles from the API
      message.info("You've seen all available profiles. Starting again!");
      setCurrentProfileIndex(0);
    }
  };

  // Get current profile to display
  const currentProfile = profiles[currentProfileIndex] || null;

  if (!currentProfile) {
    return (
      <App>
        {contextHolder}
        <div className={`${backgroundStyles.loginBackground}`}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div>Loading profiles...</div>
          </div>
        </div>
      </App>
    );
  }
  return (
    <App>
      {contextHolder}
      <div className={backgroundStyles.loginBackground}>
        <div className={styles.mainContainer}>
          {/* Header */}
          <div className={styles.header}>
            <Link href="/main" className={styles.logoLink}>
              <Logo className={styles.headerLogo} />
            </Link>
            <div className={styles.headerRight}>
              <Link href="/messages">
                <button className={styles.iconButton}><MessageOutlined /></button>
              </Link>
              <Link href="/profile">
                <button className={styles.iconButton}><UserOutlined /></button>
              </Link>
              <button className={styles.iconButton} onClick={handleLogout}><FilterOutlined /></button>
              <button
                className={styles.iconButton}
                onClick={actualLogout}
                style={{ marginLeft: '15px', color: '#ff4d4f' }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Two-column Profile Layout */}
          <div className={styles.profileContainer}>
            {/* LEFT COLUMN: Larger Profile Image */}
            <div className={styles.profileImageContainer}>
              <img
                src={currentProfile.profileImage}
                alt={currentProfile.name || "Profile"}
                className={styles.profileImage}
              />
            </div>

            {/* RIGHT COLUMN: Details + Study Level + Buttons */}
            <div className={styles.rightSection}>
              {/* Profile Card (Name, Study Style, Goal, Tags) */}
              <div className={styles.profileCard}>
                <div className={styles.detailsSection}>
                  <div className={styles.detailsLabel}>Name</div>
                  <div className={styles.detailsValue}>{currentProfile.name}</div>
                </div>

                <div className={styles.detailsSection}>
                  <div className={styles.detailsLabel}>Study Style</div>
                  <div className={styles.detailsValue}>{currentProfile.studyStyle}</div>
                </div>

                <div className={styles.detailsSection}>
                  <div className={styles.detailsLabel}>Goal</div>
                  <div className={styles.detailsValue}>{currentProfile.goal}</div>
                </div>

                <div className={styles.detailsSection}>
                  <div className={styles.tagContainer}>
                    {currentProfile.tags?.map((tag, index) => (
                      <span key={index} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Study Level Card */}
              <div className={styles.studyLevelContainer}>
                <div className={styles.studyLevelTitle}>Study Level</div>
                {currentProfile.studyLevels?.map((level, index) => (
                  <div key={index} className={styles.studyLevel}>
                    <div className={styles.studyLevelLeft}>
                      <div className={styles.studyLevelGrade}>{level.grade}</div>
                      <div className={styles.studyLevelSubject}>{level.subject}</div>
                    </div>
                    <div className={styles.studyLevelRight}>{level.level}</div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <button
                  className={`${styles.actionButton} ${styles.dislikeButton}`}
                  onClick={handleDislike}
                >
                  ✕ Dislike
                </button>
                <button
                  className={`${styles.actionButton} ${styles.likeButton}`}
                  onClick={handleLike}
                >
                  ★ Like
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </App>
  );
};

export default MainPage;