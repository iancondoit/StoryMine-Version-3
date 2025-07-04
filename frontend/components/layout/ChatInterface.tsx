"use client";

import React, { useState } from 'react';
import { Send, Bot, User, CheckCircle } from 'lucide-react';

// Utility function for consistent time formatting to avoid hydration issues
const formatTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const ChatInterface: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock conversation data - will be replaced with real data from API
  const messages = [
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Jordi, your research assistant. I\'m here to help you investigate deeply and uncover hidden narratives. What would you like to explore today?',
      timestamp: new Date('2024-01-15T09:00:00'),
      reasoning: [],
    },
    {
      id: '2',
      role: 'user',
      content: 'Did anything suspicious happen to Judge Ransom White in 1978?',
      timestamp: new Date('2024-01-15T09:05:00'),
    },
    {
      id: '3',
      role: 'assistant',
      content: 'Interesting — I\'ll begin by searching for any articles that mention Judge Ransom White between 1976–1979.',
      timestamp: new Date('2024-01-15T09:06:00'),
      reasoning: [
        'Step 1: Entity resolution: Confirming identity',
        'Step 2: Filtering by crime or legal keywords: "death," "investigation," "scandal"',
        'Step 3: Pattern-matching article clusters over time'
      ],
      isThinking: true,
    },
    {
      id: '4',
      role: 'assistant',
      content: 'I found a strange clustering of articles in March 1978 about a car accident. But the coverage is vague. One article mentions "inconclusive toxicology results." I\'ll flag that.\n\nI\'m going to write a short Narrative Thread artifact about this window and mark it with a 🚨. You may want to dig deeper into who ordered the toxicology report.',
      timestamp: new Date('2024-01-15T09:10:00'),
      artifacts: ['Suspicious Events – March 1978', 'Timeline of Judge White\'s Media Mentions'],
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setIsLoading(true);
    // TODO: Send message to API
    setTimeout(() => {
      setMessage('');
      setIsLoading(false);
    }, 1000);
  };



  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Jordi</h2>
            <p className="text-sm text-gray-500">Research Assistant</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
              {/* Message Header */}
              <div className={`flex items-center space-x-2 mb-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
              </div>

              {/* Message Content */}
              <div className={`p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>

              {/* Reasoning Steps */}
              {msg.reasoning && msg.reasoning.length > 0 && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Reasoning Steps</span>
                  </div>
                  <div className="space-y-1">
                    {msg.reasoning.map((step, index) => (
                      <div key={index} className="text-sm text-amber-700">
                        {msg.isThinking ? '🔍' : '✅'} {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Artifacts */}
              {msg.artifacts && msg.artifacts.length > 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-blue-800">Generated Artifacts</span>
                  </div>
                  <div className="space-y-1">
                    {msg.artifacts.map((artifact, index) => (
                      <div key={index} className="text-sm text-blue-700">
                        📄 {artifact}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-gray-500">Thinking...</span>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span className="text-sm text-gray-600">Jordi is investigating...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask Jordi about your investigation..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}; 