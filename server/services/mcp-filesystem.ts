import { promises as fs } from 'fs';
import { join, resolve, dirname } from 'path';
import { z } from 'zod';

// MCP File System Service
// Provides secure file operations within the project directory

const fileOperationSchema = z.object({
  operation: z.enum(['read', 'write', 'list', 'delete', 'create_dir']),
  path: z.string(),
  content: z.string().optional(),
  encoding: z.enum(['utf8', 'base64']).optional().default('utf8')
});

export interface FileOperationResult {
  success: boolean;
  content?: string;
  files?: { name: string; type: string }[];
  message: string;
  path?: string;
  structure?: any;
}

export interface ProjectConfig {
  allowedExtensions: string[];
  restrictedPaths: string[];
}

const defaultConfig: ProjectConfig = {
  allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.css', '.html'],
  restrictedPaths: ['node_modules', '.git', '.env', 'package-lock.json']
};

export class MCPFileSystemService {
  private readonly projectRoot: string;
  private readonly config: ProjectConfig;

  constructor(config: Partial<ProjectConfig> = {}) {
    // For MCP filesystem access, use root filesystem access
    this.projectRoot = '/';
    this.config = { 
      ...defaultConfig, 
      restrictedPaths: ['.git', 'node_modules'], // Minimal restrictions for MCP
      ...config 
    };
  }

  private sanitizePath(inputPath: string): string {
    // Validate input
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error('Invalid path provided');
    }
    
    // Remove potentially dangerous characters
    const cleanPath = inputPath.replace(/[<>:"|?*]/g, '');
    
    // Handle desktop paths for MCP access
    if (cleanPath.startsWith('desktop/') || cleanPath.startsWith('Desktop/')) {
      const userHome = process.env.HOME || process.env.USERPROFILE || '/home/runner';
      const desktopPath = resolve(userHome, 'Desktop', cleanPath.replace(/^desktop\//i, ''));
      
      // Ensure path is within desktop directory
      if (!desktopPath.startsWith(resolve(userHome, 'Desktop'))) {
        throw new Error('Path traversal not allowed');
      }
      
      return desktopPath;
    }
    
    // Handle absolute paths with security check
    if (cleanPath.startsWith('/')) {
      // For security, restrict to safe directories in production
      const allowedPaths = ['/tmp', '/home/runner', process.cwd()];
      const isAllowed = allowedPaths.some(allowed => cleanPath.startsWith(allowed));
      
      if (!isAllowed && process.env.NODE_ENV === 'production') {
        throw new Error('Access to this path is restricted');
      }
      
      return cleanPath;
    }
    
    // For relative paths, resolve from current working directory
    const resolvedPath = resolve(process.cwd(), cleanPath);
    
    // Ensure path doesn't escape project directory
    if (!resolvedPath.startsWith(process.cwd())) {
      throw new Error('Path traversal not allowed');
    }
    
    return resolvedPath;
  }

  private isAllowedExtension(filePath: string): boolean {
    const ext = filePath.substring(filePath.lastIndexOf('.')) || '';
    return this.config.allowedExtensions.includes(ext) || ext === '';
  }

  private async executeRead(filePath: string, encoding: 'utf8' | 'base64' = 'utf8'): Promise<FileOperationResult> {
    try {
      await fs.access(filePath, fs.constants.R_OK);
      
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return {
          success: false,
          message: 'Path is not a file',
          path: filePath
        };
      }
      
      if (stats.size > 10 * 1024 * 1024) {
        return {
          success: false,
          message: `File too large: ${Math.round(stats.size / 1024 / 1024)}MB (max 10MB)`,
          path: filePath
        };
      }
      
      const content = await fs.readFile(filePath, encoding);
      return { 
        success: true, 
        content: content.toString(), 
        message: `Successfully read ${stats.size} bytes from: ${filePath}`, 
        path: filePath 
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        path: filePath
      };
    }
  }

  private async executeWrite(filePath: string, content: string, encoding: 'utf8' | 'base64' = 'utf8'): Promise<FileOperationResult> {
    try {
      const dir = dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      if (content.length > 5 * 1024 * 1024) {
        return {
          success: false,
          message: `Content too large: ${Math.round(content.length / 1024 / 1024)}MB (max 5MB)`,
          path: filePath
        };
      }
      
      await fs.writeFile(filePath, content, encoding);
      return { 
        success: true, 
        message: `Successfully wrote ${content.length} bytes to: ${filePath}`, 
        path: filePath 
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        path: filePath
      };
    }
  }

  private async executeList(dirPath: string): Promise<FileOperationResult> {
    try {
      await fs.access(dirPath, fs.constants.R_OK);
      
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      const files = items
        .filter(item => !item.name.startsWith('.') || item.name === '.')
        .map(item => ({
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file'
        }))
        .sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      
      return { 
        success: true, 
        files, 
        message: `Successfully listed ${files.length} items in: ${dirPath}`, 
        path: dirPath 
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        path: dirPath
      };
    }
  }

  private async executeDelete(filePath: string): Promise<FileOperationResult> {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) throw new Error('Cannot delete directories with this operation');
    if (!this.isAllowedExtension(filePath)) throw new Error('File type not allowed');
    
    await fs.unlink(filePath);
    return { 
      success: true, 
      message: `Successfully deleted file: ${filePath}`, 
      path: filePath 
    };
  }

  private async executeCreateDir(dirPath: string): Promise<FileOperationResult> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return { 
        success: true, 
        message: `Successfully created directory: ${dirPath}`, 
        path: dirPath 
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        path: dirPath
      };
    }
  }

  async executeFileOperation(params: any): Promise<FileOperationResult> {
    try {
      const { operation, path, content, encoding = 'utf8' } = fileOperationSchema.parse(params);
      const safePath = this.sanitizePath(path);
      
      switch (operation) {
        case 'read': return await this.executeRead(safePath, encoding);
        case 'write': return await this.executeWrite(safePath, content || '', encoding);
        case 'list': return await this.executeList(safePath);
        case 'delete': return await this.executeDelete(safePath);
        case 'create_dir': return await this.executeCreateDir(safePath);
        default: throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error) {
      return { 
        success: false, 
        message: `File operation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Get project structure for MCP context
  async getProjectStructure(maxDepth: number = 3): Promise<any> {
    try {
      const structure = await this.buildDirectoryTree(this.projectRoot, 0, maxDepth);
      return {
        success: true,
        structure,
        message: 'Project structure retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get project structure: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async buildDirectoryTree(dirPath: string, currentDepth: number, maxDepth: number): Promise<any> {
    if (currentDepth >= maxDepth) {
      return { name: dirname(dirPath), type: 'directory', truncated: true };
    }

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const tree: any = {
        name: dirname(dirPath) === dirPath ? 'root' : dirname(dirPath),
        type: 'directory',
        children: []
      };

      for (const entry of entries) {
        if (this.config.restrictedPaths.some((restricted: string) => entry.name.includes(restricted))) {
          continue;
        }

        const fullPath = join(dirPath, entry.name);
        if (entry.isDirectory()) {
          const subtree = await this.buildDirectoryTree(fullPath, currentDepth + 1, maxDepth);
          tree.children.push(subtree);
        } else if (this.isAllowedExtension(entry.name)) {
          tree.children.push({
            name: entry.name,
            type: 'file',
            path: fullPath
          });
        }
      }

      return tree;
    } catch (error) {
      return {
        name: dirname(dirPath),
        type: 'directory',
        error: 'Access denied'
      };
    }
  }
}

export const mcpFileSystem = new MCPFileSystemService();