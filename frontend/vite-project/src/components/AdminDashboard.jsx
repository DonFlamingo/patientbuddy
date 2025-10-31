import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
    const [conversations, setConversations] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // Replace with your server's URL if necessary
    const API_URL = 'http://142.93.195.191:3000/api/admin/conversations';

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                // IMPORTANT: You need to send the user's JWT token
                // in the Authorization header for the verifyAdmin middleware to work.
                const token = localStorage.getItem('token'); // Get token from storage

                const response = await axios.get(API_URL, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                setConversations(response.data);
                setLoading(false);

            } catch (err) {
                console.error("Admin Fetch Error:", err);
                setError('Failed to fetch conversations. Check if you are logged in as admin.');
                setLoading(false);
            }
        };

        fetchConversations();
    }, []);

    if (loading) return <div>Loading Conversations...</div>;
    if (error) return <div style={{color: 'red'}}>{error}</div>;

    return (
        <div className="admin-container">
            <h2>👤 Admin Conversation Log</h2>
            {/* Render the table in Step 2 */}
            <ConversationTable conversations={conversations} />
        </div>
    );
}

function ConversationTable({ conversations }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b">Thread ID</th>
                        <th className="py-2 px-4 border-b">User ID</th>
                        <th className="py-2 px-4 border-b">Created At</th>
                        <th className="py-2 px-4 border-b">Messages</th>
                    </tr>
                </thead>
                <tbody>
                    {conversations.map((conv) => (
                        <tr key={conv.threadId} className="hover:bg-gray-50">
                            <td className="py-2 px-4 border-b">{conv.threadId}</td>
                            <td className="py-2 px-4 border-b">{conv.userId}</td>
                            <td className="py-2 px-4 border-b">{new Date(conv.createdAt).toLocaleString()}</td>
                            <td className="py-2 px-4 border-b">
                                <ul className="list-disc list-inside">
                                    {conv.messages.map((msg, index) => (
                                        <li key={index} className="text-sm">
                                            <strong>{msg.role}:</strong> {msg.content}
                                        </li>
                                    ))}
                                </ul>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminDashboard;
