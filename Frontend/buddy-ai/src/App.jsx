import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const App = () => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const editInputRef = useRef(null);

  // Load chats from localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem("buddyai_chats");
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);

      // Load last active chat or create new one
      const lastActiveChat = parsedChats.find((chat) => chat.isActive);
      if (lastActiveChat) {
        setCurrentChatId(lastActiveChat.id);
        setMessages(lastActiveChat.messages);
      } else if (parsedChats.length > 0) {
        setCurrentChatId(parsedChats[0].id);
        setMessages(parsedChats[0].messages);
      } else {
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []);

  // Save chats to localStorage
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("buddyai_chats", JSON.stringify(chats));
    }
  }, [chats]);

  // Update current chat messages
  useEffect(() => {
    if (currentChatId) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages, isActive: true }
            : { ...chat, isActive: false },
        ),
      );
    }
  }, [messages, currentChatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus edit input when editing
  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingChatId]);

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Conversation",
      messages: [
        {
          id: Date.now(),
          text: "Hey buddy! 👋 I'm your AI companion. I'll remember everything we talk about across all our chats!",
          sender: "buddy",
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    setChats((prev) => [
      ...prev.map((c) => ({ ...c, isActive: false })),
      newChat,
    ]);
    setCurrentChatId(newChat.id);
    setMessages(newChat.messages);
  };

  const switchChat = (chatId) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
      setEditingChatId(null);
    }
  };

  const deleteChat = (chatId, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this conversation?")) {
      const updatedChats = chats.filter((c) => c.id !== chatId);
      setChats(updatedChats);

      if (chatId === currentChatId) {
        if (updatedChats.length > 0) {
          switchChat(updatedChats[0].id);
        } else {
          createNewChat();
        }
      }
    }
  };

  const startEditingChat = (chat, e) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const saveChatTitle = (chatId) => {
    if (editingTitle.trim()) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, title: editingTitle.trim() } : chat,
        ),
      );
    }
    setEditingChatId(null);
  };

  const handleKeyDown = (e, chatId) => {
    if (e.key === "Enter") {
      saveChatTitle(chatId);
    } else if (e.key === "Escape") {
      setEditingChatId(null);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();

    if (!inputText.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Update chat title if it's the first user message
    if (messages.filter((m) => m.sender === "user").length === 0) {
      const title =
        inputText.length > 30 ? inputText.substring(0, 30) + "..." : inputText;
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId ? { ...chat, title } : chat,
        ),
      );
    }

    // Simulate AI response
    setTimeout(async () => {
      const buddyResponse = await generateBuddyResponse(inputText, messages);
      const buddyMessage = {
        id: Date.now() + 1,
        text: buddyResponse,
        sender: "buddy",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, buddyMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const generateBuddyResponse = async (userInput) => {
    let res = await axios.post("http://localhost:8000/chat", {
      query: userInput,
    });
    return (
      res?.data?.response || "Sorry, I couldn't process that. Please try again."
    );
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatChatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar - Recent Chats */}
      <div
        className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden`}
      >
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={createNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => switchChat(chat.id)}
              className={`group relative p-4 cursor-pointer hover:bg-gray-700/50 transition-colors ${
                chat.id === currentChatId ? "bg-gray-700" : ""
              }`}
            >
              {editingChatId === chat.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => saveChatTitle(chat.id)}
                  onKeyDown={(e) => handleKeyDown(e, chat.id)}
                  className="w-full bg-gray-600 text-white rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 mt-1 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{chat.title}</h3>
                    <p className="text-sm text-gray-400">
                      {chat.messages.length} messages •{" "}
                      {formatChatTime(chat.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startEditingChat(chat, e)}
                      className="p-1 hover:bg-gray-600 rounded"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="p-1 hover:bg-red-600 rounded"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>BuddyAI remembers everything</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="h-16 border-b border-gray-700 flex items-center px-6 bg-gray-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-700 rounded-lg mr-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h2 className="text-lg font-semibold">
            {chats.find((c) => c.id === currentChatId)?.title || "BuddyAI Chat"}
          </h2>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-850">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-3 max-w-2xl ${
                    message.sender === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === "user"
                        ? "bg-blue-600"
                        : "bg-purple-600"
                    }`}
                  >
                    {message.sender === "user" ? "👤" : "🤖"}
                  </div>

                  {/* Message Content */}
                  <div
                    className={`flex flex-col ${
                      message.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        message.sender === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                    🤖
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-gray-700">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      ></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 bg-gray-800 p-4">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message BuddyAI..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="bg-blue-600 text-white rounded-lg px-4 py-3 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;
