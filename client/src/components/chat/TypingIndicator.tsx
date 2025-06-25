import React from 'react';
import { formatTimestamp, getAgentInitials, marbleClasses } from '@shared/utils';

interface TypingIndicatorProps {
  agentName?: string;
  createdAt?: string;
}

export const TypingIndicator = React.memo<TypingIndicatorProps>(({ 
  agentName = 'Agent', 
  createdAt 
}) => {
  return (
    <div className="flex items-start space-x-4 typing-indicator px-8">
      <div className={`${marbleClasses.avatar} flex-shrink-0 marble-card-elevated`}>
        <span className="text-xs font-bold text-marble-700">
          {getAgentInitials(agentName)}
        </span>
      </div>
      <div className="flex-1 max-w-4xl">
        <div className="flex items-center mb-3">
          <span className="font-bold marble-text-primary text-sm">
            {agentName}
          </span>
          <div className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full animate-pulse">
            thinking...
          </div>
        </div>
        <div className="marble-card-elevated rounded-2xl rounded-tl-md p-6">
          <div className="flex items-center space-x-2">
            <div className="typing-dot w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce"></div>
            <div className="typing-dot w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="typing-dot w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="ml-3 text-sm marble-text-muted italic">Crafting response...</span>
          </div>
        </div>
        {createdAt && (
          <div className="text-xs marble-text-muted mt-2">
            <span>{formatTimestamp(createdAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';