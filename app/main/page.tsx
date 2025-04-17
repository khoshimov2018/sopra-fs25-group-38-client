"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useMessage } from '@/hooks/useMessage';
import { User, ProfileKnowledgeLevel, UserAvailability } from "@/types/user";
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
import { MatchService } from "@/api/services/matchService";
import {StudentFilterService} from "@/api/services/studentFilterService";
import {UserService} from "@/api/services/userService";



// Mocked user profile data for now
// This would be replaced with API data in production
interface UserProfile extends User {
  studyStyle?: string;
  goal?: string;
  bio?: string;
  studyLevel?: string;
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
  const matchService = new MatchService(apiService.apiService);
  const studentFilterService = new StudentFilterService(apiService.apiService);
  const userService = new UserService(apiService.apiService);
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const { message, contextHolder } = useMessage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<{
    selectedCourses: number[];
    availability: UserAvailability | null;
  }>({
    selectedCourses: [],
    availability: null
  });

  // This will be populated from API when fetchUsers is called
  const [mockProfiles, setMockProfiles] = useState<UserProfile[]>([]);

  // Function to fetch users from the backend
  const fetchUsers = async () => {
    try {
      message.loading("Loading profiles...");
      
      if (!currentUser || currentUser.id === null) {
        console.error("Current user is not available - cannot filter properly");
        message.error("Failed to load user information");
        return;
      }
      
      console.log("Current user:", currentUser);
      
      // Get all available users using the studentFilterService
      const users = await studentFilterService.getFilteredStudents();
      console.log("All fetched users:", users.map(u => ({ id: u.id, name: u.name })));
      
      if (users && users.length > 0) {
        // Convert all user IDs to numbers for comparison
        const currentUserId = Number(currentUser.id);
        
        // Filter out the current user from the list
        const filteredUsers = users.filter(user => Number(user.id) !== currentUserId);
        console.log("After filtering current user:", filteredUsers.map(u => ({ id: u.id, name: u.name })));
        
        if (filteredUsers.length === 0) {
          message.info("No other users available");
          setProfiles([]);
          return;
        }
        
        // Convert UserGetDTO to UserProfile format
        const fetchedProfiles: UserProfile[] = filteredUsers.map(user => {
          // Extract study goals as tags (splitting by comma if it's a string)
          const tags = user.studyGoals ? 
            typeof user.studyGoals === 'string' ? 
              user.studyGoals.split(',').map(tag => tag.trim()) : 
              [user.studyGoals] : 
            [];
            
          // Convert userCourses to studyLevels format
          let studyLevels = [];
          if (user.userCourses && user.userCourses.length > 0) {
            studyLevels = user.userCourses.map(course => ({
              subject: course.courseName || "Unknown Course",
              grade: "N/A", // Grade information isn't available in the DTO
              level: course.knowledgeLevel || "BEGINNER"
            }));
            console.log("Mapped study levels from userCourses:", studyLevels);
          } else {
            console.log("No userCourses found for user:", user.id);
            studyLevels = [];
          }
          
          // Format availability properly
          let formattedAvailability = "Not specified";
          if (user.availability) {
            switch(user.availability) {
              case "MORNING":
                formattedAvailability = "Morning";
                break;
              case "AFTERNOON":
                formattedAvailability = "Afternoon";
                break;
              case "EVENING":
                formattedAvailability = "Evening";
                break;
              default:
                formattedAvailability = user.availability;
            }
          }
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            token: user.token,
            status: user.status,
            studyStyle: formattedAvailability,
            goal: user.studyGoals || "Not specified",
            bio: user.bio || "",
            studyLevel: user.studyLevel || "",
            tags: tags,
            studyLevels: studyLevels,
            profileImage: user.profilePicture || `https://placehold.co/600x800/random/white.png?text=${user.name}`
          };
        });
        
        console.log("Fetched profiles:", fetchedProfiles);
        setProfiles(fetchedProfiles);
        message.success(`Loaded ${fetchedProfiles.length} profiles`);
      } else {
        message.info("No profiles available");
        // If no profiles are returned, set some default profile to avoid breaking UI
        setProfiles([]);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
      message.error("Failed to load profiles");
      setProfiles([]);
    }
  };

  // Function to fetch current user info
  const fetchCurrentUser = async () => {
    try {
      const user = await userService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      message.error("Failed to load your profile");
    }
  };

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

    // Fetch the current user first
    fetchCurrentUser();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // This useEffect runs when currentUser changes
  useEffect(() => {
    // Only fetch users after we have the current user
    if (currentUser) {
      console.log("Current user loaded, now fetching other users");
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleFilterClick = () => {
    setFilterModalVisible(true);
  };
  
  const handleFilterSave = async (selectedCourses: number[], availability: UserAvailability | null) => {
    setFilters({
      selectedCourses,
      availability
    });
    
    try {
      if (!currentUser || currentUser.id === null) {
        console.error("Current user is not available - cannot filter properly");
        message.error("Failed to load user information");
        return;
      }
      
      message.loading("Applying filters...");
      
      // Get filtered students using the service
      const filteredStudents = await studentFilterService.getFilteredStudents(
        selectedCourses.length > 0 ? selectedCourses : undefined,
        availability ? [availability] : undefined
      );
      
      // Filter out the current user - ensure we use number comparison
      const currentUserId = Number(currentUser.id);
      const withoutCurrentUser = filteredStudents.filter(user => Number(user.id) !== currentUserId);
      console.log("Filter - current user ID:", currentUserId);
      console.log("Filter - filtered users:", withoutCurrentUser.map(u => ({ id: u.id, name: u.name })));
      
      // Update the profiles with the filtered students
      if (withoutCurrentUser && withoutCurrentUser.length > 0) {
        // Convert filtered students to profiles
        const filteredProfiles: UserProfile[] = withoutCurrentUser.map(user => {
          // Extract study goals as tags
          const tags = user.studyGoals ? 
            typeof user.studyGoals === 'string' ? 
              user.studyGoals.split(',').map(tag => tag.trim()) : 
              [user.studyGoals] : 
            [];
            
          // Convert userCourses to studyLevels format  
          let studyLevels = [];
          if (user.userCourses && user.userCourses.length > 0) {
            studyLevels = user.userCourses.map(course => ({
              subject: course.courseName || "Unknown Course",
              grade: "N/A", // Grade information isn't available in the DTO
              level: course.knowledgeLevel || "BEGINNER"
            }));
            console.log("Mapped study levels from userCourses for filtered user:", studyLevels);
          } else {
            console.log("No userCourses found for filtered user:", user.id);
            studyLevels = [];
          }
          
          // Format availability properly
          let formattedAvailability = "Not specified";
          if (user.availability) {
            switch(user.availability) {
              case "MORNING":
                formattedAvailability = "Morning";
                break;
              case "AFTERNOON":
                formattedAvailability = "Afternoon";
                break;
              case "EVENING":
                formattedAvailability = "Evening";
                break;
              default:
                formattedAvailability = user.availability;
            }
          }
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            token: user.token,
            status: user.status,
            studyStyle: formattedAvailability,
            goal: user.studyGoals || "Not specified",
            bio: user.bio || "",
            studyLevel: user.studyLevel || "",
            tags: tags,
            studyLevels: studyLevels,
            profileImage: user.profilePicture || `https://placehold.co/600x800/random/white.png?text=${user.name}`
          };
        });
        
        // Update profiles state with filtered results
        setProfiles(filteredProfiles);
        // Reset index to show the first filtered profile
        setCurrentProfileIndex(0);
        
        message.success(`Found ${filteredProfiles.length} matching students`);
      } else {
        message.info("No students match the selected filters. Try different criteria.");
        setProfiles([]);
        setCurrentProfileIndex(-1); // Ensure we show the "no matches" view
      }
      
      // Display what filters were applied
      let filterMessage = 'Filters applied: ';
      const filterParts = [];
      
      if (selectedCourses.length > 0) {
        filterParts.push(`${selectedCourses.length} courses`);
      }
      
      if (availability) {
        filterParts.push(`${availability.toLowerCase()} availability`);
      }
      
      if (filterParts.length > 0) {
        filterMessage += filterParts.join(', ');
      } else {
        filterMessage += 'None';
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
      try {
        // Use the userService from the hooks result
        const { userService } = apiService;
        if (userService) {
          // Use token-based logout instead of user ID-based logout
          await userService.logoutUserByToken();
        } else {
          console.warn("User service not available");
        }
      } catch (error) {
        console.warn("Logout API call failed, but proceeding with local logout", error);
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
    if (!currentUser || !currentProfile) return;
    
    const targetUserId = Number(currentProfile.id);
    if (isNaN(targetUserId)) {
      console.error("Invalid target user ID");
      message.error("Cannot like this user. Invalid ID.");
      return;
    }
    
    const matchData = { userId: Number(currentUser.id), targetUserId };
    try {
      const result = await matchService.processLike(matchData);
      message.success("Successfully liked the user!");
      console.log("Match result:", result);
      
      // Move to the next profile
      showNextProfile();
    } catch (error) {
      console.error("Error processing like:", error);
      message.error("Failed to process like.");
    }
  };
  
  const handleDislike = async () => {
    if (!currentUser || !currentProfile) return;
    
    const targetUserId = Number(currentProfile.id);
    if (isNaN(targetUserId)) {
      console.error("Invalid target user ID");
      message.error("Cannot dislike this user. Invalid ID.");
      return;
    }
    
    const matchData = { userId: Number(currentUser.id), targetUserId };
    try {
      await matchService.processDislike(matchData);
      message.success("Successfully disliked the user!");
      
      // Move to the next profile
      showNextProfile();
    } catch (error) {
      console.error("Error processing dislike:", error);
      message.error("Failed to process dislike.");
    }
  };
  

  const showNextProfile = () => {
    if (currentProfileIndex < profiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
    } else {
      // When we've shown all profiles, display a message that no more profiles are available
      setCurrentProfileIndex(-1); // Set to -1 to indicate no profiles to show
      message.info("You've seen all available matches!");
    }
  };

  // Get current profile to display
  const currentProfile = profiles[currentProfileIndex] || null;

  if (!currentProfile) {
    // Determine what message to show based on the situation
    let message;
    let showActions = false;
    
    if (profiles.length === 0) {
      // No profiles found (either initial load or after filtering)
      if (filters.selectedCourses.length > 0 || filters.availability) {
        // Show this message when filters returned no results
        message = "No students match your filters. Try different filter criteria.";
        showActions = true;
      } else {
        // Initial loading or no users in the system
        message = "Loading profiles...";
      }
    } else if (currentProfileIndex === -1) {
      // User has seen all available profiles
      message = "You've seen all potential matches! Change your filters or wait for new users to join.";
      showActions = true;
    }
      
    return (
      <App>
        {contextHolder}
        <div className={`${backgroundStyles.loginBackground}`}>
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
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: 'calc(100vh - 80px)',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '20px' }}>{message}</div>
              
              {showActions && (
                <div>
                  <button 
                    className={styles.actionButton}
                    style={{ marginRight: '10px' }}
                    onClick={handleFilterClick}
                  >
                    Change Filters
                  </button>
                  <button 
                    className={styles.actionButton}
                    onClick={() => {
                      // Reset filters
                      setFilters({
                        selectedCourses: [],
                        availability: null
                      });
                      fetchUsers();
                      setCurrentProfileIndex(0);
                    }}
                  >
                    Refresh Users
                  </button>
                </div>
              )}
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

                {/* Study Level */}
                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Study Level</div>
                  <div className={styles.detailsValue}>{currentProfile.studyLevel || "Not specified"}</div>
                </div>

                {/* Availability */}
                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Availability</div>
                  <div className={styles.detailsValue}>{currentProfile.studyStyle}</div>
                </div>

                {/* Goal */}
                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Goal</div>
                  <div className={styles.detailsValue}>{currentProfile.goal}</div>
                </div>
                
                {/* Bio */}
                {currentProfile.bio && (
                  <div className={styles.cardSection}>
                    <div className={styles.detailsLabel}>Bio</div>
                    <div className={styles.detailsValue}>{currentProfile.bio}</div>
                  </div>
                )}

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
                  onClick={() => handleDislike()}
                >
                  <span className={styles.buttonIcon}>✕</span>
                  <span>Dislike</span>
                </button>
                <button
                  className={`${styles.actionButton} ${styles.likeButton}`}
                  onClick={() => handleLike()}
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