import { z } from 'zod';

// Project Tracker API Configuration
export interface ProjectTrackerConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

// Project data structures
export interface ProjectUpdate {
  projectCode: string;
  progressPercentage?: number;
  statusMessage: string;
  phaseChange?: boolean;
  completedTasks?: string[];
  inProgressTasks?: string[];
  blockers?: string[];
  estimatedCompletion?: string;
}

export interface ProjectData {
  projectCode: string;
  clientName: string;
  title: string;
  status: 'planning' | 'development' | 'testing' | 'deployment' | 'completed';
  phase: number;
  progressPercentage: number;
  startDate: string;
  estimatedCompletion: string;
  description?: string;
}

// Validation schemas - supports multiple project code formats
const projectUpdateSchema = z.object({
  projectCode: z.string().min(1, 'Project code required'),
  progressPercentage: z.number().min(0).max(100).optional(),
  statusMessage: z.string().min(1),
  phaseChange: z.boolean().optional(),
  completedTasks: z.array(z.string()).optional(),
  inProgressTasks: z.array(z.string()).optional(),
  blockers: z.array(z.string()).optional(),
  estimatedCompletion: z.string().optional()
});

export class ProjectTrackerService {
  private config: ProjectTrackerConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      baseUrl: process.env.PROJECT_TRACKER_URL || '',
      apiKey: process.env.PROJECT_TRACKER_API_KEY || '',
      timeout: 10000
    };
    
    this.isConfigured = !!(this.config.baseUrl && this.config.apiKey);
    
    if (!this.isConfigured) {
      console.warn('Project Tracker not configured. Set PROJECT_TRACKER_URL and PROJECT_TRACKER_API_KEY environment variables.');
    }
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }

  async updateProject(update: ProjectUpdate): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Project Tracker not configured'
      };
    }

    try {
      // Validate input
      const validatedUpdate = projectUpdateSchema.parse(update);
      
      const response = await fetch(`${this.config.baseUrl}/api/swarm/projects/${validatedUpdate.projectCode}`, {
        method: 'PATCH',
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'SWARM-ProjectManager/1.0'
        },
        body: JSON.stringify(validatedUpdate),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        message: `Project ${validatedUpdate.projectCode} updated successfully`
      };
    } catch (error) {
      console.error('Project Tracker update failed:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getProject(projectCode: string): Promise<ProjectData | null> {
    if (!this.isConfigured) {
      console.warn('Project Tracker not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/swarm/projects/${projectCode}`, {
        headers: {
          'X-API-Key': this.config.apiKey,
          'User-Agent': 'SWARM-ProjectManager/1.0'
        },
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const projectData = await response.json();
      return projectData as ProjectData;
    } catch (error) {
      console.error('Failed to fetch project data:', error);
      return null;
    }
  }

  async refreshCustomerPage(projectCode: string): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Project Tracker not configured'
      };
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/swarm/projects/${projectCode}/refresh`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.config.apiKey,
          'User-Agent': 'SWARM-ProjectManager/1.0'
        },
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        message: `Customer page refreshed for project ${projectCode}`
      };
    } catch (error) {
      console.error('Customer page refresh failed:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Project Tracker not configured. Set PROJECT_TRACKER_URL and PROJECT_TRACKER_API_KEY.'
      };
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/health`, {
        headers: {
          'X-API-Key': this.config.apiKey,
          'User-Agent': 'SWARM-ProjectManager/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Project Tracker connection successful'
        };
      } else {
        return {
          success: false,
          message: `Connection failed: HTTP ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  getConfiguration(): { configured: boolean; baseUrl: string } {
    return {
      configured: this.isConfigured,
      baseUrl: this.config.baseUrl || 'Not configured'
    };
  }
}

export const projectTrackerService = new ProjectTrackerService();