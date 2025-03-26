import React from 'react';
import Image from 'next/image';
import styles from '@/styles/theme/components.module.css';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`${styles.logoContainer} ${className}`}>
      <Image
        src="/images/logo.svg"
        alt="App Logo"
        width={300}
        height={300}
        priority
        quality={100}
        unoptimized={true}
      />
    </div>
  );
};

export default Logo;
