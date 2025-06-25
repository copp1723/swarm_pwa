import React from 'react';
import { Button } from '@/components/ui/button';
import { formatTokenCount } from '@shared/utils';

interface ChatHeaderProps {
  conversationId: number;
  selectedAgent?: string;
  totalTokens: number;
  showAgentSelector: boolean;
  setShowAgentSelector: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChatHeader = React.memo<ChatHeaderProps>(({
  conversationId,
  selectedAgent,
  totalTokens,
  showAgentSelector,
  setShowAgentSelector,
}) => {
  return (
    <div className="border-b marble-border px-4 py-3 marble-card-elevated" style={{ background: 'var(--gradient-header)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h2 className="text-xl font-bold marble-text-primary tracking-tight">Conversation</h2>
          <div className="flex items-center text-sm marble-text-secondary glass-effect px-3 py-2 rounded-full hover-lift marble-transition">
            <div className={`w-3 h-3 rounded-full mr-3 status-indicator ${
              selectedAgent ? 'bg-blue-500' : 'bg-emerald-500'
            }`}></div>
            <span className="font-semibold text-xs uppercase tracking-wide">
              {selectedAgent ? `${selectedAgent} Mode` : 'Multi-Agent Swarm'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAgentSelector(!showAgentSelector)}
            className="hover:text-blue-600 hover:bg-blue-50 rounded-full marble-transition"
            title="Add agents to conversation"
          >
            <span className="text-lg font-bold">+</span>
          </Button>
        </div>
      </div>
    </div>
  );
});

ChatHeader.displayName = 'ChatHeader';