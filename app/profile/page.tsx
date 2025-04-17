"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useMessage } from '@/hooks/useMessage';
import { UserProfile } from "@/types/profile";
import { UserAvailability, ProfileKnowledgeLevel, UserPutDTO } from "@/types/dto";
import Link from "next/link";
import Logo from "@/components/Logo";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import { UserOutlined, MessageOutlined, FilterOutlined, LogoutOutlined } from "@ant-design/icons";
import { Modal, Upload, message as antdMessage } from "antd";
import { RcFile, UploadProps } from "antd/es/upload";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string>("");

  const isAdmin = (email: string | undefined): boolean => email === "admin@example.com";

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const localStorageToken = localStorage.getItem("token");
        const effectiveToken = token || localStorageToken;
        if (!effectiveToken) {
          message.error("Please login to access your profile");
          router.push("/login");
          return;
        }

        const { userService } = apiService;
        if (!userService) return;
        const tokenValue = effectiveToken.startsWith('Bearer ') ? effectiveToken.substring(7) : effectiveToken;
        const apiUser = await userService.getUserByToken(tokenValue);

        if (!apiUser || !apiUser.id) return;
        const fullDetails = await userService.getUserById(Number(apiUser.id));
        if (!fullDetails) return;

        const userProfile: UserProfile = {
          ...apiUser,
          ...fullDetails,
          token: effectiveToken,
          studyGoals: Array.isArray(fullDetails.studyGoals) ? fullDetails.studyGoals.join(", ") : fullDetails.studyGoals,
          studyLevels: fullDetails.userCourses?.map(course => ({
            subject: course.courseName || String(course.courseId),
            grade: "N/A",
            level: course.knowledgeLevel || "Beginner"
          })) || [],
          userCourses: fullDetails.userCourses || []
        };

        setCurrentUser(userProfile);
        setEditableUser(userProfile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        message.error("Could not load your profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editableUser) return;
    const { name, value } = e.target;
    setEditableUser({ ...editableUser, [name]: value });
  };

  const handleTagChange = (index: number, value: string) => {
    if (!editableUser?.tags) return;
    const tags = [...editableUser.tags];
    tags[index] = value;
    setEditableUser({ ...editableUser, tags });
  };

  const handleAddStudyLevel = () => {
    if (!editableUser) return;
  
    const newStudyLevel = { subject: '', grade: '', level: 'Beginner' };
    const newUserCourse = {
      courseId: 0,
      courseName: '',
      knowledgeLevel: ProfileKnowledgeLevel.BEGINNER // <-- required
    };
  
    setEditableUser({
      ...editableUser,
      studyLevels: [...(editableUser.studyLevels || []), newStudyLevel],
      userCourses: [...(editableUser.userCourses || []), newUserCourse]
    });
  };
  
  const handleStudyLevelChange = (index: number, field: 'subject' | 'grade' | 'level', value: string) => {
    if (!editableUser?.studyLevels) return;
    const newLevels = [...editableUser.studyLevels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    const newUserCourses = [...(editableUser.userCourses || [])];
    if (field === 'level') {
      let knowledgeLevel: ProfileKnowledgeLevel = ProfileKnowledgeLevel.BEGINNER;
      if (value.toLowerCase() === 'intermediate') knowledgeLevel = ProfileKnowledgeLevel.INTERMEDIATE;
      else if (["advanced", "expert"].includes(value.toLowerCase())) knowledgeLevel = ProfileKnowledgeLevel.ADVANCED;
      newUserCourses[index] = { ...newUserCourses[index], knowledgeLevel };
    }
    setEditableUser({ ...editableUser, studyLevels: newLevels, userCourses: newUserCourses });
  };

  const handleAddTag = () => {
    if (!editableUser) return;
    const tags = [...(editableUser.tags || []), ""];
    setEditableUser({ ...editableUser, tags });
  };
  
  const handleRemoveStudyLevel = (index: number) => {
    if (!editableUser) return;
  
    const studyLevels = [...(editableUser.studyLevels || [])];
    const userCourses = [...(editableUser.userCourses || [])];
  
    studyLevels.splice(index, 1);
    userCourses.splice(index, 1);
  
    setEditableUser({ ...editableUser, studyLevels, userCourses });
  };
  
  const handleRemoveTag = (index: number) => {
    if (!editableUser?.tags) return;
    const tags = [...editableUser.tags];
    tags.splice(index, 1);
    setEditableUser({ ...editableUser, tags });
  };

  const validateProfile = () => {
    if (!editableUser) return null;

    const errors = [];
    
    // Check name
    if (!editableUser.name?.trim()) {
      errors.push('Name is required');
    }

    // Check study level
    if (!editableUser.studyLevel?.trim()) {
      errors.push('Study Level is required');
    }

    // Check study goals
    const studyGoals = typeof editableUser.studyGoals === 'string'
      ? editableUser.studyGoals.split(',').map(g => g.trim()).filter(Boolean)
      : editableUser.studyGoals || [];
    
    if (!studyGoals.length) {
      errors.push('At least one Study Goal is required');
    }

    // Check availability
    if (!editableUser.availability) {
      errors.push('Availability is required');
    }

    // Check courses
    const validCourses = (editableUser.userCourses || []).filter(c => c.courseId !== 0);
    if (!validCourses.length) {
      errors.push('At least one Course is required');
    }

    return errors.length ? errors : null;
  };

  const handleSaveProfile = async () => {
    if (!editableUser || !currentUser?.id) return;
    const { userService } = apiService;
    if (!userService) return;

    // Validate all required fields
    const validationErrors = validateProfile();
    if (validationErrors) {
      message.error(
        <div>
          <div>Please fix the following errors:</div>
          <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      );
      return;
    }
  
    // ✅ Construct courseSelections properly
    const courseSelections = (editableUser.userCourses || []).map((course, index) => {
      return {
        courseId: course.courseId,
        knowledgeLevel: course.knowledgeLevel || 'BEGINNER'
      };
    }).filter(c => c.courseId !== 0); // skip empty courses
  
    // Create the profile update object
    // Important: courseSelections must be explicitly included with exactly the required format
    // Prepare the profile image - ensure it's a reasonable size for the database
    let profileImageToSave = editableUser.profileImage || "";
    if (profileImageToSave && profileImageToSave.startsWith('data:image')) {
      // If image is larger than 20KB, it might be too large for the server
      if (profileImageToSave.length > 20000) {
        console.log("Image may be too large for server:", profileImageToSave.length, "bytes");
        try {
          // Apply extra compression before saving
          const compressPromise = async () => {
            try {
              // First compression with smaller dimensions and lower quality
              let compressed = await resizeImage(profileImageToSave, 250, 250);
              
              // If still too large, compress even more aggressively
              if (compressed.length > 20000) {
                console.log("First compression not sufficient, trying more aggressive compression");
                compressed = await resizeImage(compressed, 200, 200);
              }
              
              console.log("Compressed image from", profileImageToSave.length, "to", compressed.length, "bytes");
              return compressed;
            } catch (err) {
              console.error("Error during extra compression:", err);
              return profileImageToSave;
            }
          };
          
          // Wait for compression to complete before continuing
          profileImageToSave = await compressPromise();
        } catch (error) {
          console.error("Error in image compression, using original:", error);
        }
      }
      
      console.log("Final image size for upload:", profileImageToSave.length, "bytes");
    }

    const profileUpdate: UserPutDTO = {
      name: editableUser.name || "",
      bio: editableUser.bio || "",
      profilePicture: profileImageToSave,
      availability: editableUser.availability,
      studyLevel: editableUser.studyLevel || "",
      studyGoals: typeof editableUser.studyGoals === 'string'
        ? editableUser.studyGoals.split(',').map(g => g.trim()).filter(Boolean)
        : editableUser.studyGoals || [],
      courseSelections: courseSelections
    };
  
    try {
      console.log("📦 Final payload for PUT:", JSON.stringify(profileUpdate, null, 2));

      await userService.updateUser(currentUser.id, profileUpdate);
      const updatedUser = await userService.getUserById(currentUser.id);
      
      // Process the updated user properly to ensure studyLevels and userCourses are synchronized
      const processedUser: UserProfile = {
        ...updatedUser,
        token: currentUser.token,
        studyGoals: Array.isArray(updatedUser.studyGoals) ? updatedUser.studyGoals.join(", ") : updatedUser.studyGoals,
        studyLevels: updatedUser.userCourses?.map(course => ({
          subject: course.courseName || String(course.courseId),
          grade: "N/A",
          level: course.knowledgeLevel || "Beginner"
        })) || [],
        userCourses: updatedUser.userCourses || []
      };
      
      setCurrentUser(processedUser);
      setEditableUser(processedUser);
      setIsEditing(false);
      message.success("Profile updated");
    } catch (err) {
      console.error("Save failed", err);
      
      // Extract and display specific validation errors from the backend if available
      if (err instanceof Error) {
        const errorMessage = err.message;
        if (errorMessage.includes('Availability is required')) {
          message.error('Availability is required');
        } else if (errorMessage.includes('Study goals are required')) {
          message.error('Study goals are required');
        } else if (errorMessage.includes('At least one course must be selected')) {
          message.error('At least one course must be selected');
        } else {
          message.error("Failed to save profile");
        }
      } else {
        message.error("Failed to save profile");
      }
    }
  };
  
  const handleEditToggle = async () => {
    if (isEditing) await handleSaveProfile();
    else setIsEditing(true);
  };

  const handleOpenDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleDeleteAccount = async () => {
    try {
      const { userService } = apiService;
      if (!userService) {
        throw new Error("User service not available");
      }
      
      await userService.deleteAccount();
      localStorage.removeItem("token");
      clearToken();
      message.success("Your account has been successfully deleted");
      router.push("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      message.error("Failed to delete your account. Please try again later.");
    }
  };

  const handleImageUpload = () => {
    setFileList([]);
    setShowImageModal(true);
  };

  const handleImageModalCancel = () => {
    setShowImageModal(false);
  };

  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
    
  // Function to resize image for better performance and smaller payload size
  const resizeImage = (base64Str: string, maxWidth = 300, maxHeight = 300): Promise<string> => {
    // Skip if not in browser environment
    if (typeof window === 'undefined') {
      return Promise.resolve(base64Str);
    }
    
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate the new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Use lower quality (0.6) for much better compression
          const compressedImage = canvas.toDataURL('image/jpeg', 0.6);
          
          // If still too large, compress more aggressively
          if (compressedImage.length > 30000) {
            console.log("Image still large, applying more aggressive compression");
            // Create smaller canvas for further reduction
            const smallerCanvas = document.createElement('canvas');
            smallerCanvas.width = Math.floor(width * 0.8);
            smallerCanvas.height = Math.floor(height * 0.8);
            const smallerCtx = smallerCanvas.getContext('2d');
            if (smallerCtx) {
              smallerCtx.drawImage(img, 0, 0, smallerCanvas.width, smallerCanvas.height);
              resolve(smallerCanvas.toDataURL('image/jpeg', 0.5));
            } else {
              resolve(compressedImage);
            }
          } else {
            resolve(compressedImage);
          }
        } else {
          // If canvas context is not available, return the original
          resolve(base64Str);
        }
      };
      
      // Handle errors
      img.onerror = () => {
        console.error('Error loading image for resize');
        resolve(base64Str);
      };
    });
  };

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG files!');
      return false;
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return false;
    }

    return isJpgOrPng && isLt2M;
  };

  const handleChange: UploadProps['onChange'] = async ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const base64Image = await getBase64(newFileList[0].originFileObj as RcFile);
      setPreviewImage(base64Image);
    }
  };

  const handleUploadConfirm = async () => {
    if (fileList.length > 0 && fileList[0].originFileObj && editableUser) {
      try {
        // First get the base64 data
        const base64Image = await getBase64(fileList[0].originFileObj as RcFile);
        
        // Apply first round of compression with our improved function
        let resizedImage = await resizeImage(base64Image);
        
        // If still too large, compress further for safe server upload
        if (resizedImage.length > 20000) {
          console.log("Image still too large after initial compression, applying additional compression");
          // Apply second round of compression with smaller size and lower quality
          resizedImage = await resizeImage(resizedImage, 200, 200);
        }
        
        // Show the size reduction for debugging
        console.log(
          "Image size reduction:",
          `${Math.round(base64Image.length / 1024)}KB → ${Math.round(resizedImage.length / 1024)}KB`,
          `(${Math.round((resizedImage.length / base64Image.length) * 100)}% of original)`
        );
        
        // Ensure the final image is small enough for server
        if (resizedImage.length > 30000) {
          console.warn("Image still large after compression:", resizedImage.length, "bytes");
          message.warning('Image may be too large. If you have issues saving your profile, try a smaller image.');
        }
        
        // Update the editableUser with the resized image
        setEditableUser({
          ...editableUser,
          profileImage: resizedImage
        });
        
        message.success('Profile picture updated!');
        setShowImageModal(false);
      } catch (error) {
        console.error("Error processing image:", error);
        message.error('Failed to process image. Please try another image.');
      }
    } else {
      message.error('Please select an image first');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    clearToken();
    router.push("/login");
  };

  if (loading || !currentUser) return <div>Loading...</div>;

  return (
    <div>
      {contextHolder}
      <div className={backgroundStyles.loginBackground}>
        <div className={styles.profileContainer}>
          <div className={mainStyles.header}>
            <Link href="/main" className={mainStyles.logoLink}><Logo className={mainStyles.headerLogo} /></Link>
            <div className={mainStyles.headerRight}>
              <Link href="/profile"><button className={mainStyles.iconButton}><UserOutlined /></button></Link>
              <Link href="/messages"><button className={mainStyles.iconButton}><MessageOutlined /></button></Link>
              <button className={mainStyles.iconButton} onClick={handleLogout}><LogoutOutlined /></button>
            </div>
          </div>
          <ProfileContent
            currentUser={currentUser}
            editableUser={editableUser}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
            onDeleteAccount={handleOpenDeleteModal}
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
      
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteAccount}
      />

      <Modal
        open={showImageModal}
        title="Upload Profile Picture"
        onCancel={handleImageModalCancel}
        footer={[
          <button 
            key="cancel" 
            onClick={handleImageModalCancel}
            style={{ 
              padding: '8px 15px',
              marginRight: '10px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              background: '#f5f5f5',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>,
          <button 
            key="submit" 
            onClick={handleUploadConfirm}
            style={{ 
              padding: '8px 15px',
              border: '1px solid #6750A4',
              borderRadius: '6px',
              background: '#6750A4',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Upload
          </button>
        ]}
      >
        <div style={{ textAlign: 'center' }}>
          <Upload
            name="avatar"
            listType="picture-card"
            className="avatar-uploader"
            showUploadList={false}
            beforeUpload={beforeUpload}
            onChange={handleChange}
            maxCount={1}
            accept="image/png, image/jpeg"
          >
            {previewImage ? (
              <img 
                src={previewImage} 
                alt="Profile" 
                style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} 
              />
            ) : (
              <div>
                <div style={{ marginTop: 8 }}>
                  Click to Upload
                </div>
              </div>
            )}
          </Upload>
          <div style={{ marginTop: '15px', color: '#888' }}>
            Image should be JPG/PNG, max 2MB
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;