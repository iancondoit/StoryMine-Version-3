"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, CheckCircle } from 'lucide-react';

// Utility function for consistent time formatting to avoid hydration issues
const formatTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

interface Artifact {
  type: string;
  title: string;
  content: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reasoning?: string[];
  isThinking?: boolean;
  artifacts?: (string | Artifact)[];
}

interface DatasetStats {
  totalArticles: number;
  analyzedArticles: number;
  interestingArticles: number;
  interestingPercentage: string;
}

export const ChatInterface: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [datasetStats, setDatasetStats] = useState<DatasetStats | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load dataset statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/jordi/scout/stats');
        const data = await response.json();
        
        if (data.success) {
          setDatasetStats(data.data.overview);
        }
      } catch (error) {
        console.error('Error fetching dataset stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Create introduction message once dataset stats are loaded
  useEffect(() => {
    if (datasetStats) {
      const introMessage: Message = {
        id: 'intro-1',
        role: 'assistant',
        content: `Hello! I'm Jordi, your AI research assistant specialized in investigative journalism and historical analysis.

**How StoryMine Works:**
StoryMine is your investigative research platform that helps you discover hidden narratives buried in historical records. I analyze thousands of documents to find patterns, connections, and stories that might otherwise go unnoticed.

**My Dataset:**
• **${datasetStats.totalArticles.toLocaleString()} total articles** from historical archives
• **${datasetStats.analyzedArticles.toLocaleString()} analyzed articles** processed by Scout (our background analysis agent)
• **${datasetStats.interestingArticles.toLocaleString()} interesting articles** flagged for investigative potential
• **${datasetStats.interestingPercentage}% discovery rate** of potentially compelling stories

**What I Can Help You With:**
- **Timeline Creation**: Organize events chronologically to reveal patterns
- **Narrative Thread Analysis**: Connect scattered information into coherent stories  
- **Source Crosswalks**: Compare multiple sources to find discrepancies or confirmations
- **Entity Tracking**: Follow people, places, and organizations across time
- **Hypothesis Trees**: Build and test investigative theories

**My Approach:**
I don't just search for keywords - I understand context, detect anomalies, and identify stories with documentary potential. I'll show you my reasoning process and generate research artifacts to help you investigate deeper.

What story would you like to uncover today?`,
        timestamp: new Date(),
        reasoning: []
      };

      setMessages([introMessage]);
    }
  }, [datasetStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Send message to backend API
      const response = await fetch('http://localhost:3001/api/jordi/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          projectId: 'default-project', // TODO: Get from actual project context
          userId: 'cmco3obd7000012e6y5e775dd'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date(),
          reasoning: data.data.reasoning || [],
          artifacts: data.data.artifacts || []
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again in a moment.',
        timestamp: new Date(),
        reasoning: []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
              <div className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600' 
                    : 'bg-gradient-to-br from-green-500 to-blue-600'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-800 text-white font-semibold' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                  
                  {/* Reasoning Steps */}
                  {msg.reasoning && msg.reasoning.length > 0 && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Reasoning Steps</span>
                      </div>
                      <div className="space-y-1">
                        {msg.reasoning.map((step, index) => (
                          <div key={index} className="text-sm text-blue-800">
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Artifacts Generated */}
                  {msg.artifacts && msg.artifacts.length > 0 && (
                    <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Artifacts Generated</span>
                      </div>
                      <div className="space-y-3">
                        {msg.artifacts.map((artifact, index) => {
                          // Handle both string and object artifacts for backward compatibility
                          if (typeof artifact === 'string') {
                            return (
                              <div key={index} className="text-sm text-green-800">
                                📄 {artifact}
                              </div>
                            );
                          }
                          
                          // Handle artifact objects
                          return (
                            <div key={index} className="bg-white p-3 rounded-lg border border-green-300">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm font-semibold text-green-700">{artifact.type}</span>
                                <span className="text-xs text-green-600">•</span>
                                <span className="text-sm font-medium text-green-800">{artifact.title}</span>
                              </div>
                              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {artifact.content}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-500">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="p-3 rounded-lg bg-gray-100 text-gray-900">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">Jordi is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask Jordi about historical narratives, patterns, or connections..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}; 