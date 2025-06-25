import { z } from 'zod';
import { RouteHandler, RequestContext } from '../lib/route-registry';
import { projectTrackerService } from '../services/project-tracker';

export const projectManagerHandler: RouteHandler = {
  schema: z.object({
    message: z.string(),
    projectCode: z.string().optional(),
    autoProcess: z.boolean().default(false),
    generateClientUpdate: z.boolean().default(false)
  }),
  
  handler: async (params, context: RequestContext) => {
    const { message, projectCode, autoProcess, generateClientUpdate } = params;
    
    // Enhanced system prompt with project context and changelog processing
    let contextPrompt = '';
    
    if (message.toLowerCase().includes('changelog') || autoProcess) {
      contextPrompt = `You are the Project Manager Agent processing a developer changelog. Extract structured information and provide professional analysis:

DEVELOPER CHANGELOG: ${message}

Your analysis should include:
1. PROJECT IDENTIFICATION: Extract project code (AI-YYYY-### format) if present
2. COMPLETED TASKS: List all finished work items
3. IN-PROGRESS TASKS: Current ongoing work
4. BLOCKERS/ISSUES: Any obstacles or delays mentioned
5. PROGRESS ASSESSMENT: Estimate percentage impact on overall project
6. TIMELINE IMPACT: Assessment of schedule adherence
7. CLIENT COMMUNICATION: Professional summary suitable for client updates

${projectCode ? `\nPROJECT CONTEXT: ${projectCode}` : ''}

Provide your response in a structured format that separates technical analysis from client-facing communications.`;
    } else {
      contextPrompt = `You are the Project Manager Agent. Provide expert project management guidance:

USER REQUEST: ${message}

${projectCode ? `\nPROJECT CONTEXT: ${projectCode}` : ''}

Focus on practical project management advice, timeline analysis, resource optimization, and professional communication strategies.`;
    }
    
    // Process with Project Manager agent
    const response = await context.agentService.processAgentRequest({
      userId: context.userId,
      conversationId: 1,
      content: contextPrompt,
      agentType: 'Project Manager',
      model: 'anthropic/claude-3.5-sonnet'
    });
    
    // Enhanced response with structured data for changelog processing
    let processedData = null;
    if (autoProcess && message.toLowerCase().includes('changelog')) {
      // Extract structured information from agent response
      const content = response.content;
      
      // Parse project code from message or response (support multiple formats)
      const projectCodeMatch = message.match(/(AI-\d{4}-\d{3}|PROJ-\d{4}|[A-Z]+-[A-Z]+-\d{4}-\d{3})/);
      const extractedProjectCode = projectCodeMatch ? projectCodeMatch[0] : projectCode;
      
      processedData = {
        projectCode: extractedProjectCode,
        rawChangelog: message,
        agentAnalysis: content,
        timestamp: new Date().toISOString(),
        processingType: 'automated'
      };
      
      // Send update to Project Tracker if configured
      if (projectTrackerService.isAvailable() && extractedProjectCode) {
        try {
          const updateResult = await projectTrackerService.updateProject({
            projectCode: extractedProjectCode,
            statusMessage: content,
            completedTasks: [], // Could be extracted from content
            inProgressTasks: [] // Could be extracted from content
          });
          
          processedData.projectTrackerUpdate = updateResult;
        } catch (error) {
          console.error('Failed to update Project Tracker:', error);
          processedData.projectTrackerError = error instanceof Error ? error.message : 'Unknown error';
        }
      }
    }
    
    return {
      ...response,
      processedData,
      projectCode: projectCode || null
    };
  },
  
  description: 'Process requests with Project Manager Agent including advanced changelog processing and client update generation'
};