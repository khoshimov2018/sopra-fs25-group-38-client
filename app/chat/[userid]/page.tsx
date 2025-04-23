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

const GroupModal: React.FC<{
  visible: boolean;
  mode: "create" | "update"; // 区分创建和更新模式
  onClose: () => void;
  onSubmit: (selectedUsers: number[], channelName?: string) => void;
  existingUsers?: number[]; // 已有用户的 ID 列表（仅更新模式需要）
  allUsers: { userId: number; userName: string }[]; // 所有匹配用户
}> = ({ visible, mode, onClose, onSubmit, existingUsers = [], allUsers }) => {
  const [selectedUsers, setSelectedUsers] = useState<number[]>(existingUsers);
  const [channelName, setChannelName] = useState<string>("");

  useEffect(() => {
    if (mode === "update") {
      setSelectedUsers(existingUsers); // 更新模式下初始化选中已有用户
    } else {
      setSelectedUsers([]); // 创建模式下清空选中用户
    }
  }, [mode, existingUsers]);

  const handleUserSelect = (userId: number) => {
    if (!existingUsers.includes(userId)) {
      setSelectedUsers((prevSelected) =>
        prevSelected.includes(userId)
          ? prevSelected.filter((id) => id !== userId) // 如果已选中则取消选择
          : [...prevSelected, userId] // 否则添加到选中列表
      );
    }
  };

  const handleSubmit = () => {
    if (mode === "create" && !channelName.trim()) {
      alert("Please provide a group name!");
      return;
    }
    onSubmit(selectedUsers, channelName.trim());
  };

  return visible ? (
    <div className="group-modal">
      <div className="group-modal-content">
        <h3>{mode === "create" ? "Create Group" : "Update Group"}</h3>
        {mode === "create" && (
          <input
            type="text"
            placeholder="Enter group name"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
          />
        )}
        <div className="user-list">
          {allUsers.map((user) => {
            const isExistingUser = existingUsers.includes(user.userId);
            return (
              <div
                key={user.userId}
                className={`user-item ${isExistingUser ? "existing" : selectedUsers.includes(user.userId) ? "selected" : ""}`}
                onClick={() => handleUserSelect(user.userId)}
                style={isExistingUser ? { pointerEvents: "none", opacity: 0.5 } : {}}
              >
                <div className="content">
                  <div className="headline">{user.userName}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="group-modal-actions">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="submit-button" onClick={handleSubmit}>
            {mode === "create" ? "Create" : "Update"}
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

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
  const [isMessagesLoading, setIsMessagesLoading] = useState(false); // 控制消息加载状态
  const [isBlockPanelVisible, setIsBlockPanelVisible] = useState(false); // 控制 Block Panel 显示
  const [isReportPanelVisible, setIsReportPanelVisible] = useState(false); // 控制 Report Panel 显示
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null); // 当前选中的对方用户 ID
  const [reportReason, setReportReason] = useState<string>(""); // 存储用户输入的举报理由
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
  const [typingStatus, setTypingStatus] = useState(false); // 存储对方的 typing 状态
  const [groupModalMode, setGroupModalMode] = useState<"create" | "update">("create"); // 区分创建和更新模式

  // Used for scrolling to the latest message.
  const messagesEndRef = useRef<HTMLDivElement | null >(null);
  const { userid : rawUserId} = useParams();
  const parsedUserId = Array.isArray(rawUserId)
    ? parseInt(rawUserId[0], 10)
    : rawUserId
    ? parseInt(rawUserId, 10)
    : undefined;
  const { message, contextHolder } = useMessage();
  const { clear: clearToken } = useLocalStorage<string>("token", "");
  const [isLoading, setIsLoading] = useState(false); // 控制加载状态

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

  interface UserTypingStatusPushDTO {
    userId: number;
    typing: boolean;
  }


  useEffect(() => {
    if (typeof window === "undefined") return;
  
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      console.error("Token is missing. Redirecting to /main.");
      window.location.href = "/main"; // 重定向到 /main
      return;
    }
  
    if (!parsedUserId) {
      console.error("User ID is missing. Redirecting to /main.");
      window.location.href = "/main"; // 重定向到 /main
      return;
    }
  
    console.log("Token and User ID are valid. Proceeding with ChatPage.");
  }, [parsedUserId]);

  const handleTypingStatus = async (isTyping: boolean) => {
    if (!parsedUserId || !selectedChannel) {
      console.error("User ID or selected channel is not defined.");
      return;
    }
  
    const typingStatus: UserTypingStatusPushDTO = {
      userId: parsedUserId,
      typing: isTyping,
    };
  
    try {
      await apiService.put(`/chat/typing`, typingStatus);
      console.log(`Typing status updated to ${isTyping} for user ${parsedUserId}`);
    } catch (error) {
      console.error("Failed to update typing status:", error);
    }
  };

  const handleBlock = () => {
    const currentChannel = channels.find(
      (channel) => String(channel.channelId) === String(selectedChannel)
    );
  
    if (!currentChannel || !currentChannel.participants) {
      console.error("Selected channel does not exist or has no participants.");
      return;
    }
  
    const participant = currentChannel.participants.find((p) => p.userId !== parsedUserId);
    if (!participant) {
      console.error("No participant found to block.");
      return;
    }
  
    setSelectedParticipant(participant.userId); // 设置对方用户 ID
    setIsBlockPanelVisible(true); // 打开 Block Panel
    console.log("I am trying to open the block panel",isBlockPanelVisible)
  };

  const handleSubmitBlock = async () => {
    if (!parsedUserId || !selectedParticipant) {
      console.error("Blocker ID or Blocked User ID is not defined.");
      return;
    }
  
    const blockDTO = {
      blockerId: parsedUserId,
      blockedUserId: selectedParticipant,
    };
  
    try {
      await apiService.post("/blocks", blockDTO);
      message.success("User blocked successfully!");
      setIsBlockPanelVisible(false); // 关闭 Block Panel
      setSelectedParticipant(null); // 清空选中用户
    } catch (error) {
      console.error("Failed to block user:", error);
      message.error("Failed to block user, please try again later.");
    }
  };

  const handleReport = () => {
    setIsBlockPanelVisible(false); // 关闭 Block Panel
    setIsReportPanelVisible(true); // 打开 Report Panel
  };

  const handleSubmitReport = async () => {
    if (!parsedUserId || !selectedParticipant || !reportReason.trim()) {
      message.error("Please provide a valid reason for reporting.");
      return;
    }
  
    const reportDTO = {
      reporterId: parsedUserId,
      reportedId: selectedParticipant,
      reason: reportReason.trim(),
    };
  
    try {
      await apiService.post("/reports", reportDTO);
      message.success("Report submitted successfully!");
      setIsReportPanelVisible(false); // 关闭 Report Panel
      setReportReason(""); // 清空输入框
      setSelectedParticipant(null); // 清空选中用户
    } catch (error) {
      console.error("Failed to submit report:", error);
      message.error("Failed to submit report, please try again later.");
    }
  };

  const fetchTypingStatus = async (userId: number) => {
    const url = `/chat/typing/${userId}`;
    console.log(`Fetching typing status from URL: ${url}`); // 打印完整的 URL
    try {
      const response = await apiService.get<UserTypingStatusPushDTO>(url);
      return response.typing;
    } catch (error) {
      console.error(`Failed to fetch typing status for user ${userId}:`, error);
      return false; // 默认返回 false
    }
  };

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
  setGroupModalMode("create");
  setIsGroupModalVisible(true);
};

// 关闭创建群聊浮层
const handleCloseGroupModal = () => {
  setIsGroupModalVisible(false);
  setSelectedUsers([]); // 清空选中的用户
};

const handleSubmitGroupModal = async (selectedUsers: number[], channelName?: string) => {
  if (groupModalMode === "create") {
    // 创建群聊逻辑
    if (selectedUsers.length === 0) {
      message.error("Please select at least one user!");
      return;
    }

    const channelData = {
      channelName: channelName || "New Group",
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
  } else if (groupModalMode === "update") {
    // 更新群聊逻辑
    const currentChannel = channels.find(
      (channel) => String(channel.channelId) === String(selectedChannel)
    );

    if (!currentChannel || currentChannel.channelType !== "group") {
      console.error("Selected channel is not a group or does not exist.");
      return;
    }

    const channelId = currentChannel.channelId;

    const channelData = {
      channelName: currentChannel.channelName,
      channelType: "group",
      participantIds: [parsedUserId, ...selectedUsers], // 确保当前用户也在 participants 中
    };

    try {
      await apiService.put(`/chat/channels/${channelId}`, channelData);
      message.success("Group updated successfully!");
      setIsGroupModalVisible(false);
      setSelectedUsers([]);
    } catch (error) {
      console.error("Failed to update group:", error);
      message.error("Failed to update group, please try again later.");
    }
  }
};

  useEffect(() => {
    if (parsedUserId === undefined) return;

    const fetchMatchedUsers = async (userid: number) => {
      try {
        if (userid) {
          const response = await apiService.get<ChatChannelGetDTO[]>(`/chat/channels/user/${userid}`);
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

  // 每 200ms 调用一次 fetchMatchedUsers
  const interval = setInterval(() => {
    fetchMatchedUsers(parsedUserId);
  }, 200);

  // 清除定时器
  return () => clearInterval(interval);
}, [parsedUserId]);

  // Fetching messages for selected channel
  const fetchMessages = async (channelId: string) => {
    try {
      // setIsMessagesLoading(true); // 开始加载消息
      const currentChannel = channels.find((channel) => String(channel.channelId) === channelId);
      if (!currentChannel) {
        console.error("Channel not found!");
        return;
      }
  
      const url1 = `/chat/channels/${channelId}`;
      const response = await apiService.get<MessageGetDTO[]>(url1);
      console.log("Messages", response);
  
      if (!Array.isArray(response)) {
        console.error("Expected an array of messages but got:", response);
        return;
      }
  
      const mappedMessages = response.map((message) => ({
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
    // finally {
    //   setIsMessagesLoading(false); // 加载完成
    // }
  };

  useEffect(() => {
    if (!selectedChannel) return;
  
    const interval = setInterval(() => {
      fetchMessages(selectedChannel); // 每 200ms 调用一次 fetchMessages
    }, 200);
  
    // 清除定时器
    return () => clearInterval(interval);
  }, [selectedChannel]);

  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }, [channelMessages]);

  useEffect(() => {
    if (!selectedChannel) return;

    // 获取当前频道的参与者（排除当前用户）
    const currentChannel = channels.find((channel) => String(channel.channelId) === String(selectedChannel));
    if (!currentChannel || currentChannel.channelType !== "individual") return;

    const participant = currentChannel.participants?.find((p) => p.userId !== parsedUserId);
    if (!participant) return;

    const participantId = participant.userId;

    const interval = setInterval(async () => {
      const isTyping = await fetchTypingStatus(participantId);
      setTypingStatus(isTyping);
    }, 200);

    return () => clearInterval(interval); // 清除定时器
  }, [selectedChannel, channels, parsedUserId]);
 

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
  
    // 如果是 AI Advisor 的会话
    if (selectedChannel === "AI Advisor") {
      try {
        setIsLoading(true); // 开始加载
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
          [selectedChannel]: [
            ...(prevMessages[selectedChannel] || []),
            userMessage, // 添加用户消息
            aiMessage, // 添加 AI 回复
          ],
        }));
      } catch (error) {
        console.error("AI Advisor message generation failed:", error);
      } finally {
        setIsLoading(false); // 加载完成
      }
      return;
    }
  
    // 非 AI Advisor 的会话逻辑
    const currentChannel = channels.find((channel) => String(channel.channelId) === String(selectedChannel));
    if (!currentChannel) {
      console.error("Channel not found!");
      return;
    }
  
    const channelId = currentChannel.channelId;
  
    try {
      const messagePostDTO = {
        senderId: parsedUserId, // 当前用户 ID
        context: messageText,
      };
  
      // 发送消息到服务端
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
  
      // 将服务端返回的消息添加到当前频道的消息列表中
      setChannelMessages((prevMessages) => ({
        ...prevMessages,
        [String(channelId)]: [
          ...(prevMessages[String(channelId)] || []),
          serverMessage, // 添加服务器返回的消息
        ],
      }));
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
      You have many experiences in instructing study so you know how to advise intuitively.
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
      You are a great planner and you know how to schedule one student's study based on his or her weaknesses and strengths.
      Please give a table if you are sure it is a perfect timeslot for one individual student's study.
      The conversation so far:
      ${[...otherMessages, ...userMessages]
        .map((msg) => `${msg.sender}: ${msg.text}`)
        .join("\n")}
      AI Advisor:`;
  
    handleSendMessage(prompt, quickReplyMessage);
  };

  // 处理选择聊天对象

  const handleSelectChat = (chatName: string | number) => {
    const channelId = chatName.toString();
    setSelectedChannel(channelId);
    fetchMessages(channelId); // 点击时立即加载消息
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

  useEffect(() => {
    console.log("isBlockPanelVisible:", isBlockPanelVisible);
    console.log("isReportPanelVisible:", isReportPanelVisible);
    console.log("selectedParticipant:", selectedParticipant);
  }, [isBlockPanelVisible, isReportPanelVisible, selectedParticipant]);

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
              <Link href={`/chat/${parsedUserId}`}>
                <button className={styles.iconButton}><MessageOutlined /></button>
              </Link>
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
                  ? typingStatus
                    ? "Typing..." // 如果对方正在输入
                    : channels.find((c) => String(c.channelId) === String(selectedChannel))?.channelName || selectedChannel
                  : "Select a chat"}
                  <div className="chat-header-actions">
                    {channels.find(
                      (channel) => String(channel.channelId) === String(selectedChannel)
                    ) && (
                      <>
                        {/* Individual 类型的频道 */}
                        {channels.find((channel) => String(channel.channelId) === String(selectedChannel))?.channelType === "individual" && (
                          <>
                            {/* 删除聊天按钮 */}
                            <button
                              className="icon-button"
                              onClick={handleBlock} // 点击时调用 handleBlock
                            >
                              <div className="icon icon-clear"></div>
                            </button>

                            {/* 创建群聊按钮 */}
                            <button
                              className="icon-button"
                              onClick={() => {
                                setGroupModalMode("create");
                                setSelectedUsers([]); // 清空选中用户
                                setIsGroupModalVisible(true); // 打开创建群聊浮窗
                              }}
                            >
                              <div className="icon icon-makingGroup"></div>
                            </button>
                          </>
                        )}

                        {/* Group 类型的频道 */}
                        {channels.find((channel) => String(channel.channelId) === String(selectedChannel))?.channelType === "group" && (
                          <>
                            {/* 更新群聊按钮 */}
                            <button
                              className="icon-button"
                              onClick={() => {
                                const currentChannel = channels.find(
                                  (channel) => String(channel.channelId) === String(selectedChannel)
                                );

                                if (!currentChannel) {
                                  console.error("Selected channel does not exist.");
                                  return;
                                }

                                // 更新群聊逻辑
                                setGroupModalMode("update");
                                const existingUserIds = currentChannel.participants?.map((p) => p.userId) ?? [];
                                setSelectedUsers(existingUserIds); // 设置已有用户为选中态
                                setIsGroupModalVisible(true); // 打开更新群聊浮窗
                              }}
                            >
                              <div className="icon icon-makingGroup"></div>
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="chat-content">
                {/* AI Advisor 默认消息 */}
                {selectedChannel === "AI Advisor" && aiAvatar && (
                  <div key={defaultAIMessage.id} className="chat-message">
                    <img className="avatar" src={aiAvatar} alt="AI Avatar" />
                    <div className="message-bubble">{defaultAIMessage.text}</div>
                  </div>
                )}

                {isMessagesLoading ? (
                    <div className="chat-loading">
                      <div className="spinner"></div>
                      <span>Loading Messages...</span>
                    </div>
                  ) : (
                    <>
                      {/* 渲染所有消息 */}
                      {[...(selectedChannel ? channelMessages[selectedChannel] || [] : [])]
                        .sort((a, b) => a.timeStamp - b.timeStamp) // 按时间戳排序
                        .map((message) => (
                          <div key={message.id} className={`chat-message ${message.sender === String(parsedUserId) ? "you" : ""}`}>
                            {message.sender !== String(parsedUserId) && (
                              <img
                                className="avatar"
                                src={
                                  message.sender === "AI Advisor"
                                    ? aiAvatar // AI Advisor 使用固定头像
                                    : channels.find((channel) => String(channel.channelId) === String(selectedChannel))?.participants?.find(
                                        (p) => String(p.userId) === message.sender
                                      )?.userProfileImage || "/default-avatar.png" // 普通用户从服务端读取头像
                                }
                                alt="Avatar"
                              />
                            )}
                            <div className="message-bubble">{renderMarkdown(message.text)}</div>
                          </div>
                        ))}
                      <div ref={messagesEndRef}></div>
                    </>
                  )}
                
                {/* 加载指示器 */}
                {isLoading && (
                  <div className="chat-loading">
                    <div className="spinner"></div>
                    <span>AI is thinking...</span>
                  </div>
                )}
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
                      onFocus={() => {
                        if (selectedChannel !== "AI Advisor") {
                          handleTypingStatus(true); // 用户开始输入时
                        }
                      }}
                      onBlur={() => {
                        if (selectedChannel !== "AI Advisor") {
                          handleTypingStatus(false); // 用户离开输入框时, 调试用
                        }
                      }}
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
            <GroupModal
              visible={isGroupModalVisible}
              mode={groupModalMode}
              onClose={() => setIsGroupModalVisible(false)}
              onSubmit={handleSubmitGroupModal}
              existingUsers={groupModalMode === "update" ? selectedUsers : []}
              allUsers={channels
                .filter((channel) => channel.channelType === "individual")
                .map((channel) => ({
                  userId: channel.participants?.[0]?.userId ?? -1,
                  userName: channel.channelName,
                }))}
            />
          )}
          {isBlockPanelVisible && (
            <div className="block-panel">
              <div className="card">
                <button className="close-button" onClick={() => setIsBlockPanelVisible(false)}>×</button>
                <h3>Block User</h3>
                <p>Are you sure you want to block this user?</p>
                <div className="button-group">
                  <button className="report-reasons" onClick={handleReport}>Report Reasons</button>
                  <button className="submit-button" onClick={handleSubmitBlock}>OK</button>
                </div>
              </div>
            </div>
          )}
          {isReportPanelVisible && (
            <div className="report-panel">
              <div className="form-forgot-password">
                <h3>Report User</h3>
                <div className="input-field">
                  <label className="label">Reason</label>
                  <textarea
                    className="input"
                    placeholder="Enter your reason here..."
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                </div>
                <div className="button-group">
                  <button className="cancel-button" onClick={() => setIsReportPanelVisible(false)}>Cancel</button>
                  <button className="submit-button" onClick={handleSubmitReport}>Submit</button>
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