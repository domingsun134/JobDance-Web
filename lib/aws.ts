// AWS service clients (server-side only)
// This file should only be imported in API routes or server components
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Request queue for rate limiting
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private minDelay = 1000; // Increased to 1 second minimum delay between requests (ms)
  private lastRequestTime = 0;
  private consecutiveThrottles = 0;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          // Reset throttle counter on success
          this.consecutiveThrottles = 0;
          resolve(result);
        } catch (error: any) {
          // Track throttling errors
          if (error.name === 'ThrottlingException' || error.$metadata?.httpStatusCode === 429) {
            this.consecutiveThrottles++;
            // Increase delay if we're getting throttled
            if (this.consecutiveThrottles > 2) {
              this.minDelay = Math.min(3000, this.minDelay * 1.5); // Cap at 3 seconds
            }
          }
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      // Use adaptive delay based on throttle history
      const delay = this.consecutiveThrottles > 0 ? this.minDelay * 1.5 : this.minDelay;
      
      if (timeSinceLastRequest < delay) {
        await new Promise(resolve => setTimeout(resolve, delay - timeSinceLastRequest));
      }
      
      const request = this.queue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        await request();
      }
    }
    
    this.processing = false;
  }
}

const bedrockQueue = new RequestQueue();

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a throttling error
      if (error.name === 'ThrottlingException' || error.$metadata?.httpStatusCode === 429) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000; // Exponential backoff with jitter
          console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  throw lastError;
}

// Initialize AWS clients
const getPollyClient = () => {
  return new PollyClient({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
};

/**
 * Get Bedrock Runtime Client configured for US East 1 region
 * 
 * IMPORTANT DATA RESIDENCY NOTICE:
 * This client is configured to use us-east-1 (US East - N. Virginia) region,
 * which means all AI inference requests will be processed in the United States.
 * This may have compliance implications depending on your data residency requirements.
 * Please verify that processing data in the US is acceptable for your use case.
 * 
 * We use us-east-1 instead of ap-southeast-1 to access the US Cross-Region Inference pools,
 * which have significantly higher default quotas (TPM/TPS) and better reliability.
 */
const getBedrockClient = () => {
  return new BedrockRuntimeClient({
    region: 'us-east-1', // Force US East 1 for higher quota capacity and reliability
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    maxAttempts: 5, // Maximum number of retry attempts
    retryMode: 'standard', // Use standard retry mode with exponential backoff
  });
};

const getS3Client = () => {
  return new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

// Text-to-Speech using AWS Polly
// Using 'Ruth' (US English, female, neural) - most natural and human-like voice
// Other natural neural voices: 'Matthew' (US English, male), 'Joanna' (US English, female), 
// 'Stephen' (US English, male), 'Amy' (British English, female), 'Emma' (British English, female)
export async function synthesizeSpeech(text: string, voiceId: string = 'Ruth'): Promise<Buffer> {
  const client = getPollyClient();
  
  // Use retry logic for Polly as well
  const response = await retryWithBackoff(async () => {
    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voiceId as any, // Type assertion for VoiceId
      Engine: 'neural', // Use neural engine for more natural, human-like speech with better intonation
    });
    return await client.send(command);
  }, 3, 500); // 3 retries with 500ms base delay
  
  if (!response.AudioStream) {
    throw new Error('No audio stream returned from Polly');
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.AudioStream as any) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

// Helper function to calculate similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/).filter(w => w.length > 3); // Only meaningful words
  const words2 = str2.split(/\s+/).filter(w => w.length > 3);
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  return intersection.length / union.length;
}

// Helper function to extract topics from conversation
function extractTopics(messages: Array<{ role: string; content: string }>): string[] {
  const topics: string[] = [];
  messages.forEach(msg => {
    if (msg.role === 'user') {
      const content = msg.content.toLowerCase();
      if (content.includes('experience')) topics.push('experience');
      if (content.includes('project')) topics.push('projects');
      if (content.includes('skill')) topics.push('skills');
      if (content.includes('work') || content.includes('job')) topics.push('work');
      if (content.includes('education') || content.includes('study')) topics.push('education');
      if (content.includes('challenge') || content.includes('problem')) topics.push('challenges');
      if (content.includes('team') || content.includes('collaborate')) topics.push('teamwork');
      if (content.includes('lead') || content.includes('manage')) topics.push('leadership');
    }
  });
  return [...new Set(topics)];
}

// Generate a new question when AI is repeating
function generateNewQuestion(coveredTopics: string[], userText: string, userProfile?: any): string {
  const allTopics = [
    'your career goals',
    'your biggest achievement',
    'how you handle pressure',
    'your problem-solving approach',
    'what motivates you',
    'your learning style',
    'how you work in a team',
    'your communication style',
    'your strengths and weaknesses',
    'where you see yourself in 5 years',
    'why you want this role',
    'what you bring to the team'
  ];
  
  const availableTopics = allTopics.filter(topic => {
    const topicKey = topic.toLowerCase();
    return !coveredTopics.some(covered => topicKey.includes(covered) || covered.includes(topicKey));
  });
  
  if (userText.includes("don't have") || userText.includes("no experience")) {
    const questions = [
      "What interests you most about this field?",
      "What skills are you looking to develop?",
      "What drew you to pursue this career path?",
      "What are your career goals for the next few years?"
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }
  
  if (userProfile) {
    if (userProfile.skills && userProfile.skills.length > 0 && !coveredTopics.includes('skills')) {
      return `I see you have skills in ${userProfile.skills.slice(0, 2).join(' and ')}. How did you develop these skills, and which one are you most passionate about?`;
    }
    if (userProfile.education && userProfile.education.length > 0 && !coveredTopics.includes('education')) {
      const edu = userProfile.education[0];
      return `I noticed you studied ${edu.field}. What motivated you to choose this field, and how has your education prepared you for your career?`;
    }
  }
  
  if (availableTopics.length > 0) {
    const topic = availableTopics[0];
    return `Let's shift gears. Can you tell me about ${topic}?`;
  }
  
  return "That's helpful context. Can you tell me about a time when you had to learn something new quickly?";
}

// Get AI response using AWS Bedrock (Claude)
export async function getAIResponse(
  messages: Array<{ role: string; content: string }>,
  userProfile?: any,
  isClosing?: boolean
): Promise<string> {
  const client = getBedrockClient();

  // Extract previously asked questions to avoid repetition
  const previousQuestions = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content)
    .slice(-5); // Last 5 questions

  // Build context from user profile
  let systemPrompt = '';
  
  if (isClosing) {
    // Special prompt for closing statement
    systemPrompt = `You are a professional interview coach concluding a job interview practice session. The candidate has just completed answering all interview questions.

Your task is to provide a warm, professional, and encouraging closing statement that:
1. Thanks the candidate for their time and thoughtful responses
2. Acknowledges their participation in the practice interview
3. Provides a brief, positive note about the interview process
4. Mentions that they will receive detailed feedback and a comprehensive report
5. Keeps it concise (2-3 sentences) and professional
6. Ends on an encouraging note

Example: "Thank you so much for taking the time to participate in this interview practice session. I really appreciate the thoughtful responses you've shared today. You'll receive a detailed feedback report shortly that will help you continue improving your interview skills. Best of luck with your job search!"

Do NOT ask any more questions. This is the closing statement only.`;
  } else {
    systemPrompt = `You are a professional, friendly, and engaging interview coach conducting a job interview. Your goal is to have a natural, conversational interview that helps the candidate practice their interview skills.

CRITICAL INSTRUCTIONS - FOLLOW THESE STRICTLY:
1. ALWAYS acknowledge what the candidate ACTUALLY said - if they say they DON'T have experience, acknowledge that
2. NEVER contradict what the candidate just said (e.g., don't say "that's interesting" if they said they have no experience)
3. Reference specific details, keywords, or topics from the candidate's IMMEDIATE previous answer
4. If the candidate gives a negative response, acknowledge it appropriately and pivot to a helpful question
5. Ask targeted follow-up questions that make sense given their ACTUAL response
6. Use natural, conversational language - speak like a real person, not a formal robot
7. Keep responses SHORT (1-2 sentences max) - this is a quick back-and-forth conversation
8. Be warm, encouraging, and show personality
9. NEVER give generic responses that ignore what they actually said

GOOD Examples:
- User: "I have experience in AI projects"
- You: "That's fantastic! AI skills are incredibly valuable. Can you tell me about a specific AI project you worked on? What was the most challenging part?"

- User: "I worked as a Senior IT Engineer at Sunningdale Tech"
- You: "Great! A Senior IT Engineer role sounds like a significant position. What were your main responsibilities at Sunningdale Tech, and what did you enjoy most about that role?"

- User: "I don't have experience"
- You: "I understand. Everyone starts somewhere! What interests you about this field, or what skills are you looking to develop?" ✅ (Acknowledges lack of experience and pivots appropriately)

- User: "I don't have any experience in that area"
- You: "That's okay. Can you tell me about related experiences or skills you do have that might be transferable?" ✅ (Acknowledges and redirects constructively)

- User: "I'm not sure about that"
- You: "No problem. Let me rephrase - what aspects of your background do you think are most relevant to this role?" ✅ (Acknowledges uncertainty and helps)

BAD Examples (DON'T DO THIS):
- User: "I don't have experience"
- You: "That sounds really interesting! Can you tell me more about that experience?" ❌ (Contradicts what they said)

- User: "I don't have any experience"
- You: "That's great! Tell me about your experience." ❌ (Makes no sense)

- User: "I have experience in AI projects"
- You: "That's interesting. Can you tell me more?" ❌ (Too vague, doesn't reference AI)

- User: "I worked on a mobile app"
- You: "That's great. What else?" ❌ (Doesn't acknowledge the mobile app specifically)

- Asking the same question multiple times ❌ (Move forward, don't repeat)

PREVIOUSLY ASKED QUESTIONS (DO NOT REPEAT THESE):
${previousQuestions.length > 0 ? previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n') : 'None yet - this is the first question'}

Remember: 
- Your response MUST acknowledge what they ACTUALLY said, even if it's negative
- Be empathetic and pivot constructively when they express lack of experience or uncertainty
- NEVER repeat questions - always move to NEW topics and areas
- Progress the conversation forward naturally`;
  }

  if (userProfile) {
    systemPrompt += `\n\nCandidate Background (use this for context, but focus on what they say in the conversation):
- Work Experience: ${userProfile.workExperience?.map((exp: any) => `${exp.position} at ${exp.company}`).join(', ') || 'None'}
- Education: ${userProfile.education?.map((edu: any) => `${edu.degree} in ${edu.field} from ${edu.institution}`).join(', ') || 'None'}
- Skills: ${userProfile.skills?.join(', ') || 'None'}`;
  }

  // Format messages for Claude
  const conversation = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content,
  }));

  const prompt = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1000,
    system: systemPrompt,
    messages: conversation,
  };

  try {
    const body = JSON.stringify(prompt);
    
    // Use queue and retry logic to handle rate limiting
    const response = await bedrockQueue.add(async () => {
      return await retryWithBackoff(async () => {
        const command = new InvokeModelCommand({
          // US Cross-Region Inference Profile for maximum throughput and reliability
          // This profile provides access to the US inference pool with higher quotas
          modelId: 'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
          contentType: 'application/json',
          accept: 'application/json',
          body: new TextEncoder().encode(body),
        });
        return await client.send(command);
      }, 3, 1000); // 3 retries with 1s base delay (additional to SDK retries)
    });
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    const aiResponse = responseBody.content[0].text.trim();
    
    // Get the last user message to check context
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const userText = lastUserMessage?.content?.toLowerCase() || '';
    
    // Extract previous questions for repetition check
    const previousQuestionsForCheck = messages
      .filter(m => m.role === 'assistant')
      .map(m => m.content)
      .slice(-5);
    
    // Check if AI is repeating a previous question
    const isRepeating = previousQuestionsForCheck.some(prevQ => {
      const similarity = calculateSimilarity(aiResponse.toLowerCase(), prevQ.toLowerCase());
      return similarity > 0.7; // 70% similarity threshold
    });
    
    if (isRepeating) {
      // Generate a different question based on conversation context
      const conversationTopics = extractTopics(messages);
      return generateNewQuestion(conversationTopics, userText, userProfile);
    }
    
    // Check if user said they don't have experience or something negative
    const hasNegativeResponse = userText.includes("don't have") || 
                               userText.includes("don't") || 
                               userText.includes("no experience") ||
                               userText.includes("not sure") ||
                               userText.includes("i don't");
    
    // If response contradicts a negative user statement, fix it
    if (hasNegativeResponse && (aiResponse.toLowerCase().includes("that's interesting") || 
                                aiResponse.toLowerCase().includes("tell me more about that experience"))) {
      // Create an appropriate response that acknowledges lack of experience
      if (userText.includes("experience")) {
        return "I understand. Everyone starts somewhere! What interests you about this field, or what skills are you looking to develop?";
      } else if (userText.includes("not sure")) {
        return "No problem. Let me rephrase - what aspects of your background do you think are most relevant to this role?";
      } else {
        return "That's okay. Can you tell me about related experiences or skills you do have that might be transferable?";
      }
    }
    
    // Ensure the response is conversational and references the user's answer
    // If the response is too generic, enhance it
    if (aiResponse.length < 20 || (aiResponse.toLowerCase().includes("that's interesting") && !aiResponse.includes("specifically"))) {
      if (lastUserMessage) {
        // Create a more specific response
        return `I'd love to hear more about that. Can you share a specific example or tell me more details about what you mentioned?`;
      }
    }
    
    return aiResponse;
  } catch (error: any) {
    console.error('Bedrock error:', error);
    
    // Handle throttling with user-friendly message
    if (error.name === 'ThrottlingException' || error.$metadata?.httpStatusCode === 429) {
      console.warn('Rate limited, using fallback response');
      // Return a context-aware fallback instead of failing
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        const userText = lastUserMessage.content?.toLowerCase() || '';
        
        if (userText.includes("don't have") || userText.includes("no experience") || userText.includes("i don't")) {
          return "I understand. Everyone starts somewhere! What interests you about this field, or what skills are you looking to develop?";
        }
        
        if (userText.includes("not sure")) {
          return "No problem. Let me rephrase - what aspects of your background do you think are most relevant to this role?";
        }
        
        // Extract key topic from user's message for context
        if (userText.includes("project")) {
          return "That's interesting! Can you tell me more about that project and what you learned from it?";
        }
        if (userText.includes("work") || userText.includes("job")) {
          return "Great! Can you share more about your work experience and what you enjoyed most?";
        }
        if (userText.includes("skill")) {
          return "That's valuable! How did you develop that skill, and how have you applied it?";
        }
        
        return `That sounds really interesting! Can you tell me more about that?`;
      }
    }
    
    // Fallback that's still conversational and context-aware
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      const userText = lastUserMessage.content?.toLowerCase() || '';
      
      // Check for negative responses
      if (userText.includes("don't have") || userText.includes("no experience") || userText.includes("i don't")) {
        return "I understand. Everyone starts somewhere! What interests you about this field, or what skills are you looking to develop?";
      }
      
      if (userText.includes("not sure")) {
        return "No problem. Let me rephrase - what aspects of your background do you think are most relevant to this role?";
      }
      
      return `That sounds really interesting! Can you tell me more about that?`;
    }
    return "That's interesting. Can you tell me more about that?";
  }
}

// Generate interview report using AWS Bedrock
export async function generateInterviewReport(
  messages: Array<{ role: string; content: string }>,
  userProfile?: any,
  duration?: number
): Promise<any> {
  const client = getBedrockClient();

  const systemPrompt = `You are an expert interview analyst. Analyze the COMPLETE interview conversation and provide a comprehensive, professional report.

IMPORTANT: This report is for the INTERVIEWEE to read themselves. Use second person ("You", "Your") throughout the report, NOT third person ("The candidate", "The candidate's"). Write as if you are speaking directly to them.

CRITICAL: You must analyze the ENTIRE conversation as a whole, not just individual questions. Consider:
- How all answers connect together
- Patterns across multiple responses
- Consistency in your story
- Overall narrative and coherence
- How different topics relate to each other
- The complete picture of your experience, skills, and personality

MOST IMPORTANT: FAIR EVALUATION PRINCIPLE
- ALWAYS evaluate answers in the CONTEXT of the questions asked
- If a question asks for a specific example (e.g., "give a project that you facing issue"), you SHOULD focus on that specific example
- DO NOT penalize for appropriately answering the question as asked
- Only criticize if the answer is INAPPROPRIATE for the question (e.g., not answering the question, being evasive, or providing irrelevant information)
- If a question asks for ONE project, focusing on ONE project is CORRECT and should be praised, not criticized
- If a question asks for details about a specific topic, providing focused details is APPROPRIATE
- Evaluate whether the answer demonstrates the skills/knowledge being asked about, not whether it covers other topics
- Consider: "Did you answer what was asked?" before evaluating depth or breadth

Analyze the FULL conversation history and provide a detailed report in JSON format with the following structure:
{
  "overallPerformance": {
    "score": 85,
    "summary": "Comprehensive summary that links ALL answers together, showing your complete picture. Use 'You' and 'Your' throughout.",
    "strengths": ["strength1 based on multiple answers", "strength2 from conversation pattern"],
    "weaknesses": ["weakness1 identified across responses", "weakness2 from overall pattern"]
  },
  "technicalKnowledge": {
    "score": 80,
    "assessment": "Detailed assessment based on ALL technical discussions throughout the interview. Use 'You' and 'Your'.",
    "areasOfExpertise": ["area1 mentioned multiple times", "area2 consistently demonstrated"],
    "gaps": ["gap1 identified from conversation", "gap2 from missing topics"]
  },
  "confidenceLevel": {
    "score": 75,
    "assessment": "Overall confidence assessment based on your communication style across ALL responses. Use 'You' and 'Your'.",
    "indicators": ["indicator1 from multiple answers", "indicator2 from conversation flow"]
  },
  "jobSuitability": {
    "score": 82,
    "assessment": "How well you fit the role based on COMPLETE interview performance. Use 'You' and 'Your'.",
    "alignment": ["alignment1 from multiple answers", "alignment2 from overall narrative"],
    "concerns": ["concern1 from conversation pattern", "concern2 from inconsistencies"]
  },
  "hiringLikelihood": {
    "score": 78,
    "assessment": "Likelihood based on ENTIRE interview performance, not just one answer. Use 'You' and 'Your'.",
    "factors": ["factor1 from full conversation", "factor2 from overall impression"],
    "recommendation": "Comprehensive recommendation considering all responses. Use 'You' and 'Your'."
  },
  "conversationAnalysis": {
    "coherence": "How well all your answers connect together",
    "consistency": "Whether your story is consistent across topics",
    "depth": "How deeply topics were explored",
    "narrative": "The overall story you told"
  },
  "improvements": [
    {
      "category": "Technical",
      "suggestion": "Specific improvement based on multiple responses",
      "priority": "High/Medium/Low",
      "evidence": "Which answers showed this need"
    }
  ],
  "considerations": [
    "Important consideration based on full conversation",
    "Pattern identified across multiple answers"
  ]
}

CRITICAL REQUIREMENTS:
1. Analyze the ENTIRE conversation, not just individual Q&A pairs
2. Link answers together to see the complete picture
3. Identify patterns across multiple responses
4. Scores should be 0-100 (realistic, not inflated)
5. Be honest and constructive - this is for improvement
6. Reference specific examples from MULTIPLE parts of the conversation
7. Show how different answers relate to each other
8. Provide actionable feedback based on the full interview
9. Be professional but encouraging
10. Consider the user's background and experience level
11. Look for consistency or inconsistencies across responses
12. Build a comprehensive narrative from all answers
13. ALWAYS use second person ("You", "Your") - NEVER use third person ("The candidate", "The candidate's")

FAIRNESS REQUIREMENTS (CRITICAL):
14. ALWAYS read the question asked before evaluating the answer
15. Evaluate whether the answer is APPROPRIATE for the specific question asked
16. If a question asks for a specific example, focusing on that example is CORRECT
17. If a question asks for details about one project, providing details about one project is APPROPRIATE
18. DO NOT criticize for answering questions as asked, even if it's focused
19. Only identify weaknesses if:
    - The answer doesn't address the question asked
    - The answer lacks necessary detail for what was asked
    - The answer is evasive or avoids the question
    - The answer shows a genuine gap in knowledge/skills
20. Praise for:
    - Directly answering the question asked
    - Providing relevant details for the specific question
    - Being focused when the question asks for focus
    - Demonstrating the skills/knowledge being asked about
21. When evaluating breadth vs depth:
    - If the question asks for depth (e.g., "tell me about a project"), depth is appropriate
    - If the question asks for breadth (e.g., "tell me about your experience"), breadth is appropriate
    - Evaluate based on what was asked, not what you wish was asked`;

  // Use ALL messages for comprehensive analysis, not just last 10
  const fullConversation = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content,
  }));

  // Create a structured conversation summary for better analysis
  // Group questions and answers together so the AI can see the context
  const conversationSummary = [];
  let questionNum = 0;
  for (let i = 0; i < fullConversation.length; i++) {
    const msg = fullConversation[i];
    if (msg.role === 'assistant') {
      questionNum++;
      conversationSummary.push(`\n=== QUESTION ${questionNum} ===`);
      conversationSummary.push(`Interviewer: ${msg.content}`);
    } else {
      conversationSummary.push(`Candidate: ${msg.content}`);
      conversationSummary.push(''); // Empty line between Q&A pairs
    }
  }
  const formattedSummary = conversationSummary.join('\n');

  const prompt = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 3000, // Increased for comprehensive analysis
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Analyze this COMPLETE interview conversation and generate a comprehensive report that links ALL questions and answers together.

Interview Duration: ${duration || 0} seconds
Total Questions Asked: ${fullConversation.filter(m => m.role === 'assistant').length}
Total Answers Provided: ${fullConversation.filter(m => m.role === 'user').length}

Candidate Background:
${userProfile ? JSON.stringify({
  workExperience: userProfile.workExperience?.map((exp: any) => `${exp.position} at ${exp.company}`) || [],
  education: userProfile.education?.map((edu: any) => `${edu.degree} in ${edu.field}`) || [],
  skills: userProfile.skills || []
}) : 'Not provided'}

FULL CONVERSATION HISTORY (Questions and Answers paired together):
${formattedSummary}

CRITICAL ANALYSIS INSTRUCTIONS:
1. For EACH question-answer pair, FIRST identify what the question asked for
2. THEN evaluate whether the answer appropriately addresses that specific question
3. DO NOT penalize for being focused if the question asked for focus
4. DO NOT penalize for providing one example if the question asked for one example
5. Only identify weaknesses if the answer fails to address what was asked
6. ALWAYS use second person ("You", "Your") throughout the report - this is for the interviewee to read

IMPORTANT: Analyze this as a COMPLETE interview. Look for:
- How all answers connect and build a narrative
- Patterns across multiple responses
- Consistency in your story
- Overall coherence and depth
- How different topics relate to each other
- The complete picture, not just individual answers
- Whether each answer is APPROPRIATE for the question asked

FAIRNESS CHECK: Before identifying any weakness, ask yourself:
- "What did the question ask for?"
- "Did the answer address what was asked?"
- "Is this criticism fair given what the question requested?"

PERSONA: Write the entire report using second person ("You", "Your", "Yourself") as if speaking directly to the interviewee. This is their personal feedback report, not a third-party evaluation.

Generate a comprehensive, FAIR report that evaluates answers in the context of the questions asked, written in second person for the interviewee.`
      }
    ],
  };

  try {
    const body = JSON.stringify(prompt);
    
    // Use queue and retry logic to handle rate limiting
    const response = await bedrockQueue.add(async () => {
      return await retryWithBackoff(async () => {
        const command = new InvokeModelCommand({
          // US Cross-Region Inference Profile for maximum throughput and reliability
          // This profile provides access to the US inference pool with higher quotas
          modelId: 'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
          contentType: 'application/json',
          accept: 'application/json',
          body: new TextEncoder().encode(body),
        });
        return await client.send(command);
      }, 3, 1000); // 3 retries with 1s base delay (additional to SDK retries)
    });
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    const reportText = responseBody.content[0].text.trim();
    
    // Try to extract JSON from the response
    const jsonMatch = reportText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If no JSON found, return a structured default
    return {
      overallPerformance: {
        score: 70,
        summary: "Interview completed. Review the detailed analysis below.",
        strengths: [],
        weaknesses: []
      },
      technicalKnowledge: {
        score: 70,
        assessment: reportText.substring(0, 200),
        areasOfExpertise: [],
        gaps: []
      },
      confidenceLevel: {
        score: 70,
        assessment: "Confidence level assessed based on communication style.",
        indicators: []
      },
      jobSuitability: {
        score: 70,
        assessment: "Suitability assessed based on responses.",
        alignment: [],
        concerns: []
      },
      hiringLikelihood: {
        score: 70,
        assessment: "Based on overall performance.",
        factors: [],
        recommendation: "Continue practicing and improving."
      },
      improvements: [],
      considerations: []
    };
  } catch (error: any) {
    console.error('Error generating report:', error);
    
    // Handle throttling - return a basic report structure
    if (error.name === 'ThrottlingException' || error.$metadata?.httpStatusCode === 429) {
      console.warn('Rate limited during report generation, returning basic report');
      // Return a basic report structure based on conversation analysis
      const userAnswers = messages.filter(m => m.role === 'user').map(m => m.content);
      const totalAnswers = userAnswers.length;
      const avgAnswerLength = userAnswers.reduce((sum, ans) => sum + ans.length, 0) / totalAnswers || 0;
      
      return {
        overallPerformance: {
          score: Math.min(75, Math.max(50, Math.floor(avgAnswerLength / 10))),
          summary: `Interview completed with ${totalAnswers} responses. Review your answers to identify areas for improvement.`,
          strengths: userAnswers.length > 0 ? ["Engaged in conversation", "Provided responses to questions"] : [],
          weaknesses: ["Continue practicing to improve depth of answers"]
        },
        technicalKnowledge: {
          score: 70,
          assessment: "Technical knowledge assessment based on interview responses.",
          areasOfExpertise: [],
          gaps: []
        },
        confidenceLevel: {
          score: 70,
          assessment: "Confidence level assessed based on communication throughout the interview.",
          indicators: []
        },
        jobSuitability: {
          score: 70,
          assessment: "Job suitability based on overall interview performance.",
          alignment: [],
          concerns: []
        },
        hiringLikelihood: {
          score: 70,
          assessment: "Based on interview performance. Continue practicing to improve.",
          factors: [],
          recommendation: "Keep practicing and refining your answers."
        },
        conversationAnalysis: {
          coherence: "Interview completed successfully.",
          consistency: "Responses provided throughout the conversation.",
          depth: "Continue to provide more detailed examples in future interviews.",
          narrative: "Your interview story is developing."
        },
        improvements: [
          {
            category: "General",
            suggestion: "Practice providing more detailed examples using the STAR method.",
            priority: "High"
          }
        ],
        considerations: ["Continue practicing to improve interview skills"]
      };
    }
    
    throw error;
  }
}

// Upload video to S3
export async function uploadVideoToS3(
  videoBlob: Blob,
  userId: string,
  sessionId: string
): Promise<string> {
  const client = getS3Client();
  const bucketName = process.env.AWS_S3_BUCKET_NAME || '';

  const key = `interviews/${userId}/${sessionId}-${Date.now()}.webm`;
  
  const arrayBuffer = await videoBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: 'video/webm',
  });

  await client.send(command);

  // Generate presigned URL for access
  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const url = await getSignedUrl(client, getCommand, { expiresIn: 3600 * 24 * 7 }); // 7 days

  return url;
}
