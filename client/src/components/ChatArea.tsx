import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

import type { Message, Conversation } from '@shared/schema';
import { ChatHeader } from './chat/ChatHeader';
import { MessageList } from './chat/MessageList';
import { TypingIndicator } from './chat/TypingIndicator';
import { MessageInput } from './chat/MessageInput';
import { CollaborationStatus } from './chat/CollaborationStatus';
import { marbleClasses, getAgentInitials, getAgentColor, formatTimestamp } from '@shared/utils';

interface ChatAreaProps {
  conversationId: number;
  selectedAgent?: string;
  selectedModels?: Record<string, string>;
}

// Helper function to parse @mentions with agent name validation
const parseAgentMentions = (text: string): string[] => {
  const validAgents = ['Communication', 'Coder', 'Analyst', 'Writer', 'Email', 'Project Manager'];
  const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionedName = match[1];
    // Find exact or partial matches with valid agent names
    const matchedAgent = validAgents.find(agent => 
      agent.toLowerCase() === mentionedName.toLowerCase() ||
      agent.toLowerCase().includes(mentionedName.toLowerCase()) ||
      mentionedName.toLowerCase().includes(agent.toLowerCase())
    );
    
    if (matchedAgent) {
      mentions.push(matchedAgent);
    }
  }
  
  return Array.from(new Set(mentions)); // Remove duplicates
};

// API function for sending messages
const sendMessage = async (conversationId: number, content: string, agentType?: string, model?: string) => {
  const response = await fetch('/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'send_message',
      params: { conversationId, content, agentType, model },
      id: Date.now()
    })
  });
  
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
};

// API function for getting messages
const getMessages = async (conversationId: number) => {
  const response = await fetch('/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'get_messages',
      params: { conversationId },
      id: Date.now()
    })
  });
  
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
};

export function ChatArea({ conversationId, selectedAgent, selectedModels = {} }: ChatAreaProps) {
  const [message, setMessage] = useState('');
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [collaborationStatus, setCollaborationStatus] = useState<any>(null);
  const [invitedAgents, setInvitedAgents] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
    enabled: conversationId > 0,
    refetchInterval: 5000, // Reduced from 1s to 5s
    refetchOnWindowFocus: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });



  // Calculate total tokens from messages
  const totalTokens = messages?.reduce((sum, msg) => sum + (msg.tokenCount || 0), 0) || 0;

  const sendMessageMutation = useMutation({
    mutationFn: ({ content, agentType, model }: { content: string; agentType?: string; model?: string }) => {
      return sendMessage(conversationId, content, agentType, model);
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data: any) => {
      setIsTyping(false);
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      
      if (data.tokenUsage > 0) {
        toast({
          title: "Response Generated",
          description: `${data.tokenUsage} tokens used`,
        });
      }
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "Message Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addAgentMention = (agentName: string) => {
    const mention = `@${agentName.toLowerCase()} `;
    setMessage(prev => prev + mention);
    setShowAgentSelector(false);
  };

  const handleInviteAgent = (agentName: string) => {
    if (!invitedAgents.includes(agentName)) {
      setInvitedAgents(prev => [...prev, agentName]);
      toast({
        title: "Agent Invited",
        description: `${agentName} has been invited to collaborate`,
      });
    }
  };

  const handleRemoveInvitedAgent = (agentName: string) => {
    setInvitedAgents(prev => prev.filter(name => name !== agentName));
    toast({
      title: "Agent Removed",
      description: `${agentName} removed from collaboration`,
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Parse @mentions from message
    const mentions = parseAgentMentions(message);
    
    // Combine @mentions with invited agents for collaboration
    const allCollaboratingAgents = Array.from(new Set([...mentions, ...invitedAgents]));
    
    let agentType = selectedAgent;
    let enhancedMessage = message;
    
    // If we have invited agents or mentions, create collaborative request
    if (allCollaboratingAgents.length > 0) {
      agentType = allCollaboratingAgents[0]; // Primary agent
      
      // Add invited agents as mentions if not already mentioned
      const missingAgents = invitedAgents.filter(agent => !mentions.includes(agent));
      if (missingAgents.length > 0) {
        enhancedMessage = `${missingAgents.map(agent => `@${agent}`).join(' ')} ${message}`;
      }
    }
    
    const model = selectedModels[agentType || 'Communication'];
    
    sendMessageMutation.mutate({ content: enhancedMessage, agentType, model });
    setMessage('');
    
    // Clear invited agents after sending (they completed their collaboration)
    if (invitedAgents.length > 0) {
      setInvitedAgents([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-marble-300 border-t-marble-600 rounded-full mx-auto mb-4"></div>
          <p className="marble-text-secondary">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-gradient-to-br from-gray-50 to-white">
      <ChatHeader
        conversationId={conversationId}
        selectedAgent={selectedAgent}
        totalTokens={totalTokens}
        showAgentSelector={showAgentSelector}
        setShowAgentSelector={setShowAgentSelector}
      />

      <CollaborationStatus status={collaborationStatus} />

      {/* Invited Agents Display */}
      {invitedAgents.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-800 dark:text-blue-200 font-medium">Collaborating with:</span>
            <div className="flex gap-2">
              {invitedAgents.map((agentName) => (
                <div
                  key={agentName}
                  className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs"
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white ${getAgentColor(agentName)}`}>
                    {getAgentInitials(agentName)}
                  </span>
                  {agentName}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col">
        <MessageList messages={messages || []} />
        
        {isTyping && (
          <TypingIndicator agentName={selectedAgent || 'Communication'} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        conversationId={conversationId}
        selectedAgent={selectedAgent}
        selectedModels={selectedModels || {}}
        setShowAgentSelector={setShowAgentSelector}
        sendMessageMutation={sendMessageMutation}
        message={message}
        setMessage={setMessage}
        showAgentSelector={showAgentSelector}
        handleSend={handleSend}
        handleKeyPress={handleKeyPress}
        addAgentMention={addAgentMention}
        invitedAgents={invitedAgents}
        onInviteAgent={handleInviteAgent}
        onRemoveInvitedAgent={handleRemoveInvitedAgent}
      />
    </div>
  );
}
