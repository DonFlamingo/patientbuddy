import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [conversations, setConversations] = useState([]);
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

            const [usersRes, convRes] = await Promise.all([
                axios.get(`${BASE_URL}/users`, { headers }),
                axios.get(`${BASE_URL}/conversations`, { headers })
            ]);

            setUsers(usersRes.data);
            setConversations(convRes.data);
            setLoading(false);
        } catch (err) {
            console.error("Admin Fetch Error:", err);
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
                    <ConversationTable conversations={conversations} />
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

function ConversationTable({ conversations }) {
    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Conversation Logs</h3>
                <p className="text-sm text-gray-600">View all user conversations and interactions</p>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thread ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created At
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Messages
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {conversations.map((conv) => (
                            <tr key={conv.threadId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                    {conv.threadId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                                    {conv.userId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(conv.createdAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                    <div className="space-y-2">
                                        {conv.messages.map((msg, index) => (
                                            <div key={index} className="flex">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    msg.role === 'user'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {msg.role}
                                                </span>
                                                <span className="ml-2 text-gray-700 truncate">{msg.content}</span>
                                            </div>
                                        ))}
                                    </div>
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
