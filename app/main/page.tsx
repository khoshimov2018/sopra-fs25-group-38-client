"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useMessage } from '@/hooks/useMessage';
import { User, ProfileKnowledgeLevel } from "@/types/user";
import { MatchPost, MatchGet } from "@/types/match";
import { App, Button as AntButton } from "antd";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import { UserOutlined, MessageOutlined, FilterOutlined, LogoutOutlined } from "@ant-design/icons";
import styles from "@/styles/main.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import Button from "@/components/Button";
import FilterModal from "@/components/FilterModal";


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
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<{
    selectedCourses: number[];
    knowledgeLevel: ProfileKnowledgeLevel | null;
  }>({
    selectedCourses: [],
    knowledgeLevel: null
  });

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

  const handleFilterClick = () => {
    setFilterModalVisible(true);
  };
  
  const handleFilterSave = async (selectedCourses: number[], knowledgeLevel: ProfileKnowledgeLevel | null) => {
    setFilters({
      selectedCourses,
      knowledgeLevel
    });
    
    try {
      message.loading("Applying filters...");
      
      // Use the specialized studentFilterService
      const { studentFilterService } = apiService;
      
      // Prepare an availability filter if knowledgeLevel is selected
      // This is just for demo - in a real app, availability would be a separate filter
      const availability = knowledgeLevel ? [UserAvailability.MORNING] : undefined;
      
      // Get filtered students using the service
      const filteredStudents = await studentFilterService.getFilteredStudents(
        selectedCourses.length > 0 ? selectedCourses : undefined,
        availability
      );
      
      // Update the profiles with the filtered students
      if (filteredStudents && filteredStudents.length > 0) {
        // In a real app, you would convert the filtered students to profiles
        // For demo purposes, we'll just keep using the mock profiles
        message.success(`Found ${filteredStudents.length} matching students`);
      } else {
        message.info("No students match the selected filters");
      }
      
      // Display what filters were applied
      let filterMessage = 'Filters applied: ';
      if (selectedCourses.length > 0) {
        filterMessage += `${selectedCourses.length} courses selected`;
      }
      if (knowledgeLevel) {
        filterMessage += selectedCourses.length > 0 ? `, ${knowledgeLevel} level` : `${knowledgeLevel} level`;
      }
      
      message.success(filterMessage);
    } catch (error) {
      console.error("Error applying filters:", error);
      message.error("Could not apply filters. Please try again.");
    }
  };
  
  const actualLogout = async () => {
    try {
      message.success("Logging out...");
      // In production, call the logout endpoint
      if (currentUser && currentUser.id) {
        try {
          // Use the userService from the hooks result
          const { userService } = apiService;
          if (userService) {
            await userService.logoutUser(Number(currentUser.id));
          } else {
            console.warn("User service not available");
          }
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

  const handleLike = async () => {
    try {
      if (!currentUser?.id || !profiles[currentProfileIndex]?.id) {
        message.error("User data is missing");
        return;
      }

      const matchData: MatchPost = {
        userId: Number(currentUser.id),
        targetUserId: Number(profiles[currentProfileIndex].id)
      };

      message.loading("Processing like...");
      
      // Use the specialized matchService
      const { matchService } = apiService;
      const response = await matchService.processLike(matchData);
      
      if (response && response.status === "ACCEPTED") {
        message.success(`Match with ${profiles[currentProfileIndex].name}! You both liked each other.`);
      } else {
        message.success(`You liked ${profiles[currentProfileIndex].name}`);
      }
      
      showNextProfile();
    } catch (error) {
      console.error("Error processing like:", error);
      message.error("Could not process like. Please try again.");
      
      // For demo, still show next profile
      showNextProfile();
    }
  };

  const handleDislike = async () => {
    try {
      if (!currentUser?.id || !profiles[currentProfileIndex]?.id) {
        message.error("User data is missing");
        return;
      }

      const matchData: MatchPost = {
        userId: Number(currentUser.id),
        targetUserId: Number(profiles[currentProfileIndex].id)
      };

      message.loading("Processing dislike...");
      
      // Use the specialized matchService
      const { matchService } = apiService;
      await matchService.processDislike(matchData);
      
      message.info(`You disliked ${profiles[currentProfileIndex].name}`);
      showNextProfile();
    } catch (error) {
      console.error("Error processing dislike:", error);
      message.error("Could not process dislike. Please try again.");
      
      // For demo, still show next profile
      showNextProfile();
    }
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
              <Link href="/profile">
                <button className={styles.iconButton}><UserOutlined /></button>
              </Link>
              <Link href="/chat">
                <button className={styles.iconButton}><MessageOutlined /></button>
              </Link>
              <button className={styles.iconButton} onClick={handleFilterClick}><FilterOutlined /></button>
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
                src={currentProfile.profileImage}
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

                {/* Study Style */}
                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Study Style</div>
                  <div className={styles.detailsValue}>{currentProfile.studyStyle}</div>
                </div>

                {/* Goal */}
                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Goal</div>
                  <div className={styles.detailsValue}>{currentProfile.goal}</div>
                </div>

                {/* Tags */}
                <div className={styles.cardSection}>
                  <div className={styles.tagContainer}>
                    {currentProfile.tags?.map((tag, index) => (
                      <span key={index} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Study Level Section */}
                <div className={styles.cardSection}>
                  <div className={styles.cardTitle}>Study Level</div>
                  {currentProfile.studyLevels?.map((level, index) => (
                    <div key={index} className={styles.studyLevelRow}>
                      <div className={styles.studyLevelLeft}>
                        <div className={styles.studyLevelGrade}>{level.grade}</div>
                        <div className={styles.studyLevelSubject}>{level.subject}</div>
                      </div>
                      <div className={styles.studyLevelRight}>{level.level}</div>
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
      
      {/* Filter Modal */}
      <FilterModal 
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onSave={handleFilterSave}
      />
    </App>
  );
};

export default MainPage;