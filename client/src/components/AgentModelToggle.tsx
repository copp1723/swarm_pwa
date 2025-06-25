import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface AgentModelToggleProps {
  agentType: string;
  selectedModel?: string;
  onModelChange: (model: string) => void;
}

const AVAILABLE_MODELS = [
  { 
    id: 'openai/gpt-4.1', 
    name: 'GPT 4.1', 
    provider: 'OpenAI',
    useWhen: 'Advanced reasoning, complex analysis, and detailed responses'
  },
  { 
    id: 'anthropic/claude-4-sonnet', 
    name: 'Claude 4 Sonnet', 
    provider: 'Anthropic',
    useWhen: 'Writing, editing, and nuanced communication tasks'
  },
  { 
    id: 'anthropic/claude-4-opus', 
    name: 'Claude 4 Opus', 
    provider: 'Anthropic',
    useWhen: 'Most complex tasks requiring deep thinking and creativity'
  },
  { 
    id: 'openai/o3-pro', 
    name: 'OpenAI o3 Pro', 
    provider: 'OpenAI',
    useWhen: 'Research, reasoning, and complex problem solving'
  },
  { 
    id: 'qwen/qwen-2.5-coder-32b-instruct', 
    name: 'Qwen2.5 Coder', 
    provider: 'Alibaba',
    useWhen: 'Code generation, debugging, and programming tasks'
  },
  { 
    id: 'google/gemini-2.0-flash-exp', 
    name: 'Gemini 2.0 Flash', 
    provider: 'Google',
    useWhen: 'Fast responses and multimodal content processing'
  },
  { 
    id: 'deepseek/deepseek-r1', 
    name: 'DeepSeek R1', 
    provider: 'DeepSeek',
    useWhen: 'Research, analysis, and cost-effective high-quality output'
  },
  { 
    id: 'x-ai/grok-beta', 
    name: 'Grok 3', 
    provider: 'xAI',
    useWhen: 'Real-time information and conversational responses'
  },
  { 
    id: 'deepseek/deepseek-v3', 
    name: 'DeepSeek V3', 
    provider: 'DeepSeek',
    useWhen: 'General tasks with excellent speed and value'
  },
  { 
    id: 'openai/codex-mini', 
    name: 'OpenAI Codex Mini', 
    provider: 'OpenAI',
    useWhen: 'Code generation, completion, and programming assistance'
  }
];

const DEFAULT_MODELS: Record<string, string> = {
  'Communication': 'anthropic/claude-4-sonnet',
  'Coder': 'qwen/qwen-2.5-coder-32b-instruct',
  'Analyst': 'openai/gpt-4.1',
  'Researcher': 'openai/o3-pro',
  'Writer': 'anthropic/claude-4-opus'
};

export const AgentModelToggle = memo(function AgentModelToggle({ agentType, selectedModel, onModelChange }: AgentModelToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const currentModel = selectedModel || DEFAULT_MODELS[agentType] || 'anthropic/claude-4-sonnet';
  const currentModelInfo = AVAILABLE_MODELS.find(m => m.id === currentModel);
  
  const recommendedModels = AVAILABLE_MODELS.filter(model => {
    switch (agentType) {
      case 'Coder':
        return ['qwen/qwen-2.5-coder-32b-instruct', 'deepseek/deepseek-v3', 'openai/gpt-4.1', 'openai/codex-mini'].includes(model.id);
      case 'Analyst':
        return ['openai/gpt-4.1', 'openai/o3-pro', 'deepseek/deepseek-r1'].includes(model.id);
      case 'Writer':
      case 'Communication':
        return ['anthropic/claude-4-sonnet', 'anthropic/claude-4-opus', 'openai/gpt-4.1'].includes(model.id);
      case 'Researcher':
        return ['openai/o3-pro', 'deepseek/deepseek-r1', 'google/gemini-2.0-flash-exp'].includes(model.id);
      default:
        return true;
    }
  });

  return (
    <div className="ml-2 mr-2 mt-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-7 px-2 text-xs marble-text-secondary hover:marble-text-primary flex items-center gap-1"
      >
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        {currentModelInfo?.name || 'Model'}
        <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
      </Button>
      
      {isExpanded && (
        <Card className="mt-2 border marble-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium marble-text-primary">
              Model for {agentType} Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <TooltipProvider>
              <div className="space-y-1">
                {AVAILABLE_MODELS.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => {
                      onModelChange(model.id);
                      setIsExpanded(false);
                    }}
                    className={`p-2 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between ${
                      currentModel === model.id 
                        ? 'bg-blue-50 border border-blue-300' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <span className="text-sm font-medium">{model.name}</span>
                    <div className="flex items-center space-x-2">
                      {currentModel === model.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-64">
                          <p className="text-xs">Use when you need: {model.useWhen}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      )}
    </div>
  );
});