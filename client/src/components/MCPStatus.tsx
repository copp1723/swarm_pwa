import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { memo } from 'react';
import { FileText, Brain, Github, Server } from 'lucide-react';

interface MCPServer {
  name: string;
  description: string;
  capabilities: string[];
  enabled: boolean;
  available?: boolean;
}

export const MCPStatus = memo(function MCPStatus() {
  const { data: serverStatus, isLoading } = useQuery({
    queryKey: ['mcp-status'],
    queryFn: () => api.getMCPServerStatus(),
    staleTime: 30000,
    refetchInterval: 60000
  });

  if (isLoading) {
    return (
      <div className="p-3 border-b marble-border">
        <h3 className="text-sm font-medium marble-text-primary mb-3">MCP Servers</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-20"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getServerIcon = (serverName: string) => {
    switch (serverName) {
      case 'filesystem': return <FileText className="w-4 h-4" />;
      case 'memory': return <Brain className="w-4 h-4" />;
      case 'github': return <Github className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const getStatusColor = (enabled: boolean, available: boolean) => {
    if (!enabled) return 'bg-gray-400';
    return available ? 'bg-emerald-500' : 'bg-red-500';
  };

  const servers = serverStatus ? Object.entries(serverStatus).map(([name, config]: [string, any]) => ({
    name,
    ...config
  })) : [];

  return (
    <div className="p-3 border-b marble-border">
      <h3 className="text-sm font-medium marble-text-primary mb-3">MCP Servers</h3>
      <div className="grid grid-cols-2 gap-2">
        {servers.map((server) => (
          <div
            key={server.name}
            className="flex items-center justify-between p-2 rounded-lg bg-white/40 hover:bg-white/60 marble-transition"
            title={server.description}
          >
            <div className="flex items-center space-x-2">
              <div className="text-gray-600">
                {getServerIcon(server.name)}
              </div>
              <span className="text-xs font-medium marble-text-primary capitalize">
                {server.name}
              </span>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor(server.enabled, server.available)}`}
              title={server.enabled ? (server.available ? 'Active' : 'Error') : 'Disabled'}
            />
          </div>
        ))}
      </div>
    </div>
  );
});