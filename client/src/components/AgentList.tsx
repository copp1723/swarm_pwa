import { useState, useMemo, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Agent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AgentModelToggle } from './AgentModelToggle';
import { marbleClasses, getAgentColor, getAgentInitials } from '../../../shared/utils';
import { 
  MessageCircle, 
  Code, 
  BarChart3, 
  PenTool, 
  Mail,
  User
} from 'lucide-react';

interface AgentListProps {
  selectedAgent?: string;
  onAgentSelect: (agentName: string) => void;
  selectedModels?: Record<string, string>;
  onModelChange?: (agentName: string, model: string) => void;
}

export const AgentList = memo(function AgentList({ selectedAgent, onAgentSelect, selectedModels = {}, onModelChange }: AgentListProps) {
  const { data: agents, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.getAgents(),
    staleTime: 5 * 60 * 1000, // Reduced cache time to ensure agents load
    refetchOnWindowFocus: false,
    retry: 3,
  });

  // Agent icon mapping
  const getAgentIcon = (agentName: string) => {
    const iconMap: Record<string, React.ElementType> = {
      'Communication': MessageCircle,
      'Coder': Code,
      'Analyst': BarChart3,
      'Writer': PenTool,
      'Email': Mail
    };
    
    return iconMap[agentName] || User;
  };

  // Agent color mapping for visual distinction
  const getAgentColors = (agentName: string, isSelected: boolean) => {
    const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
      'Communication': { 
        bg: isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white/60 hover:bg-blue-50/80', 
        text: isSelected ? 'text-blue-900' : 'text-gray-700', 
        icon: isSelected ? 'text-blue-600' : 'text-blue-500' 
      },
      'Coder': { 
        bg: isSelected ? 'bg-green-50 border-green-200' : 'bg-white/60 hover:bg-green-50/80', 
        text: isSelected ? 'text-green-900' : 'text-gray-700', 
        icon: isSelected ? 'text-green-600' : 'text-green-500' 
      },
      'Analyst': { 
        bg: isSelected ? 'bg-purple-50 border-purple-200' : 'bg-white/60 hover:bg-purple-50/80', 
        text: isSelected ? 'text-purple-900' : 'text-gray-700', 
        icon: isSelected ? 'text-purple-600' : 'text-purple-500' 
      },
      'Writer': { 
        bg: isSelected ? 'bg-orange-50 border-orange-200' : 'bg-white/60 hover:bg-orange-50/80', 
        text: isSelected ? 'text-orange-900' : 'text-gray-700', 
        icon: isSelected ? 'text-orange-600' : 'text-orange-500' 
      },
      'Email': { 
        bg: isSelected ? 'bg-red-50 border-red-200' : 'bg-white/60 hover:bg-red-50/80', 
        text: isSelected ? 'text-red-900' : 'text-gray-700', 
        icon: isSelected ? 'text-red-600' : 'text-red-500' 
      }
    };
    
    return colorMap[agentName] || {
      bg: isSelected ? 'bg-gray-50 border-gray-200' : 'bg-white/60 hover:bg-gray-50/80',
      text: isSelected ? 'text-gray-900' : 'text-gray-700',
      icon: isSelected ? 'text-gray-600' : 'text-gray-500'
    };
  };

  // Memoize agent list to prevent unnecessary re-renders
  const memoizedAgents = useMemo(() => agents?.agents || [], [agents]);

  if (isLoading) {
    return (
      <div className="p-3 border-b marble-border">
        <h3 className="text-sm font-medium marble-text-primary mb-3">Agents</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center p-2 animate-pulse">
              <div className="w-7 h-7 bg-gray-200 rounded-full mr-3"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border-b marble-border" style={{ background: 'var(--gradient-subtle)' }}>
      <h3 className="text-sm font-medium marble-text-primary mb-2">Agents</h3>
      <div className="space-y-2">
        {memoizedAgents.map((agent: any) => {
          const IconComponent = getAgentIcon(agent.name);
          const colors = getAgentColors(agent.name, selectedAgent === agent.name);
          const isSelected = selectedAgent === agent.name;
          
          return (
            <div key={agent.name}>
              <Button
                variant="ghost"
                onClick={() => onAgentSelect(agent.name)}
                className={`w-full justify-start p-3 h-auto rounded-xl transition-all duration-200 border-2 ${colors.bg} ${colors.text} hover:shadow-md`}
              >
                <div className="flex items-center w-full">
                  <div className="w-8 h-8 mr-3 flex-shrink-0 flex items-center justify-center">
                    <IconComponent className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-semibold text-sm ${colors.text}`}>{agent.name}</div>
                  </div>
                  {isSelected && (
                    <div className={`w-2 h-2 rounded-full ${colors.icon.replace('text-', 'bg-')} ml-2`}></div>
                  )}
                </div>
              </Button>
              
              {selectedAgent === agent.name && onModelChange && (
                <div className="mt-2 ml-2 pr-2">
                  <AgentModelToggle
                    agentType={agent.name}
                    selectedModel={selectedModels[agent.name]}
                    onModelChange={(model) => onModelChange(agent.name, model)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});