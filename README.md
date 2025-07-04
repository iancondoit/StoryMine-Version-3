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
- **Scout Data Processing** - 568 historical articles analyzed and ready
- **Jordi Agent Framework** with memory and reasoning chains

### Database
- Project and artifact storage
- User management and token tracking
- Persistent memory/context per project
- **Scout Analysis Data** - articles, entities, story types, documentary potential
- **Scalable schema** designed for millions of articles

### External Integrations
- **Mistral Small 3.1** (via Ollama) - Optional for advanced features
- Stripe (payment processing) - Planned
- **Scout Agent** (article imports and analysis) - Complete

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
- **Ollama** (optional - for advanced Mistral features)

### Quick Start
1. Clone the repository:
   ```bash
   git clone https://github.com/iancondoit/StoryMine-Version-3.git
   cd "StoryMine Version 3"
   ```

2. Install dependencies:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. Set up database:
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

4. Start development servers:
   ```bash
   # Backend (Terminal 1)
   cd backend && npm exec ts-node src/index.ts
   
   # Frontend (Terminal 2)
   cd frontend && npm run dev
   ```

5. Open your browser:
   - **Frontend**: http://localhost:3004
   - **Backend**: http://localhost:3001/health

### Advanced Setup (Optional Mistral Integration)

For full AI capabilities, install Ollama:

```bash
# Install Ollama (macOS)
brew install ollama

# Start Ollama service
ollama serve

# Install Mistral Small model
ollama pull mistral
```

## 🔧 Tech Stack

### Frontend
- **Framework**: React with Next.js 14
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Lucide React icons
- **HTTP Client**: Axios
- **Development**: Turbopack for fast builds

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma
- **AI Integration**: Mistral Small 3.1 via Ollama (optional)
- **Agent Framework**: LangChain + Instructor
- **Authentication**: JWT (planned)
- **Payment**: Stripe (planned)
- **Validation**: Zod

### Development Tools
- **TypeScript**: For type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **CORS**: Cross-origin request handling

## 🧠 Jordi Agent Features

### Current Capabilities
- **Memory Management**: Persistent conversation history per project
- **Scout Data Integration**: Queries 568 analyzed historical articles from 1940s-50s Atlanta
- **Reasoning Display**: Shows thinking process transparently
- **Artifact Generation**: Creates timelines, narrative threads, entity profiles
- **Context Awareness**: Maintains research focus and entity tracking
- **Real Historical Content**: References specific articles, dates, and people from Scout database

### Scout Data Features
- **568 Historical Articles** from 1940s-50s Atlanta newspapers
- **Documentary Potential Rating**: YES (381), MAYBE (147), NO (40)
- **Unusualness Classification**: ANOMALOUS (143), NOTABLE (366), ROUTINE (59)
- **Real Historical Content**: Articles about crime, politics, social issues, prominent figures
- **Entity Extraction**: People, places, organizations, events
- **Specific Examples**: Col. Oveta Culp Hobby, Policeman J.C. Clay case, NAACP tax issues

## 💰 Token System

Users receive tokens to interact with Jordi:
- Demo users start with 10,000 tokens
- Token usage tracked per conversation
- Clear balance display in UI
- Graceful handling of insufficient tokens
- Stripe integration planned for token purchases

## 🔐 Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (.env)
```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-jwt-secret-here
CORS_ORIGIN=http://localhost:3004
OLLAMA_BASE_URL=http://localhost:11434
MISTRAL_MODEL=mistral
```

## 📚 API Documentation

### Core Endpoints
- `GET /health`: Server health check
- `/api/auth/*`: Authentication (planned)
- `/api/projects/*`: Project management
- `/api/artifacts/*`: Artifact operations
- `/api/tokens/*`: Token management

### Jordi Endpoints
- `POST /api/jordi/chat`: Send message to Jordi
- `GET /api/jordi/health`: Check Jordi health status  
- `POST /api/jordi/clear-memory`: Clear conversation memory
- `GET /api/jordi/scout/stats`: Get Scout data statistics
- `GET /api/jordi/scout/search`: Search Scout analyzed articles

### Example Jordi Chat Request
```bash
curl -X POST http://localhost:3001/api/jordi/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What murder cases do you have from 1940s Atlanta?",
    "projectId": "default-project", 
    "userId": "demo-user"
  }'
```

## 🧪 Testing Strategy

- **Unit Tests**: Individual components and functions
- **Integration Tests**: API endpoints and database operations  
- **E2E Tests**: Complete user workflows
- **Test-Driven Development**: Write tests before implementation

## 🚢 Deployment

- **Development**: Local SQLite database
- **Production**: PostgreSQL with cloud hosting
- **Docker**: Containerization ready
- **CI/CD**: GitHub Actions integration

## 📊 Project Status

Current Status: **Alpha Development - Core Features Working**

### ✅ Completed Features
- ✅ Three-column UI layout (Project Navigator, Artifact Space, Chat Interface)
- ✅ Backend API with Express/TypeScript
- ✅ Database schema with Prisma ORM
- ✅ Jordi agent framework with memory and reasoning
- ✅ Scout data integration (568 articles from 1940s-50s Atlanta)
- ✅ Token tracking and usage system
- ✅ Frontend-backend integration with CORS
- ✅ Real historical data queries and responses
- ✅ Working chat interface with persistent memory
- ✅ Artifact generation system
- ✅ Error handling and graceful fallbacks

### 🔄 In Progress  
- User authentication system
- Stripe payment integration
- Advanced Mistral AI features
- Production database setup

### 📋 Next Steps
- Docker containerization
- Production deployment
- E2E testing suite
- Advanced artifact types

See [roadmap.md](./roadmap.md) for detailed development timeline.

## 🎯 Current Demo Capabilities

You can currently:
- **Chat with Jordi** about 1940s-50s Atlanta history
- **Ask specific questions** like "What murder cases do you have?" or "Tell me about women's stories"
- **Get real historical data** with specific names, dates, and events
- **See Jordi's reasoning process** with visible thinking steps
- **Explore 568 analyzed articles** with documentary potential ratings
- **Track token usage** and conversation history

### Sample Conversations
- "What interesting crime stories do you have from 1940s Atlanta?"
- "Tell me about Col. Oveta Culp Hobby"
- "What stories about women might make good documentaries?"
- "Show me political scandals from that era"

## 🎯 Core Ethos

- 🚫 No sales pressure. Just story work.
- 🤝 Jordi is your partner, not a bot.
- 🪓 Cut through data noise to find real narrative.
- 🧱 Let users build the wall of understanding, one artifact at a time.
- 🔍 **Work with real historical data** to find hidden stories.

## 🐛 Known Issues

- Ollama integration optional (fallback responses work fine)
- Authentication system in development
- Payment processing planned
- Some advanced Mistral features require API keys

## 🤝 Contributing

This project follows strict development principles:
- All work must align with the roadmap
- Test-driven development is mandatory
- Code must be organized in proper directories
- Documentation must be kept current

## 📝 License

[License TBD]

## 📞 Support

For development questions or issues:
- GitHub Issues: Report bugs and feature requests
- See roadmap.md for planned features
- Check development-progress.md for latest updates 