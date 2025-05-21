"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useMessage } from "@/hooks/useMessage";
import { User, UserAvailability } from "@/types/user";
import { MatchService } from "@/api/services/matchService";
import { StudentFilterService } from "@/api/services/studentFilterService";
import { UserService } from "@/api/services/userService";
import { App } from "antd";
import Link from "next/link";
import Logo from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";
import {
  UserOutlined,
  MessageOutlined,
  FilterOutlined,
  LogoutOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import styles from "@/styles/main.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import Button from "@/components/Button";
import FilterModal from "@/components/FilterModal";
import InfoModal from "@/components/InfoModal";
import { getApiDomain } from "@/utils/domain";

interface UserProfile extends User {
  studyStyle?: string;
  bio?: string;
  studyLevel?: string;
  tags?: string[];
  studyLevels?: { subject: string; grade: string; level: string }[];
  profileImage?: string;
  isLiked?: boolean;
  isDisliked?: boolean;
  hasSharedGoals?: boolean;
  sharedGoals?: string[];
}


const MainPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();

  const matchService = new MatchService(apiService.apiService);
  const studentFilterService = new StudentFilterService(apiService.apiService);
  const userService = new UserService(apiService.apiService);

  const { value: token, clear: clearToken } =
    useLocalStorage<string>("token", "");
  const { message, contextHolder } = useMessage();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState<number>(0);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  
  const { value: seenIds, set: setSeenIds } = useLocalStorage<number[]>("seenIds", []);
  const { value: likedIds, set: setLikedIds } = useLocalStorage<number[]>("likedIds", []);
  const { value: dislikedIds, set: setDislikedIds } = useLocalStorage<number[]>("dislikedIds", []);
  const [showDislikedOnly, setShowDislikedOnly] = useState(false);
  
  // Check if this is the first time the user is visiting this page
  const { value: hasSeenInfoModal, set: setHasSeenInfoModal } = 
    useLocalStorage<boolean>("hasSeenMainInfoModal", false);

  const [filters, setFilters] = useState<{
    selectedCourses: number[];
    availabilities: UserAvailability[];
  }>({
    selectedCourses: [],
    availabilities: []
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem("token");
    if (!token && !storedToken) {
      message.error("Please login to access this page");
      router.push("/login");
      return;
    }
    (async () => {
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
    })();
  }, []);

  useEffect(() => {
    if (!isUserLoaded || !currentUser) return;
    
    const fetchAndProcessUsers = async () => {
      try {
        const result = await fetchUsers(filters.selectedCourses, filters.availabilities);
        
        if (result && result.profiles) {
          if (result.profiles.length > 0) {
            message.success(`Loaded ${result.profiles.length} profiles`);
          } else if (!result.error) {
            message.warning(
              "No students match the criteria (or you've already seen them)."
            );
          }
          
          setProfiles(result.profiles);
          setCurrentProfileIndex(result.profiles.length > 0 ? 0 : -1);
        }
        
        if (result && result.error) {
          message.error(result.error);
        }
        
        setShowDislikedOnly(false); 
      } catch (error) {
        console.error(error);
        message.error("Failed to load profiles");
        setProfiles([]);
        setCurrentProfileIndex(-1);
      }
    };
    
    fetchAndProcessUsers();
  }, [filters, currentUser, isUserLoaded]);
  
  // Show info modal on first visit
  useEffect(() => {
    if (isUserLoaded && currentUser && !hasSeenInfoModal) {
      setInfoModalVisible(true);
      // Make sure this function exists
      if (typeof setHasSeenInfoModal === 'function') {
        setHasSeenInfoModal(true);
      }
    }
  }, [isUserLoaded, currentUser, hasSeenInfoModal, setHasSeenInfoModal]);

  const fetchInteractedUsers = async (userId: number) => {
    try {
      const { likedIds: remoteLikedIds, matchedIds, blockedIds } = await matchService.getInteractedUserIds(userId);
      
      // If we're unable to fetch from the backend, we'll use the local state as a fallback
      if (remoteLikedIds.length > 0) {
        // Merge remote and local ids to ensure we don't miss anything
        setLikedIds([...new Set([...likedIds, ...remoteLikedIds])]);
      }
      
      return { matchedIds, blockedIds };
    } catch (error) {
      console.error("Failed to fetch interacted users:", error);
      return { matchedIds: [], blockedIds: [] };
    }
  };

  // Helper function to extract study goals from a user
  const extractStudyGoals = (user: any): string[] => {
    if (!user) return [];

    if (typeof user.studyGoals === "string") {
      return user.studyGoals.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean);
    } else if (Array.isArray(user.studyGoals)) {
      return user.studyGoals.map((g: string) => g.toLowerCase());
    }

    return [];
  };

  // Function to check for shared study goals
  const getSharedGoals = (currentUserGoals: string[], profileGoals: string[]): string[] => {
    if (!currentUserGoals.length || !profileGoals.length) return [];

    return currentUserGoals.filter(goal =>
      profileGoals.some(profileGoal => profileGoal.toLowerCase() === goal.toLowerCase())
    );
  };

  const fetchUsers = async (
    courseIds?: number[],
    availability?: UserAvailability[]
  ) => {
    const hideLoading = message.loading("Loading profiles...");
    try {
      if (!currentUser) {
        return { profiles: [] };
      }

      // Log the current state of liked IDs from localStorage
      console.log("Liked IDs from localStorage:", likedIds);
      
      // Fetch users the current user has already interacted with
      const { matchedIds, blockedIds } = await fetchInteractedUsers(Number(currentUser.id));
      
      console.log("After fetchInteractedUsers:");
      console.log("- Matched IDs:", matchedIds);
      console.log("- Blocked IDs:", blockedIds);
      console.log("- Liked IDs (local):", likedIds);

      // Fetch current user's full details to get their study goals
      const currentUserDetails = await userService.getUserById(Number(currentUser.id));
      const currentUserGoals = extractStudyGoals(currentUserDetails);

      let users = await studentFilterService.getFilteredStudents(
        courseIds && courseIds.length > 0 ? courseIds : undefined,
        availability && availability.length > 0 ? availability : undefined
      );

      if (!Array.isArray(users)) users = [];
      
      console.log("Total users before filtering:", users.length);

      const filtered = users
        .filter(u => Number(u.id) !== Number(currentUser.id))
        // Filter out users that the current user has already matched with, liked, or blocked
        .filter(u => {
          const id = Number(u.id);
          
          // Debug: check if this user is in any of our exclude lists
          const isMatched = matchedIds.includes(id);
          const isBlocked = blockedIds.includes(id);
          const isLiked = likedIds.includes(id);
          
          // Log every user we're excluding and why
          if (isMatched || isBlocked || isLiked) {
            console.log(`Excluding user ${id}: matched=${isMatched}, blocked=${isBlocked}, liked=${isLiked}`);
          }
          
          // Skip users that have been matched with, blocked, or liked
          if (isMatched || isBlocked || isLiked) {
            return false;
          }

          // Handle client-side seen/disliked logic
          const alreadySeen = seenIds.includes(id) && !dislikedIds.includes(id);
          const disliked = dislikedIds.includes(id);
          return showDislikedOnly ? disliked : !alreadySeen;
        });
      const fetchedProfiles: UserProfile[] = filtered.map(u => {
        // Extract profile goals
        let tags = [];
        if (typeof u.studyGoals === "string") {
          tags = u.studyGoals.split(",").map(t => t.trim()).filter(Boolean);
        } else if (Array.isArray(u.studyGoals)) {
          tags = u.studyGoals;
        }

        // Find shared goals between current user and this profile
        const profileGoals = extractStudyGoals(u);
        const sharedGoals = getSharedGoals(currentUserGoals, profileGoals);
        const hasSharedGoals = sharedGoals.length > 0;

        const studyLevels =
          u.userCourses?.map(c => ({
            subject: c.courseName || "Unknown Course",
            grade: "N/A",
            level: c.knowledgeLevel || "BEGINNER"
          })) || [];

        const studyStyle = u.availability
          ? { MORNING: "Morning", AFTERNOON: "Afternoon", EVENING: "Evening" }[
              u.availability
            ] || u.availability
          : "Not specified";

        const id = Number(u.id);
        const isLiked = likedIds.includes(id);
        const isDisliked = dislikedIds.includes(id);

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          token: u.token,
          status: u.status,
          studyStyle,
          bio: u.bio ?? "",
          studyLevel: u.studyLevel ?? "",
          tags,
          studyLevels,
          profileImage:
            u.profilePicture ??
            `https://placehold.co/600x800/random/white.png?text=${encodeURIComponent(
              u.name
            )}`,
          isLiked,
          isDisliked,
          hasSharedGoals,
          sharedGoals
        };
      });

      setProfiles(fetchedProfiles);
      setCurrentProfileIndex(fetchedProfiles.length > 0 ? 0 : -1);

      if (fetchedProfiles.length > 0) {
        message.success(`Loaded ${fetchedProfiles.length} profiles`);
      } else {
        message.warning(
          "No students match the criteria (or you’ve already seen them)."
        );
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load profiles");
      setProfiles([]);
      setCurrentProfileIndex(-1);
    } finally {
      setShowDislikedOnly(false); // reset flag after each fetch
      hideLoading();
    }
  };


  const skipUser = (id: number) => {
    // purely client‑side “skip”
    setSeenIds(ids => [...ids, id]);
    setDislikedIds(ids => [...ids, id]);
    setLikedIds(ids => ids.filter(l => l !== id));
  };


  const handleFilterSave = (
    selectedCourses: number[],
    availabilities: UserAvailability[]
  ) => setFilters({ selectedCourses, availabilities });

  const showNextProfile = () =>
    setCurrentProfileIndex(idx =>
      idx < profiles.length - 1 ? idx + 1 : -1
    );

  const handleLike = async () => {
    if (!currentUser || currentProfileIndex < 0) return;
    const targetId = profiles[currentProfileIndex].id;
    try {
      await matchService.processLike({
        userId: Number(currentUser.id),
        targetUserId: targetId
      });
      setSeenIds(ids => [...ids, targetId]);
      setLikedIds(ids => [...ids, targetId]);
      setDislikedIds(ids => ids.filter(id => id !== targetId));
      showNextProfile();
    } catch (err: any) {
      console.error(err);
      const msg = err?.message ?? "";
      if (msg.includes("block")) {
        message.info("You cannot match with this user due to block settings.");
      } else {
        message.error("Failed to like user");
      }
      skipUser(targetId);
      showNextProfile();
    }
  };

  const handleDislike = () => {
    if (!currentUser || currentProfileIndex < 0) return;
    const targetId = profiles[currentProfileIndex].id;
    skipUser(targetId);
    showNextProfile();
  };

  const handleRefreshUsers = async () => {
    setSeenIds(likedIds);      
    setShowDislikedOnly(true);
    
    setFilters({...filters});
  };


  const currentProfile = profiles[currentProfileIndex] ?? null;

  if (!currentProfile) {
    return (
      <App>
        {contextHolder}
        <div className={backgroundStyles.loginBackground}>
          <div className={styles.mainContainer}>
            <div className={styles.header}>
              <Link href="/main" className={styles.logoLink}>
                <Logo className={styles.headerLogo} />
              </Link>
              <div className={styles.headerRight}>
                {currentUser && (
                  <button className={styles.iconButton} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <NotificationBell userId={Number(currentUser.id)} />
                  </button>
                )}
                <button 
                  onClick={() => router.push('/profile')}
                  className={styles.iconButton}
                >
                  <UserOutlined />
                </button>
                <button
                  onClick={() => router.push('/chat')}
                  className={styles.iconButton}
                  id="chat-button-main"
                >
                  <MessageOutlined />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => setFilterModalVisible(true)}
                >
                  <FilterOutlined />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => setInfoModalVisible(true)}
                >
                  <InfoCircleOutlined />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={async () => {
                    // Clear all localStorage values
                    localStorage.removeItem("token");
                    localStorage.removeItem("seenIds");
                    localStorage.removeItem("likedIds");
                    localStorage.removeItem("dislikedIds");
                    clearToken();
                    router.push("/login");
                    if (token) {
                      await fetch(`${getApiDomain()}/users/logout`, {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      });
                    }
                  }}
                >
                  <LogoutOutlined />
                </button>
              </div>
            </div>

            <div style={{ textAlign: "center", padding: 20 }}>
              <div
                style={{
                  fontSize: "1.2rem",
                  marginBottom: 20,
                  padding: "0 20px",
                  color: "#000000"
                }}
              >
                No students match your filters. Try different filter criteria.
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "20px"
                }}
              >
                <Button onClick={() => setFilterModalVisible(true)}>
                  Change Filters
                </Button>
                <Button onClick={handleRefreshUsers}>Refresh Users</Button>
              </div>
            </div>
          </div>
        </div>
        <FilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onSave={handleFilterSave}
        />
        <InfoModal
          visible={infoModalVisible}
          onClose={() => setInfoModalVisible(false)}
          pageName="main"
        />
      </App>
    );
  }


  return (
    <App>
      {contextHolder}
      <div className={backgroundStyles.loginBackground}>
        <div className={styles.mainContainer}>
          <div className={styles.header}>
            <Link href="/main" className={styles.logoLink}>
              <Logo className={styles.headerLogo} />
            </Link>
            <div className={styles.headerRight}>
              {currentUser && (
                <button className={styles.iconButton} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <NotificationBell userId={Number(currentUser.id)} />
                </button>
              )}
              <button 
                onClick={() => router.push('/profile')}
                className={styles.iconButton}
              >
                <UserOutlined />
              </button>
              <button
                onClick={() => router.push('/chat')}
                className={styles.iconButton}
                id="chat-button-main"
              >
                <MessageOutlined />
              </button>
              <button
                className={styles.iconButton}
                onClick={() => setFilterModalVisible(true)}
              >
                <FilterOutlined />
              </button>
              <button
                className={styles.iconButton}
                onClick={() => setInfoModalVisible(true)}
              >
                <InfoCircleOutlined />
              </button>
              <button
                className={styles.iconButton}
                onClick={() => {
                  // Clear all localStorage values
                  localStorage.removeItem("token");
                  localStorage.removeItem("seenIds");
                  localStorage.removeItem("likedIds");
                  localStorage.removeItem("dislikedIds");
                  clearToken();
                  router.push("/login");
                }}
              >
                <LogoutOutlined />
              </button>
            </div>
          </div>
          <div className={styles.profileContainer}>
            <div className={styles.profileImageContainer}>
              <img
                src={currentProfile.profileImage}
                alt={currentProfile.name}
                className={styles.profileImage}
              />
            </div>

            <div className={styles.rightSection}>
              <div className={`${styles.card} ${styles.profileCard}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.dragHandle}></div>
                </div>

                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Name</div>
                  <div className={styles.detailsValue}>
                    {currentProfile.name}
                  </div>
                </div>

                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Study Level</div>
                  <div className={styles.detailsValue}>
                    {currentProfile.studyLevel ?? "Not specified"}
                  </div>
                </div>

                <div className={styles.cardSection}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className={styles.detailsLabel}>Study Goals</div>
                    {currentProfile.hasSharedGoals && (
                      <span
                        style={{
                          background: '#52c41a',
                          color: 'white',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>★</span> Similar Goals!
                      </span>
                    )}
                  </div>
                  <div className={styles.tagContainer}>
                    {currentProfile.tags?.map((t) => {

                      const isShared = currentProfile.sharedGoals?.some(
                        goal => goal.toLowerCase() === t.toLowerCase()
                      );

                      return (
                        <span
                          key={`tag-${t}`}
                          className={styles.tag}
                          style={isShared ? {
                            background: '#f6ffed',
                            border: '1px solid #b7eb8f',
                            color: '#52c41a',
                            fontWeight: '500'
                          } : {}}
                        >
                          {isShared && <span style={{ marginRight: '4px' }}>★</span>}
                          {t}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Availability</div>
                  <div className={styles.detailsValue}>
                    {currentProfile.studyStyle}
                  </div>
                </div>

                {currentProfile.bio && (
                  <div className={styles.cardSection}>
                    <div className={styles.detailsLabel}>Bio</div>
                    <div className={styles.detailsValue}>
                      {currentProfile.bio}
                    </div>
                  </div>
                )}

                <div className={styles.cardSection}>
                  <div className={styles.cardTitle}>Courses</div>
                  {currentProfile.studyLevels?.map((lvl) => (
                    <div key={`level-${lvl.subject}-${lvl.level}`} className={styles.studyLevelRow}>
                      <div className={styles.studyLevelLeft}>
                        <div className={styles.studyLevelGrade}>{lvl.grade}</div>
                        <div className={styles.studyLevelSubject}>
                          {lvl.subject}
                        </div>
                      </div>
                      <div className={styles.studyLevelRight}>{lvl.level}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button
                  className={`${styles.actionButton} ${styles.dislikeButton} ${currentProfile.isDisliked ? styles.dislikedButton : ''}`}
                  onClick={handleDislike}
                >
                  <span className={styles.buttonIcon}>✕</span>
                  <span>Dislike</span>
                </button>
                <button
                  className={`${styles.actionButton} ${styles.likeButton} ${currentProfile.isLiked ? styles.likedButton : ''}`}
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

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onSave={handleFilterSave}
      />
      <InfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        pageName="main"
      />
    </App>
  );
};

export default MainPage;
