import React from 'react';
import { ProjectNavigator } from './ProjectNavigator';
import { ArtifactSpace } from './ArtifactSpace';
import { ChatInterface } from './ChatInterface';
import { TokenCounter } from './TokenCounter';

interface ThreeColumnLayoutProps {
  children?: React.ReactNode;
}

export const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">🪨</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">StoryMine</h1>
            <p className="text-xs text-gray-500">v3.0.0-alpha</p>
          </div>
        </div>
        
        {/* Token Counter in top right */}
        <TokenCounter />
      </header>

      {/* Main Content Area - Chat window takes nearly half the screen */}
      <div className="flex-1 grid min-h-0" style={{ gridTemplateColumns: '280px 1fr 45%' }}>
        {/* Left Column: Project Navigator - Compact sidebar */}
        <aside className="bg-white border-r border-gray-200 flex flex-col">
          <ProjectNavigator />
        </aside>

        {/* Middle Column: Artifact Space - Remaining space */}
        <main className="bg-gray-50 flex flex-col min-w-0">
          <ArtifactSpace />
        </main>

        {/* Right Column: Chat Interface - Nearly half the screen */}
        <aside className="bg-white border-l border-gray-200 flex flex-col">
          <ChatInterface />
        </aside>
      </div>
    </div>
  );
};

export default ThreeColumnLayout; 