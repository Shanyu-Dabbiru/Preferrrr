'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from './api/chat/route';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Your personal shopper</h1>
        <p>I know your taste. Let me find what you&apos;ll love next.</p>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="message bot">
            <p>
              Hey there! 👋 Share a link to a product (like Gymshark or
              Allbirds) and I&apos;ll check out the real reviews for you, filter
              the sponsored fluff, and give you the real deal + some
              alternatives.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role === 'user' ? 'user' : 'bot'}`}
          >
            {message.parts.map((part, i) => {
              switch (part.type) {
                case 'text':
                  return (
                    <div key={`${message.id}-text-${i}`} className="text-part">
                      {part.text.split('\n').map((line, li) => {
                        // Basic markdown-lite rendering
                        if (line.startsWith('### '))
                          return (
                            <h3 key={li}>{line.replace('### ', '')}</h3>
                          );
                        if (line.startsWith('## '))
                          return (
                            <h2 key={li}>{line.replace('## ', '')}</h2>
                          );
                        if (line.startsWith('# '))
                          return (
                            <h1 key={li}>{line.replace('# ', '')}</h1>
                          );
                        if (line.startsWith('- '))
                          return <li key={li}>{line.replace('- ', '')}</li>;
                        if (line.startsWith('**') && line.endsWith('**'))
                          return (
                            <strong key={li}>
                              {line.replace(/\*\*/g, '')}
                            </strong>
                          );
                        if (line.trim() === '') return <br key={li} />;
                        return <p key={li}>{line}</p>;
                      })}
                    </div>
                  );

                case 'tool-scrape_product_url':
                  return (
                    <div key={`${message.id}-tool-${i}`} className="tool-status">
                      {part.state === 'input-streaming' || part.state === 'input-available' ? (
                        <div className="tool-loading">
                          <div className="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                          <span>Scraping product page &amp; reviews...</span>
                        </div>
                      ) : part.state === 'output-available' ? (
                        <div className="tool-done">✅ Product data retrieved</div>
                      ) : part.state === 'output-error' ? (
                        <div className="tool-error">
                          ⚠️ Couldn&apos;t scrape that page. Analyzing from general knowledge...
                        </div>
                      ) : null}
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="message bot loading">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
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
            placeholder="Share a product link..."
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="send-btn"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
