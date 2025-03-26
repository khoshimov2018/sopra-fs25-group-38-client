"use client"; 
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button } from "antd";
import styles from "@/styles/page.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import Logo from "@/components/Logo";

export default function Home() {
  const router = useRouter();
  const { value: token } = useLocalStorage<string>("token", "");

  useEffect(() => {
    // If user is already logged in, redirect to main page
    if (token) {
      router.push("/main");
    }
  }, [token, router]);

  return (
    <div className={`${styles.page} ${backgroundStyles.loginBackground}`}>
      <Logo />
      <main className={styles.main}>
        <div className={styles.heading}>
          <h1 style={{ fontSize: '2.5rem', margin: '20px 0', textAlign: 'center' }}>
            Welcome to StudyBuddy!
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '40px', textAlign: 'center', maxWidth: '600px' }}>
            Find your perfect study match
          </p>
        </div>

        <div className={styles.ctas}>
          <Button
            type="primary"
            size="large"
            onClick={() => router.push("/login")}
            style={{ 
              backgroundColor: '#2C2C2C', 
              margin: '0 10px',
              minWidth: '120px'
            }}
          >
            Login
          </Button>
          <Button
            type="default"
            size="large"
            onClick={() => router.push("/register")}
            style={{ 
              margin: '0 10px', 
              color: '#1E1E1E',
              backgroundColor: '#FFFFFF',
              borderColor: '#2C2C2C',
              minWidth: '120px'
            }}
          >
            Register
          </Button>
        </div>
      </main>
      <footer className={styles.footer} style={{ marginTop: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <p>© 2025 Study Matchmaking System - SoPra FS25</p>
          <p style={{ fontSize: '0.8rem', marginTop: '10px', color: '#888' }}>
            Created by Group 38
          </p>
        </div>
      </footer>
    </div>
  );
}