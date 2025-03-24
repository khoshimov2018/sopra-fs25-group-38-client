"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering
import "@ant-design/v5-patch-for-react-19";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import styles from "@/styles/page.module.css";

export default function Home() {
  const router = useRouter();
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.heading}>
          <h1 style={{ fontSize: '2.5rem', margin: '20px 0', textAlign: 'center' }}>
            Welcome to SoPra FS25!
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '40px', textAlign: 'center', maxWidth: '600px' }}>
          </p>
        </div>

        <div className={styles.ctas}>
          <Button
            type="primary"
            size="large"
            variant="solid"
            onClick={() => router.push("/login")}
            style={{ backgroundColor: '#1677ff', margin: '0 10px' }}
          >
            Login
          </Button>
          <Button
            type="default"
            size="large"
            variant="solid"
            onClick={() => router.push("/register")}
            style={{ margin: '0 10px' }}
          >
            Register
          </Button>
        </div>
      </main>
      <footer className={styles.footer} style={{ marginTop: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <p>© 2025 User Management System - SoPra FS25</p>
          <p style={{ fontSize: '0.8rem', marginTop: '10px', color: '#888' }}>
            Created by Rakhmatillokhon Khoshimov
          </p>
        </div>
      </footer>
    </div>
  );
}
