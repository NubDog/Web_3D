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

            // Regex to match "list item" style image prefixes often used by Gemini
            // e.g. "* Ảnh:", "* Hình ảnh:", "- Ảnh:", etc.
            const imageLabelRegex = /^[\*\-]\s*(Ảnh|Hình ảnh|Image):?/i;

            // Check if line starts with an image label, strip it
            if (imageLabelRegex.test(processedLine)) {
                processedLine = processedLine.replace(imageLabelRegex, '').trim();
            }

            // 1. Markdown image: ![alt](url)
            // 2. Text link: [text](url)
            // 3. Raw URL
            const rawUrlRegex = /(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif|webp))/gi;

            // Check if the line is NOW just an image URL (after stripping label) or similar
            // If the line *became* empty after stripping label, but had an image url, we might need to find it.
            // Let's look for URL in the processed line.

            // Simplified logic: Find all image URLs in the line.
            // If found, render images.
            // If text remains after removing URLs, render text.

            const urls = processedLine.match(rawUrlRegex);

            if (urls && urls.length > 0) {
                // Remove URLs from text to see what's left
                let textContent = processedLine;
                urls.forEach(url => {
                    textContent = textContent.replace(url, '');
                });

                // Clean up common markdown link syntax artifacts left over: [] ()
                textContent = textContent.replace(/\[.*?\]/g, '').replace(/\(\)/g, '').trim();

                return (
                    <div key={index} className="chat-paragraph">
                        {textContent && <span dangerouslySetInnerHTML={{ __html: textContent }} />}
                        {urls.map((url, i) => (
                            <img key={i} src={url} alt="Product" className="chat-product-image" />
                        ))}
                    </div>
                );
            }

            // Handle lists (text only)
            if (line.trim().startsWith('* ')) {
                const content = processedLine.trim().substring(2);
                // If content is empty (e.g. was just "* "), skip
                if (!content) return null;

                return (
                    <div key={index} className="chat-list-item">
                        <span className="bullet">•</span>
                        <span dangerouslySetInnerHTML={{ __html: content }} />
                    </div>
                );
            }

            // Standard paragraph
            if (processedLine.trim() !== '') {
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
