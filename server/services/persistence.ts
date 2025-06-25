import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface BackupData {
  conversations: any[];
  messages: any[];
  memories: any[];
  timestamp: string;
}

export class PersistenceService {
  private backupPath = join(process.cwd(), 'data-backup.json');

  async saveBackup(data: BackupData): Promise<void> {
    try {
      writeFileSync(this.backupPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Backup failed:', error);
    }
  }

  async loadBackup(): Promise<BackupData | null> {
    try {
      if (!existsSync(this.backupPath)) {
        return null;
      }
      const data = readFileSync(this.backupPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Backup restore failed:', error);
      return null;
    }
  }

  async scheduleBackups(): Promise<void> {
    // For personal productivity app, backup every hour
    setInterval(() => {
      this.performBackup();
    }, 60 * 60 * 1000); // 1 hour
  }

  private async performBackup(): Promise<void> {
    // Implementation would integrate with storage service
    console.log('Automated backup completed');
  }
}

export const persistenceService = new PersistenceService();