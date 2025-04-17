"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useMessage } from '@/hooks/useMessage';
import { User, UserAvailability } from "@/types/user";
import { MatchService } from "@/api/services/matchService";
import { StudentFilterService } from "@/api/services/studentFilterService";
import { UserService } from "@/api/services/userService";
import { App } from "antd";
import Link from "next/link";
import Logo from "@/components/Logo";
import { UserOutlined, MessageOutlined, FilterOutlined, LogoutOutlined } from "@ant-design/icons";
import styles from "@/styles/main.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import Button from "@/components/Button";
import FilterModal from "@/components/FilterModal";

// Extended user profile with UI fields
interface UserProfile extends User {
  studyStyle?: string;
  bio?: string;
  studyLevel?: string;
  tags?: string[];
  studyLevels?: { subject: string; grade: string; level: string }[];
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
  const [currentProfileIndex, setCurrentProfileIndex] = useState<number>(0);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [seenIds, setSeenIds] = useState<number[]>([]);
  const [filters, setFilters] = useState<{ selectedCourses: number[]; availabilities: UserAvailability[] }>({
    selectedCourses: [],
    availabilities: []
  });

  // Fetch profiles according to filters and seen IDs
  const fetchUsers = async (
    courseIds?: number[],
    availability?: UserAvailability[]
  ) => {
    const hideLoading = message.loading("Loading profiles...");
    try {
      if (!currentUser) {
        message.error("User not loaded");
        return;
      }

      let users = await studentFilterService.getFilteredStudents(
        courseIds && courseIds.length > 0 ? courseIds : undefined,
        availability && availability.length > 0 ? availability : undefined
      );

      if (!Array.isArray(users)) {
        console.error("Invalid response:", users);
        users = [];
      }

      // Exclude current user and those already liked/disliked
      const filtered = users
        .filter(u => Number(u.id) !== Number(currentUser.id))
        .filter(u => !seenIds.includes(Number(u.id)));

      // Map to UI-friendly profiles
      const fetchedProfiles: UserProfile[] = filtered.map(u => {
        // Tags from studyGoals
        const tags = u.studyGoals
          ? (typeof u.studyGoals === 'string'
              ? u.studyGoals.split(',').map(t => t.trim()).filter(t => t)
              : Array.isArray(u.studyGoals)
                ? u.studyGoals
                : [u.studyGoals]
            )
          : [];

        // Courses -> studyLevels
        const studyLevels = u.userCourses?.map(c => ({
          subject: c.courseName || 'Unknown Course',
          grade: 'N/A',
          level: c.knowledgeLevel || 'BEGINNER'
        })) || [];

        // Availability label
        const studyStyle = u.availability
          ? { MORNING: 'Morning', AFTERNOON: 'Afternoon', EVENING: 'Evening' }[u.availability] || u.availability
          : 'Not specified';

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          token: u.token,
          status: u.status,
          studyStyle,
          bio: u.bio || '',
          studyLevel: u.studyLevel || '',
          tags,
          studyLevels,
          profileImage: u.profilePicture || `https://placehold.co/600x800/random/white.png?text=${encodeURIComponent(u.name)}`
        };
      });

      setProfiles(fetchedProfiles);
      setCurrentProfileIndex(fetchedProfiles.length > 0 ? 0 : -1);

      if (fetchedProfiles.length > 0) {
        message.success(`Loaded ${fetchedProfiles.length} profiles`);
      } else {
        message.info("No students match your filters. Try different filter criteria.");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load profiles");
      setProfiles([]);
      setCurrentProfileIndex(-1);
    } finally {
      hideLoading();
    }
  };

  // Load current user without pre-filtering courses
  const fetchCurrentUser = async () => {
    try {
      const user = await userService.getCurrentUser();
      setCurrentUser(user || null);
    } catch (err) {
      console.error(err);
      message.error("Failed to load your profile");
      setCurrentUser(null);
    } finally {
      setIsUserLoaded(true);
    }
  };

  // Initial auth & user load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedToken = localStorage.getItem("token");
    if (!token && !storedToken) {
      message.error("Please login to access this page");
      router.push("/login");
      return;
    }
    fetchCurrentUser();
  }, []);

  // Fetch profiles whenever user or filters change
  useEffect(() => {
    if (!isUserLoaded || !currentUser) return;
    fetchUsers(filters.selectedCourses, filters.availabilities);
  }, [filters, currentUser, isUserLoaded]);

  // Save new filters
  const handleFilterSave = (selectedCourses: number[], availabilities: UserAvailability[]) => {
    setFilters({ selectedCourses, availabilities });
  };

  // Advance to next profile or end
  const showNextProfile = () => {
    setCurrentProfileIndex(idx => (idx < profiles.length - 1 ? idx + 1 : -1));
  };

  // Like handler
  const handleLike = async () => {
    if (!currentUser || currentProfileIndex < 0) return;
    const targetId = profiles[currentProfileIndex].id;
    try {
      await matchService.processLike({ userId: Number(currentUser.id), targetUserId: targetId });
      setSeenIds(ids => [...ids, targetId]);
      showNextProfile();
    } catch (err) {
      console.error(err);
      message.error("Failed to like user");
    }
  };

  // Dislike handler
  const handleDislike = async () => {
    if (!currentUser || currentProfileIndex < 0) return;
    const targetId = profiles[currentProfileIndex].id;
    try {
      await matchService.processDislike({ userId: Number(currentUser.id), targetUserId: targetId });
      setSeenIds(ids => [...ids, targetId]);
      showNextProfile();
    } catch (err) {
      console.error(err);
      message.error("Failed to dislike user");
    }
  };

  const currentProfile = profiles[currentProfileIndex] || null;

  // Render when no profile to show
  if (!currentProfile) {
    const noFilters = filters.selectedCourses.length === 0 && filters.availabilities.length === 0;
    const messageText = noFilters ? "Loading profiles..." : "No students match your filters. Try different filter criteria.";
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
                <Link href="#" id="chat-link">
                  <button className={styles.iconButton} disabled id="chat-button"><MessageOutlined /></button>
                </Link>
                <button className={styles.iconButton} onClick={() => setFilterModalVisible(true)}><FilterOutlined /></button>
                <button className={styles.iconButton} onClick={() => { localStorage.removeItem("token"); clearToken(); router.push("/login"); }}><LogoutOutlined /></button>
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 20 }}>{messageText}</div>
              {!noFilters && (
                <>
                  <Button onClick={() => setFilterModalVisible(true)}>Change Filters</Button>
                  <Button onClick={() => fetchUsers(filters.selectedCourses, filters.availabilities)} style={{ marginLeft: 8 }}>Refresh Users</Button>
                </>
              )}
            </div>
          </div>
        </div>
        <FilterModal visible={filterModalVisible} onClose={() => setFilterModalVisible(false)} onSave={handleFilterSave} />
      </App>
    );
  }

  // Render profile card
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
              <Link href="#" id="chat-link-main">
                <button className={styles.iconButton} disabled id="chat-button-main"><MessageOutlined /></button>
              </Link>
              <button className={styles.iconButton} onClick={() => setFilterModalVisible(true)}><FilterOutlined /></button>
              <button className={styles.iconButton} onClick={() => { localStorage.removeItem("token"); clearToken(); router.push("/login"); }}><LogoutOutlined /></button>
            </div>
          </div>

          {/* Profile Content */}
          <div className={styles.profileContainer}>
            <div className={styles.profileImageContainer}>
              <img src={currentProfile.profileImage} alt={currentProfile.name} className={styles.profileImage} />
            </div>
            <div className={styles.rightSection}>
              <div className={`${styles.card} ${styles.profileCard}`}>
                <div className={styles.cardHeader}><div className={styles.dragHandle}></div></div>

                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Name</div>
                  <div className={styles.detailsValue}>{currentProfile.name}</div>
                </div>
                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Study Level</div>
                  <div className={styles.detailsValue}>{currentProfile.studyLevel || 'Not specified'}</div>
                </div>
                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Study Goals</div>
                  <div className={styles.tagContainer}>{currentProfile.tags?.map((t,i) => <span key={i} className={styles.tag}>{t}</span>)}</div>
                </div>
                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Availability</div>
                  <div className={styles.detailsValue}>{currentProfile.studyStyle}</div>
                </div>
                {currentProfile.bio && (
                  <div className={styles.cardSection}>
                    <div className={styles.detailsLabel}>Bio</div>
                    <div className={styles.detailsValue}>{currentProfile.bio}</div>
                  </div>
                )}
                <div className={styles.cardSection}>
                  <div className={styles.cardTitle}>Courses</div>
                  {currentProfile.studyLevels?.map((lvl,i) => (
                    <div key={i} className={styles.studyLevelRow}>
                      <div className={styles.studyLevelLeft}>
                        <div className={styles.studyLevelGrade}>{lvl.grade}</div>
                        <div className={styles.studyLevelSubject}>{lvl.subject}</div>
                      </div>
                      <div className={styles.studyLevelRight}>{lvl.level}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.actionButtons}>
                <button className={`${styles.actionButton} ${styles.dislikeButton}`} onClick={handleDislike}><span className={styles.buttonIcon}>✕</span><span>Dislike</span></button>
                <button className={`${styles.actionButton} ${styles.likeButton}`} onClick={handleLike}><span className={styles.buttonIcon}>★</span><span>Like</span></button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FilterModal visible={filterModalVisible} onClose={() => setFilterModalVisible(false)} onSave={handleFilterSave} />
    </App>
  );
};

export default MainPage;