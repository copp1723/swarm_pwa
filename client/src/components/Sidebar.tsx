import { useState, memo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ServiceStatus } from './ServiceStatus';
import { MCPStatus } from './MCPStatus';
import { AgentList } from './AgentList';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Bot, MessageCircle, Plus, Settings, User } from "lucide-react";
import { DarkModeToggle } from "./DarkModeToggle";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface SidebarProps {
  selectedAgent?: string;
  onAgentSelect: (agentName: string) => void;
  selectedModels?: Record<string, string>;
  onModelChange?: (agentName: string, model: string) => void;
}

const Sidebar = memo(function Sidebar({ selectedAgent, onAgentSelect, selectedModels, onModelChange }: SidebarProps) {
  const [quickTransformText, setQuickTransformText] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const quickTransformMutation = useMutation({
    mutationFn: (text: string) => api.quickTransform(text),
    onSuccess: (data: any) => {
      if (data.error) {
        toast({
          title: "Transform Service Unavailable",
          description: data.error,
          variant: "destructive",
        });
        setQuickTransformText('');
        return;
      }

      if (data.redirectToChat) {
        toast({
          title: "Communication Agent Processing",
          description: "Text transformation sent to chat - check your conversation",
        });
        setQuickTransformText('');
        
        // Invalidate messages to refresh chat interface
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        return;
      }

      toast({
        title: "Text Transformed by Writer Agent",
        description: `ESTJ-style text copied to clipboard • ${data.tokenUsage || 0} tokens used`,
      });
      setQuickTransformText('');

      // Copy to clipboard for immediate use
      if (navigator.clipboard && data.transformed) {
        navigator.clipboard.writeText(data.transformed).then(() => {
          console.log('Text copied to clipboard:', data.transformed);
        }).catch(err => {
          console.error('Failed to copy to clipboard:', err);
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Transform Failed", 
        description: error instanceof Error ? error.message : "Failed to transform text",
        variant: "destructive",
      });
    }
  });



  const handleQuickTransform = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (quickTransformText.trim() && !quickTransformMutation.isPending) {
      quickTransformMutation.mutate(quickTransformText);
    }
  }, [quickTransformText, quickTransformMutation]);

  const handleQuickTransformKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleQuickTransform(e);
    }
  }, [handleQuickTransform]);

  return (
    <div className="w-80 marble-card border-r marble-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b marble-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold marble-text-primary">SWARM</h1>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
          </div>
        </div>
      </div>

      {/* Quick Transform */}
      <div className="p-3 border-b marble-border" style={{ background: 'var(--gradient-card)' }}>
        <form onSubmit={handleQuickTransform}>
          <div className="relative">
            <Textarea
              placeholder="Transform text..."
              value={quickTransformText}
              onChange={(e) => setQuickTransformText(e.target.value)}
              onKeyDown={handleQuickTransformKeyPress}
              className="w-full marble-focus text-sm resize-none border-0 shadow-sm bg-white/50"
              rows={2}
            />
            <Button 
              type="submit"
              size="sm"
              className="absolute right-1 bottom-1 h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm"
              disabled={!quickTransformText.trim() || quickTransformMutation.isPending}
            >
              {quickTransformMutation.isPending ? '...' : 'Go'}
            </Button>
          </div>
        </form>
      </div>

      {/* Service Status */}
      <ServiceStatus />
      
      {/* MCP Server Status */}
      <MCPStatus />

      {/* Agent List - Removed overflow container to eliminate scrolling */}
      <AgentList 
        onAgentSelect={onAgentSelect} 
        selectedAgent={selectedAgent} 
        selectedModels={selectedModels}
        onModelChange={onModelChange}
      />


    </div>
  );
});

export { Sidebar };