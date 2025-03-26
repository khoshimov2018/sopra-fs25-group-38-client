"use client";

import { message } from 'antd';
import { useEffect } from 'react';

// Create a hook that manages message API instances
export const useMessage = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const showMessage = {
    success: (content: string) => messageApi.success(content),
    error: (content: string) => messageApi.error(content),
    info: (content: string) => messageApi.info(content),
    warning: (content: string) => messageApi.warning(content),
    loading: (content: string) => messageApi.loading(content),
    destroy: () => messageApi.destroy(),
  };

  return {
    message: showMessage,
    contextHolder,
  };
};