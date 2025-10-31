import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const BASE_URL = 'http://142.93.195.191:3000/api/admin';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch users and conversations separately so we can enhance conversations with user info
            const usersRes = await axios.get(`${BASE_URL}/users`, { headers });
            const convRes = await axios.get(`${BASE_URL}/conversations`, { headers });

            const usersList = usersRes.data || [];
            const convList = convRes.data || [];

            // Build a map of users by id for quick lookup
            const userMap = usersList.reduce((acc, u) => {
                acc[u._id] = u;
                return acc;
            }, {});

            // Enhance conversations: handle populated userId (object) or plain id
            const enhanced = convList.map((conv) => {
                const rawUserId = conv.userId;
                const uid = rawUserId && (typeof rawUserId === 'object' ? rawUserId._id : rawUserId);
                const user = userMap[uid] || (rawUserId && typeof rawUserId === 'object' ? rawUserId : { email: 'Unknown', username: 'Unknown' });
                return { ...conv, user };
            });

            setUsers(usersList);
            setConversations(enhanced);
            setLoading(false);
        } catch (err) {
            console.error("Admin Fetch Error:", err.response?.data || err.message || err);
            setError('Failed to fetch data. Check if you are logged in as admin.');
            setLoading(false);
        }
    };

    const updateUserRole = async (userId, newRole) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${BASE_URL}/users/${userId}`, { role: newRole }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Refresh users list
            fetchData();
        } catch (err) {
            console.error("Update Role Error:", err);
            setError('Failed to update user role.');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-red-600 text-xl">{error}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <span className="text-pink-600">👑</span> Admin Dashboard
                </h1>

                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-8 bg-white p-1 rounded-lg shadow-sm">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
                            activeTab === 'users'
                                ? 'bg-pink-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        👥 User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('conversations')}
                        className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
                            activeTab === 'conversations'
                                ? 'bg-pink-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        💬 Conversation Logs
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'users' && (
                    <UserManagementTable users={users} onUpdateRole={updateUserRole} />
                )}
                {activeTab === 'conversations' && (
                    <ConversationTable conversations={conversations} onView={(conv) => setSelectedConv(conv)} />
                )}

                {/* Conversation detail modal */}
                {selectedConv && (
                    <ConversationModal conversation={selectedConv} onClose={() => setSelectedConv(null)} />
                )}
            </div>
        </div>
    );
}

function UserManagementTable({ users, onUpdateRole }) {
    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                <p className="text-sm text-gray-600">Manage user roles and permissions</p>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Username
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created At
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {user.username}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <select
                                        value={user.role}
                                        onChange={(e) => onUpdateRole(user._id, e.target.value)}
                                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ConversationTable({ conversations, onView }) {
    const [expanded, setExpanded] = useState(null);
    const [filter, setFilter] = useState('');

    const filtered = (conversations || []).filter((conv) => {
        if (!filter) return true;
        const q = filter.toLowerCase();
        const username = conv.user?.username || '';
        const email = conv.user?.email || '';
        const threadId = conv.threadId || '';
        const messagesText = (conv.messages || []).map(m => m.content || '').join(' ').toLowerCase();
        return (
            username.toLowerCase().includes(q) ||
            email.toLowerCase().includes(q) ||
            threadId.toLowerCase().includes(q) ||
            messagesText.includes(q)
        );
    });

    const exportJSON = () => {
        const data = JSON.stringify(filtered, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversations-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    if (!conversations || conversations.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h3 className="text-xl font-medium text-gray-900">No conversations yet</h3>
                <p className="text-sm text-gray-600">No conversation history found. Have users send messages to create conversations.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Conversation Logs</h3>
                    <p className="text-sm text-gray-600">View all user conversations and interactions</p>
                </div>
                <div className="flex items-center space-x-3">
                    <input
                        type="text"
                        placeholder="Search by user, email, threadId, or message"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm"
                    />
                    <button onClick={exportJSON} className="px-3 py-2 bg-pink-600 text-white rounded-md text-sm">Export JSON</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Message</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.map((conv) => (
                            <tr key={conv.threadId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{conv.user?.username || 'Unknown'}</div>
                                    <div className="text-sm text-gray-500">{conv.user?.email || 'Unknown'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">
                                        {conv.messages?.length || 0} messages
                                        <button
                                            onClick={() => setExpanded(expanded === conv.threadId ? null : conv.threadId)}
                                            className="ml-2 text-pink-600 hover:text-pink-700"
                                        >
                                            {expanded === conv.threadId ? 'Hide' : 'Show'}
                                        </button>
                                        <button
                                            onClick={() => onView && onView(conv)}
                                            className="ml-2 text-blue-600 hover:text-blue-700"
                                        >
                                            View
                                        </button>
                                    </div>
                                    {expanded === conv.threadId && (
                                        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                            {(conv.messages || []).map((msg, idx) => (
                                                <div key={idx} className="flex items-start space-x-2 text-sm">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                        msg.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {msg.role}
                                                    </span>
                                                    <div>
                                                        <div className="text-gray-700">{msg.content}</div>
                                                        <div className="text-xs text-gray-400">{new Date(msg.timestamp || conv.createdAt).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(conv.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {conv.messages && conv.messages.length > 0
                                        ? new Date(conv.messages[conv.messages.length - 1]?.timestamp || conv.createdAt).toLocaleString()
                                        : 'No messages'
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminDashboard;

function ConversationModal({ conversation, onClose }) {
    const renderContent = (msg) => {
        const raw = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        // Try to pretty-print JSON if content looks like JSON
        if (/^[\s]*[\[{]/.test(raw)) {
            try {
                const parsed = JSON.parse(raw);
                return <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">{JSON.stringify(parsed, null, 2)}</pre>;
            } catch (e) {
                // fallthrough to plain text
            }
        }
        return raw.split('\n').map((line, i) => <p key={i} className="text-sm text-gray-800">{line}</p>);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white w-11/12 md:w-3/4 lg:w-2/3 max-h-[80vh] overflow-auto rounded-lg shadow-lg">
                <div className="p-4 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold">Conversation — {conversation.threadId}</h3>
                        <div className="text-sm text-gray-500">User: {conversation.user?.username || conversation.user?.email || 'Unknown'}</div>
                    </div>
                    <div>
                        <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">Close</button>
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    {(conversation.messages || []).map((msg, idx) => (
                        <div key={idx} className="">
                            <div className="text-xs text-gray-400">{new Date(msg.timestamp || conversation.createdAt).toLocaleString()}</div>
                            <div className={`mt-1 p-3 rounded ${msg.role === 'user' ? 'bg-blue-50' : 'bg-green-50'}`}>
                                <div className="text-xs font-semibold text-gray-600 mb-1">{msg.role}</div>
                                <div>{renderContent(msg)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
