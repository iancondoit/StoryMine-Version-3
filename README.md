# StoryMine Version 3 🪨

**Version:** 3.0.0-alpha

A tool for investigative imagination that helps you dig up buried stories from historical records, newspaper archives, oral histories, and long-forgotten content collections.

## 🌟 Project Background

StoryMine is designed to find **narrative veins** — powerful, surprising threads that can become documentaries, books, podcasts, or creative works. Rather than surfing data like a search engine, StoryMine lets you work with a dedicated research assistant named **Jordi**, who reads, reasons, and reflects with you in real time.

### Target Users
- Journalists chasing leads across archives
- Filmmakers hunting for long-forgotten arcs
- Writers developing characters and timelines
- Researchers exploring lost history
- Curious minds who want to follow a thread to the end

## 🤖 Meet Jordi

Jordi is your full-time narrative researcher powered by **Mistral Small 3.1**. She's not a chatbot or blank slate, but a trained investigator who:

- Investigates deeply and shows all reasoning
- Documents dead-ends and lucky breaks
- Produces artifacts like timelines, maps, comparisons, and threads
- Argues with herself and explores multiple theories
- Acts as an internal monologue made external
- **Works with real historical data** from Scout-analyzed archives

## 🏗️ Architecture Overview

### Frontend (React/Next.js)
- **Project Navigator**: Persistent index of active/archived work sessions
- **Artifact Space**: Where all of Jordi's research artifacts live
- **Chat Interface**: Live assistant interface with persistent memory

### Backend (Node.js/Express)
- RESTful API for project and artifact management
- User authentication and session management
- Token tracking and payment processing
- **Mistral Small 3.1 Integration** via Ollama/vLLM
- **Scout Data Processing** - 663 historical articles analyzed and ready
- **Jordi Agent Framework** with memory and reasoning chains

### Database
- Project and artifact storage
- User management and token tracking
- Persistent memory/context per project
- **Scout Analysis Data** - articles, entities, story types, documentary potential
- **Scalable schema** designed for millions of articles

### External Integrations
- **Mistral Small 3.1** (via Ollama)
- Stripe (payment processing)
- **Scout Agent** (article imports and analysis)

## 📁 Project Structure

```
StoryMine Version 3/
├── frontend/          # React/Next.js application
├── backend/           # Node.js/Express API server
│   ├── src/agents/    # Jordi agent implementation
│   ├── src/services/  # Mistral service integration
│   ├── src/scripts/   # Data import scripts
│   └── prisma/        # Database schema and migrations
├── docs/              # Project documentation
├── tests/             # Test suites (unit, integration, E2E)
├── pipeline/          # CI/CD and deployment scripts
├── src/               # Shared utilities and types
└── README.md          # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database
- **Ollama** (for Mistral Small 3.1)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. Set up Ollama and install Mistral:
   ```bash
   # Install Ollama (macOS)
   brew install ollama
   
   # Start Ollama service
   ollama serve
   
   # Install Mistral Small model
   ollama pull mistral
   ```

4. Set up database:
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. Import Scout data:
   ```bash
   cd backend
   npm run import:scout
   ```

6. Start development servers:
   ```bash
   # Frontend
   cd frontend && npm run dev
   
   # Backend
   cd backend && npm run dev
   ```

## 🔧 Tech Stack

### Frontend
- **Framework**: React with Next.js 14
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Lucide React icons
- **HTTP Client**: Axios
- **Testing**: Jest, React Testing Library

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: Mistral Small 3.1 via Ollama
- **Agent Framework**: LangChain
- **Authentication**: JWT
- **Payment**: Stripe
- **Validation**: Zod
- **Testing**: Jest, Supertest

### Development Tools
- **TypeScript**: For type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Docker**: Containerization
- **GitHub Actions**: CI/CD

## 🧠 Jordi Agent Features

### Current Capabilities
- **Memory Management**: Persistent conversation history per project
- **Scout Data Integration**: Queries 663 analyzed historical articles
- **Reasoning Display**: Shows thinking process transparently
- **Artifact Generation**: Creates timelines, narrative threads, entity profiles
- **Context Awareness**: Maintains research focus and entity tracking

### Scout Data Features
- **663 Historical Articles** pre-analyzed for documentary potential
- **Documentary Potential Rating**: YES/MAYBE/NO classifications
- **Story Type Analysis**: Political, Conflict, Personal, Mystery, etc.
- **Confidence Scoring**: 0.0-1.0 confidence ratings
- **Entity Extraction**: People, places, organizations, events
- **Modern Relevance**: High/Medium/Low contemporary appeal

## 💰 Token System

Users purchase tokens to interact with Jordi:
- Clear pricing structure ($10 = 1,000 tokens)
- Subtle low-balance warnings
- Seamless Stripe integration
- No aggressive upselling

## 🔐 Environment Variables

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe public key

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT signing
- `STRIPE_SECRET_KEY`: Stripe secret key
- `OLLAMA_BASE_URL`: Ollama server URL (default: http://localhost:11434)
- `MISTRAL_MODEL`: Mistral model name (default: mistral)

## 📚 API Documentation

### Core Endpoints
- `/api/auth/*`: Authentication
- `/api/projects/*`: Project management
- `/api/artifacts/*`: Artifact operations
- `/api/tokens/*`: Token management
- `/api/jordi/*`: Jordi agent interactions

### Jordi Endpoints
- `POST /api/jordi/chat`: Send message to Jordi
- `GET /api/jordi/health`: Check Jordi health status
- `POST /api/jordi/clear-memory`: Clear conversation memory
- `GET /api/jordi/scout/stats`: Get Scout data statistics
- `GET /api/jordi/scout/search`: Search Scout analyzed articles

## 🧪 Testing Strategy

- **Unit Tests**: Individual components and functions
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Complete user workflows
- **Test-Driven Development**: Write tests before implementation

## 🚢 Deployment

- **Development**: Local with Ollama
- **Staging**: Cloud hosting with GPU support
- **Production**: Scalable cloud deployment

## 🔄 Development Workflow

1. **Feature Development**: Create feature branch
2. **Test-Driven Development**: Write tests first
3. **Implementation**: Build feature to pass tests
4. **Code Review**: PR review process
5. **Deployment**: Automated via CI/CD

## 📊 Project Status

Current Status: **Alpha Development - Core Features Complete**

### ✅ Completed Features
- Three-column UI layout (Project Navigator, Artifact Space, Chat Interface)
- Backend API with Express/TypeScript
- Database schema with Prisma ORM
- Mistral Small 3.1 integration via Ollama
- Jordi agent framework with memory and reasoning
- Scout data import system (663 articles)
- Complete artifact generation system
- Token tracking and usage system

### 🔄 In Progress
- Frontend-backend integration
- User authentication system
- Payment processing with Stripe

### 📋 Next Steps
- Database setup and migration
- Scout data import execution
- E2E testing and bug fixes
- Production deployment preparation

See [roadmap.md](./roadmap.md) for detailed development timeline.

## 🎯 Core Ethos

- 🚫 No sales pressure. Just story work.
- 🤝 Jordi is your partner, not a bot.
- 🪓 Cut through data noise to find real narrative.
- 🧱 Let users build the wall of understanding, one artifact at a time.
- 🔍 **Work with real historical data** to find hidden stories.

## 🤝 Contributing

This project follows strict development principles:
- All work must align with the roadmap
- Test-driven development is mandatory
- Code must be organized in proper directories
- Documentation must be kept current

## 📝 License

[License TBD]

## 📞 Support

[Support information TBD] 