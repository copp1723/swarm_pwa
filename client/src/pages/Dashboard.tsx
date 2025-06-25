import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { type Conversation } from '@shared/schema';

export default function Dashboard() {
  const [selectedAgent, setSelectedAgent] = useState<string>('Communication');
  const [currentConversationId, setCurrentConversationId] = useState<number>(1);
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: conversations } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes - conversations rarely change for personal use
    refetchOnWindowFocus: false, // Reduce unnecessary API calls
  });

  const createConversationMutation = useMutation({
    mutationFn: (title?: string) => api.createConversation(title),
    onSuccess: (data: { conversation: Conversation }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setCurrentConversationId(data.conversation.id);
    }
  });

  // Create initial conversation if none exists or set to existing conversation
  useEffect(() => {
    if (conversations?.conversations?.length === 0) {
      createConversationMutation.mutate('New Conversation');
    } else if (conversations?.conversations?.length && currentConversationId <= 1) {
      // Always use the first available conversation
      setCurrentConversationId(conversations.conversations[0].id);

    }
  }, [conversations]);

  const handleAgentSelect = (agentName: string) => {
    setSelectedAgent(agentName);
  };

  const handleModelChange = (agentName: string, model: string) => {
    setSelectedModels(prev => ({
      ...prev,
      [agentName]: model
    }));
  };

  return (
    <div className="flex h-screen marble-bg font-inter marble-text-primary antialiased">
      <Sidebar 
        selectedAgent={selectedAgent}
        onAgentSelect={handleAgentSelect}
        selectedModels={selectedModels}
        onModelChange={handleModelChange}
      />

      <ChatArea 
        conversationId={currentConversationId}
        selectedAgent={selectedAgent}
        selectedModels={selectedModels}
      />
    </div>
  );
}