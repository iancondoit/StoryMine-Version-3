import { User, Project, Artifact, Conversation, TokenBalance, Payment, TokenUsage, ProjectStatus, ArtifactType, PaymentStatus } from '@prisma/client';

// Re-export Prisma types
export {
  User,
  Project,
  Artifact,
  Conversation,
  TokenBalance,
  Payment,
  TokenUsage,
  ProjectStatus,
  ArtifactType,
  PaymentStatus,
} from '@prisma/client';

// Request/Response types
export interface AuthRequest {
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface ProjectRequest {
  title: string;
  description?: string;
  isExclusive?: boolean;
  memoryOn?: boolean;
}

export interface ProjectResponse extends Omit<Project, 'userId'> {
  user: Omit<User, 'password'>;
  _count: {
    artifacts: number;
    conversations: number;
  };
}

export interface ArtifactRequest {
  title: string;
  content: string;
  type: ArtifactType;
  metadata?: any;
  projectId: string;
}

export interface ArtifactResponse extends Artifact {
  project: Pick<Project, 'id' | 'title'>;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokenUsage?: number;
}

export interface ConversationRequest {
  projectId: string;
  message: string;
}

export interface ConversationResponse extends Conversation {
  project: Pick<Project, 'id' | 'title'>;
  user: Pick<User, 'id' | 'name'>;
}

export interface TokenPurchaseRequest {
  amount: number; // in cents
  tokenQuantity: number;
  paymentMethodId: string;
}

export interface TokenPurchaseResponse {
  payment: Payment;
  tokenBalance: TokenBalance;
}

export interface TokenBalanceResponse extends TokenBalance {
  user: Pick<User, 'id' | 'name'>;
}

// API Error types
export interface ApiError {
  error: string;
  message: string;
  details?: any;
  statusCode: number;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Search and filter types
export interface ProjectFilter {
  status?: ProjectStatus;
  isExclusive?: boolean;
  memoryOn?: boolean;
  search?: string;
}

export interface ArtifactFilter {
  type?: ArtifactType;
  isPinned?: boolean;
  search?: string;
  projectId?: string;
}

// Jordi AI types
export interface JordiContext {
  projectId: string;
  conversationHistory: ConversationMessage[];
  projectInfo: Pick<Project, 'title' | 'description' | 'memoryOn'>;
  artifacts: Pick<Artifact, 'title' | 'type' | 'metadata'>[];
  investigationContext?: any;
}

export interface JordiResponse {
  content: string;
  artifacts?: ArtifactRequest[];
  reasoning?: string[];
  tokenUsage: number;
  context?: any;
}

// Scout integration types
export interface ScoutArticle {
  id: string;
  title: string;
  content: string;
  source: string;
  date: Date;
  entities: string[];
  tags: string[];
  metadata: any;
}

export interface ScoutImportRequest {
  articles: ScoutArticle[];
  projectId?: string;
}

// Express middleware types
export interface AuthenticatedRequest extends Express.Request {
  user?: User;
}

// Database query options
export interface QueryOptions {
  include?: any;
  where?: any;
  orderBy?: any;
  take?: number;
  skip?: number;
}

// Validation schemas (for use with Zod)
export const VALIDATION_LIMITS = {
  PROJECT_TITLE_MAX: 200,
  PROJECT_DESCRIPTION_MAX: 1000,
  ARTIFACT_TITLE_MAX: 300,
  ARTIFACT_CONTENT_MAX: 50000,
  CONVERSATION_MESSAGE_MAX: 10000,
  USER_NAME_MAX: 100,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
} as const; 