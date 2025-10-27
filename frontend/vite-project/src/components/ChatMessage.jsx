import React from 'react';
import { UserIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

const ChatMessage = ({ message, isAi }) => {
    return (
        <div
            className={`chat-message max-w-7xl mx-auto flex items-start p-6 rounded-2xl transition-colors duration-200
                ${isAi ? 'bg-blue-100 justify-start flex-row' : 'bg-pink-50 justify-end flex-row-reverse'}
            `}
        >
            <div className={`flex-shrink-0 rounded-full p-2 ${isAi ? 'bg-blue-100' : 'bg-green-100'}`}>
                {isAi ? (
                    <ComputerDesktopIcon className="h-6 w-6 text-blue-600" />
                ) : (
                    <UserIcon className="h-6 w-6 text-green-600" />
                )}
            </div>
            {/* The following div's flex-1 and text alignment are crucial for positioning the text */}
            <div className="flex-1 space-y-2 flex flex-col">
                <div className={`flex items-center justify-between ${!isAi ? 'flex-row-reverse' : ''}`}>
                    <p className={`font-medium ${isAi ? 'text-blue-900' : 'text-green-900'} ${!isAi ? 'text-right' : ''}`}>
                        {isAi ? 'Patient Buddy' : 'You'}
                    </p>
                </div>
                <div className="prose prose-sm max-w-none">
                    <p className={`text-gray-700 text-base leading-relaxed whitespace-pre-wrap ${!isAi ? 'text-right' : ''}`}>
                        {message.text}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;

