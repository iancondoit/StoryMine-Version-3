import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').default('postgresql://user:password@localhost:5432/storymine_dev'),
  
  // Server
  PORT: z.string().transform(Number).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').default('dev-secret-key-change-this-in-production-please-make-it-long-enough'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // External Services
  OPENAI_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Internal Services
  SCOUT_API_URL: z.string().url().optional(),
  SCOUT_API_KEY: z.string().optional(),
});

// Validate environment variables
const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
};

export const env = validateEnv();

export const config = {
  database: {
    url: env.DATABASE_URL,
  },
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    frontendUrl: env.FRONTEND_URL,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
  },
  external: {
    openai: {
      apiKey: env.OPENAI_API_KEY,
    },
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    },
  },
  internal: {
    scout: {
      apiUrl: env.SCOUT_API_URL,
      apiKey: env.SCOUT_API_KEY,
    },
  },
} as const;

// Environment variables documentation
export const ENV_DOCS = {
  DATABASE_URL: 'PostgreSQL connection string',
  PORT: 'Server port (default: 3001)',
  NODE_ENV: 'Environment mode (development, production, test)',
  FRONTEND_URL: 'Frontend application URL',
  JWT_SECRET: 'Secret key for JWT signing (minimum 32 characters)',
  JWT_EXPIRES_IN: 'JWT token expiration time (default: 7d)',
  OPENAI_API_KEY: 'OpenAI API key for Jordi AI assistant',
  STRIPE_SECRET_KEY: 'Stripe secret key for payments',
  STRIPE_WEBHOOK_SECRET: 'Stripe webhook secret for event verification',
  SCOUT_API_URL: 'Internal Scout agent API URL (optional)',
  SCOUT_API_KEY: 'Internal Scout agent API key (optional)',
} as const; 