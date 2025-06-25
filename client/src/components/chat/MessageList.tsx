import React from 'react';
import { Message } from '@shared/schema';
import { formatTimestamp, getAgentInitials, marbleClasses } from '@shared/utils';

// Simple markdown renderer for agent responses
const renderMarkdown = (text: string) => {
  return text
    // Bold text **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Headers ## text -> <h3>text</h3>
    .replace(/^## (.*$)/gm, '<h3 class="text-lg font-semibold mb-2 mt-4 first:mt-0">$1</h3>')
    // Headers # text -> <h2>text</h2>
    .replace(/^# (.*$)/gm, '<h2 class="text-xl font-bold mb-3 mt-6 first:mt-0">$1</h2>')
    // Line breaks
    .replace(/\n/g, '<br/>')
    // Code blocks ```code``` -> <code>code</code>
    .replace(/```(.*?)```/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
    // Inline code `code` -> <code>code</code>
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-sm font-mono">$1</code>')
    // Lists - text -> <li>text</li>
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    // Wrap consecutive list items in <ul>
    .replace(/(<li.*?<\/li>(?:\s*<li.*?<\/li>)*)/g, '<ul class="mb-2">$1</ul>');
};

interface MessageListProps {
  messages: Message[];
}

export const MessageList = React.memo<MessageListProps>(({ messages }) => {

  
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.length === 0 ? (
        <div className="text-center py-16">
          <div className="marble-card-elevated rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
            </div>
            <h3 className="text-lg font-semibold marble-text-primary mb-2">Ready to start</h3>
            <p className="marble-text-secondary text-sm leading-relaxed">
              Begin your conversation with the AI agents. Use @mentions to collaborate with specific agents.
            </p>
          </div>
        </div>
      ) : (
        <>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.userId ? 'chat-message-user flex justify-end' : 'chat-message-agent flex items-start space-x-4'}`}
            >
            {msg.userId ? (
              // User Message
              <div className="flex-1">
                <div className="marble-card-elevated rounded-2xl rounded-br-md px-6 py-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <div className="text-sm marble-text-primary leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
                <div className="text-xs marble-text-muted mt-2 text-right">
                  {formatTimestamp(msg.createdAt || new Date())}
                </div>
              </div>
            ) : (
              // Agent Response
              <>
                <div className={`${marbleClasses.avatar} flex-shrink-0 marble-card-elevated hover-lift`}>
                  <span className="text-xs font-bold text-marble-700">
                    {getAgentInitials(msg.agentType || '')}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <span className="font-bold marble-text-primary text-sm">
                      {msg.agentType} Agent
                    </span>
                    <div className="ml-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      completed
                    </div>
                  </div>
                  <div className="marble-card-elevated rounded-2xl rounded-tl-md p-6">
                    <div 
                      className="text-sm marble-text-primary leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                    {msg.metadata && typeof msg.metadata === 'object' && (msg.metadata as any).relevantContextCount && (
                      <div className="mt-4 pt-4 border-t border-marble-200">
                        <div className="flex items-center space-x-4 text-xs marble-text-muted">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>{(msg.metadata as any).relevantContextCount} context items</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-xs marble-text-muted mt-2 flex items-center space-x-2">
                    <span>{formatTimestamp(msg.createdAt || new Date())}</span>
                    {msg.tokenCount && (
                      <>
                        <span>•</span>
                        <span>{msg.tokenCount} tokens used</span>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        </>
      )}
    </div>
  );
});

MessageList.displayName = 'MessageList';