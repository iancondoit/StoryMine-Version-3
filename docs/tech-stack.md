# StoryMine Version 3 - Tech Stack Specification

**Version:** 3.0.0-alpha  
**Last Updated:** January 2025

## 🎯 Technology Decisions

### Frontend Stack
- **Framework**: Next.js 14.x (App Router)
- **React**: 18.x
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 3.x
- **UI Components**: Radix UI primitives
- **State Management**: Zustand 4.x
- **HTTP Client**: Axios
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier

### Backend Stack
- **Runtime**: Node.js 18.x LTS
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15.x
- **ORM**: Prisma 5.x
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **API Documentation**: OpenAPI 3.0 (Swagger)

### Database Design
- **Primary**: PostgreSQL 15.x
- **Connection Pooling**: Built-in Prisma connection pooling
- **Migrations**: Prisma Migrate
- **Seeding**: Prisma seed scripts

### External Integrations
- **AI Model**: OpenAI GPT-4 API (configurable)
- **Payment Processing**: Stripe API
- **Internal Data**: Scout agent API (backend-only)

### Development Tools
- **Package Manager**: npm
- **Code Quality**: ESLint, Prettier, TypeScript
- **Testing**: Jest ecosystem
- **Environment**: .env files for configuration
- **Git Hooks**: Husky (future addition)

## 🏗️ Project Structure

```
StoryMine Version 3/
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # Utilities and configurations
│   │   ├── stores/           # Zustand state stores
│   │   └── types/            # TypeScript type definitions
│   ├── public/               # Static assets
│   ├── tests/                # Frontend tests
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   ├── controllers/      # Business logic controllers
│   │   ├── services/         # External service integrations
│   │   ├── middleware/       # Custom middleware
│   │   ├── models/           # Database models (Prisma)
│   │   ├── utils/            # Utility functions
│   │   └── types/            # TypeScript type definitions
│   ├── prisma/               # Database schema and migrations
│   ├── tests/                # Backend tests
│   └── package.json
├── docs/                     # Project documentation
└── src/                      # Shared types and utilities
```

## 🔧 Development Environment

### Prerequisites
- Node.js 18.x LTS
- PostgreSQL 15.x
- npm (comes with Node.js)

### Environment Variables

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/storymine
JWT_SECRET=your-jwt-secret-here
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
SCOUT_API_URL=http://internal-scout-service
PORT=3001
```

## 🚀 Getting Started

### Backend Setup
```bash
cd backend
npm init -y
npm install express cors helmet morgan dotenv
npm install -D typescript @types/node @types/express ts-node nodemon
npm install prisma @prisma/client
npm install bcrypt jsonwebtoken zod
npm install -D @types/bcrypt @types/jsonwebtoken
npm install jest supertest -D
npm install -D @types/jest @types/supertest
```

### Frontend Setup
```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app
npm install zustand axios @radix-ui/react-slot
npm install lucide-react # for icons
npm install -D @types/node
```

## 📊 Database Schema Planning

### Core Tables
- **users**: User authentication and profiles
- **projects**: Research projects with metadata
- **artifacts**: Generated research content
- **conversations**: Chat history with Jordi
- **tokens**: Token balance and usage tracking
- **payments**: Payment history and transactions

### Relationships
- Users have many Projects
- Projects have many Artifacts
- Projects have many Conversations
- Users have TokenBalance
- Users have many Payments

## 🔐 Security Considerations

### Authentication
- JWT tokens with expiration
- bcrypt for password hashing
- Secure session management

### API Security
- CORS configuration
- Rate limiting (future addition)
- Input validation with Zod
- SQL injection prevention (Prisma ORM)

### Data Protection
- Environment variables for secrets
- Encrypted database connections
- Secure payment processing with Stripe

## 🧪 Testing Strategy

### Frontend Testing
- Component testing with React Testing Library
- Integration testing for user flows
- Mock API calls for isolated testing

### Backend Testing
- Unit tests for individual functions
- Integration tests for API endpoints
- Database testing with test database

### Test Coverage Goals
- Minimum 80% code coverage
- All critical paths tested
- Edge cases covered

## 📈 Performance Considerations

### Frontend Optimization
- Next.js static generation where possible
- Component lazy loading
- Image optimization
- Bundle size monitoring

### Backend Performance
- Database query optimization
- Connection pooling
- Caching strategies (future addition)
- API response time monitoring

## 🔄 Development Workflow

1. **Feature Development**: Create feature branch
2. **TDD Approach**: Write tests first
3. **Implementation**: Build feature to pass tests
4. **Type Safety**: Ensure full TypeScript coverage
5. **Testing**: Run full test suite
6. **Documentation**: Update relevant docs

## 📚 Documentation Standards

- **API**: OpenAPI/Swagger documentation
- **Code**: TypeScript interfaces and JSDoc
- **Architecture**: Mermaid diagrams
- **User Guides**: Markdown documentation

---

**Tech Stack Status**: ✅ Finalized  
**Next Step**: Project setup and database schema implementation 