import { useState, useRef, useEffect } from 'react';
import { FiSend, FiX } from 'react-icons/fi';
import privyLogo from '../assets/Privy_Logo_Red.png';

function renderWithLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a>;
    }
    return part;
  });
}

const BOT_NAME = 'Privy T-3000';

const WELCOME_MSG = {
  role: 'bot',
  text: 'Hey there! I\'m Privy T-3000, your FAQ assistant. Ask me anything about Privy ID, integrations, or our services — I\'ll find the answer in our database.',
};


export default function FAQChatbot({ faqs, onScrollToFaq }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = text.trim();
    if (!userMsg || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/faq-api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API error: ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply, references: data.references || [] }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `Something went wrong: ${err.message} Try again in a moment.`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {!isOpen && (
        <button className="ro-chat-fab" onClick={() => setIsOpen(true)} aria-label="Open FAQ Chatbot">
          <div className="ro-chat-fab-character">
            <img
              src={privyLogo}
              alt="Privy"
              className="angeling-fab"
            />
          </div>
          <span className="ro-chat-fab-label">Ask {BOT_NAME}</span>
        </button>
      )}

      {isOpen && (
        <div className="ro-chat-panel animate-fade-in">
          <div className="ro-chat-header">
            <div className="ro-chat-header-left">
              <div className="ro-chat-avatar">
                <img
                  src={privyLogo}
                  alt="Privy"
                  className="angeling-header"
                />
              </div>
              <div>
                <div className="ro-chat-title">{BOT_NAME}</div>
                <div className="ro-chat-status">Online</div>
              </div>
            </div>
            <button className="ro-chat-close" onClick={() => setIsOpen(false)}>
              <FiX />
            </button>
          </div>

          <div className="ro-chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={`ro-msg ${msg.role === 'user' ? 'user' : 'bot'}`}>
                {msg.role === 'bot' && (
                  <div className="ro-msg-avatar">
                    <img
                      src={privyLogo}
                      alt="Privy"
                      className="angeling-msg"
                    />
                  </div>
                )}
                <div className="ro-msg-bubble">
                  <div className="ro-msg-text">{renderWithLinks(msg.text)}</div>
                  {msg.references && msg.references.length > 0 && (
                    <div className="ro-msg-references">
                      <div className="ro-ref-label">View referenced FAQs:</div>
                      {msg.references.map((ref, ri) => (
                        <button
                          key={ri}
                          className="ro-ref-chip"
                          onClick={() => onScrollToFaq?.(ref.id)}
                        >
                          {ref.question}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="ro-msg bot">
                <div className="ro-msg-avatar">
                  <img
                    src={privyLogo}
                    alt="Privy"
                    className="angeling-msg"
                  />
                </div>
                <div className="ro-msg-bubble">
                  <div className="ro-typing">
                    <span className="ro-typing-dot" />
                    <span className="ro-typing-dot" />
                    <span className="ro-typing-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="ro-chat-input-area" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="ro-chat-input"
              placeholder="Ask Privy T-3000..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="ro-chat-send"
              disabled={!input.trim() || isLoading}
            >
              <FiSend />
            </button>
          </form>
        </div>
      )}
    </>
  );
}