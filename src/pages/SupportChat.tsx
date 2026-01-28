import React, { useState, useEffect, useRef } from 'react';
import '../styles/pages/SupportChat/SupportChat.css';
import agentAvatar from '../assets/Admin Support.jpg'; // Check kỹ path nhé
import Header from '../components/Header/header'; // Header chung

const API_BASE_URL = 'https://r2-api.sharkeatrice.workers.dev';

const SupportChatPage: React.FC = () => {
    const [messages, setMessages] = useState<{ text: string, sender: 'bot' | 'user' }[]>([
        { text: 'Xin chào! Shark Eat Rice rất vui được hỗ trợ bạn. Hôm nay bạn cần tìm hiểu về mẫu xe nào?', sender: 'bot' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSendMessage = async () => {
        if (inputValue.trim() === '' || isLoading) return;

        const userText = inputValue;
        const newUserMessage = { text: userText, sender: 'user' as const };
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');

        // Delay xíu cho tự nhiên
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

    const formatMessage = (text: string) => {
        const lines = text.split('\n');
        return lines.map((line, index) => {
            let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            // Lọc mấy cái label ảnh thừa
            const imageLabelRegex = /^[\*\-]\s*(Ảnh|Hình ảnh|Image):?/i;
            if (imageLabelRegex.test(processedLine)) {
                processedLine = processedLine.replace(imageLabelRegex, '').trim();
            }

            const rawUrlRegex = /(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif|webp))/gi;
            const urls = processedLine.match(rawUrlRegex);

            if (urls && urls.length > 0) {
                let textContent = processedLine;
                urls.forEach(url => {
                    textContent = textContent.replace(url, '');
                });
                textContent = textContent.replace(/\[.*?\]/g, '').replace(/\(\)/g, '').trim();

                return (
                    <div key={index} className="chat-paragraph">
                        {textContent && <span dangerouslySetInnerHTML={{ __html: textContent }} />}
                        {urls.map((url, i) => (
                            <img key={i} src={url} alt="Product" className="chat-product-image-full" />
                        ))}
                    </div>
                );
            }

            // Xử lý list
            if (line.trim().startsWith('* ')) {
                const content = processedLine.trim().substring(2);
                if (!content) return null;
                return (
                    <div key={index} className="chat-list-item">
                        <span className="bullet">•</span>
                        <span dangerouslySetInnerHTML={{ __html: content }} />
                    </div>
                );
            }

            // Xử lý đoạn văn
            if (processedLine.trim() !== '') {
                return (
                    <p key={index} className="chat-paragraph" dangerouslySetInnerHTML={{ __html: processedLine }} />
                );
            }
            return <div key={index} style={{ height: '8px' }}></div>;
        });
    };

    return (
        <div className="full-chat-page">
            <Header /> {/* Tái sử dụng Header */}
            <div className="chat-interface-container">
                <div className="chat-main-window">
                    <div className="chat-header-simple">
                        <h2>Shark Eat Rice Support</h2>
                        <span className="online-status">● Online</span>
                    </div>

                    <div className="chat-messages-area">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message-row ${msg.sender}`}>
                                {msg.sender === 'bot' && (
                                    <img src={agentAvatar} alt="Agent" className="agent-avatar-full" />
                                )}
                                <div className={`message-bubble ${msg.sender}`}>
                                    {formatMessage(msg.text)}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="message-row bot">
                                <img src={agentAvatar} alt="Agent" className="agent-avatar-full" />
                                <div className="typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <div className="input-wrapper">
                            <input
                                type="text"
                                placeholder="Nhập câu hỏi của bạn..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                            />
                            <button onClick={handleSendMessage} disabled={isLoading} className="send-btn-full">
                                <i className="fa-solid fa-arrow-up"></i>
                            </button>
                        </div>
                        <p className="disclaimer">SharkAI có thể mắc lỗi. Vui lòng kiểm tra các thông tin quan trọng.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportChatPage;
