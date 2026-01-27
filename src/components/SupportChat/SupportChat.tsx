import React, { useState, useEffect, useRef } from 'react';
import './../../styles/components/SupportChat/SupportChat.css';
import agentAvatar from '../../assets/Admin Support.jpg';

interface SupportChatProps {
    isOpen: boolean;
    onClose: () => void;
}

const API_BASE_URL = 'https://r2-api.sharkeatrice.workers.dev';

const SupportChat: React.FC<SupportChatProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<{ text: string, sender: 'bot' | 'user' }[]>([
        { text: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?', sender: 'bot' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isLoading]);

    const handleSendMessage = async () => {
        if (inputValue.trim() === '' || isLoading) return;

        const userText = inputValue;
        const newUserMessage = { text: userText, sender: 'user' as const };
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');

        // Random delay between 1000ms and 2000ms
        const delay = Math.floor(Math.random() * 1000) + 1000;

        setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(userText)}`);
                const data = await response.json();

                if (data.answer) {
                    const botResponse = { text: data.answer, sender: 'bot' as const };
                    setMessages(prev => [...prev, botResponse]);
                } else {
                    const errorResponse = { text: 'Xin lỗi, tôi không tìm thấy thông tin bạn cần.', sender: 'bot' as const };
                    setMessages(prev => [...prev, errorResponse]);
                }

            } catch (error) {
                console.error("Chat error:", error);
                const errorResponse = { text: 'Xin lỗi, kết nối đến máy chủ bị gián đoạn.', sender: 'bot' as const };
                setMessages(prev => [...prev, errorResponse]);
            } finally {
                setIsLoading(false);
            }
        }, delay);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    if (!isOpen) {
        // Keep mounted for animation logic if handled by CSS opacity/transform
    }

    const formatMessage = (text: string) => {
        const lines = text.split('\n');

        return lines.map((line, index) => {
            let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            // 1. Check for standard Markdown image syntax: ![alt](url)
            // 2. Check for "text link" style often returned by LLMs: [Txxt](url) where url is an image
            // 3. Raw URL
            const rawUrlRegex = /(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif|webp))/gi;

            // Strategy: First try to match markdown syntax which is most specific. 
            // If match found, replace with special placeholder or split.
            // Actually, we can just split by a unified regex.

            // Let's combine regexes subtly.
            // We want to extract the URL.

            // If the whole line is basically an image link:
            let imageUrl = '';
            const mdMatch = /!\[.*?\]\((.*?)\)/.exec(line);
            if (mdMatch && mdMatch[1]) imageUrl = mdMatch[1];
            else {
                const linkMatch = /\[.*?\]\((https?:\/\/.*?\.(?:png|jpg|jpeg|gif|webp))\)/.exec(line);
                if (linkMatch && linkMatch[1]) imageUrl = linkMatch[1];
            }

            if (imageUrl) {
                return <img key={index} src={imageUrl} alt="Product" className="chat-product-image" />;
            }

            // Fallback to splitting by raw URL if no markdown syntax found
            const parts = processedLine.split(rawUrlRegex);
            if (parts.length > 1) {
                return (
                    <div key={index} className="chat-paragraph">
                        {parts.map((part, i) => {
                            // Check if this part is a URL
                            if (part.match(rawUrlRegex)) {
                                return <img key={i} src={part} alt="Product" className="chat-product-image" />;
                            }
                            // Clean up dangling brackets from [url]( if raw regex caught the url part
                            // This is tricky. simpler to just strip logic.
                            // If we encounter "](", it means we cut inside a markdown link.

                            // Let's just output text.
                            return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
                        })}
                    </div>
                );
            }

            // Handle lists
            if (line.trim().startsWith('* ')) {
                const content = processedLine.trim().substring(2);
                return (
                    <div key={index} className="chat-list-item">
                        <span className="bullet">•</span>
                        <span dangerouslySetInnerHTML={{ __html: content }} />
                    </div>
                );
            }

            // Standard paragraph
            if (line.trim() !== '') {
                return (
                    <p key={index} className="chat-paragraph" dangerouslySetInnerHTML={{
                        __html: processedLine
                    }} />
                );
            }
            return <div key={index} style={{ height: '8px' }}></div>;
        });
    };

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
                    <div key={index} className={`message-row ${msg.sender}`}>
                        {msg.sender === 'bot' && (
                            <img src={agentAvatar} alt="Agent" className="agent-avatar" />
                        )}
                        <div className={`message ${msg.sender}`}>
                            {formatMessage(msg.text)}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="message-row bot">
                        <img src={agentAvatar} alt="Agent" className="agent-avatar" />
                        <div className="message bot" style={{ fontStyle: 'italic', color: '#888' }}>
                            Đang trả lời...
                        </div>
                    </div>
                )}

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
                    disabled={isLoading}
                />
                <button className="send-btn" onClick={handleSendMessage} disabled={isLoading}>
                    <i className="fa-brands fa-telegram"></i>
                </button>
            </div>
        </div>
    );
};

export default SupportChat;
