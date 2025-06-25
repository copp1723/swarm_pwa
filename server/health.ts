// Simple health monitoring for personal productivity app
import { memoryService } from "./services/memory";

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: number;
  services: {
    openrouter: boolean;
    memory: boolean;
    storage: boolean;
  };
}

export class HealthMonitor {
  private lastCheck: HealthStatus | null = null;

  async checkHealth(): Promise<HealthStatus> {
    const timestamp = Date.now();
    
    try {
      const memoryStatus = memoryService.getServiceStatus();
      const services = {
        openrouter: !!process.env.OPENROUTER_API_KEY,
        memory: memoryStatus.status === 'active',
        storage: true, // Local storage always available
      };

      const allHealthy = Object.values(services).every(Boolean);
      
      this.lastCheck = {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp,
        services
      };

      return this.lastCheck;
    } catch (error) {
      this.lastCheck = {
        status: 'down',
        timestamp,
        services: {
          openrouter: false,
          memory: false,
          storage: false,
        }
      };
      return this.lastCheck;
    }
  }

  getLastStatus(): HealthStatus | null {
    return this.lastCheck;
  }
}

export const healthMonitor = new HealthMonitor();