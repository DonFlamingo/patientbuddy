import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

function Chat({ onLogout, user }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // State to store the threadId for the ongoing conversation
    const [threadId, setThreadId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://142.93.195.191:3000/api/conversations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const loadConversation = async (selectedThreadId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://142.93.195.191:3000/api/conversations/${selectedThreadId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const conversation = await response.json();
                const loadedMessages = conversation.messages.map(msg => ({
                    text: msg.content,
                    isAi: msg.role === 'assistant'
                }));
                setMessages(loadedMessages);
                setThreadId(selectedThreadId);
                setSidebarOpen(false);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    };

    const startNewConversation = () => {
        setMessages([]);
        setThreadId(null);
        setSidebarOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userMessage = input.trim();
        if (!userMessage) return;

        // Add user message to state
        setMessages(prev => [...prev, { text: userMessage, isAi: false }]);
        setInput("");
        setIsLoading(true);

        // Add an empty message object for the AI response
        // This is a crucial step for streaming so the AI's response has a place to be built
        setMessages(prev => [...prev, { text: '', isAi: true }]);

       
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found.');
            }

            const response = await fetch('http://142.93.195.191:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: userMessage,
                    threadId: threadId
                }),
            });

            // CRITICAL FIX: Get the new threadId from the response header immediately
            const newThreadId = response.headers.get('X-Thread-Id');
            if (newThreadId) {
                setThreadId(newThreadId); // Store the threadId for the next message
                console.log('New threadId stored:', newThreadId);
            }

            if (!response.body) {
                throw new Error("Response body is not a readable stream.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let receivedText = '';

            // Loop through the stream chunks
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }

                // Decode and append the chunk to the received text
                const chunk = decoder.decode(value, { stream: true });
                receivedText += chunk;

                // Update the state with the partial streamed message
                setMessages(prev => {
                    const updatedMessages = [...prev];
                    const lastMessage = updatedMessages[updatedMessages.length - 1];
                    // Ensure you're only updating the text of the last message
                    if (lastMessage && lastMessage.isAi) {
                         lastMessage.text = receivedText;
                    }
                    return updatedMessages;
                });
            }

        } catch (error) {
            console.error("Frontend Error:", error);
            // Slice off the last, empty AI message and replace with an error message
            setMessages(prev => [...prev.slice(0, -1), { text: 'Sorry, there was an error processing your request.', isAi: true }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
            // Refresh conversations list after new message
            fetchConversations();
        }
    };


    return (
        <main>
            <div className="flex h-screen bg-gradient-to-b from-gray-50 to-white">
                {/* Sidebar */}
                <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden`}>
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <button
                            onClick={startNewConversation}
                            className="w-full mb-4 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
                        >
                            New Conversation
                        </button>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {conversations.map((conv) => (
                                <button
                                    key={conv.threadId}
                                    onClick={() => loadConversation(conv.threadId)}
                                    className="w-full text-left p-3 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
                                >
                                    <div className="text-sm text-gray-600 truncate">
                                        {conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].content : 'Empty conversation'}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date(conv.createdAt).toLocaleDateString()}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex flex-col flex-1">
                    <div className="w-full bg-white border-b border-gray-200 shadow-sm">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className="p-2 text-gray-600 hover:text-gray-900"
                                >
                                    <ChatBubbleLeftRightIcon className="h-6 w-6" />
                                </button>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                    <span className="text-pink-600">Patient</span>Buddy
                                </h1>
                            </div>
                            <div className="flex items-center gap-4">
                                {user?.role === 'admin' && (
                                    <button
                                        onClick={() => window.location.href = '/admin'}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        Admin Dashboard
                                    </button>
                                )}
                                <button
                                    onClick={onLogout}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 ">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-xl font-medium">Start a conversation</p>
                            <p className="mt-2">How`s Your Health!</p>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <ChatMessage key={index} message={message} isAi={message.isAi} />
                        ))
                    )}
                    {isLoading && (
                        <div className="flex items-center justify-center space-x-2 p-4">
                            <div className="animate-bounce h-2 w-2 bg-pink-500 rounded-full"></div>
                            <div className="animate-bounce h-2 w-2 bg-pink-500 rounded-full delay-100"></div>
                            <div className="animate-bounce h-2 w-2 bg-pink-500 rounded-full delay-200"></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="flex-none p-6 bg-white border-t border-gray-200 shadow-lg">
                    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto w-full">
                        <div className="flex flex-col space-y-3">
                            <div className="relative flex items-center">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 min-h-[60px] w-full rounded-2xl border-2 border-gray-300 px-6 py-4 text-base focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 transition-all duration-200 pr-16"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="absolute right-2 inline-flex items-center justify-center w-12 h-12 rounded-xl text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    <PaperAirplaneIcon className="h-6 w-6 rotate-90" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                Press Enter to send your message
                            </p>
                        </div>
                    </form>
                </div>
                </div>
            </div>
        </main>
    );
}

export default Chat;
