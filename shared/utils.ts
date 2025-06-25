// Shared utility functions for the SWARM multi-agent system

export const marbleClasses = {
  card: 'bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-sm',
  cardFloating: 'bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-xl shadow-lg',
  avatar: 'rounded-full flex items-center justify-center text-white font-semibold',
  focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400',
  transition: 'transition-all duration-200 ease-in-out',
  textPrimary: 'text-gray-800',
  textSecondary: 'text-gray-600',
  textMuted: 'text-gray-500',
  border: 'border-gray-200/30'
};

export const gradients = {
  subtle: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  card: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)'
};

// Agent color mapping for visual distinction
export const getAgentColor = (agentName: string, isSelected: boolean = false): string => {
  const colorMap: Record<string, string> = {
    'Communication': 'bg-blue-500',
    'Coder': 'bg-green-500', 
    'Analyst': 'bg-purple-500',
    'Writer': 'bg-orange-500',
    'Email': 'bg-red-500',
    'Project Manager': 'bg-indigo-500'
  };
  
  const baseColor = colorMap[agentName] || 'bg-gray-500';
  
  if (isSelected) {
    return `${baseColor} text-white border-${baseColor.split('-')[1]}-600`;
  }
  
  return baseColor;
};

// Get agent initials for avatar display
export const getAgentInitials = (agentName: string): string => {
  return agentName.charAt(0).toUpperCase();
};

// Format token count for display
export const formatTokenCount = (count: number): string => {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
};

// Service status color mapping
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'text-emerald-600';
    case 'limited': return 'text-yellow-600';
    case 'inactive': return 'text-red-600';
    default: return 'text-gray-500';
  }
};

// Service status indicator
export const getStatusIndicator = (status: string): string => {
  switch (status) {
    case 'active': return 'bg-emerald-500';
    case 'limited': return 'bg-yellow-500';
    case 'inactive': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Format timestamp for display
export const formatTimestamp = (timestamp: string | Date): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
};

// Validate email address
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Debounce function for search and input handling
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Safe JSON parse with fallback
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

// Copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch {
    return false;
  }
};

// Error message formatting
export const formatError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
};