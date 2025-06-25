import { useState, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ModelSelectorProps {
  agentType: string;
  selectedModel?: string;
  onModelChange: (model: string) => void;
  compact?: boolean;
}

const AVAILABLE_MODELS = [
  { id: 'openai/gpt-4.1', name: 'GPT 4.1', provider: 'OpenAI' },
  { id: 'openai/gpt-4o', name: 'GPT 4o', provider: 'OpenAI' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'x-ai/grok-beta', name: 'Grok 3', provider: 'xAI' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen2.5 Coder', provider: 'Alibaba' },
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'Google' },
  { id: 'openai/o3-mini', name: 'OpenAI o3 Mini', provider: 'OpenAI' },
  { id: 'openai/codex-mini', name: 'OpenAI Codex Mini', provider: 'OpenAI' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek' },
  { id: 'deepseek/deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek' }
];

const DEFAULT_MODELS: Record<string, string> = {
  'Communication': 'anthropic/claude-3.5-sonnet',
  'Coder': 'qwen/qwen-2.5-coder-32b-instruct', 
  'Analyst': 'openai/gpt-4o',
  'Researcher': 'openai/gpt-4o',
  'Writer': 'anthropic/claude-3.5-sonnet'
};

export const ModelSelector = memo(function ModelSelector({ agentType, selectedModel, onModelChange, compact = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const availableModels = AVAILABLE_MODELS;

  const currentModel = selectedModel || DEFAULT_MODELS[agentType] || 'anthropic/claude-3.5-sonnet';
  const currentModelInfo = availableModels.find(m => m.id === currentModel);
  const modelDisplayName = currentModelInfo?.name || currentModel.split('/').pop() || currentModel;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-6 px-2 text-xs marble-text-secondary hover:marble-text-primary"
        >
          {modelDisplayName}
        </Button>
        {isOpen && (
          <div className="absolute z-50 mt-8 w-64 marble-card border border-marble-200 rounded-md shadow-lg">
            <div className="p-3">
              <Label className="text-xs font-medium marble-text-primary mb-2 block">
                Model for {agentType}
              </Label>
              <Select value={currentModel} onValueChange={onModelChange}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="text-xs">
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        <span className="text-xs marble-text-secondary">{model.provider}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-full mt-2 h-6 text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium marble-text-primary">
        Model for {agentType}
      </Label>
      <Select value={currentModel} onValueChange={onModelChange}>
        <SelectTrigger className="w-full marble-focus">
          <SelectValue placeholder="Select model..." />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs marble-text-secondary">{model.provider}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});