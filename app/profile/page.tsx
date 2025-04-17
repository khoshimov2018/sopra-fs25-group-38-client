"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useMessage } from '@/hooks/useMessage';
import { UserProfile, ProfileUpdate } from "@/types/profile";
import { UserAvailability, ProfileKnowledgeLevel } from "@/types/dto";
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

  const handleSaveProfile = async () => {
    if (!editableUser || !currentUser?.id) return;
    const { userService } = apiService;
    if (!userService) return;
  
    // ✅ Construct courseSelections properly
    const courseSelections = (editableUser.userCourses || []).map((course, index) => {
      return {
        courseId: course.courseId,
        knowledgeLevel: course.knowledgeLevel || 'BEGINNER'
      };
    }).filter(c => c.courseId !== 0); // optional: skip empty courses
  
    const profileUpdate: ProfileUpdate = {
      name: editableUser.name || "",
      bio: editableUser.bio || "",
      profilePicture: editableUser.profileImage || "",
      availability: editableUser.availability || undefined,
      studyLevel: editableUser.studyLevel || "",
      studyGoals: typeof editableUser.studyGoals === 'string'
        ? editableUser.studyGoals.split(',').map(g => g.trim())
        : editableUser.studyGoals || [],
      courseSelections // ✅ include this!
    };
  
    try {
      console.log("📦 Final payload for PUT:", JSON.stringify(profileUpdate, null, 2));

      await userService.updateUser(currentUser.id, profileUpdate);
      const updatedUser = await userService.getUserById(currentUser.id);
      setCurrentUser(updatedUser);
      setEditableUser(updatedUser);
      setIsEditing(false);
      message.success("Profile updated");
    } catch (err) {
      console.error("Save failed", err);
      message.error("Failed to save profile");
    }
  };
  

  const handleEditToggle = async () => {
    if (isEditing) await handleSaveProfile();
    else setIsEditing(true);
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
            onImageUpload={() => {}}
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