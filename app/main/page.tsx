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
import {
  UserOutlined,
  MessageOutlined,
  FilterOutlined,
  LogoutOutlined
} from "@ant-design/icons";
import styles from "@/styles/main.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import Button from "@/components/Button";
import FilterModal from "@/components/FilterModal";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface UserProfile extends User {
  studyStyle?: string;
  bio?: string;
  studyLevel?: string;
  tags?: string[];
  studyLevels?: { subject: string; grade: string; level: string }[];
  profileImage?: string;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

const MainPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();

  const matchService = new MatchService(apiService.apiService);
  const studentFilterService = new StudentFilterService(apiService.apiService);
  const userService = new UserService(apiService.apiService);

  const { value: token, clear: clearToken } =
    useLocalStorage<string>("token", "");
  const { message, contextHolder } = useMessage();

  /* --------------------  component state  ------------------------- */

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState<number>(0);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  const [seenIds, setSeenIds] = useState<number[]>([]);
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [dislikedIds, setDislikedIds] = useState<number[]>([]);
  const [showDislikedOnly, setShowDislikedOnly] = useState(false);

  const [filters, setFilters] = useState<{
    selectedCourses: number[];
    availabilities: UserAvailability[];
  }>({
    selectedCourses: [],
    availabilities: []
  });

  /* ------------------------------------------------------------------
     LOAD CURRENT USER (once)                                          
  ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------
     FETCH PROFILES whenever filters OR currentUser load changes       
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!isUserLoaded || !currentUser) return;
    fetchUsers(filters.selectedCourses, filters.availabilities);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentUser, isUserLoaded]);

  /* ------------------------------------------------------------------
     fetchUsers – core logic                                           
  ------------------------------------------------------------------ */
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

      if (!Array.isArray(users)) users = [];

      /* -------- filter out seen / duplicate logic ---------- */
      const filtered = users
        .filter(u => Number(u.id) !== Number(currentUser.id))
        .filter(u => {
          const id = Number(u.id);
          const alreadySeen = seenIds.includes(id) && !dislikedIds.includes(id);
          const disliked   = dislikedIds.includes(id);
          return showDislikedOnly ? disliked : !alreadySeen;
        });

      /* -------- convert to UI model ---------- */
      const fetchedProfiles: UserProfile[] = filtered.map(u => {
        let tags = [];
      if (typeof u.studyGoals === "string") {
        tags = u.studyGoals.split(",").map(t => t.trim()).filter(Boolean);
      } else if (Array.isArray(u.studyGoals)) {
        tags = u.studyGoals;
      }

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
            )}`
        };
      });

      setProfiles(fetchedProfiles);
      setCurrentProfileIndex(fetchedProfiles.length > 0 ? 0 : -1);

      /* ----- messaging ----- */
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

  /* ------------------------------------------------------------------
     Helpers                                                           
  ------------------------------------------------------------------ */

  const skipUser = (id: number) => {
    // purely client‑side “skip”
    setSeenIds(ids => [...ids, id]);
    setDislikedIds(ids => [...ids, id]);
    setLikedIds(ids => ids.filter(l => l !== id));
  };

  /* ------------------------------------------------------------------ */
  /*  Handlers                                                          */
  /* ------------------------------------------------------------------ */

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
      skipUser(targetId); // still advance
      showNextProfile();
    }
  };

  const handleDislike = () => {
    /* ---------------------------------------------------- *
     *  FIX #1 ‑ “skip” is only local, do NOT call backend  *
     * ---------------------------------------------------- */
    if (!currentUser || currentProfileIndex < 0) return;
    const targetId = profiles[currentProfileIndex].id;
    skipUser(targetId);
    showNextProfile();
  };

  /* -------- refresh button (bring back ONLY disliked users) -------- */
  const handleRefreshUsers = () => {
    /* ---------------------------------------------- *
     *  FIX #2 – keep liked IDs hidden, show disliked *
     * ---------------------------------------------- */
    setSeenIds(likedIds);      // leave liked ones hidden
    setShowDislikedOnly(true); // next fetch shows disliked
    fetchUsers(filters.selectedCourses, filters.availabilities);
  };

  /* ------------------------------------------------------------------ */
  /*  Rendering: empty list variant                                     */
  /* ------------------------------------------------------------------ */

  const currentProfile = profiles[currentProfileIndex] || null;

  if (!currentProfile) {
    return (
      <App>
        {contextHolder}
        <div className={backgroundStyles.loginBackground}>
          <div className={styles.mainContainer}>
            {/* -------- header -------- */}
            <div className={styles.header}>
              <Link href="/main" className={styles.logoLink}>
                <Logo className={styles.headerLogo} />
              </Link>
              <div className={styles.headerRight}>
                <Link href="/profile">
                  <button className={styles.iconButton}>
                    <UserOutlined />
                  </button>
                </Link>
                <button
                  className={styles.iconButton}
                  disabled
                  id="chat-button"
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
                  onClick={() => {
                    localStorage.removeItem("token");
                    clearToken();
                    router.push("/login");
                  }}
                >
                  <LogoutOutlined />
                </button>
              </div>
            </div>
            {/* -------- message + buttons -------- */}
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
      </App>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Rendering: profile card                                           */
  /* ------------------------------------------------------------------ */

  return (
    <App>
      {contextHolder}
      <div className={backgroundStyles.loginBackground}>
        <div className={styles.mainContainer}>
          {/* ------------- header ------------- */}
          <div className={styles.header}>
            <Link href="/main" className={styles.logoLink}>
              <Logo className={styles.headerLogo} />
            </Link>
            <div className={styles.headerRight}>
              <Link href="/profile">
                <button className={styles.iconButton}>
                  <UserOutlined />
                </button>
              </Link>
              <button
                className={styles.iconButton}
                disabled
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
                onClick={() => {
                  localStorage.removeItem("token");
                  clearToken();
                  router.push("/login");
                }}
              >
                <LogoutOutlined />
              </button>
            </div>
          </div>

          {/* ------------- profile card ------------- */}
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
                    {currentProfile.studyLevel || "Not specified"}
                  </div>
                </div>

                <div className={styles.cardSection}>
                  <div className={styles.detailsLabel}>Study Goals</div>
                  <div className={styles.tagContainer}>
                    {currentProfile.tags?.map((t) => (
                      <span key={`tag-${t}`} className={styles.tag}>
                        {t}
                      </span>
                    ))}
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

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onSave={handleFilterSave}
      />
    </App>
  );
};

export default MainPage;
