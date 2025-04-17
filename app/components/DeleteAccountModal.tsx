import React, { useState } from 'react';
import { Modal, Input, Typography } from 'antd';
import Button from './Button';
import styles from '@/styles/theme/components.module.css';

const { Text, Title } = Typography;

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ 
  visible, 
  onClose, 
  onConfirm 
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmText(e.target.value);
  };

  const handleCancel = () => {
    setConfirmText('');
    onClose();
  };

  const handleConfirm = async () => {
    if (confirmText !== 'DELETE') return;
    
    setIsSubmitting(true);
    try {
      await onConfirm();
      setConfirmText('');
      onClose();
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={<Title level={4}>Delete Account</Title>}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      <div style={{ padding: '20px 0' }}>
        <Text>
          <p>Are you sure you want to delete your account? This action cannot be undone.</p>
          <p>All your data will be permanently deleted, including:</p>
          <ul>
            <li>Your profile information</li>
            <li>Your matches</li>
            <li>Your chat history</li>
            <li>Your course enrollments</li>
          </ul>
          <p style={{ marginTop: '20px', fontWeight: 'bold' }}>
            To confirm, type DELETE in the field below:
          </p>
        </Text>
        
        <Input
          placeholder="Type DELETE to confirm"
          value={confirmText}
          onChange={handleConfirmChange}
          style={{ margin: '20px 0' }}
        />

        <div style={{ 
          marginTop: '24px', 
          display: 'flex', 
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <Button 
            onClick={handleCancel} 
            className={styles.secondaryButton}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className={`${styles.dangerButton} ${confirmText !== 'DELETE' ? styles.disabled : ''}`}
            disabled={confirmText !== 'DELETE' || isSubmitting}
          >
            {isSubmitting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteAccountModal;