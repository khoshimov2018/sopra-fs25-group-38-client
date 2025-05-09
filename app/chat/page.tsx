'use client';

import React, { useEffect, useState, useRef } from "react";
import {useRouter} from "next/navigation";
import { UserOutlined, MessageOutlined, LogoutOutlined, InfoCircleOutlined } from "@ant-design/icons";
import NotificationBell from "@/components/NotificationBell";
import { useMessage } from "@/hooks/useMessage";
import useLocalStorage from "@/hooks/useLocalStorage";
import { App } from "antd";
import { useApi } from "@/hooks/useApi";
import Link from "next/link";
import { ApiService } from "../api/apiService";
import Logo from "@/components/Logo";
import "../styles/chat.css";
import styles from "@/styles/main.module.css";
import backgroundStyles from "@/styles/theme/backgrounds.module.css";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from "marked";
import { getApiDomain } from "@/utils/domain";
import InfoModal from "@/components/InfoModal";


const getUserItemClass = (userId: number, existingUsers: number[], selectedUsers: number[]): string => {
  if (existingUsers.includes(userId)) {
    return "existing";
  }
  if (selectedUsers.includes(userId)) {
    return "selected";
  }
  return "";
};

const GroupModal: React.FC<{
  visible: boolean;
  mode: "create" | "update";
  onClose: () => void;
  onSubmit: (selectedUsers: number[], channelName?: string) => void;
  existingUsers?: number[];
  allUsers: { userId: number; userName: string }[];
  selectedUsers: number[];
  setSelectedUsers: React.Dispatch<React.SetStateAction<number[]>>;
}> = ({ visible, mode, onClose, onSubmit, existingUsers = [], allUsers, selectedUsers, setSelectedUsers }) => {
  const [channelName, setChannelName] = useState<string>("");

  const handleUserSelect = (userId: number) => {
    if (mode === "update" && existingUsers.includes(userId)) {
      return;
    }
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
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
          {allUsers.length === 0 ? (
            <div className="no-users-message">No selectable users.</div>
          ) : (
            allUsers.map((user) => (
              <button
                key={user.userId}
                className={`user-item ${
                  getUserItemClass(user.userId, existingUsers, selectedUsers)
                }`}
                onClick={() => handleUserSelect(user.userId)}
                style={
                  mode === "update" && existingUsers.includes(user.userId)
                    ? { pointerEvents: "none", opacity: 0.5 }
                    : {}
                }
              >
                <div className="content">
                  <div className="headline">{user.userName}</div>
                </div>
              </button>
            ))
          )}
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
  const [userMessages] = useState<{ id: number; text: string; sender: string; timeStamp: number; avatar: string| null }[]>([]);
  const [otherMessages] = useState<{ id: number; text: string; sender: string; timeStamp: number; avatar: string| null}[]>([]);
  const [channels, setChannels] = useState<{ channelId: number; channelName: string; supportingText?: string; channelType:string; participants?: ChatParticipantGetDTO[]; channelProfileImage?: string }[]>([
    {
      channelId: -1,
      channelName: "AI Advisor",
      supportingText: "Hello! How can I assist you?",
      channelType:'undefined'
    }
  ]);
  const [isMessagesLoading] = useState(false);
  const [isBlockPanelVisible, setIsBlockPanelVisible] = useState(false);
  const [isReportPanelVisible, setIsReportPanelVisible] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState<string>("");
  const [channelMessages, setChannelMessages] = useState<Record<string, { id: number; text: string; sender: string; timeStamp: number; avatar: string | null }[]>>({});
  const [inputValue, setInputValue] = useState("");
  const apiService = new ApiService();
  const apiService_token = useApi();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);  // Track selected chat
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const { value: hasSeenChatInfoModal, set: setHasSeenChatInfoModal } =
    useLocalStorage<boolean>("hasSeenChatInfoModal", false);
  // Using the Next.js public environment variable for the API key
  const Your_API_Key = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
  const genAI = new GoogleGenerativeAI(Your_API_Key);
  const aiAvatar = "/AI-Icon.svg";
  const defaultGroupicon = '/Group_icon.svg';
  const defaulindividualicon = '/defaultIndividualIcon.svg';
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [typingStatus, setTypingStatus] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState<"create" | "update">("create");

  // Used for scrolling to the latest message.
  const messagesEndRef = useRef<HTMLDivElement | null >(null);
  const [parsedUserId, setParsedUserId] = useState<number | undefined>(undefined);
  const [currentUserImage, setCurrentUserImage] = useState<string | null>(null);
  const { message, contextHolder } = useMessage();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const [userStatus, setUserStatus] = useState<string>("OFFLINE");
  interface ChatParticipantGetDTO {
    userId: number;
    userName: string;
    userProfileImage: string;
    role: string;
  }

  interface ChatChannelGetDTO {
    channelId: number;
    channelName: string;
    channelType: 'individual' | 'group';
    channelProfileImage: string;
    createdAt: string;
    updatedAt: string;
    participants: ChatParticipantGetDTO[];
  }

  interface MessageGetDTO {
    messageId: number;
    senderId: number;
    channelId: number;
    senderProfileImage: String;
    context: String;
    timestamp: String;
  }

  interface UserTypingStatusPushDTO {
    userId: number;
    typing: boolean;
  }


    const hasFetchedUserId = useRef(false);

    useEffect(() => {
      if (!hasFetchedUserId.current) {
        fetchUserId();
        hasFetchedUserId.current = true;
      }
    }, [router, message]);

    const fetchUserId = async () => {
      try {
        const localStorageToken = localStorage.getItem("token");
        const effectiveToken = token || localStorageToken;
        console.log("What is effectiveToken", effectiveToken);
        console.log("What is Token", token);
        console.log("What is localStorageToken", localStorageToken);

    
        if (!effectiveToken) {
          message.error("Invalid token format. Please login again.123");
          actualLogout();
          return;
        }
    
        const tokenValue = effectiveToken.startsWith('Bearer ') ? effectiveToken.substring(7) : effectiveToken;
        const apiUser = await apiService_token.userService?.getUserByToken(tokenValue);
    
        if (!apiUser?.id) {
          throw new Error("Invalid token: userId not found");
        }
    
        setParsedUserId(apiUser.id);
        setCurrentUserImage(apiUser.profilePicture);
      } catch (error) {
          message.error("Network error. Please check your connection.");
        }
    };

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
  
    if (!currentChannel?.participants) {
      console.error("Selected channel does not exist or has no participants.");
      return;
    }
  
    const participant = currentChannel.participants.find((p) => p.userId !== parsedUserId);
    if (!participant) {
      console.error("No participant found to block.");
      return;
    }
  
    setSelectedParticipant(participant.userId);
    setIsBlockPanelVisible(true);
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
      setIsBlockPanelVisible(false);
      setSelectedParticipant(null);
      console.log("now loading matched users again with my userId",parsedUserId)
      fetchMatchedUsers(parsedUserId);
      setSelectedChannel(null);
      console.log("current Channel", selectedChannel);
    } catch (error) {
      console.error("Failed to block user:", error);
      message.error("Failed to block user, please try again later.");
    }
  };

  const handleReport = () => {
    setIsBlockPanelVisible(false);
    setIsReportPanelVisible(true);
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
      setIsReportPanelVisible(false);
      setReportReason(""); 
      fetchMatchedUsers(parsedUserId);
      setSelectedParticipant(null);
    } catch (error) {
      console.error("Failed to submit report:", error);
      message.error("Failed to submit report, please try again later.");
    }
  };

  const fetchTypingStatus = async (userId: number) => {
    if (!userId) return;
    const url = `/chat/typing/${userId}`;
    console.log(`Fetching typing status from URL: ${url}`);
    try {
      const response = await apiService.get<{ typing: boolean; userId: number; userStatus: string }>(url);
      setTypingStatus(response.typing ?? false);
      setUserStatus(response.userStatus ?? "OFFLINE");
      return response;
    } catch (error) {
      console.error(`Failed to fetch typing status for user ${userId}:`, error);
      return { typing: false, userId, userStatus: "OFFLINE" };
    }
  };

  const defaultAIMessage = {
    id: 1,
    text: "Hello! How can I assist you?",
    sender: "AI Advisor",
    timeStamp: Date.now(),
    avatar: aiAvatar,
    channelType: 'individual' // Provide a default or appropriate value
  };

  const handleSubmitGroupModal = async (selectedUsers: number[], channelName?: string) => {
    if (groupModalMode === "create") {
      if (selectedUsers.length === 0) {
        message.error("Please select at least one user!");
        return;
      }
  
      const channelData = {
        channelName: channelName || "New Group",
        channelType: "group",
        participantIds: [parsedUserId, ...selectedUsers],
        channelProfileImage: defaultGroupicon,
      };
  
      try {
        const response = await apiService.post("/chat/channels", channelData);
        message.success("Your group is made successfully!");
        setIsGroupModalVisible(false);
        setSelectedUsers([]);
        console.log("Creating Group Messages：", response);
    } catch (error) {
        console.error("Failed in creating a group", error);
        message.error("Failed creating a group, please try again later.");
      }
    } else if (groupModalMode === "update") {
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
        participantIds: [parsedUserId, ...selectedUsers], // To make sure that currently logged in user is selected
      };
  
      try {
        await apiService.put(`/chat/channels/${channelId}`, channelData);
        message.success("Group updated successfully!");
  
        const messageText = "Let's welcome our new members!";
        const messagePostDTO = {
          senderId: parsedUserId,
          context: messageText,
        };
  
        const response = await apiService.post<MessageGetDTO>(
          `/chat/${channelId}/message`,
          messagePostDTO
        );
  
        const serverMessage = {
          id: Number(response.messageId),
          text: String(response.context),
          sender: String(response.senderId),
          timeStamp: new Date(String(response.timestamp)).getTime(),
          avatar: response.senderProfileImage ? String(response.senderProfileImage) : defaulindividualicon,
        };
  
        setChannelMessages((prevMessages) => ({
          ...prevMessages,
          [String(channelId)]: [
            ...(prevMessages[String(channelId)] || []),
            serverMessage,
          ],
        }));
  
        setIsGroupModalVisible(false);
        setSelectedUsers([]);
        if (parsedUserId) {
          fetchMatchedUsers(parsedUserId);
        }
      } catch (error) {
        console.error("Failed to update group:", error);
        message.error("Failed to update group, please try again later.");
      }
    }
  };

  const fetchMatchedUsers = async (userid: number) => {
    try {
      if (userid) {
        const response = await apiService.get<ChatChannelGetDTO[]>(`/chat/channels/user/${userid}`);
        console.log("Fetched chat channels:", response);
        const data = response || [];

        // Ensure data is an array before mapping
        const mappedData = Array.isArray(data) ? data.map((channel) => {
          const latestMessage = channel.updatedAt
            ? `Last message at ${new Date(channel.updatedAt).toLocaleString()}`
            : "No messages yet";

          const participants = channel.participants.filter((p) => p.userId !== userid);

        const channelProfileImage =
          channel.channelType === "individual" && participants.length > 0
            ? participants[0].userProfileImage
            : defaultGroupicon;

        
          return {
            channelId: channel.channelId,
            channelName: channel.channelType === "individual" && participants.length > 0
              ? participants[0].userName
              : channel.channelName,
            supportingText: latestMessage,
            channelType: channel.channelType,
            participants,
            channelProfileImage,
          };
        }) : [];
        // Fixed bugs so that now only channels would be updated
        setChannels(prevChannels => {
          // Always keep the AI Advisor channel
          const aiAdvisorChannel = prevChannels.find(channel => channel.channelId === -1);
          return [...(aiAdvisorChannel ? [aiAdvisorChannel] : []), ...mappedData];
        });
        console.log("Mapped matched users:", mappedData);
      } else {
        console.error("userId is undefined!");
      }
    } catch (error) {
      console.error("Failed to fetch chat channels:", error);
    }
  };

  // Fetching messages for selected channel
  const fetchMessages = async (channelId: string) => {
    try {
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
        id: Number(message.messageId) as number,
        text: String(message.context),
        sender: String(message.senderId),
        timeStamp: new Date(String(message.timestamp)).getTime(),
        avatar: String(message.senderProfileImage) || defaulindividualicon,
      }));
  
      setChannelMessages((prevMessages) => ({
        ...prevMessages,
        [String(channelId)]: mappedMessages,
      }));
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      }
  };

  // Controlling fetching matched users
  useEffect(() => {
    if (parsedUserId === undefined) return;
    let interval: string | number | NodeJS.Timeout | undefined;

    // To fetch Matched users once entering.
    fetchMatchedUsers(parsedUserId);
    
    interval = setInterval( () => {
      fetchMatchedUsers(parsedUserId);
    }, 2000);

    return () => clearInterval(interval);
  
  }, [parsedUserId]);

  // controlling fetching messages
  useEffect(() => {
    if (!selectedChannel) return;
    let interval: string | number | NodeJS.Timeout | undefined;

    if (selectedChannel !== 'AI Advisor') {
      // To fetch Matched users once entering.
      fetchMessages(selectedChannel);

      interval = setInterval(() => {
        fetchMessages(selectedChannel);
      }, 500);
    
    }
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
    let intervalId: string | number | NodeJS.Timeout | undefined;
    const fetchTyping = async () => {
  
      const currentChannel = channels.find((channel) => String(channel.channelId) === String(selectedChannel));
      if (!currentChannel || currentChannel.channelType !== "individual") return;
  
      const participant = currentChannel.participants?.find((p) => p.userId !== parsedUserId);
      if (!participant) return;
  
      const participantId = participant.userId;
      
      const isTyping_response = await fetchTypingStatus(participantId);
      const isTyping = isTyping_response?.typing;
      setTypingStatus(isTyping ?? false);
      console.log("Typing API returns:", isTyping);

      intervalId = setInterval(async () => {
        const isTyping_response = await fetchTypingStatus(participantId);
        const isTyping = isTyping_response?.typing;
        setTypingStatus(isTyping ?? false);
      }, 1000);
    };
    fetchTyping();
    return () => {
      console.log("Clearing interval for typing status");
      clearInterval(intervalId);
    };
  }, [selectedChannel]);

  const handleSendMessage = async (customPrompt?: string, quickReplyMessage?: string) => {
    const messageText = quickReplyMessage || inputValue.trim();
    if (messageText === "") return;
  
    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: String(parsedUserId),
      timeStamp: Date.now(),
      avatar: currentUserImage,
    };
  
    if (!quickReplyMessage) {
      setInputValue("");
    }

    if (selectedChannel === "AI Advisor") {
      try {
        setIsLoading(true); 
        const prompt = customPrompt || `
          You are a professional study advisor with a PhD in diverse fields. Please answer in an academic way and briefly. Your answer should be less than 100 words.
          The conversation so far:
          ${[...(channelMessages[selectedChannel] || []), userMessage]
            .map((msg) => `${msg.sender}: ${msg.text}`)
            .join("\n")}
          AI Advisor:`;
        
        // Initialize the model
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
            userMessage, 
            aiMessage,
          ],
        }));
      } catch (error) {
        console.error("AI Advisor message generation failed:", error);
      } finally {
        setIsLoading(false);
      }
      return;
    }
  
    // For channels which are not AI advisor
    const currentChannel = channels.find((channel) => String(channel.channelId) === String(selectedChannel));
    if (!currentChannel) {
      console.error("Channel not found!");
      return;
    }
  
    const channelId = currentChannel.channelId;
  
    try {
      const messagePostDTO = {
        senderId: parsedUserId,
        context: messageText,
      };
  
      const response = await apiService.post<MessageGetDTO>(
        `/chat/${channelId}/message`,
        messagePostDTO
      );
  
      const data = response;
  
      const serverMessage = {
        id: Number(data.messageId),
        text: String(data.context),
        sender: String(data.senderId),
        timeStamp: new Date(String(data.timestamp)).getTime(),
        avatar: data.senderProfileImage ? String(data.senderProfileImage) : defaulindividualicon,
      };
  
      setChannelMessages((prevMessages) => ({
        ...prevMessages,
        [String(channelId)]: [
          ...(prevMessages[String(channelId)] || []),
          serverMessage,
        ],
      }));
    } catch (error) {
      console.error("Failed in sending this message", error);
  
      const errorMessage = {
        id: Date.now(),
        text: "Failed in sending messages, please try again later",
        sender: "Server",
        timeStamp: Date.now(),
        avatar: defaulindividualicon,
      };
  
      setChannelMessages((prevMessages) => ({
        ...prevMessages,
        [String(channelId)]: [
          ...(prevMessages[String(channelId)] || []),
          errorMessage,
        ],
      }));
    }
  };


  const renderMarkdown = (markdownText: string) => {
    const htmlContent = marked(markdownText, { async: false });
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  const getChannelHeaderText = (selectedChannel: string | null, typingStatus: boolean, channels: { channelId: number; channelName: string; supportingText?: string; channelType: string; participants?: ChatParticipantGetDTO[]; channelProfileImage?: string }[]) => {
    if (!selectedChannel) {
      return "Select a chat";
    }
    if (typingStatus) {
      return "Typing...";
    }
    return channels.find((c) => String(c.channelId) === String(selectedChannel))?.channelName || selectedChannel;
  };

const getAvatarSrc = (sender: string, selectedChannel: string | null, channels: { channelId: number; channelName: string; supportingText?: string; channelType: string; participants?: ChatParticipantGetDTO[]; channelProfileImage?: string }[], aiAvatar: string, defaulindividualicon: string): string => {
    if (sender === "AI Advisor") {
      return aiAvatar;
    }

    // For regular users, get avatar from the participants list
    const channel = channels.find(channel => String(channel.channelId) === String(selectedChannel));
    const participant = channel?.participants?.find(p => String(p.userId) === sender);
    return participant?.userProfileImage || defaulindividualicon;
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

  const handleSelectChat = (chatName: string | number) => {
    const channelId = chatName.toString();
  
    if (channelId === "AI Advisor") {
      setSelectedChannel(channelId);
      console.log("Not fetching typing status for AI Advisor");
      return;
    } else {
      console.log('now you not selecting AI advisor',channelId);
      setSelectedChannel(channelId);
      fetchMessages(channelId);
    };
  };

  const actualLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      if (token) {
        await fetch(`${getApiDomain()}/users/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
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

  // Show info modal on first visit
  useEffect(() => {
    if (parsedUserId && !hasSeenChatInfoModal) {
      setInfoModalVisible(true);
      // Make sure this function exists
      if (typeof setHasSeenChatInfoModal === 'function') {
        setHasSeenChatInfoModal(true);
      }
    }
  }, [parsedUserId, hasSeenChatInfoModal, setHasSeenChatInfoModal]);

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
              {parsedUserId && (
                <button className={styles.iconButton} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <NotificationBell userId={Number(parsedUserId)} />
                </button>
              )}
              <Link href="/profile">
                <button className={styles.iconButton}><UserOutlined /></button>
              </Link>
              <Link href={`/chat`}>
                <button className={styles.iconButton}><MessageOutlined /></button>
              </Link>
              <button
                className={styles.iconButton}
                onClick={() => setInfoModalVisible(true)}
              >
                <InfoCircleOutlined />
              </button>
              <button
                className={styles.iconButton}
                onClick={actualLogout}
              >
                <LogoutOutlined />
              </button>
            </div>
          </div>

          <div className="chat-container">
            {/* Messages list in the left */}
            <div className="message-list-container">
              <div className="message-list-header">Matched Users</div>
              <div className="message-list">
                {/* AI Advisor is always at the top */}
                <button
                  className="message-item"
                  onClick={() => handleSelectChat("AI Advisor")}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectChat("AI Advisor")}
                >
                  <img className="avatar" src={aiAvatar} alt="" />
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
                </button>

                {/* for all matched users */}
                {channels
                  .filter((user) => user.channelId !== -1)
                  .map((user) => (
                  <button
                    key={user.channelId}
                    className={`message-item ${String(selectedChannel) === String(user.channelId) ? "selected" : ""}`}
                    onClick={() => handleSelectChat(String(user.channelId))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectChat(String(user.channelId))}
                  >
                    <img className="avatar" src ={user.channelProfileImage || defaulindividualicon} alt =""/>
                    <div className="content">
                      <div className="headline">{user.channelName}</div>
                      <div className="supporting-text">
                        {(channelMessages[String(user.channelId)]?.length &&
                          channelMessages[String(user.channelId)][channelMessages[String(user.channelId)].length - 1].text) ||
                          user.supportingText ||
                          "No messages yet"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* For Chat Contents */}
            <div className="chat-page">
                {/* Displaying usernames */}
                <div className="chat-header">
                  <div
                    className={`header-text ${selectedChannel && selectedChannel !== "AI Advisor" ? "clickable" : ""}`}
                    role={selectedChannel && selectedChannel !== "AI Advisor" ? "button" : undefined}
                    tabIndex={selectedChannel && selectedChannel !== "AI Advisor" ? 0 : undefined}
                    onClick={() => {
                      if (selectedChannel && selectedChannel !== "AI Advisor") {
                        const currentChannel = channels.find(
                          (channel) => String(channel.channelId) === String(selectedChannel)
                        );
                        const participant = currentChannel?.participants?.find(
                          (p) => String(p.userId) !== String(parsedUserId)
                        );
                        if (participant) {
                          router.push(`/profile?userId=${participant.userId}`);
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && selectedChannel && selectedChannel !== "AI Advisor") {
                        const currentChannel = channels.find(
                          (channel) => String(channel.channelId) === String(selectedChannel)
                        );
                        const participant = currentChannel?.participants?.find(
                          (p) => String(p.userId) !== String(parsedUserId)
                        );
                        if (participant) {
                          router.push(`/profile?userId=${participant.userId}`);
                        }
                      }
                    }}
                  >
                    {getChannelHeaderText(selectedChannel, typingStatus, channels)}
                      {selectedChannel && selectedChannel !== "AI Advisor" && channels.find((channel) => String(channel.channelId) === String(selectedChannel))?.channelType === "individual" && (
                        <span style={{ marginLeft: "10px", color: userStatus === "ONLINE" ? "green" : "red" }}>
                        {userStatus === "ONLINE" ? "Online" : "Offline"}
                        </span>
                      )}
                  </div>
                  <div className="chat-header-actions">
                    {channels.find(
                      (channel) => String(channel.channelId) === String(selectedChannel)
                    ) && (
                      <>
                        {/* Individual Channels */}
                        {channels.find((channel) => String(channel.channelId) === String(selectedChannel))?.channelType === "individual" && (
                          <>
                            {/* Deleting Channels */}
                            <button
                              className="icon-button"
                              onClick={handleBlock}
                            >
                              <div className="icon icon-clear"></div>
                            </button>

                            {/* Creating Groups */}
                            <button
                              className="icon-button"
                              onClick={() => {
                                setGroupModalMode("create");
                                setSelectedUsers([]);
                                setIsGroupModalVisible(true); 
                              }}
                            >
                              <div className="icon icon-makingGroup"></div>
                            </button>
                          </>
                        )}

                        {/* Group Channels */}
                        {channels.find((channel) => String(channel.channelId) === String(selectedChannel))?.channelType === "group" && (
                          <>
                            {/* Updating Groups */}
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

                                setGroupModalMode("update");
                                const existingUserIds = currentChannel.participants?.map((p) => p.userId) ?? [];
                                setSelectedUsers(existingUserIds);
                                setIsGroupModalVisible(true); 
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
                {selectedChannel === "AI Advisor" && aiAvatar && (
                  <div key={defaultAIMessage.id} className="chat-message">
                    <img className="avatar" src={aiAvatar} alt="" />
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
                      {/* Displaying all messages */}
                      {[...(selectedChannel ? channelMessages[selectedChannel] || [] : [])]
                        .sort((a, b) => a.timeStamp - b.timeStamp) 
                        .map((message) => (
                          <div key={message.id} className={`chat-message ${message.sender === String(parsedUserId) ? "you" : ""}`}>
                            {message.sender !== String(parsedUserId) && (
                              <button
                                className={`avatar-button ${selectedChannel === "AI Advisor" ? "disabled" : ""}`}
                                onClick={() => {
                                  if (selectedChannel !== "AI Advisor") {
                                    router.push(`/profile?userId=${message.sender}`);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && selectedChannel !== "AI Advisor") {
                                    router.push(`/profile?userId=${message.sender}`);
                                  }
                                }}
                                aria-label="View profile"
                                disabled={selectedChannel === "AI Advisor"}
                              >
                                <img
                                  className="avatar"
                                  src={getAvatarSrc(message.sender, selectedChannel, channels, aiAvatar, defaulindividualicon)}
                                  alt=""
                                />
                              </button>
                            )}
                            <div className="message-bubble">{renderMarkdown(message.text)}</div>
                          </div>
                        ))}
                      <div ref={messagesEndRef}></div>
                    </>
                  )}
                
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
                          handleTypingStatus(true); 
                        }
                      }}
                      onBlur={() => {
                        if (selectedChannel !== "AI Advisor") {
                          handleTypingStatus(false);
                        }
                      }}
                    />
                    {/* Quick Reply */}
                    {selectedChannel === "AI Advisor" && (
                      <div className="quick-reply-container">
                        <button
                          className="quick-reply-bubble"
                          onClick={handleQuickReplySuggestion}
                          onKeyDown={(e) => e.key === 'Enter' && handleQuickReplySuggestion()}
                        >
                          Suggestion
                        </button>
                        <button
                          className="quick-reply-bubble"
                          onClick={handleQuickReplySchedule}
                          onKeyDown={(e) => e.key === 'Enter' && handleQuickReplySchedule()}
                        >
                          Scheduling
                        </button>
                      </div>
                    )}
                    <button
                      className="send-button" 
                      onClick={() => handleSendMessage()} 
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      aria-label="Send message">
                      <div className="icon"></div>
                    </button>
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
              existingUsers={
                groupModalMode === "update"
                  ? channels
                      .find((channel) => String(channel.channelId) === String(selectedChannel))
                      ?.participants?.map((p) => p.userId) ?? []
                  : []
              }
              allUsers={channels
                .filter((channel) => channel.channelType === "individual")
                .map((channel) => ({
                  userId: channel.participants?.[0]?.userId ?? -1,
                  userName: channel.channelName,
                }))}
                selectedUsers={selectedUsers}
                setSelectedUsers={setSelectedUsers}
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
                  <label className="label" htmlFor="report-reason">Reason</label>
                  <textarea
                    id="report-reason"
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
        <InfoModal
          visible={infoModalVisible}
          onClose={() => setInfoModalVisible(false)}
          pageName="chat"
        />
      </div>
    </App>
  );
};

export default ChatPage;