import { createHash, createHmac } from 'crypto';

export interface EmailMessage {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
  tags?: string[];
}

export interface EmailTemplate {
  name: string;
  subject: string;
  text: string;
  html?: string;
  variables: string[];
}

export class EmailService {
  private apiKey: string;
  private domain: string;
  private signingKey: string;
  private baseUrl = 'https://api.mailgun.net/v3';

  constructor() {
    this.apiKey = process.env.MAILGUN_API_KEY || '';
    this.domain = process.env.MAILGUN_DOMAIN || 'mailagent.onerylie.com'; // Using your actual domain
    this.signingKey = process.env.MAILGUN_SIGNING_KEY || '';
    

  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.domain);
  }

  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { 
        success: true, 
        messageId: 'simulated-' + Date.now(),
        error: 'Email simulation mode - Mailgun not fully configured'
      };
    }

    try {
      const formData = new URLSearchParams();
      formData.append('from', message.from || `SWARM <noreply@${this.domain}>`);
      formData.append('to', message.to.join(','));
      formData.append('subject', message.subject);
      formData.append('text', message.text);
      
      if (message.html) {
        formData.append('html', message.html);
      }
      
      if (message.replyTo) {
        formData.append('h:Reply-To', message.replyTo);
      }
      
      if (message.tags) {
        message.tags.forEach(tag => formData.append('o:tag', tag));
      }

      const response = await fetch(`${this.baseUrl}/${this.domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, messageId: result.id };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to send email: ${error}` };
      }
    } catch (error) {
      return { success: false, error: `Email service error: ${error}` };
    }
  }

  async sendTaskSummary(userEmail: string, agentName: string, taskSummary: string): Promise<boolean> {
    const message: EmailMessage = {
      to: [userEmail],
      subject: `Task Complete: ${agentName} Agent`,
      text: `Your ${agentName} agent has completed a task:\n\n${taskSummary}\n\nBest regards,\nSWARM`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #374151;">Task Complete: ${agentName} Agent</h2>
          <p>Your ${agentName} agent has completed a task:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            ${taskSummary.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #6b7280;">Best regards,<br>SWARM</p>
        </div>
      `,
      tags: ['task-completion', agentName.toLowerCase()]
    };

    const result = await this.sendEmail(message);
    return result.success;
  }

  verifyWebhookSignature(timestamp: string, token: string, signature: string): boolean {
    if (!this.signingKey) return false;
    
    const data = timestamp + token;
    const hash = createHmac('sha256', this.signingKey).update(data).digest('hex');
    return hash === signature;
  }

  parseIncomingEmail(webhookData: any): { from: string; subject: string; text: string; html?: string } | null {
    try {
      return {
        from: webhookData.sender || '',
        subject: webhookData.subject || '',
        text: webhookData['body-plain'] || '',
        html: webhookData['body-html'] || undefined
      };
    } catch (error) {
      console.error('Failed to parse incoming email:', error);
      return null;
    }
  }
}

export const emailService = new EmailService();