"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useMessage } from '@/hooks/useMessage';
import { UserProfile } from "@/types/profile";
import { User, UserCourse, CourseSelection } from "@/types/user";
import Link from "next/link";
import Logo from "@/components/Logo";
import { UserOutlined, MessageOutlined, FilterOutlined, LogoutOutlined, DeleteOutlined } from "@ant-design/icons";
import styles from "@/styles/profile.module.css";
import mainStyles from "@/styles/main.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import ProfileContent from "@/components/profile";
import { App, Button, Modal } from 'antd';

const ProfilePage = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const { message, contextHolder, modal } = useMessage();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [editableUser, setEditableUser] = useState<UserProfile | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Array<{id: number, courseName: string}>>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  
  // Create ref at component level, not inside useEffect
  const isFetching = useRef(false);

  // Fetch user data and courses
  useEffect(() => {
    let isActive = true; // Flag to track if component is mounted
    
    const fetchData = async () => {
      // If already fetching, don't trigger another fetch
      if (isFetching.current) return;
      
      try {
        // Set fetching flag
        isFetching.current = true;
        
        // Check if we're in browser environment
        if (typeof window === 'undefined') return;

        // Check for token
        const localStorageToken = localStorage.getItem("token");
        const effectiveToken = token || localStorageToken;
        
        console.log("Profile token check:", !!effectiveToken);
        if (effectiveToken) {
          // Log just the first 12 chars for security 
          console.log("Token (first 12 chars):", effectiveToken.substring(0, 12) + "...");
        }
        
        if (!effectiveToken) {
          message.error("Please login to access your profile");
          router.push("/login");
          return;
        }

        setLoading(true);

        // Get any navigation context
        const isNavigationFromMain = localStorage.getItem("navigatingToProfile") === "true";
        if (isNavigationFromMain) {
          // Clear the flag
          localStorage.removeItem("navigatingToProfile");
          console.log("Navigation from main page detected");
        }

        // Fetch current user profile
        try {
          console.log("Fetching user profile from /users/me");
          
          // Use cached user data on navigation within app if available
          const cachedUserData = localStorage.getItem("cachedUserProfile");
          let meResponse: UserProfile | null = null;
          
          // Try to use cached data first if coming from navigation
          if (isNavigationFromMain && cachedUserData) {
            try {
              meResponse = JSON.parse(cachedUserData);
              console.log("Using cached profile data from navigation");
            } catch (cacheError) {
              console.error("Error parsing cached profile:", cacheError);
            }
          }
          
          // If we don't have a valid cached profile, fetch from API
          if (!meResponse) {
            meResponse = await apiService.get<UserProfile>('/users/me');
          }
          console.log("Response from /users/me:", meResponse);
          
          if (!meResponse) {
            throw new Error("Empty response when fetching user profile");
          }
          
          console.log("Processing user response:", meResponse);
          
          // Process the profile data for client use
          const processedProfile = processProfileResponse(meResponse);
          
          console.log("Setting current user with processed profile:", processedProfile);
          
          // Store the processed profile in localStorage for future quick access
          localStorage.setItem("cachedUserProfile", JSON.stringify(processedProfile));
          
          // Check if component is still mounted before updating state
          if (isActive) {
            setCurrentUser(processedProfile);
            setEditableUser({...processedProfile});
            setLoading(false);
            
            // Store the user ID in localStorage for future reference
            if (processedProfile?.id) {
              localStorage.setItem("userId", processedProfile.id.toString());
              console.log("Stored user ID in localStorage:", processedProfile.id);
            } else {
              console.warn("User ID is missing in the response");
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          
          // Try to use cached profile as fallback
          try {
            const cachedUserData = localStorage.getItem("cachedUserProfile");
            if (cachedUserData && isActive) {
              console.log("Using cached profile data");
              const cachedProfile = JSON.parse(cachedUserData) as UserProfile;
              setCurrentUser(cachedProfile);
              setEditableUser({...cachedProfile});
              setLoading(false);
              return;
            }
          } catch (cacheError) {
            console.error("Error using cached profile:", cacheError);
          }
          
          message.error("Could not retrieve your profile. Please log in again.");
          
          if (isActive) {
            // Clear tokens and redirect to login
            localStorage.removeItem("token");
            clearToken();
            router.push("/login");
            setLoading(false);
          }
        }

        // Fetch available courses
        try {
          console.log("Fetching available courses");
          const coursesResponse = await apiService.get<Array<{id: number, courseName: string}>>('/courses');
          console.log("Courses response:", coursesResponse);
          
          if (coursesResponse && isActive) {
            console.log("Setting available courses:", coursesResponse.length);
            setAvailableCourses(coursesResponse);
          }
        } catch (error) {
          console.error("Error fetching courses:", error);
          // We'll handle this silently without showing a warning to the user
        }
      } catch (error) {
        console.error("Error in data fetching:", error);
        if (isActive) {
          setLoading(false);
        }
      } finally {
        // Clear fetching flag
        isFetching.current = false;
      }
    };

    // Execute fetch immediately
    fetchData();
    
    // Cleanup function to prevent memory leaks and state updates after unmount
    return () => {
      isActive = false; // Mark component as unmounted
    };
    
    // Dependencies: only re-run if these change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Helper function to fetch user profile by ID and format data for client use
   * @param userId - The ID of the user to fetch
   * @returns Formatted UserProfile with client-friendly data structures
   */
  const fetchUserProfileById = async (userId: string) => {
    try {
      const profileResponse = await apiService.get<UserProfile>(`/users/${userId}`);
      
      if (profileResponse) {
        // Process the profile response for client use
        const processedProfile = processProfileResponse(profileResponse);
        return processedProfile;
      } else {
        throw new Error("Empty response when fetching user profile");
      }
    } catch (error) {
      console.error("Error in fetchUserProfileById:", error);
      throw error;
    }
  }
  
  /**
   * Process profile response from server to make it suitable for client use
   * Handles data format conversions (e.g., comma-separated string to array)
   * @param profile - The raw profile data from the server
   * @returns Processed profile with client-friendly data structures
   */
  const processProfileResponse = (profile: UserProfile): UserProfile => {
    const processedProfile = {...profile};
    
    // Convert studyGoals from comma-separated string to array for UI
    if (profile.studyGoals) {
      processedProfile.formattedStudyGoals = profile.studyGoals
        .split(',')
        .map(goal => goal.trim())
        .filter(goal => goal !== ''); // Filter out empty values
    } else {
      processedProfile.formattedStudyGoals = [];
    }
    
    // Ensure userCourses is always an array
    if (!processedProfile.userCourses) {
      processedProfile.userCourses = [];
    }
    
    // Set default values for required fields if missing
    if (!processedProfile.availability) {
      processedProfile.availability = 'WEEKDAYS';
    }
    
    if (!processedProfile.knowledgeLevel) {
      processedProfile.knowledgeLevel = 'INTERMEDIATE';
    }
    
    return processedProfile;
  }

  const handleLogout = async () => {
    try {
      message.loading("Logging out...");
      // Call the logout endpoint
      if (currentUser && currentUser.id) {
        try {
          await apiService.post(`/users/${currentUser.id}/logout`, {});
        } catch (error) {
          console.warn("Logout API call failed, but proceeding with local logout", error);
        }
      }
      
      // Clear token and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      clearToken();
      
      // Use window.location for a hard refresh to ensure clean state
      window.location.href = "/login";
    } catch (error) {
      console.error("Error during logout:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
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

  const handleSelectChange = (name: string, value: string | string[]) => {
    if (!editableUser) return;
    
    if (name === 'studyGoals') {
      // For study goals, store both the formatted array for UI and the string version for API
      // Server expects an array in UserPostDTO, which its mapper will convert to a comma-separated string
      setEditableUser({
        ...editableUser,
        formattedStudyGoals: value as string[],
        studyGoals: (value as string[]).join(', ') // This is for display only
      });
    } else if (name === 'availability' || name === 'knowledgeLevel') {
      // These are required by the server validation
      setEditableUser({
        ...editableUser,
        [name]: value
      });
    } else {
      setEditableUser({
        ...editableUser,
        [name]: value
      });
    }
  };

  const handleCourseChange = (index: number, field: 'courseId' | 'knowledgeLevel', value: any) => {
    if (!editableUser || !editableUser.userCourses) return;
    
    const newCourses = [...editableUser.userCourses];
    
    // Handle course ID change (need to find course name too)
    if (field === 'courseId') {
      const courseId = Number(value);
      const selectedCourse = availableCourses.find(c => c.id === courseId);
      
      newCourses[index] = {
        ...newCourses[index],
        courseId,
        courseName: selectedCourse?.courseName || ''
      };
    } else {
      // Handle knowledge level change
      newCourses[index] = {
        ...newCourses[index],
        [field]: value
      };
    }
    
    setEditableUser({
      ...editableUser,
      userCourses: newCourses
    });
  };

  const handleAddCourse = () => {
    if (!editableUser) return;
    
    const newCourse: UserCourse = {
      courseId: undefined,
      courseName: '',
      knowledgeLevel: 'BEGINNER'
    };
    
    const newCourses = editableUser.userCourses ? 
      [...editableUser.userCourses, newCourse] : 
      [newCourse];
    
    setEditableUser({
      ...editableUser,
      userCourses: newCourses
    });
  };

  const handleRemoveCourse = (index: number) => {
    if (!editableUser || !editableUser.userCourses) return;
    
    const newCourses = [...editableUser.userCourses];
    newCourses.splice(index, 1);
    
    setEditableUser({
      ...editableUser,
      userCourses: newCourses
    });
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg, image/png, image/jpg, image/gif';
    
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        
        // Validate file size (max 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (file.size > maxSize) {
          message.error("Profile image must be less than 2MB");
          return;
        }
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
          message.error("Only JPEG, PNG, and GIF images are allowed");
          return;
        }
        
        try {
          // Show loading message
          message.loading("Processing image...");
          
          // Read file as data URL
          const reader = new FileReader();
          reader.onload = async (event) => {
            if (event.target && event.target.result && editableUser) {
              const dataUrl = event.target.result.toString();
              
              // Check if data URL is too large for the server (adjust limit as needed)
              // Base64 encoding increases size by about 33%
              if (dataUrl.length > maxSize * 1.33) {
                message.error("Encoded image is too large. Please choose a smaller image.");
                return;
              }
              
              // Set to state for immediate visual feedback
              setEditableUser({
                ...editableUser,
                profilePicture: dataUrl
              });
              
              message.success("Profile photo updated. Don't forget to save your profile!");
            }
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error("Error uploading image:", error);
          message.error("Failed to upload profile picture");
        }
      }
    };
    
    input.click();
  };
  
  const handleSaveProfile = async () => {
    if (!editableUser || !currentUser || !currentUser.id) return;
    
    try {
      // Comprehensive validation for all required fields
      const validationErrors = [];
      
      // Validate name
      if (!editableUser.name || editableUser.name.trim() === '') {
        validationErrors.push("Name is required");
      }
      
      // Validate study goals
      if (!editableUser.formattedStudyGoals || editableUser.formattedStudyGoals.length === 0) {
        validationErrors.push("Study goals are required");
      }
      
      // Validate study level
      if (!editableUser.studyLevel || editableUser.studyLevel.trim() === '') {
        validationErrors.push("Study level is required");
      }
      
      // Validate availability
      if (!editableUser.availability) {
        validationErrors.push("Availability is required");
      }
      
      // Validate knowledge level
      if (!editableUser.knowledgeLevel) {
        validationErrors.push("Knowledge level is required");
      }
      
      // Validate course selections
      if (!editableUser.userCourses || editableUser.userCourses.length === 0) {
        validationErrors.push("At least one course selection is required");
      } else {
        // Check if all courses have valid IDs
        const invalidCourses = editableUser.userCourses.filter(course => !course.courseId);
        if (invalidCourses.length > 0) {
          validationErrors.push("All courses must have a valid selection");
        }
      }
      
      // If validation errors exist, show the first one and return
      if (validationErrors.length > 0) {
        message.error(validationErrors[0]);
        return;
      }
      
      // Birthday validation (if provided)
      if (editableUser.birthday) {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(editableUser.birthday)) {
          message.error("Birthday must be in YYYY-MM-DD format");
          return;
        }
        
        const birthdayDate = new Date(editableUser.birthday);
        const today = new Date();
        if (isNaN(birthdayDate.getTime())) {
          message.error("Invalid birthday date");
          return;
        }
        if (birthdayDate > today) {
          message.error("Birthday cannot be in the future");
          return;
        }
      }
      
      // Show confirmation dialog before saving
      modal.confirm({
        title: 'Save Profile Changes',
        content: 'Are you sure you want to save these profile changes?',
        onOk: async () => {
          try {
            // Prepare the payload based on server expectations
            const payload = {
              // Do not include email as it shouldn't be changed via profile update
              name: editableUser.name,
              studyLevel: editableUser.studyLevel,
              studyStyle: editableUser.studyStyle,
              // Server expects studyGoals as array
              studyGoals: editableUser.formattedStudyGoals, 
              bio: editableUser.bio || "",
              profilePicture: editableUser.profilePicture,
              birthday: editableUser.birthday,
              // Required fields from server validation
              availability: editableUser.availability,
              knowledgeLevel: editableUser.knowledgeLevel,
              // Format courseSelections as expected by server
              courseSelections: editableUser.userCourses
                .filter(course => course.courseId) // Filter out any without courseId
                .map(course => ({
                  courseId: course.courseId as number,
                  knowledgeLevel: course.knowledgeLevel
                }))
            };
            
            // Save profile to the server
            message.loading("Saving profile...");
            await apiService.put(`/users/${currentUser.id}`, payload);
            
            // Fetch the updated profile to ensure we display the latest data
            const updatedProfile = await fetchUserProfileById(currentUser.id.toString());
            setCurrentUser(updatedProfile);
            setEditableUser({...updatedProfile});
            
            // Update the cache with the new profile data
            localStorage.setItem("cachedUserProfile", JSON.stringify(updatedProfile));
            
            setIsEditing(false);
            message.success("Profile updated successfully");
          } catch (error: any) {
            handleProfileUpdateError(error);
          }
        }
      });
    } catch (error: any) {
      handleProfileUpdateError(error);
    }
  };
  
  // Helper function to handle profile update errors consistently
  const handleProfileUpdateError = (error: any) => {
    console.error("Error saving profile:", error);
    
    // Handle specific error cases based on HTTP status codes
    const errorMessage = error?.message || "";
    
    if (errorMessage.includes("400")) {
      // Handle validation errors
      if (errorMessage.toLowerCase().includes("availability")) {
        message.error("Availability status is required");
      } else if (errorMessage.toLowerCase().includes("knowledge level")) {
        message.error("Knowledge level is required");
      } else if (errorMessage.toLowerCase().includes("study goals")) {
        message.error("Study goals are required");
      } else if (errorMessage.toLowerCase().includes("study level")) {
        message.error("Study level is required");
      } else if (errorMessage.toLowerCase().includes("courses")) {
        message.error("At least one course selection is required");
      } else {
        message.error("Invalid input: Please check all required fields");
      }
    } else if (errorMessage.includes("401")) {
      message.error("Authentication error: Please log in again");
      setTimeout(() => {
        localStorage.removeItem("token");
        clearToken();
        router.push("/login");
      }, 1500);
    } else if (errorMessage.includes("403")) {
      message.error("You are not authorized to update this profile");
    } else {
      message.error("Failed to update profile. Please try again.");
    }
  };

  const handleShowDeleteModal = () => {
    setDeleteModalVisible(true);
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
  };

  const handleConfirmDelete = async () => {
    if (!currentUser || !currentUser.id) return;
    
    try {
      message.loading("Deleting account...");
      await apiService.delete(`/users/${currentUser.id}`);
      
      // Clear token and local storage
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      clearToken();
      
      message.success("Your account has been deleted");
      setDeleteModalVisible(false);
      
      // Redirect to login page
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      console.error("Error deleting account:", error);
      message.error("Failed to delete account. Please try again.");
      setDeleteModalVisible(false);
    }
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
    <App>
      {contextHolder}
      <div className={backgroundStyles.loginBackground}>
        <div className={styles.profileContainer}>
          {header}
          <ProfileContent
            currentUser={currentUser}
            editableUser={editableUser}
            availableCourses={availableCourses}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
            onImageUpload={handleImageUpload}
            onInputChange={handleInputChange}
            onSelectChange={handleSelectChange}
            onCourseChange={handleCourseChange}
            onAddCourse={handleAddCourse}
            onRemoveCourse={handleRemoveCourse}
            onDeleteAccount={handleShowDeleteModal}
          />
          
          {/* Delete Account Button */}
          <div className={styles.deleteAccountContainer}>
            <Button 
              danger 
              type="primary" 
              icon={<DeleteOutlined />} 
              onClick={handleShowDeleteModal}
            >
              Delete Account
            </Button>
          </div>
          
          {/* Delete Account Confirmation Modal */}
          <Modal
            title="Delete Account"
            open={deleteModalVisible}
            onOk={handleConfirmDelete}
            onCancel={handleCancelDelete}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
            <p>All your data will be permanently removed.</p>
          </Modal>
        </div>
      </div>
    </App>
  );
};

export default ProfilePage;