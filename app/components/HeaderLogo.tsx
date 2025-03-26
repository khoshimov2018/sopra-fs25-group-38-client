import React from 'react';
import Image from 'next/image';

interface HeaderLogoProps {
  className?: string;
}

const HeaderLogo: React.FC<HeaderLogoProps> = ({ className = '' }) => {
  return (
    <div className={className} style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'flex-start',
      marginTop: '-10px', // Move logo all the way to the top
      position: 'relative',
      top: '-5px'
    }}>
      <Image
        src="/images/logo.svg"
        alt="StudyBuddy Logo"
        width={220}
        height={50}
        style={{
          objectFit: 'contain',
          width: 'auto',
          height: 'auto',
          maxHeight: '50px' // Slightly smaller
        }}
        priority
      />
    </div>
  );
};

export default HeaderLogo;