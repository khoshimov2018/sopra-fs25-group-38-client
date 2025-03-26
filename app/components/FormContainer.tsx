import React from 'react';
import styles from '@/styles/theme/components.module.css';

interface FormContainerProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

const FormContainer: React.FC<FormContainerProps> = ({
  children,
  onSubmit,
  className = '',
}) => {
  return (
    <div className={`${styles.formContainer} ${className}`}>
      <form onSubmit={onSubmit}>
        {children}
      </form>
    </div>
  );
};

export default FormContainer;
