import React from 'react';
import { getStatusColor, getStatusIndicator } from '@shared/utils';

interface CollaborationStatusProps {
  status: {
    status: string;
    currentStep?: string;
    activeAgents?: string[];
    progress?: { current: number; total: number };
    error?: string;
  } | null;
}

export const CollaborationStatus = React.memo<CollaborationStatusProps>(({ status }) => {
  if (!status || status.status === 'idle' || status.status === 'completed') {
    return null;
  }

  return (
    <div className="px-8 py-4 border-b marble-border">
      <div className="marble-card-elevated rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)} animate-pulse`}></div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm marble-text-primary">
                {getStatusIndicator(status.status)} Agent Collaboration
              </span>
              {status.progress && (
                <span className="text-xs marble-text-muted">
                  {status.progress.current}/{status.progress.total}
                </span>
              )}
            </div>
            
            {status.currentStep && (
              <p className="text-xs marble-text-secondary mt-1">
                {status.currentStep}
              </p>
            )}
            
            {status.activeAgents && status.activeAgents.length > 0 && (
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs marble-text-muted">Active:</span>
                {status.activeAgents.map((agent, index) => (
                  <span
                    key={agent}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                  >
                    {agent}
                  </span>
                ))}
              </div>
            )}
            
            {status.error && (
              <p className="text-xs text-red-600 mt-2">
                {status.error}
              </p>
            )}
            
            {status.progress && (
              <div className="mt-3">
                <div className="w-full bg-marble-200 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(status.progress.current / status.progress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

CollaborationStatus.displayName = 'CollaborationStatus';