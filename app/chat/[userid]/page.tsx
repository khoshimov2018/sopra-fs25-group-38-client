'use client';

import React, { useEffect, useState, useRef } from "react";
import {useParams} from "next/navigation";
import { UserOutlined, MessageOutlined, FilterOutlined, LogoutOutlined } from "@ant-design/icons";
import { useMessage } from "@/hooks/useMessage";
import useLocalStorage from "@/hooks/useLocalStorage";
import { App } from "antd";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import Logo from "@/components/Logo";
import "../../styles/chat.css";
import styles from "@/styles/main.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from "marked"; // 导入 marked 库
import { getApiDomain } from "@/utils/domain";

const ChatPage: React.FC = () => {
  const [userMessages, setUserMessages] = useState<{ id: number; text: string; sender: string; timeStamp: number; avatar: string| null }[]>([]);
  const [otherMessages, setOtherMessages] = useState<{ id: number; text: string; sender: string; timeStamp: number; avatar: string| null}[]>([]);
  const [channels, setChannels] = useState<{ channelId: number; channelName: string; supportingText?: string }[]>([
    {
      channelId: -1, // 特殊 ID 表示 AI Advisor
      channelName: "AI Advisor",
      supportingText: "Hello! How can I assist you?",
    },
  ]);
  const [messages, setMessages] = useState<{ id: number; text: string; sender: string; timeStamp: number; avatar: string | null }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const apiService = useApi();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);  // Track selected chat
  const Your_API_Key = "AIzaSyAA9DyJQQeK-E9E1PIblN7ay-g4PlwKbVw"
  const genAI = new GoogleGenerativeAI(Your_API_Key);
  const [userAvatar, setUserAvatar] = useState("/default-user-avatar.png"); // 默认头像
  const aiAvatar = "/AI-Icon.svg";  // 你可以使用本地或外部的头像路径

  // 引用用于滚动到最新消息
  const messagesEndRef = useRef<HTMLDivElement | null >(null);
  const { userid } = useParams(); // 获取动态路由中的 userid
  const { message, contextHolder } = useMessage();
  const { clear: clearToken } = useLocalStorage<string>("token", "");

  // 定义 ChatParticipantGetDTO 类型
  interface ChatParticipantGetDTO {
    userId: number;
    userName: string;
    userProfileImage: string;
    role: string;
  }

  // 定义 ChatChannelGetDTO 类型
  interface ChatChannelGetDTO {
    channelId: number;
    channelName: string;
    channelType: 'individual' | 'group'; // 或者你可以直接使用字符串类型 'string'，不过使用具体的枚举值会更好
    channelProfileImage: string;
    createdAt: string;
    updatedAt: string;
    participants: ChatParticipantGetDTO[];
  }

  interface MessageGetDTO {
    messageId: Number;
    senderId: Number;
    channelId: Number;
    senderProfileImage: String;
    context: String;
    timestamp: String;
  }

  const defaultAIMessage = {
    id: 1,
    text: "Hello! How can I assist you?",
    sender: "AI Advisor",
    timeStamp: Date.now(),
    avatar: userAvatar
  };


  useEffect(() => {
    const fetchMatchedUsers = async (userId: number) => {
      try {
        const response = await apiService.get<ChatChannelGetDTO[]>(`/chat/channels/user/${userId}`);
        console.log('Fetched chat channels:', response);
        const data = response;
  
        const mappedData = data.map(channel => {
          const latestMessage = channel.updatedAt ? `Last message at ${new Date(channel.updatedAt).toLocaleString()}` : "No messages yet";
          if (channel.channelType === 'individual') {
            // 找出参与者中不是自己的那一位
            const targetUser = channel.participants.find(p => p.userId !== userId);
            if (!targetUser) return null; // 安全校验
  
            return {
              channelId: targetUser.userId,
              channelName: targetUser.userName,
              supportingText: latestMessage,
            };
          } else {
            // 群聊逻辑：使用频道信息
            return {
              channelId: channel.channelId, // 用 channelId 作为唯一标识
              channelName: channel.channelName,
              supportingText: latestMessage,
            };
          }
        }).filter(Boolean); // 过滤 null
  
        setChannels(mappedData as { channelId: number; channelName: string; supportingText?: string }[]);
        console.log('Mapped matched users:', mappedData);
      } catch (error) {
        console.error("Failed to fetch chat channels:", error);
      }
    };
  
    const intervalId = setInterval(fetchMatchedUsers, 2000000000000); // 每 200ms 获取频道列表
    return () => clearInterval(intervalId); // 清理定时器
  }, [userid]);

  // Fetching messages for selected channel
  useEffect(() => {
    if (!selectedChannel) return;
  
    const fetchMessages = async () => {
      try {
        const response = await apiService.get<MessageGetDTO[]>(`/chat/channels/${selectedChannel}`);
        const data = response;
  
        const mappedMessages = data.map(message => ({
          id: Number(message.messageId),
          text: String(message.context),
          sender: String(message.senderId),
          timeStamp: new Date(String(message.timestamp)).getTime(),
          avatar: String(message.senderProfileImage) || null,
        }));
  
        setMessages(mappedMessages);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };
  
    const intervalId = setInterval(fetchMessages, 2000000000000); // 每 200ms 获取消息
    return () => clearInterval(intervalId); // 清理定时器
  }, [selectedChannel]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [userMessages, otherMessages,messages]);
 
  const updateMessageList = (sender: string, text: string) => {
    if (sender === "AI Advisor") {
      // 直接更新 AI Advisor 的 supporting text
      setChannels((prevChannels) =>
        prevChannels.map((channel) =>
          channel.channelName === "AI Advisor"
            ? { ...channel, supportingText: text }
            : channel
        )
      );
    } else {
      // 普通用户的逻辑
      setChannels((prevChannels) =>
        prevChannels.map((channel) =>
          channel.channelName === sender
            ? { ...channel, supportingText: text }
            : channel
        )
      );
    }
  };

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
      if (selectedChannel === "AI Advisor") {
        // **AI Advisor 的处理逻辑**
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
        // 更新 AI Advisor 的 supporting text
        updateMessageList("AI Advisor", aiReply);
      } else  {
        // For noraml users
        try {
          const messagePostDTO = {
            senderId: 1, // 假设当前用户 ID 为 1
            context: messageText,
          };
      
          const response = await apiService.post<MessageGetDTO>(
            `/chat/${selectedChannel}/message`,
            messagePostDTO
          );
      
          const data = response; // 如果你的 apiService 已经封装了 response.data
      
          const serverMessage = {
            id: Number(data.messageId),
            text: String(data.context), // Ensure text is a primitive string
            sender: String(data.senderId) === "1" ? "You" : String(data.senderId),
            timeStamp: new Date(String(data.timestamp)).getTime(),
            avatar: data.senderProfileImage ? String(data.senderProfileImage) : null, // Ensure avatar is a primitive string or null
          };
      
          // 更新当前用户的消息列表
          setUserMessages((prevMessages) => [...prevMessages, serverMessage]);
      
          // 同步更新频道预览内容
          if (selectedChannel) {
            updateMessageList(String(selectedChannel), String(serverMessage.text));
          }
      
        } catch (error) {
          console.error("消息发送失败：", error);
      
          const errorMessage = {
            id: Date.now(),
            text: "Failed in sending messages, please try again later",
            sender: "Server",
            timeStamp: Date.now(),
            avatar: null,
          };
      
          setOtherMessages((prevMessages) => [...prevMessages, errorMessage]);
        }
      }
    } catch (error) {
      console.error("消息发送失败：", error);
      const errorMessage = {
        id: Date.now(),
        text: "Failed in sending messages, please try again later",
        sender: selectedChannel === "AI Advisor" ? "AI Advisor" : "Server",
        timeStamp: Date.now(),
        avatar: selectedChannel === "AI Advisor" ? aiAvatar : null,
      };
      setOtherMessages((prevMessages) => [...prevMessages, errorMessage]);
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

  // 处理选择聊天对象

  const handleSelectChat = (chatName: string | number) => {
    setSelectedChannel(chatName.toString());
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
              <div className="message-list-header">Matched Users</div>
              <div className="message-list">
                {/* AI Advisor 始终置顶 */}
                <div className="message-item" onClick={() => handleSelectChat("AI Advisor")}>
                  <div className="avatar" style={{ backgroundImage: `url(${aiAvatar})` }}></div>
                  <div className="content">
                    <div className="headline">AI Advisor</div>
                    <div className="supporting-text">
                    {
                      channels.find((channel) => channel.channelName === "AI Advisor")?.supportingText ||
                      "Hello! How can I assist you?"
                    }
                    </div>
                  </div>
                </div>

                {/* 渲染匹配用户 */}
                {channels
                  .filter((user) => user.channelId !== -1)
                  .map((user) => (
                  <div
                    key={user.channelId}
                    className={`message-item ${selectedChannel === user.channelName ? "selected" : ""}`}
                    onClick={() => setSelectedChannel(user.channelName)}
                  >
                    <div className="avatar"></div>
                    <div className="content">
                      <div className="headline">{user.channelName}</div>
                      <div className="supporting-text">{user.supportingText || "No messages yet"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧聊天页面 */}
            <div className="chat-page">
                {/* 动态显示对方的用户名 */}
                <div className="chat-header">
                  {selectedChannel ? `Chat with ${selectedChannel}` : "Select a chat"}
                </div>
                <div className="chat-content">
                    {/* AI Advisor 默认消息，每次都显示 AI 头像 */}
                    {selectedChannel=== "AI Advisor" && aiAvatar && (
                        <div key={defaultAIMessage.id} className="chat-message">
                            <img className="avatar" src={aiAvatar} alt="AI Avatar" />
                            <div className="message-bubble">{defaultAIMessage.text}</div>
                        </div>
                    )}

                {/* 渲染所有消息 */}
                {[...otherMessages, ...userMessages]
                  .sort((a, b) => a.timeStamp - b.timeStamp) // 按时间戳排序
                  .map((message) => (
                    <div key={message.id} className={`chat-message ${message.sender === "You" ? "you" : ""}`}>
                      {message.sender !== "You" && (
                        <img
                          className="avatar"
                          src={message.avatar || "/default-avatar.png"}
                          alt="Avatar"
                        />
                      )}
                      <div className="message-bubble">{renderMarkdown(message.text)}</div>
                    </div>
                  ))}
                  {/* 添加一个空的 div 作为滚动目标 */}
                  <div ref={messagesEndRef}></div>  
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
                {selectedChannel === "AI Advisor" && (
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