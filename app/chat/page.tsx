"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserOutlined, MessageOutlined, FilterOutlined, LogoutOutlined } from "@ant-design/icons";
import { useMessage } from "@/hooks/useMessage";
import useLocalStorage from "@/hooks/useLocalStorage";
import { App } from "antd";
import Link from "next/link";
import Logo from "@/components/Logo";
import "../styles/chat.css";
import styles from "@/styles/main.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { timeStamp } from "console";
import { marked } from "marked"; // 导入 marked 库

const ChatPage: React.FC = () => {
  const [userMessages, setUserMessages] = useState<{ id: number; text: string; sender: string; timeStamp: number; avatar: string| null }[]>([]);
  const [otherMessages, setOtherMessages] = useState<{ id: number; text: string; sender: string; timeStamp: number; avatar: string| null}[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);  // Track selected chat
  const Your_API_Key = "AIzaSyAA9DyJQQeK-E9E1PIblN7ay-g4PlwKbVw"
  const genAI = new GoogleGenerativeAI(Your_API_Key);
  const [userAvatar, setUserAvatar] = useState("/default-user-avatar.png"); // 默认头像

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
    timeStamp: Date.now(),
    avatar: userAvatar
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
        updateMessageList("Opponent", data.text);
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

//   useEffect(() => {
//     fetch(`/api/getUserAvatar?userId=${currentUserId}`)
//         .then((res) => res.json())
//         .then((data) => setUserAvatar(data.avatar || "/default-user-avatar.png"));
// }, []);

  const updateMessageList = (sender: string, text: string) => {
    setOtherMessages((prevMessages) => {
      const existingMessageIndex = prevMessages.findIndex((msg) => msg.sender === sender);

      if (existingMessageIndex !== -1) {
        // 如果消息列表中已经存在该用户，更新 supporting text
        const updatedMessages = [...prevMessages];
        updatedMessages[existingMessageIndex] = {
          ...updatedMessages[existingMessageIndex],
          text, // 更新 supporting text
        };
        return updatedMessages;
      } else {
        // 如果消息列表中不存在该用户，添加新消息
        return [
          ...prevMessages,
          { id: prevMessages.length + 1, text, sender, timeStamp: Date.now(), avatar: null },
        ];
      }
    });
  };

  if (!isClient) {
    return null; // 在客户端渲染之前不渲染任何内容
  }

  const handleSendMessage = async (customPrompt?: string, quickReplyMessage?: string) => {
    const messageText = quickReplyMessage || inputValue.trim();
    if (messageText === "") return;
  
    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: "You",
      timeStamp: Date.now(),
      avatar: userAvatar,
    };
    setUserMessages((prevMessages) => [...prevMessages, userMessage]);
  
    // 如果是用户输入的消息，清空输入框
    if (!quickReplyMessage) {
      setInputValue("");
    }
  
    try {
      const prompt = customPrompt || `
        You are a professional study advisor with a PhD in diverse fields. Please answer in an academic way and briefly. Your answer should be less than 100 words.
        The conversation so far:
        ${[...otherMessages, ...userMessages, userMessage]
          .map((msg) => `${msg.sender}: ${msg.text}`)
          .join("\n")}
        AI Advisor:`;
  
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiReply = await response.text();
  
      const aiMessage = {
        id: Date.now(),
        text: aiReply,
        sender: "AI Advisor",
        timeStamp: Date.now(),
        avatar: aiAvatar,
      };
      setOtherMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("AI 回复失败：", error);
      const errorMessage = {
        id: Date.now(),
        text: "AI 回复失败，请稍后再试。",
        sender: "AI Advisor",
        timeStamp: Date.now(),
        avatar: aiAvatar,
      };
      setOtherMessages((prevMessages) => [...prevMessages, errorMessage]);
  
      // 更新消息列表中的 AI 错误消息
      updateMessageList("AI Advisor", "AI 回复失败，请稍后再试。");
    }
  };

  // 渲染 Markdown 内容到页面
  const renderMarkdown = (markdownText: string) => {
    const htmlContent = marked(markdownText, { async: false }); // 将Markdown转成HTML
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  const handleQuickReplySuggestion = () => {
    const quickReplyMessage = "Can you give me a suggestion on study?";
    const prompt = `
      You have many experiences in instructing study so you know how to advise intuitively by asking sutdents which course they want to take if you do not know.
      Please answer briefly and directly.
      The conversation so far:
      ${[...otherMessages, ...userMessages]
        .map((msg) => `${msg.sender}: ${msg.text}`)
        .join("\n")}
      AI Advisor:`;
  
    handleSendMessage(prompt, quickReplyMessage);
  };
  
  const handleQuickReplySchedule = () => {
    const quickReplyMessage = "Can you help me schedule my study?";
    const prompt = `
      You are a great planner and you know how to schedule students's study based on their weaknesses and strengths.
      You could generate a result based on some simple questions and modify it based on students' requirements.
      Please give a table if you are sure it is a perfect timeslot for students' study.
      The conversation so far:
      ${[...otherMessages, ...userMessages]
        .map((msg) => `${msg.sender}: ${msg.text}`)
        .join("\n")}
      AI Advisor:`;
  
    handleSendMessage(prompt, quickReplyMessage);
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
              <Link href="/profile">
                <button className={styles.iconButton}><UserOutlined /></button>
              </Link>
              <Link href="/chat">
                <button className={styles.iconButton}><MessageOutlined /></button>
              </Link>
              <button className={styles.iconButton} onClick={handleLogout}><FilterOutlined /></button>
              <button
                className={styles.iconButton}
                onClick={actualLogout}
              >
                <LogoutOutlined />
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
                      <div className="supporting-text">
                        {otherMessages.find((msg) => msg.sender === "AI Advisor")?.text || "Hello! How can I assist you?"}
                      </div>
                    </div>
                  </div>

                  {/* 渲染其他用户的消息 */}
                  {otherMessages
                    .filter((message) => message.sender !== "You" && message.sender !== "AI Advisor")
                    .map((message) => (
                      <div
                        key={message.id}
                        className="message-item"
                        onClick={() => handleSelectChat(message.sender)}
                      >
                        <div className="avatar"></div>
                        <div className="content">
                          <div className="headline">{message.sender}</div>
                          <div className="supporting-text">{message.text}</div>
                        </div>
                      </div>
                    ))}
                </div>
            </div>

            {/* 右侧聊天页面 */}
            <div className="chat-page">
                {/* 动态显示对方的用户名 */}
                <div className="chat-header">
                    {selectedChat ? selectedChat : "Select a chat"}
                </div>
                <div className="chat-content">
                    {/* AI Advisor 默认消息，每次都显示 AI 头像 */}
                    {selectedChat === "AI Advisor" && aiAvatar && (
                        <div key={defaultAIMessage.id} className="chat-message">
                            <img className="avatar" src={aiAvatar} alt="AI Avatar" />
                            <div className="message-bubble">{defaultAIMessage.text}</div>
                        </div>
                    )}

                {/* 渲染所有消息 */}
                {[...otherMessages, ...userMessages]
                  .sort((a, b) => a.timeStamp - b.timeStamp) // 按时间戳排序，保证正确的对话顺序
                  .map((message) => (
                    <div key={message.id} className={`chat-message ${message.sender === "You" ? "you" : ""}`}>
                      {/* AI 消息或其他用户的消息都显示头像 */}
                      {message.sender !== "You" && (
                        <img className="avatar" src={message.sender === "AI" ? aiAvatar : message.avatar || "/default-avatar.png"} alt="Avatar" />
                      )}
                      <div className="message-bubble">{renderMarkdown(message.text)}</div>
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
                {/* Quick Reply 按钮容器 */}
                {selectedChat === "AI Advisor" && (
                  <div className="quick-reply-container">
                    <div
                      className="quick-reply-bubble"
                      onClick={handleQuickReplySuggestion}
                    >
                      Sugeestion
                    </div>
                    <div
                      className="quick-reply-bubble"
                      onClick={handleQuickReplySchedule}
                    >
                      Scheduler
                    </div>
                    {/* 如果需要更多按钮，可以继续添加 */}
                  </div>
                )}
                <div className="send-button" onClick={() => handleSendMessage()}>
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