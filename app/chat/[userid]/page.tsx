'use client';

import React, { useEffect, useState, useRef } from "react";
import {useParams} from "next/navigation";
import { UserOutlined, MessageOutlined, FilterOutlined, LogoutOutlined } from "@ant-design/icons";
import { useMessage } from "@/hooks/useMessage";
import useLocalStorage from "@/hooks/useLocalStorage";
import { App } from "antd";
import Link from "next/link";
import { ApiService } from "../../api/apiService";
import Logo from "@/components/Logo";
import "../../styles/chat.css";
import styles from "@/styles/main.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from "marked"; // 导入 marked 库

const ChatPage: React.FC = () => {
  const [userMessages, setUserMessages] = useState<{ id: number; text: string; sender: string; timeStamp: number; avatar: string| null }[]>([]);
  const [otherMessages, setOtherMessages] = useState<{ id: number; text: string; sender: string; timeStamp: number; avatar: string| null}[]>([]);
  const [channels, setChannels] = useState<{ channelId: number; channelName: string; supportingText?: string; channelType:string; participants?: ChatParticipantGetDTO[] }[]>([
    {
      channelId: -1, // 特殊 ID 表示 AI Advisor
      channelName: "AI Advisor",
      supportingText: "Hello! How can I assist you?",
      channelType:'individual'
    }
  ]);
  const [messages, setMessages] = useState<{ id: number; text: string; sender: string; timeStamp: number; avatar: string | null }[]>([]);
  const [channelMessages, setChannelMessages] = useState<Record<string, { id: number; text: string; sender: string; timeStamp: number; avatar: string | null }[]>>({});
  const [inputValue, setInputValue] = useState("");
  const apiService = new ApiService();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);  // Track selected chat
  const Your_API_Key = "AIzaSyAA9DyJQQeK-E9E1PIblN7ay-g4PlwKbVw"
  const genAI = new GoogleGenerativeAI(Your_API_Key);
  const [userAvatar, setUserAvatar] = useState("/default-user-avatar.png"); // 默认头像
  const aiAvatar = "/AI-Icon.svg";  // 你可以使用本地或外部的头像路径
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false); // 控制浮层显示
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]); // 存储选中的用户 ID

  // 引用用于滚动到最新消息
  const messagesEndRef = useRef<HTMLDivElement | null >(null);
  const { userid : rawUserId} = useParams();
  const parsedUserId = Array.isArray(rawUserId)
    ? parseInt(rawUserId[0], 10)
    : rawUserId
    ? parseInt(rawUserId, 10)
    : undefined;
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
    avatar: userAvatar,
    channelType: 'individual' // Provide a default or appropriate value
  };

// 打开创建群聊浮层
const handleCreateGroup = () => {
  setIsGroupModalVisible(true);
};

// 关闭创建群聊浮层
const handleCloseGroupModal = () => {
  setIsGroupModalVisible(false);
  setSelectedUsers([]); // 清空选中的用户
};

// 处理用户选择
const handleUserSelect = (userId: number) => {
  setSelectedUsers((prevSelected) =>
    prevSelected.includes(userId)
      ? prevSelected.filter((id) => id !== userId) // 如果已选中则取消选择
      : [...prevSelected, userId] // 否则添加到选中列表
  );
};

// 提交创建群聊请求
const handleSubmitGroup = async () => {
  console.log('当前选中的用户：', selectedUsers)
  if (selectedUsers.length === 0) {
    message.error("Please select at least one user!");
    return;
  }

  const channelName = prompt("Please give a name to this group", "New Group");
  if (!channelName) {
    message.error("The name should not be null!");
    return;
  }

  const channelData = {
    channelName,
    channelType: "group",
    participantIds: [parsedUserId, ...selectedUsers],
    channelProfileImage: "/default-group-avatar.png", // 默认群聊头像
  };

  try {
    const response = await apiService.post("/chat/channels", channelData);
    message.success("Your group is made successfully!");
    setIsGroupModalVisible(false);
    setSelectedUsers([]);
    console.log("创建的群聊信息：", response);
  } catch (error) {
    console.error("创建群聊失败：", error);
    message.error("Failed creating a group, please try again later.");
  }
};

  useEffect(() => {
    const fetchMatchedUsers = async (userid: number) => {
      try {
        if (userid) {
          const response = await apiService.get<ChatChannelGetDTO[]>(`/chat/channels/user/${userid}`);
          // const response = await apiService.get<ChatChannelGetDTO[]>(`/chat/channels`);
          console.log("Fetched chat channels:", response);
          const data = response;
    
          const mappedData = data.map((channel) => {
            const latestMessage = channel.updatedAt
              ? `Last message at ${new Date(channel.updatedAt).toLocaleString()}`
              : "No messages yet";
    
            // 处理 participants，移除当前用户
            const participants = channel.participants.filter((p) => p.userId !== userid);
    
            return {
              channelId: channel.channelId, // 频道 ID
              channelName: channel.channelType === "individual" && participants.length > 0
                ? participants[0].userName // 私聊时显示对方的名字
                : channel.channelName, // 群聊时显示群聊名称
              supportingText: latestMessage,
              channelType: channel.channelType,
              participants, // 存储移除当前用户后的参与者列表
            };
          });
    
          setChannels(mappedData as { channelId: number; channelName: string; supportingText?: string; channelType: string; participants: ChatParticipantGetDTO[] }[]);
          console.log("Mapped matched users:", mappedData);
        } else {
          console.error("userId is undefined!");
        }
      } catch (error) {
        console.error("Failed to fetch chat channels:", error);
      }
    };
  
    if (parsedUserId !== undefined) {
      fetchMatchedUsers(parsedUserId);
    }
  }, [parsedUserId]);

  // Fetching messages for selected channel
  useEffect(() => {
    if (!selectedChannel) return;

    const fetchMessages = async () => {
      try {
        const currentChannel = channels.find((channel) => String(channel.channelId) === String(selectedChannel));
        if (!currentChannel) {
          console.error("Channel not found!");
          return;
        }

        const channelId = currentChannel.channelId;
        console.log('current channelId', channelId)

        const response = await apiService.get<MessageGetDTO[]>(`/chat/channels/${channelId}`);
        const data = response;

        const mappedMessages = data.map((message) => ({
          id: Number(message.messageId),
          text: String(message.context),
          sender: String(message.senderId),
          timeStamp: new Date(String(message.timestamp)).getTime(),
          avatar: String(message.senderProfileImage) || null,
        }));

        setChannelMessages((prevMessages) => ({
          ...prevMessages,
          [String(channelId)]: mappedMessages, // 将消息存储到对应的频道
        }));
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();
  }, [selectedChannel]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [userMessages, otherMessages,messages]);
 

  const handleSendMessage = async (customPrompt?: string, quickReplyMessage?: string) => {
    const messageText = quickReplyMessage || inputValue.trim();
    if (messageText === "") return;
  
    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: String(parsedUserId), // 使用 parsedUserId 作为 sender
      timeStamp: Date.now(),
      avatar: userAvatar,
    };
  
    // 清空输入框
    if (!quickReplyMessage) {
      setInputValue("");
    }
  
    // 获取当前选中频道的 channelId
    const currentChannel = channels.find((channel) => String(channel.channelId) === String(selectedChannel));
    if (!currentChannel) {
      console.error("Channel not found!");
      return;
    }
  
    const channelId = currentChannel.channelId;
  
    // 将消息添加到当前频道的消息列表中
    setChannelMessages((prevMessages) => ({
      ...prevMessages,
      [String(channelId)]: [
        ...(prevMessages[String(channelId)] || []),
        //userMessage, // 添加用户消息
      ],
    }));
  
    try {
      if (selectedChannel === "AI Advisor") {
        // AI Advisor 的逻辑
        const prompt = customPrompt || `
          You are a professional study advisor with a PhD in diverse fields. Please answer in an academic way and briefly. Your answer should be less than 100 words.
          The conversation so far:
          ${[...(channelMessages[selectedChannel] || []), userMessage]
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
  
        setChannelMessages((prevMessages) => ({
          ...prevMessages,
          [String(channelId)]: [
            ...(prevMessages[String(channelId)] || []),
            aiMessage, // 添加 AI 回复
          ],
        }));
      } else {
        // 普通用户的逻辑
        const messagePostDTO = {
          senderId: parsedUserId, // 当前用户 ID
          context: messageText,
        };
  
        const response = await apiService.post<MessageGetDTO>(
          `/chat/${channelId}/message`, // 使用 channelId
          messagePostDTO
        );
  
        const data = response;
  
        const serverMessage = {
          id: Number(data.messageId),
          text: String(data.context),
          sender: String(data.senderId),
          timeStamp: new Date(String(data.timestamp)).getTime(),
          avatar: data.senderProfileImage ? String(data.senderProfileImage) : null,
        };
  
        setChannelMessages((prevMessages) => ({
          ...prevMessages,
          [String(channelId)]: [
            ...(prevMessages[String(channelId)] || []),
            serverMessage, // 添加服务器返回的消息
          ],
        }));
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
  
      setChannelMessages((prevMessages) => ({
        ...prevMessages,
        [String(channelId)]: [
          ...(prevMessages[String(channelId)] || []),
          errorMessage, // 添加错误消息
        ],
      }));
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
                      (channelMessages["AI Advisor"]?.length
                        ? channelMessages["AI Advisor"][channelMessages["AI Advisor"].length - 1].text
                        : "Hello! How can I assist you?")
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
                    className={`message-item ${String(selectedChannel) === String(user.channelId) ? "selected" : ""}`}
                    onClick={() => setSelectedChannel(String(user.channelId))}
                  >
                    <div className="avatar"></div>
                    <div className="content">
                      <div className="headline">{user.channelName}</div>
                      <div className="supporting-text">
                        {(channelMessages[String(user.channelId)]?.length &&
                          channelMessages[String(user.channelId)][channelMessages[String(user.channelId)].length - 1].text) ||
                          user.supportingText ||
                          "No messages yet"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧聊天页面 */}
            <div className="chat-page">
                {/* 动态显示对方的用户名 */}
                <div className="chat-header">
                {selectedChannel
                  ? `${channels.find((c) => String(c.channelId) === String(selectedChannel))?.channelName || selectedChannel}`
                  : "Select a chat"}
                  <div className="chat-header-actions">
                    {/* 创建群聊按钮，仅在选中 individual 类型的频道时显示 */}
                    {channels.find((channel) =>
                      String(channel.channelId) === String(selectedChannel) &&
                      channel.channelType === "individual"
                    ) && (
                      <>
                        <button className="icon-button" onClick={handleCreateGroup}>
                          <div className="icon icon-makingGroup"></div>
                        </button>
                        <button className="icon-button">
                          <div className="icon icon-clear"></div>
                        </button>
                      </>
                    )}
                  </div>
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
                  {[...(selectedChannel ? channelMessages[selectedChannel] || [] : [])]
                    .sort((a, b) => a.timeStamp - b.timeStamp) // 按时间戳排序
                    .map((message) => (
                      <div key={message.id} className={`chat-message ${message.sender === String(parsedUserId) ? "you" : ""}`}>
                        {message.sender !== String(parsedUserId) && (
                          <img
                            className="avatar"
                            src={
                              channels.find((channel) => String(channel.channelId) === String(selectedChannel))?.participants?.find(
                                (p) => String(p.userId) === message.sender
                              )?.userProfileImage || "/default-avatar.png"
                            }
                            alt="Avatar"
                          />
                        )}
                        <div className="message-bubble">{renderMarkdown(message.text)}</div>
                      </div>
                    ))}
                  <div ref={messagesEndRef}></div>
                </div>
                {selectedChannel && (
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
                )}
            </div>
          </div>
          {isGroupModalVisible && (
            <div className="group-modal">
              <div className="group-modal-content">
                <h3>To create a group by selecting users</h3>
                <div className="user-list">
                  {channels
                    .filter((channel) => channel.channelType === "individual") // 仅显示 individual 类型的用户
                    .map((user) => (
                      <div
                        key={user.channelId}
                        className={`user-item ${selectedUsers.includes(user.participants?.[0]?.userId ?? -1) ? "selected" : ""}`}
                        onClick={() => handleUserSelect(user.participants?.[0]?.userId ?? -1)}
                      >
                        <div className="content">
                          <div className="headline">{user.channelName}</div>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="group-modal-actions">
                  <button className="cancel-button" onClick={handleCloseGroupModal}>
                    Cancel
                  </button>
                  <button className="submit-button" onClick={handleSubmitGroup}>
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </App>
  );
};

export default ChatPage;