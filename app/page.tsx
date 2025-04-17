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
          <h1 style={{ fontSize: '2rem', margin: '10px 0', textAlign: 'center' }}>
            Welcome to StudyBuddy!
          </h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '20px', textAlign: 'center', maxWidth: '600px' }}>
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
      <footer className={styles.footer}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>© 2025 SoPra FS25 - Group 38</p>
        </div>
      </footer>
    </div>
  );
}