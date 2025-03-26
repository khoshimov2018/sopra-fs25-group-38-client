"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserOutlined, MessageOutlined, FilterOutlined } from "@ant-design/icons";
import { useMessage } from "@/hooks/useMessage";
import useLocalStorage from "@/hooks/useLocalStorage";
import { App } from "antd";
import Link from "next/link";
import Logo from "@/components/Logo";
import "../styles/chat.css";
import styles from "@/styles/main.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";

const ChatPage: React.FC = () => {
    const [userMessages, setUserMessages] = useState<{ id: number; text: string; sender: string }[]>([]);
  const [otherMessages, setOtherMessages] = useState<{ id: number; text: string; sender: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);  // Track selected chat

// 引用用于滚动到最新消息
const messagesEndRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { message, contextHolder } = useMessage();
  const { clear: clearToken } = useLocalStorage<string>("token", "");

  // 使用 useEffect 来确保只在客户端执行
  useEffect(() => {
    setIsClient(true); // 表示组件已经渲染到客户端
  }, []);

  const defaultAIMessage = {
    id: 1,
    text: "Hello! How can I assist you?",
    sender: "AI Advisor",
  };

  // 模拟从服务端获取消息
  useEffect(() => {
    const fetchMessages = async () => {
      // 这里假设你从服务端获取数据（可以根据实际API修改）
      const response = await fetch("/api/messages");  // 示例请求
      const data = await response.json();
      
      if (data && data.length > 0) {
        setOtherMessages(data);
      } else {
        // 如果没有消息，保持空数组
        setOtherMessages([]);
      }
    };

    fetchMessages();
  }, []);

  // 模拟实时接收对方的消息
  useEffect(() => {
    const receiveMessageFromOpponent = async () => {
      // 每2秒请求一次服务端，获取是否有新的消息
      const response = await fetch("/api/receive_message");  // 假设这是从服务端获取消息的 API
      const data = await response.json();

      // 如果服务端返回新的消息，则更新消息列表
      if (data && data.text) {
        setOtherMessages((prevMessages) => [
          ...prevMessages,
          { id: prevMessages.length + 1, text: data.text, sender: "Opponent" },
        ]);
      }
    };

    const intervalId = setInterval(receiveMessageFromOpponent, 2000);

    // 清除定时器
    return () => clearInterval(intervalId);
  }, []); // 只在初次渲染时启动定时器

    useEffect(() => {
        if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [userMessages, otherMessages]);


  if (!isClient) {
    return null; // 在客户端渲染之前不渲染任何内容
  }

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;

    // 添加用户消息到 userMessages
    setUserMessages((prevMessages) => [
        ...prevMessages,
        { id: prevMessages.length + otherMessages.length + 1, text: inputValue, sender: "You" },
    ]);

    // Clear the input field
    setInputValue("");
  };

  const handleSelectChat = (chatName: string) => {
    setSelectedChat(chatName);
  };

  const handleLogout = () => {
    message.info("Filter options would be shown here");
  };

  const actualLogout = async () => {
    try {
      message.success("Logging out...");
      localStorage.removeItem("token");
      clearToken();
      window.location.href = "/login";
    } catch (error) {
      console.error("Error during logout:", error);
      localStorage.removeItem("token");
      clearToken();
      window.location.href = "/login";
    }
  };

  const aiAvatar = "/AI-Icon.svg";  // 你可以使用本地或外部的头像路径

  return (
    <App>
      {contextHolder}
      <div className={backgroundStyles.loginBackground}>
        <div className={styles.mainContainer}>
          {/* Header */}
          <div className={styles.header}>
            <Link href="/main" className={styles.logoLink}>
              <Logo className={styles.headerLogo} />
            </Link>
            <div className={styles.headerRight}>
              <Link href="/messages">
                <button className={styles.iconButton}><MessageOutlined /></button>
              </Link>
              <Link href="/profile">
                <button className={styles.iconButton}><UserOutlined /></button>
              </Link>
              <button className={styles.iconButton} onClick={handleLogout}><FilterOutlined /></button>
              <button
                className={styles.iconButton}
                onClick={actualLogout}
                style={{ marginLeft: '15px', color: '#ff4d4f' }}
              >
                Logout
              </button>
            </div>
          </div>

          <div className="chat-container">
            {/* 左侧消息列表 */}
            <div className="message-list-container">
                <div className="message-list-header">Conversations</div>
                <div className="message-list">
                {/* AI Advisor 始终置顶 */}
                <div className="message-item" onClick={() => handleSelectChat("AI Advisor")}>
                    <div className="avatar" style={{ backgroundImage: `url(${aiAvatar})` }}></div>
                    <div className="content">
                    <div className="headline">AI Advisor</div>
                    <div className="supporting-text">{defaultAIMessage.text}</div>
                    </div>
                </div>

                {/* 渲染服务端返回的对方消息 */}
                {otherMessages.length > 0 ? (
                    otherMessages
                    .filter((message) => message.sender !== "You") // 过滤掉自己发送的消息
                    .map((message) => (
                        <div
                        key={message.id}
                        className="message-item"
                        onClick={() => handleSelectChat(message.sender)} // 点击时选中聊天
                        >
                        <div className="avatar"></div>
                        <div className="content">
                            <div className="headline">{message.sender}</div>
                            <div className="supporting-text">{message.text}</div>
                        </div>
                        </div>
                    ))
                ) : (
                    <div className="message-item">
                    <div className="content">
                        <div className="headline">No other messages available.</div>
                    </div>
                    </div>
                )}
                </div>
            </div>

            {/* 右侧聊天页面 */}
            <div className="chat-page">
                {/* 动态显示对方的用户名 */}
                <div className="chat-header">
                {selectedChat ? selectedChat : "Select a chat"}
                </div>
                <div className="chat-content">
                {/* 如果选择的是AI Advisor，显示AI Advisor的默认消息 */}
                {selectedChat === "AI Advisor" && (
                    <div key={defaultAIMessage.id} className="chat-message">
                    <div className="avatar" style={{ backgroundImage: `url(${aiAvatar})` }}></div>
                    <div className="message-bubble">{defaultAIMessage.text}</div>
                    </div>
                )}

                {/* 渲染服务端返回的对方消息 */}
                {[...otherMessages, ...userMessages].map((message) => (
                    <div
                    key={message.id}
                    className={`chat-message ${message.sender === "You" ? "you" : ""}`}
                    >
                    {/* 仅在对方发送消息时显示头像 */}
                    {message.sender !== "You" && <div className="avatar"></div>}
                    <div className="message-bubble">{message.text}</div>
                    </div>
                ))}
                </div>
              <div className="chat-input-container">
                <input
                  className="chat-input"
                  type="text"
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <div className="send-button" onClick={handleSendMessage}>
                  <div className="icon"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </App>
  );
};

export default ChatPage;