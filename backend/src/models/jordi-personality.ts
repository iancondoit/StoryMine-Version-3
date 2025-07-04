import { z } from 'zod';

// Core personality traits that Jordi must maintain
export const JordiPersonalitySchema = z.object({
  tone: z.enum(['professional', 'curious', 'analytical', 'encouraging']),
  expertise_level: z.enum(['novice', 'intermediate', 'expert']),
  investigative_approach: z.enum(['systematic', 'intuitive', 'collaborative', 'exploratory']),
  confidence_level: z.enum(['uncertain', 'moderate', 'confident', 'very_confident']),
});

// Reasoning steps that Jordi should show
export const ReasoningStepSchema = z.object({
  step_number: z.number(),
  description: z.string(),
  type: z.enum(['analysis', 'synthesis', 'hypothesis', 'evidence_review', 'conclusion']),
  confidence: z.number().min(0).max(1),
});

// Structured response from Jordi
export const JordiResponseSchema = z.object({
  message: z.string().describe("The main response message to the user"),
  personality: JordiPersonalitySchema.describe("Personality traits for this response"),
  reasoning_steps: z.array(ReasoningStepSchema).describe("Visible reasoning process"),
  data_sources_used: z.array(z.string()).describe("Scout data sources referenced"),
  follow_up_questions: z.array(z.string()).describe("Suggested follow-up questions"),
  investigative_leads: z.array(z.string()).describe("Potential research directions"),
  confidence_assessment: z.object({
    overall_confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    limitations: z.array(z.string()),
  }).describe("Confidence in the response and its limitations"),
});

// Context about the user and conversation
export const ConversationContextSchema = z.object({
  user_expertise: z.enum(['novice', 'intermediate', 'expert']),
  conversation_stage: z.enum(['opening', 'exploration', 'deep_dive', 'synthesis']),
  research_focus: z.array(z.string()).describe("Current research topics"),
  user_intent: z.enum(['general_inquiry', 'specific_research', 'story_development', 'fact_checking']),
});

// Input to Jordi's reasoning process
export const JordiInputSchema = z.object({
  user_message: z.string(),
  conversation_context: ConversationContextSchema,
  available_data: z.array(z.object({
    source: z.string(),
    type: z.enum(['article', 'entity', 'relationship', 'analysis']),
    relevance_score: z.number().min(0).max(1),
    summary: z.string(),
  })),
  project_context: z.object({
    name: z.string(),
    description: z.string(),
    research_goals: z.array(z.string()),
  }),
});

// Types for TypeScript
export type JordiPersonality = z.infer<typeof JordiPersonalitySchema>;
export type ReasoningStep = z.infer<typeof ReasoningStepSchema>;
export type JordiResponse = z.infer<typeof JordiResponseSchema>;
export type ConversationContext = z.infer<typeof ConversationContextSchema>;
export type JordiInput = z.infer<typeof JordiInputSchema>; 