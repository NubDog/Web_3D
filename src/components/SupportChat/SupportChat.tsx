import React, { useState, useEffect, useRef } from 'react';
import './../../styles/components/SupportChat/SupportChat.css';

interface SupportChatProps {
    isOpen: boolean;
    onClose: () => void;
}

const SupportChat: React.FC<SupportChatProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<{ text: string, sender: 'bot' | 'user' }[]>([
        { text: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?', sender: 'bot' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = () => {
        if (inputValue.trim() === '') return;

        const newUserMessage = { text: inputValue, sender: 'user' as const };
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');

        // Simulate bot response
        setTimeout(() => {
            const botResponse = { text: 'Cảm ơn bạn đã liên hệ. Chuyên gia của chúng tôi sẽ phản hồi sớm nhất!', sender: 'bot' as const };
            setMessages(prev => [...prev, botResponse]);
        }, 1000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    if (!isOpen) {
        // We render it but hide it via CSS for animation, or null if we want to unmount.
        // CSS animation approach: always render, toggle class.
        // But to keep it simple and performant, we might want to unmount.
        // However, for the "jump out" animation, we need it mounted.
        // Let's rely on CSS class 'open' valid in container.
    }

    return (
        <div className={`support-chat-container ${isOpen ? 'open' : ''}`}>
            <div className="support-chat-header">
                <h3>Trợ giúp trực tuyến</h3>
                <button className="close-btn" onClick={onClose}>
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div className="support-chat-body">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="support-chat-footer">
                <input
                    type="text"
                    className="support-chat-input"
                    placeholder="Nhập tin nhắn..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button className="send-btn" onClick={handleSendMessage}>
                    <i className="fa-brands fa-telegram"></i>
                </button>
            </div>
        </div>
    );
};

export default SupportChat;
