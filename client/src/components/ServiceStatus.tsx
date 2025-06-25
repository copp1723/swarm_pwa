import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Activity, Brain, Database, Folder, Mail } from 'lucide-react';
import { ServiceStatuses } from '@/lib/types';
import { memo } from 'react';
import { getStatusColor, getStatusIndicator } from '../../../shared/utils';

export const ServiceStatus = memo(function ServiceStatus() {
  const { data: statuses, isLoading } = useQuery<ServiceStatuses>({
    queryKey: ['service-status'],
    queryFn: () => api.getServiceStatus(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="p-4 border-b marble-border">
        <h3 className="text-sm font-medium marble-text-primary mb-3">Service Status</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="h-3 bg-marble-200 rounded w-20"></div>
              <div className="h-3 bg-marble-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 shadow-sm shadow-green-200';
      case 'limited': return 'bg-orange-500 shadow-sm shadow-orange-200';
      case 'error': return 'bg-red-500 shadow-sm shadow-red-200';
      default: return 'bg-gray-400';
    }
  };

  const getIconColor = (service: any, status?: any) => {
    if (status?.status === 'active') {
      switch (service.key) {
        case 'openrouter': return 'text-blue-600';
        case 'memory': return 'text-purple-600';
        case 'supabase': return 'text-green-600';
        case 'file_access': return 'text-orange-600';
        case 'email': return 'text-pink-600';
        default: return 'marble-text-secondary';
      }
    }
    return 'marble-text-secondary';
  };

  const services = [
    { key: 'openrouter', icon: Activity, label: 'API' },
    { key: 'memory', icon: Brain, label: 'Memory' },
    { key: 'supabase', icon: Database, label: 'DB' },
    { key: 'file_access', icon: Folder, label: 'Files' },
    { key: 'email', icon: Mail, label: 'Email' }
  ];

  return (
    <div className="p-3 border-b marble-border" style={{ background: 'var(--gradient-card)' }}>
      <div className="grid grid-cols-5 gap-2">
        {services.map((service) => {
          const status = statuses?.[service.key as keyof ServiceStatuses];
          const Icon = service.icon;
          return (
            <div key={service.key} className="flex flex-col items-center space-y-1 p-1.5 rounded-lg bg-white/30 hover:bg-white/50 transition-colors">
              <div className="relative">
                <Icon className={`w-4 h-4 ${getIconColor(service, status)}`} />
                <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${getStatusColor(status?.status || 'error')}`}></div>
              </div>
              <span className="text-xs marble-text-secondary text-center font-medium">{service.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
