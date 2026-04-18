'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from './api/chat/route';

const SUGGESTIONS = [
  {
    title: 'Gymshark Arrival 5" Shorts',
    url: 'https://www.gymshark.com/products/gymshark-arrival-5-shorts-black-ss22',
  },
  {
    title: 'Allbirds Tree Dashers',
    url: 'https://www.allbirds.com/products/mens-tree-dashers',
  },
  {
    title: 'Sony WH-1000XM5',
    url: 'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b',
  },
];

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat<ChatMessage>({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const isLoading = status === 'streaming' || status === 'submitted';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  const handleSuggestionClick = (url: string) => {
    sendMessage({ text: url });
  };

  return (
    <div className="app-container">
      <div className="header glass-panel">
        <div className="header-content">
          <div className="logo-icon">🛍️</div>
          <div>
            <h1>Preferrrr GTM</h1>
            <p>Competitor Intelligence Agent</p>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state fade-in">
            <div className="welcome-card glass-panel">
              <span className="welcome-emoji">🕵️‍♂️</span>
              <h2>Steal their customers.</h2>
              <p>
                Drop a competitor's product link below. I'll use <strong>Apify</strong> to scrape their 1-star reviews, extract the exact reasons customers are frustrated, and generate 3 <strong>Pixero.ai</strong> optimized Meta Ad variants to intercept their buyers.
              </p>
            </div>

            <div className="suggestions-container">
              <p className="suggestions-label">Test with real competitor data</p>
              <div className="suggestions-list">
                {SUGGESTIONS.map((sugg, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(sugg.url)}
                    className="suggestion-pill"
                    disabled={isLoading}
                  >
                    <span className="pill-icon">🔥</span>
                    {sugg.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-wrapper ${message.role === 'user' ? 'user-wrapper' : 'bot-wrapper'}`}
          >
            {message.role === 'assistant' && (
              <div className="avatar bot-avatar">🤖</div>
            )}
            
            <div className={`message ${message.role === 'user' ? 'user-msg' : 'bot-msg glass-panel'}`}>
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    return (
                      <div key={`${message.id}-text-${i}`} className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {part.text}
                        </ReactMarkdown>
                      </div>
                    );

                  case 'tool-scrape_product_url':
                    return (
                      <div key={`${message.id}-tool-${i}`} className="tool-status">
                        {part.state === 'input-streaming' || part.state === 'input-available' ? (
                          <div className="tool-loading">
                            <svg className="spinner" viewBox="0 0 50 50">
                              <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                            </svg>
                            <span>Crawling competitor via Apify Website Crawler...</span>
                          </div>
                        ) : part.state === 'output-available' ? (
                          <div className="tool-done">
                            <span>✅ Real sentiment extracted</span>
                          </div>
                        ) : part.state === 'output-error' ? (
                          <div className="tool-error">
                            <span>⚠️ Using market knowledge (site blocked scraper)</span>
                          </div>
                        ) : null}
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>

            {message.role === 'user' && (
              <div className="avatar user-avatar">👤</div>
            )}
          </div>
        ))}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="message-wrapper bot-wrapper fade-in">
            <div className="avatar bot-avatar">🤖</div>
            <div className="message bot-msg glass-panel typing-indicator-container">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <form onSubmit={handleSubmit} className="input-glass">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Drop a product link or ask for recommendations..."
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="send-btn"
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
        <p className="footer-text">Preferrrr evaluates millions of reviews to find what you actually need.</p>
      </div>
    </div>
  );
}
