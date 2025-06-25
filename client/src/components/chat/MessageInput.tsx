import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getAgentColor, getAgentInitials } from '@shared/utils';

interface MessageInputProps {
  conversationId: number;
  selectedAgent?: string;
  selectedModels: Record<string, string>;
  setShowAgentSelector: React.Dispatch<React.SetStateAction<boolean>>;
  sendMessageMutation: any;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  showAgentSelector: boolean;
  handleSend?: (e: React.FormEvent) => void;
  handleKeyPress?: (e: React.KeyboardEvent) => void;
  addAgentMention?: (agentName: string) => void;
  invitedAgents?: string[];
  onInviteAgent?: (agentName: string) => void;
  onRemoveInvitedAgent?: (agentName: string) => void;
}

// Available agents for @mentions
const AVAILABLE_AGENTS = [
  { name: 'Communication', description: 'Professional communication and writing' },
  { name: 'Coder', description: 'Software development and programming' },
  { name: 'Analyst', description: 'Data analysis and insights' },
  { name: 'Writer', description: 'Content creation and documentation' },
  { name: 'Email', description: 'Email management and correspondence' },
  { name: 'Project Manager', description: 'Project tracking and client updates' }
];

// Helper function to parse @mentions with agent name validation
const parseAgentMentions = (text: string): string[] => {
  const validAgents = AVAILABLE_AGENTS.map(a => a.name);
  const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionedName = match[1];
    const matchedAgent = validAgents.find(agent => 
      agent.toLowerCase() === mentionedName.toLowerCase() ||
      agent.toLowerCase().includes(mentionedName.toLowerCase()) ||
      mentionedName.toLowerCase().includes(agent.toLowerCase())
    );
    
    if (matchedAgent) {
      mentions.push(matchedAgent);
    }
  }
  
  return Array.from(new Set(mentions));
};

export const MessageInput = React.memo<MessageInputProps>(({
  conversationId,
  selectedAgent,
  selectedModels,
  setShowAgentSelector,
  sendMessageMutation,
  message,
  setMessage,
  showAgentSelector,
  handleSend: externalHandleSend,
  handleKeyPress: externalHandleKeyPress,
  addAgentMention,
  invitedAgents = [],
  onInviteAgent,
  onRemoveInvitedAgent,
}) => {
  const { toast } = useToast();
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
  const [showInviteMenu, setShowInviteMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter agents based on current mention query
  const filteredAgents = AVAILABLE_AGENTS.filter(agent =>
    agent.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Handle @ symbol detection and show mention suggestions
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setMessage(newValue);
    
    // Check for @ mention
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const atMatch = textBeforeCursor.lastIndexOf('@');
    
    if (atMatch !== -1) {
      const textAfterAt = textBeforeCursor.substring(atMatch + 1);
      const spaceAfterAt = textAfterAt.indexOf(' ');
      
      if (spaceAfterAt === -1 || cursorPos <= atMatch + 1 + spaceAfterAt) {
        setMentionQuery(textAfterAt);
        setMentionPosition({ start: atMatch, end: cursorPos });
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  }, [setMessage]);

  // Insert agent mention
  const insertMention = useCallback((agentName: string) => {
    const beforeMention = message.substring(0, mentionPosition.start);
    const afterMention = message.substring(mentionPosition.end);
    const newMessage = `${beforeMention}@${agentName} ${afterMention}`;
    
    setMessage(newMessage);
    setShowMentions(false);
    
    if (textareaRef.current) {
      textareaRef.current.focus();
      const newCursorPos = mentionPosition.start + agentName.length + 2;
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  }, [message, mentionPosition, setMessage]);

  // Close mentions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMentions(false);
    if (showMentions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMentions]);

  const defaultHandleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      // Check for @mentions and extract agent collaboration request
      const mentionedAgents = parseAgentMentions(message);
      const agentToUse = mentionedAgents.length > 0 ? 'Communication' : (selectedAgent || 'Communication');
      
      try {
        await sendMessageMutation.mutateAsync({
          content: message,
          agentType: agentToUse,
          model: selectedModels[agentToUse] || 'gpt-4o-mini',
        });
        
        setMessage('');
        setShowAgentSelector(false);
      } catch (error) {
        toast({
          title: "Message Failed",
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          variant: "destructive",
        });
      }
    }
  }, [message, sendMessageMutation, setMessage, setShowAgentSelector, selectedAgent, selectedModels, toast]);

  const defaultHandleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredAgents.length > 0) {
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        insertMention(filteredAgents[0].name);
        return;
      }
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      (externalHandleSend || defaultHandleSend)(e as any);
    }
  }, [externalHandleSend, defaultHandleSend, showMentions, filteredAgents, insertMention]);

  const handleSend = externalHandleSend || defaultHandleSend;
  const handleKeyDown = externalHandleKeyPress || defaultHandleKeyPress;

  const characterCount = message.length;
  const maxCharacters = 2000;

  return (
    <div className="marble-card-elevated border-t marble-border p-4" style={{ background: 'var(--gradient-header)' }}>
      <form onSubmit={handleSend} className="space-y-4">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            rows={3}
            placeholder={selectedAgent ? 
              `Message ${selectedAgent} agent... (use @mentions for collaboration)` : 
              "Message the swarm... (use @mentions like @Communication @Coder)"
            }
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="marble-focus resize-none pr-16 marble-card-elevated border-marble-200 text-sm leading-relaxed"
            disabled={sendMessageMutation.isPending}
            maxLength={maxCharacters}
          />
          
          {/* Character Count */}
          <div className="absolute bottom-3 right-4 text-xs marble-text-muted">
            {characterCount}/{maxCharacters}
          </div>
          
          {/* Mention Suggestions Dropdown */}
          {showMentions && filteredAgents.length > 0 && (
            <Card className="absolute bottom-full left-0 right-16 mb-2 max-h-56 overflow-y-auto z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-xl">
              <div className="p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 px-2 font-medium">Available agents for collaboration:</div>
                {filteredAgents.map((agent) => (
                  <button
                    key={agent.name}
                    type="button"
                    onClick={() => insertMention(agent.name)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${getAgentColor(agent.name)}`}>
                        {getAgentInitials(agent.name)}
                      </span>
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">@{agent.name}</div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 ml-10 leading-relaxed">{agent.description}</div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Invite Agent Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowInviteMenu(!showInviteMenu)}
            className="absolute top-3 right-20 hover:text-purple-600 hover:bg-purple-50 rounded-full marble-transition w-8 h-8 p-0"
            title="Invite agents to collaborate"
          >
            <span className="text-lg font-bold">👥</span>
          </Button>

          {/* Invite Agent Menu */}
          {showInviteMenu && (
            <Card className="absolute top-12 right-16 w-72 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-xl">
              <div className="p-4">
                <div className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">Invite agents to collaborate</div>
                
                {/* Currently Invited Agents */}
                {invitedAgents.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">Currently collaborating:</div>
                    <div className="flex flex-wrap gap-2">
                      {invitedAgents.map((agentName) => (
                        <div
                          key={agentName}
                          className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs"
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${getAgentColor(agentName)}`}>
                            {getAgentInitials(agentName)}
                          </span>
                          {agentName}
                          <button
                            onClick={() => onRemoveInvitedAgent?.(agentName)}
                            className="ml-1 hover:text-red-500 font-bold"
                            title="Remove from collaboration"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Agents to Invite */}
                <div className="space-y-1">
                  {AVAILABLE_AGENTS
                    .filter(agent => !invitedAgents.includes(agent.name) && agent.name !== selectedAgent)
                    .map((agent) => (
                      <button
                        key={agent.name}
                        type="button"
                        onClick={() => {
                          onInviteAgent?.(agent.name);
                          setShowInviteMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${getAgentColor(agent.name)}`}>
                            {getAgentInitials(agent.name)}
                          </span>
                          <div>
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{agent.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{agent.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
                
                {invitedAgents.length === 0 && (
                  <div className="text-xs text-gray-500 mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    💡 Invite agents to work together on complex tasks requiring multiple perspectives.
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs marble-text-muted">
            {selectedAgent ? `Sending to ${selectedAgent}` : 'Multi-agent collaboration enabled • Type @ for mentions'}
          </div>
          <Button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-6 py-2 rounded-full marble-transition disabled:opacity-50"
          >
            {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';