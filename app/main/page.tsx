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
import { UserOutlined, MessageOutlined, FilterOutlined, LogoutOutlined } from "@ant-design/icons";
import styles from "@/styles/main.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import Button from "@/components/Button";


// Use the actual UserProfile type from the profile.ts file
import { UserProfile } from "@/types/profile";

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
      availability: "WEEKDAYS",
      studyLevel: "Bachelor",
      studyStyle: "Visual learner, group study",
      studyGoals: "Pass exams, Learn new concepts, Understand materials",
      formattedStudyGoals: ["Pass exams", "Learn new concepts", "Understand materials"],
      knowledgeLevel: "INTERMEDIATE",
      userCourses: [
        { courseId: 1, courseName: "Mathematics", knowledgeLevel: "EXPERT" },
        { courseId: 2, courseName: "SoPra", knowledgeLevel: "BEGINNER" },
        { courseId: 3, courseName: "Informatics", knowledgeLevel: "BEGINNER" }
      ],
      profilePicture: "https://placehold.co/600x800/5f9ea0/white.png?text=Sakura"
    },
    {
      id: "2",
      name: "Takashi Yamamoto",
      email: "takashi@example.com",
      token: null,
      status: "ONLINE",
      availability: "EVENINGS",
      studyLevel: "Master",
      studyStyle: "Focused, independent learner",
      studyGoals: "Maintain 4.0 GPA, Understand core concepts",
      formattedStudyGoals: ["Maintain 4.0 GPA", "Understand core concepts"],
      knowledgeLevel: "ADVANCED",
      userCourses: [
        { courseId: 4, courseName: "Computer Science", knowledgeLevel: "EXPERT" },
        { courseId: 5, courseName: "Physics", knowledgeLevel: "INTERMEDIATE" },
        { courseId: 6, courseName: "English", knowledgeLevel: "ADVANCED" }
      ],
      profilePicture: "https://placehold.co/600x800/9370db/white.png?text=Takashi"
    },
    {
      id: "3",
      name: "Emma Wilson",
      email: "emma@example.com",
      token: null,
      status: "ONLINE",
      availability: "WEEKENDS",
      studyLevel: "PhD",
      studyStyle: "Early bird, structured approach",
      studyGoals: "Complete assignments early, Research opportunities",
      formattedStudyGoals: ["Complete assignments early", "Research opportunities"],
      knowledgeLevel: "EXPERT",
      userCourses: [
        { courseId: 7, courseName: "Biology", knowledgeLevel: "EXPERT" },
        { courseId: 8, courseName: "Chemistry", knowledgeLevel: "ADVANCED" },
        { courseId: 9, courseName: "Statistics", knowledgeLevel: "INTERMEDIATE" }
      ],
      profilePicture: "https://placehold.co/600x800/ff6347/white.png?text=Emma"
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
    
    // Ensure token is still valid by fetching the current user
    const validateToken = async () => {
      try {
        await apiService.get('/users/me');
        console.log("Token validated successfully");
      } catch (error) {
        console.error("Token validation failed:", error);
        message.error("Your session has expired. Please login again.");
        localStorage.removeItem("token");
        clearToken();
        router.push("/login");
      }
    };
    
    validateToken();

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
      message.loading("Logging out...");
      
      // Call the server's logout endpoint with the Authorization header
      // The server expects a token in the header, not a body payload
      try {
        await apiService.post('/users/logout', {});
        message.success("Logged out successfully");
      } catch (error) {
        console.warn("Logout API call failed, but proceeding with local logout", error);
        message.warning("Server logout failed, but you've been logged out locally");
      }
      
      // Clear token from both localStorage and state management
      localStorage.removeItem("token");
      clearToken();
      
      // Use window.location for a hard refresh to ensure clean state
      window.location.href = "/login";
    } catch (error) {
      console.error("Error during logout:", error);
      
      // Ensure token is removed even if an error occurs
      localStorage.removeItem("token");
      clearToken();
      
      message.error("Error during logout, but you've been logged out locally");
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
              <Link href="/profile" prefetch={true}>
                <button 
                  className={styles.iconButton}
                  onClick={() => {
                    // Store a flag to indicate navigation to profile
                    localStorage.setItem("navigatingToProfile", "true");
                    
                    // Pre-fetch and cache the user profile before navigation
                    const fetchProfileData = async () => {
                      try {
                        const response = await apiService.get('/users/me');
                        if (response) {
                          localStorage.setItem("cachedUserProfile", JSON.stringify(response));
                        }
                      } catch (error) {
                        console.error("Failed to prefetch user profile:", error);
                      }
                    };
                    fetchProfileData();
                  }}
                >
                  <UserOutlined />
                </button>
              </Link>
              <Link href="/chat">
                <button className={styles.iconButton}><MessageOutlined /></button>
              </Link>
              <button className={styles.iconButton} onClick={handleLogout}><FilterOutlined /></button>
              <button
                className={styles.iconButton}
                onClick={actualLogout}
              >
                <LogoutOutlined />
              </button>
            </div>
          </div>

          {/* Two-column Profile Layout */}
          <div className={styles.profileContainer}>
            {/* LEFT COLUMN: Larger Profile Image */}
            <div className={styles.profileImageContainer}>
              <img
                src={currentProfile.profilePicture || "https://placehold.co/600x800/9370db/white.png?text=Profile"}
                alt={currentProfile.name || "Profile"}
                className={styles.profileImage}
              />
            </div>

            {/* RIGHT COLUMN: Details + Study Level + Buttons */}
            <div className={styles.rightSection}>
              {/* Merged Profile & Study Level Card */}
              <div className={`${styles.card} ${styles.profileCard}`}>
                {/* Card Drag Handle (from Figma) */}
                <div className={styles.cardHeader}>
                  <div className={styles.dragHandle}></div>
                </div>
                {/* Name */}
                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Name</div>
                  <div className={styles.detailsValue}>{currentProfile.name}</div>
                </div>

                {/* Study Level */}
                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Study Level</div>
                  <div className={styles.detailsValue}>{currentProfile.studyLevel}</div>
                </div>

                {/* Study Style */}
                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Study Style</div>
                  <div className={styles.detailsValue}>{currentProfile.studyStyle || "Not specified"}</div>
                </div>

                {/* Availability */}
                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Availability</div>
                  <div className={styles.detailsValue}>{currentProfile.availability}</div>
                </div>

                {/* Study Goals */}
                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Study Goals</div>
                  <div className={styles.detailsValue}>
                    {currentProfile.formattedStudyGoals && currentProfile.formattedStudyGoals.length > 0 ? 
                      currentProfile.formattedStudyGoals.join(', ') : 
                      currentProfile.studyGoals || 'Not specified'}
                  </div>
                </div>

                {/* Study Courses Section */}
                <div className={styles.cardSection}>
                  <div className={styles.cardTitle}>Courses</div>
                  {currentProfile.userCourses?.map((course, index) => (
                    <div key={index} className={styles.studyLevelRow}>
                      <div className={styles.studyLevelLeft}>
                        <div className={styles.studyLevelSubject}>{course.courseName}</div>
                      </div>
                      <div className={styles.studyLevelRight}>{course.knowledgeLevel}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <button
                  className={`${styles.actionButton} ${styles.dislikeButton}`}
                  onClick={handleDislike}
                >
                  <span className={styles.buttonIcon}>✕</span>
                  <span>Dislike</span>
                </button>
                <button
                  className={`${styles.actionButton} ${styles.likeButton}`}
                  onClick={handleLike}
                >
                  <span className={styles.buttonIcon}>★</span>
                  <span>Like</span>
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