import React from 'react';
import { Plus, Zap, Lock, Brain, Archive } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  lastActive: Date;
  status: 'active' | 'archived';
  isExclusive: boolean;
  memoryOn: boolean;
}

export const ProjectNavigator: React.FC = () => {
  // Projects will be loaded from API in future implementation
  const projects: Project[] = [];

  const getStatusIcon = (project: Project) => {
    if (project.status === 'active') return <Zap className="w-3 h-3 text-green-500" />;
    if (project.status === 'archived') return <Archive className="w-3 h-3 text-gray-400" />;
    return null;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          <button className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              project.status === 'active' 
                ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' 
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900 text-sm leading-tight">
                {project.title}
              </h3>
              <div className="flex items-center space-x-1 ml-2">
                {getStatusIcon(project)}
                {project.isExclusive && <Lock className="w-3 h-3 text-amber-500" />}
                {project.memoryOn && <Brain className="w-3 h-3 text-purple-500" />}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {formatDate(project.lastActive)}
            </p>
          </div>
        ))}
        
        {/* Empty State */}
        {projects.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-xs text-gray-500 leading-relaxed px-2">
              Start your first investigative project by chatting with Jordi. She'll help you explore historical narratives and create focused research projects.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center space-x-2">
            <Zap className="w-3 h-3 text-green-500" />
            <span>Active Now</span>
          </div>
          <div className="flex items-center space-x-2">
            <Lock className="w-3 h-3 text-amber-500" />
            <span>Exclusive</span>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="w-3 h-3 text-purple-500" />
            <span>Memory On</span>
          </div>
          <div className="flex items-center space-x-2">
            <Archive className="w-3 h-3 text-gray-400" />
            <span>Archived</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 