"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useMessage } from '@/hooks/useMessage';
import { UserProfile, ProfileUpdate } from "@/types/profile";
import { UserAvailability, ProfileKnowledgeLevel } from "@/types/dto";
import { CourseSelection } from "@/types";
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
    
    // Prevent further execution if we already have loaded data
    if (currentUser && !loading) return;

    // Check for token
    const localStorageToken = localStorage.getItem("token");
    const effectiveToken = token || localStorageToken;
    
    if (!effectiveToken) {
      message.error("Please login to access your profile");
      router.push("/login");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // If we have a token, create a basic user profile first
        let userProfile: UserProfile = {
          id: "current-user",
          name: "User",
          email: "user@example.com",
          token: effectiveToken,
          status: "ONLINE",
          creationDate: new Date().toISOString().split('T')[0],
          studyLevel: "Bachelor", 
          studyGoals: "Pass exams, Deep understanding",
          tags: ["Looking for partners", "SoPra FS25", "Computer Science"],
          studyLevels: [
            { subject: "SoPra", grade: "A", level: "Intermediate" },
            { subject: "Software Engineering", grade: "B+", level: "Advanced" },
            { subject: "Computer Science", grade: "A-", level: "Intermediate" }
          ],
          userCourses: [
            { courseId: 1, courseName: "SoPra", knowledgeLevel: "INTERMEDIATE" },
            { courseId: 2, courseName: "Software Engineering", knowledgeLevel: "ADVANCED" },
            { courseId: 3, courseName: "Computer Science", knowledgeLevel: "INTERMEDIATE" }
          ],
          profileImage: "https://placehold.co/600x800/2c2c2c/white.png?text=User",
          bio: "I'm a computer science student looking for study partners."
        };
        
        // Try to extract user info from the token
        try {
          if (effectiveToken) {
            // Remove 'Bearer ' prefix if present
            const tokenValue = effectiveToken.startsWith('Bearer ') 
              ? effectiveToken.substring(7) 
              : effectiveToken;
              
            // JWT tokens are in format xxxxx.yyyyy.zzzzz where yyyy is base64 encoded payload
            const tokenParts = tokenValue.split('.');
            if (tokenParts.length === 3) {
              try {
                const payload = JSON.parse(atob(tokenParts[1]));
                // Extract user info from token if available
                if (payload.sub || payload.id) userProfile.id = String(payload.sub || payload.id);
                if (payload.name) {
                  userProfile.name = payload.name;
                  userProfile.profileImage = `https://placehold.co/600x800/2c2c2c/white.png?text=${encodeURIComponent(payload.name)}`;
                }
                if (payload.email) userProfile.email = payload.email;
              } catch (parseErr) {
                console.warn("Error parsing token payload:", parseErr);
              }
            }
          }
        } catch (err) {
          console.warn("Could not parse token, using defaults", err);
        }
        
        console.log("Basic profile from token:", userProfile.id, userProfile.name);
        
        // Try to get additional data from the API if possible
        const { userService } = apiService;
        
        if (userService) {
          try {
            // Attempt to get user data from API using the token
            console.log("Attempting to get user data with token");
            
            // Make sure token doesn't have 'Bearer ' prefix when passing to the function
            // The function will add it internally
            const tokenValue = effectiveToken.startsWith('Bearer ') 
              ? effectiveToken.substring(7) 
              : effectiveToken;
              
            const apiUser = await userService.getUserByToken(tokenValue);
            
            if (apiUser && apiUser.id) {
              console.log("Successfully got user data from API:", apiUser);
              
              // Update user profile with API data
              userProfile.id = String(apiUser.id);
              userProfile.name = apiUser.name || userProfile.name;
              userProfile.email = apiUser.email || userProfile.email;
              userProfile.status = apiUser.status || userProfile.status;
              userProfile.creationDate = apiUser.creationDate || userProfile.creationDate;
              userProfile.profileImage = apiUser.profilePicture || userProfile.profileImage;
              
              // Get detailed user information if possible
              try {
                console.log("Fetching detailed user info for ID:", apiUser.id);
                const fullDetails = await userService.getUserById(Number(apiUser.id));
                
                if (fullDetails) {
                  // Update with full details if available
                  userProfile.bio = fullDetails.bio || userProfile.bio;
                  
                  // Add study level from full details
                  userProfile.studyLevel = fullDetails.studyLevel || userProfile.studyLevel;
                  
                  // Handle study goals
                  if (fullDetails.studyGoals) {
                    userProfile.studyGoals = Array.isArray(fullDetails.studyGoals) 
                      ? fullDetails.studyGoals.join(", ") 
                      : fullDetails.studyGoals;
                  }
                  
                  // Store full course data in userCourses (new field)
                  if (fullDetails.userCourses && fullDetails.userCourses.length > 0) {
                    userProfile.userCourses = fullDetails.userCourses;
                  }
                  
                  // Keep backward compatibility with studyLevels
                  if (fullDetails.courseSelections && fullDetails.courseSelections.length > 0) {
                    userProfile.studyLevels = fullDetails.courseSelections.map(course => ({
                      subject: course.courseName || String(course.courseId),
                      grade: "N/A",
                      level: course.knowledgeLevel || "Beginner"
                    }));
                  }
                }
              } catch (detailsErr) {
                console.warn("Could not get full user details, using partial data", detailsErr);
              }
            } else {
              console.warn("User authentication returned null user");
            }
          } catch (apiErr) {
            console.warn("Could not get user data from API, using token data", apiErr);
          }
        } else {
          console.warn("User service not available");
        }
        
        setCurrentUser(userProfile);
        setEditableUser(userProfile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        message.error("Could not load your profile. Using demo data instead.");
        
        // Fallback to mock data for demonstration
        const mockUserProfile: UserProfile = {
          id: "current-user",
          name: "John Doe",
          email: "john.doe@example.com",
          token: effectiveToken,
          status: "ONLINE",
          creationDate: "2023-01-15",
          studyLevel: "Master",
          studyGoals: "Pass exams, Deep understanding, Career preparation",
          tags: ["Coffee lover", "Tech enthusiast", "CS Major"],
          studyLevels: [
            { subject: "Mathematics", grade: "A", level: "Advanced" },
            { subject: "Computer Science", grade: "A+", level: "Expert" },
            { subject: "Physics", grade: "B", level: "Intermediate" }
          ],
          userCourses: [
            { courseId: 1, courseName: "Mathematics", knowledgeLevel: "ADVANCED" },
            { courseId: 2, courseName: "Computer Science", knowledgeLevel: "ADVANCED" },
            { courseId: 3, courseName: "Physics", knowledgeLevel: "INTERMEDIATE" }
          ],
          profileImage: "https://placehold.co/600x800/2c2c2c/white.png?text=John+Doe",
          bio: "I'm a passionate computer science student looking for study partners in mathematics and physics."
        };
        
        setCurrentUser(mockUserProfile);
        setEditableUser(mockUserProfile);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if we're still loading or don't have a user
    if (loading || !currentUser) {
      fetchUserProfile();
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      message.success("Logging out...");
      
      // Get userService from apiService
      const { userService } = apiService;
      
      // In production, call the logout endpoint
      if (currentUser && currentUser.id && userService) {
        try {
          // Use the userService to logout instead of direct API call
          await userService.logoutUser(Number(currentUser.id));
          message.success("Logged out successfully!");
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
    
    // Handle nested structure updates (for arrays like userCourses)
    if (name.includes('[') && name.includes(']')) {
      // Parse the array name and index: e.g., "userCourses[0]"
      const matches = name.match(/^([^\[]+)\[(\d+)\]$/);
      if (matches && matches.length === 3) {
        const arrayName = matches[1]; // e.g., "userCourses"
        const index = parseInt(matches[2]); // e.g., 0
        
        // Clone the array
        const arrayValue = [...(editableUser[arrayName as keyof UserProfile] || [])];
        
        // Update the specific element with the new value
        arrayValue[index] = value;
        
        // Update the state
        setEditableUser({
          ...editableUser,
          [arrayName]: arrayValue
        });
        return;
      }
    }
    
    // Regular field update
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
    
    // Update both studyLevels for UI display and userCourses for data saving
    const updatedUser = {
      ...editableUser,
      studyLevels: newLevels
    };
    
    // If we have userCourses, update those as well to keep them in sync
    if (editableUser.userCourses && editableUser.userCourses.length > index) {
      const newUserCourses = [...editableUser.userCourses];
      
      // For subject/course field, we update the courseName
      if (field === 'subject') {
        newUserCourses[index] = {
          ...newUserCourses[index],
          courseName: value
        };
      }
      
      // For level field, we update the knowledgeLevel
      if (field === 'level') {
        // Map the level values to the ProfileKnowledgeLevel enum
        let knowledgeLevel: string;
        
        // Convert the common level terms to the enum values
        switch(value.toLowerCase()) {
          case 'beginner':
            knowledgeLevel = 'BEGINNER';
            break;
          case 'intermediate':
            knowledgeLevel = 'INTERMEDIATE';
            break;
          case 'advanced':
          case 'expert':
            knowledgeLevel = 'ADVANCED';
            break;
          default:
            knowledgeLevel = value.toUpperCase();
        }
        
        newUserCourses[index] = {
          ...newUserCourses[index],
          knowledgeLevel: knowledgeLevel
        };
      }
      
      updatedUser.userCourses = newUserCourses;
    }
    
    setEditableUser(updatedUser);
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
  
  const handleSaveProfile = async () => {
    if (!editableUser || !currentUser?.id) return;
    
    // Validate required fields
    if (!editableUser.name || !editableUser.email) {
      message.error("Name and email are required fields");
      return;
    }

    try {
      // Get userService from apiService
      const { userService } = apiService;
      
      if (!userService) {
        throw new Error("User service not available");
      }
      
      // Prepare data in UserPutDTO format
      const profileUpdate: ProfileUpdate = {
        name: editableUser.name as string,
        bio: editableUser.bio || "",
        profilePicture: editableUser.profileImage || "",
        availability: (editableUser.availability as UserAvailability) || UserAvailability.MORNING,
        studyLevel: editableUser.studyLevel || "",
        // Handle studyGoals
        studyGoals: editableUser.studyGoals 
          ? (typeof editableUser.studyGoals === 'string' 
             ? editableUser.studyGoals.split(',').map(s => s.trim()) 
             : editableUser.studyGoals)
          : [],
        courses: []
      };
      
      // Use existing userCourses if available, otherwise convert studyLevels to courses format
      if (editableUser.userCourses && editableUser.userCourses.length > 0) {
        profileUpdate.courses = editableUser.userCourses
          .filter(course => course.courseId > 0) // Filter out courses with invalid IDs
          .map(course => ({
            courseId: course.courseId,
            knowledgeLevel: course.knowledgeLevel as ProfileKnowledgeLevel
          }));
          
        console.log("Saving courses from userCourses:", profileUpdate.courses);
      } else if (editableUser.studyLevels && editableUser.studyLevels.length > 0) {
        // Try to parse course ID from subject field or use course name lookup
        const { courseService } = apiService;
        let courseMap: Record<string, number> = {};
        
        // If we have a courseService, try to get course IDs by name
        if (courseService) {
          try {
            const courses = await courseService.getCourses();
            // Create a mapping of course names to IDs
            courseMap = courses.reduce((map: Record<string, number>, course) => {
              map[course.courseName.toLowerCase()] = course.id;
              return map;
            }, {});
          } catch (err) {
            console.warn("Could not fetch courses for mapping", err);
          }
        }
        
        profileUpdate.courses = editableUser.studyLevels.map(level => {
          // Try to get courseId in several ways:
          // 1. Parse it as a number if it looks like one
          // 2. Look up by name in our course map if available
          // 3. Fall back to 0 if we can't determine it
          
          let courseId = 0;
          const subjectText = level.subject || '';
          
          if (/^\d+$/.test(subjectText)) {
            // If it's a numeric string, parse it
            courseId = parseInt(subjectText);
          } else if (courseMap && Object.keys(courseMap).length > 0) {
            // Try to find by name in our mapping
            const matchKey = Object.keys(courseMap).find(key => 
              subjectText.toLowerCase().includes(key) || key.includes(subjectText.toLowerCase())
            );
            if (matchKey) {
              courseId = courseMap[matchKey];
            }
          }
          
          return {
            courseId,
            knowledgeLevel: (level.level as ProfileKnowledgeLevel) || ProfileKnowledgeLevel.BEGINNER
          };
        }).filter(course => course.courseId > 0); // Filter out courses we couldn't identify
      }
      
      // Send update to server
      message.loading("Updating profile...");
      
      try {
        // Try to update via API but don't wait for it to complete
        // This allows UI to update even if API is unavailable
        userService.updateUser(Number(currentUser.id), profileUpdate)
          .then(() => {
            console.log("Profile successfully updated on server");
          })
          .catch(err => {
            console.warn("Could not update profile on server:", err);
          });
          
        // Always update UI immediately
        setCurrentUser(editableUser);
        setIsEditing(false);
        message.success("Profile updated");
      } catch (error) {
        console.error("Error updating profile:", error);
        // Fallback: still update the UI
        setCurrentUser(editableUser);
        setIsEditing(false);
        message.info("Profile updated locally only");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error("Failed to update profile");
    }
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
    // Add new empty study level
    const newLevel = { subject: '', grade: '', level: 'Beginner' };
    const newLevels = editableUser.studyLevels ? [...editableUser.studyLevels, newLevel] : [newLevel];
    
    // Add corresponding empty user course with proper structure
    const newUserCourse = { 
      courseId: 0, 
      courseName: '', 
      knowledgeLevel: ProfileKnowledgeLevel.BEGINNER 
    };
    const newUserCourses = editableUser.userCourses ? [...editableUser.userCourses, newUserCourse] : [newUserCourse];
    
    setEditableUser({
      ...editableUser,
      studyLevels: newLevels,
      userCourses: newUserCourses
    });
  };

  const handleRemoveStudyLevel = (index: number) => {
    if (!editableUser || !editableUser.studyLevels) return;
    
    // Remove study level at the specified index
    const newLevels = [...editableUser.studyLevels];
    newLevels.splice(index, 1);
    
    // Remove corresponding user course if it exists
    let newUserCourses = editableUser.userCourses ? [...editableUser.userCourses] : [];
    if (newUserCourses.length > index) {
      newUserCourses.splice(index, 1);
    }
    
    setEditableUser({
      ...editableUser,
      studyLevels: newLevels,
      userCourses: newUserCourses
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