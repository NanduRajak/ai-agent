# Vibe AI - AI-Powered Application Builder

## 🚀 Overview

Vibe AI is a sophisticated full-stack web application that empowers users to build custom Next.js applications through conversational AI. The platform leverages advanced AI agents, sandbox environments, and a modern tech stack to transform natural language prompts into functional web applications with live preview capabilities.

### Key Features

- **🤖 AI-Powered Code Generation**: Multi-agent system that creates production-ready Next.js applications from natural language descriptions
- **🔬 Sandboxed Execution**: Isolated E2B sandbox environments for safe code execution and live previews
- **💬 Conversational Interface**: Chat-based workflow where users can iteratively refine their applications
- **📁 Live Code Editor**: Built-in file explorer with syntax highlighting and inline editing capabilities
- **🔄 Real-time Preview**: Live iframe previews of generated applications in sandboxed environments
- **👤 Authentication**: Secure user authentication with Clerk integration
- **📊 Project Management**: Organize and manage multiple application projects with message history

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- **Next.js 15.3.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Shadcn UI** - Component library
- **tRPC** - Type-safe API layer
- **TanStack Query** - Server state management
- **Framer Motion** - Animations

**Backend:**
- **Next.js API Routes** - Serverless functions
- **Prisma** - ORM for database management
- **PostgreSQL** - Relational database
- **Inngest** - Event-driven workflow orchestration
- **Clerk** - Authentication and user management

**AI & Sandbox:**
- **@inngest/agent-kit** - Multi-agent orchestration framework
- **OpenAI GPT-4o-mini** - LLM for code generation
- **E2B Code Interpreter** - Sandboxed execution environment
- **Custom Sandbox Templates** - Pre-configured Next.js sandbox environments

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Frontend (React/Tailwind)               │   │
│  │  • Landing Page          • Project View             │   │
│  │  • File Explorer         • Live Preview             │   │
│  │  • Message Container     • Theme Toggle             │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            tRPC API Layer (Type-Safe)               │   │
│  │  • Projects Router      • Messages Router           │   │
│  │  • Authentication       • File Updates               │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Inngest Workflow Orchestration             │   │
│  │  • Code Generation Agent                             │   │
│  │  • File Update Handler                               │   │
│  │  • AI Task Management                                │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   OpenAI     │  │     E2B      │  │   Clerk      │     │
│  │   GPT-4o     │  │   Sandboxes  │  │    Auth      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  • Projects  • Messages  • Fragments                        │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
ai-agent/
├── prisma/                          # Database schema and migrations
│   ├── schema.prisma                # Database models
│   └── migrations/                  # Migration history
├── sandbox-templates/               # E2B sandbox templates
│   └── nextjs/                      # Next.js sandbox configuration
├── public/                          # Static assets
├── src/
│   ├── app/                         # Next.js app directory
│   │   ├── (home)/                  # Home route group
│   │   │   ├── page.tsx             # Landing page
│   │   │   └── layout.tsx           # Home layout
│   │   ├── projects/                # Project pages
│   │   │   └── [projectId]/         # Dynamic project routes
│   │   ├── api/                     # API routes
│   │   │   ├── trpc/                # tRPC endpoint
│   │   │   └── inngest/             # Inngest webhook
│   │   ├── globals.css              # Global styles
│   │   └── layout.tsx               # Root layout
│   ├── components/                  # Shared UI components
│   │   ├── ui/                      # Shadcn components
│   │   ├── file-explorer.tsx        # File tree explorer
│   │   ├── code-view/               # Syntax highlighted code viewer
│   │   ├── tree-view.tsx            # File tree component
│   │   └── dust-particles.tsx       # Animated background
│   ├── module/                      # Feature modules
│   │   ├── home/                    # Homepage features
│   │   ├── projects/                 # Project features
│   │   │   ├── ui/                  # UI components
│   │   │   │   ├── views/           # Page views
│   │   │   │   └── components/      # Feature components
│   │   │   └── server/              # Server procedures
│   │   └── message/                 # Messaging features
│   ├── trpc/                        # tRPC configuration
│   │   ├── client.tsx               # React client
│   │   ├── server.tsx               # Server utilities
│   │   ├── init.ts                  # Initialization
│   │   └── routers/                 # Router definitions
│   ├── inngest/                     # Inngest functions
│   │   ├── client.ts                # Inngest client
│   │   ├── functions.ts             # Workflow functions
│   │   ├── functions-simplified.ts  # Simplified functions
│   │   ├── utils.ts                 # Helper functions
│   │   └── types.ts                 # Type definitions
│   ├── lib/                         # Utility libraries
│   │   ├── db.ts                    # Prisma client
│   │   ├── utils.ts                 # Shared utilities
│   │   └── sandbox-health.ts        # Health checks
│   ├── hooks/                       # Custom React hooks
│   └── generated/                   # Generated code
│       └── prisma/                  # Prisma client
├── prompt.ts                        # AI agent prompts
├── components.json                   # Shadcn config
├── tailwind.config.ts               # Tailwind config
├── next.config.ts                   # Next.js config
└── package.json                     # Dependencies
```

## 🔧 Core Components

### 1. AI Agent System (`src/inngest/functions.ts`)

The heart of the application, orchestrating multi-agent workflows:

```typescript
codeAgentFunction:
- Creates E2B sandbox environment
- Initializes AI agent with custom tools (terminal, file operations)
- Executes iterative code generation
- Manages state and file tracking
- Generates preview URLs and saves results
```

**Tools Available to AI Agent:**
- `terminal`: Execute shell commands in sandbox
- `createOrUpdateFiles`: Write/modify project files
- `readFiles`: Read existing file contents

### 2. Database Schema (`prisma/schema.prisma`)

```prisma
Project: User's application projects
  - id, name, userId, timestamps
  - One-to-many relationship with Message

Message: Chat messages in project
  - id, content, role (USER/ASSISTANT)
  - type (RESULT/ERROR)
  - Optional one-to-one relationship with Fragment

Fragment: Generated code results
  - id, sandboxUrl, title, files (JSON)
  - Links to Message
```

### 3. API Layer (`src/trpc/routers/_app.ts`)

Type-safe API using tRPC:
- `projects.getOne/getMany` - Fetch project data
- `projects.create` - Create new project and trigger AI
- `projects.updateFiles` - Update generated files
- `projects.delete` - Delete project
- `messages.getMany` - Fetch message history
- `messages.create` - Send new message and trigger AI

### 4. UI Components

**FileExplorer** (`src/components/file-explorer.tsx`)
- Tree-based file navigation
- Syntax-highlighted code viewer
- Inline editing capabilities
- Copy to clipboard functionality

**ProjectView** (`src/module/projects/ui/views/project-view.tsx`)
- Resizable panel layout
- Chat interface with message history
- Live preview tabs (Preview/Code)
- Fragment management

**FragmentWeb** (`src/module/projects/ui/components/fragment-web.tsx`)
- Iframe-based live preview
- Sandbox URL management
- Refresh functionality

## 🔄 Workflow

### User Journey

1. **Initial Request**
   - User enters description on landing page
   - Creates project via tRPC mutation
   - User message saved to database

2. **AI Processing**
   - Inngest triggers `code-agent/run` event
   - E2B sandbox environment created
   - AI agent initialized with system prompt and tools
   - Agent generates code using available tools

3. **Code Generation**
   - Agent creates/modifies files in sandbox
   - Installs necessary dependencies
   - Ensures main `app/page.tsx` exists
   - Starts Next.js dev server
   - Monitors for `<task_summary>` completion tag

4. **Result Processing**
   - Fragment title and response message generated
   - Files and metadata saved to database
   - Sandbox URL extracted and stored
   - Fragment linked to assistant message

5. **User Interaction**
   - Preview loads in iframe
   - User can view/edit code in FileExplorer
   - Files can be updated via tRPC mutation
   - Changes sync to sandbox via Inngest

## 🎯 Key Features Explained

### Multi-Agent Architecture

The system uses three specialized AI agents:

1. **Code Agent** (`code-agent`)
   - Main executor for code generation
   - Has access to sandbox tools
   - Processes user requirements iteratively
   - Creates complete Next.js applications

2. **Fragment Title Generator** (`fragment-title-generator`)
   - Generates concise titles for fragments
   - Max 3 words in title case
   - Based on task summary

3. **Response Generator** (`response-generator`)
   - Creates user-friendly completion messages
   - Casual tone, 1-3 sentences
   - Wraps up the build process

### Sandbox Management

- **Template-based**: Pre-configured Next.js environments
- **Live Preview**: Applications served on port 3000
- **Hot Reload**: File changes automatically trigger updates
- **Timeout Management**: 10-minute execution windows
- **File Sync**: Updates propagate in real-time

### State Management

- **Server State**: TanStack Query for data fetching
- **Client State**: React hooks for UI state
- **Form State**: React Hook Form for input handling
- **Theme State**: Next Themes for dark/light mode

## 🔐 Authentication & Authorization

- **Clerk Integration**: Complete authentication system
- **Middleware Protection**: Route-based authorization
- **User Context**: Available in all tRPC procedures
- **Project Ownership**: Users can only access their projects

## 🎨 UI/UX Features

- **Dark/Light Mode**: System-aware theme switching
- **Animated Background**: Dust particles on inactivity
- **Responsive Design**: Mobile-first approach
- **Resizable Panels**: Flexible layout management
- **Toast Notifications**: User feedback with Sonner
- **Loading States**: Suspense boundaries throughout
- **Error Boundaries**: Graceful error handling

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Clerk account (for authentication)
- OpenAI API key
- E2B API key

### Installation

```bash
npm install
```

### Environment Variables

Create `.env` file:

```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
E2B_API_KEY="e2b_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
```

### Database Setup

```bash
npx prisma migrate dev
npx prisma generate
```

### Development

```bash
npm run dev
```

App runs at `http://localhost:3000`

## 📦 Dependencies

### Core
- `next@15.3.4` - Framework
- `react@19` - UI library
- `typescript@5` - Type safety
- `prisma@6.11.1` - ORM
- `@trpc/server@11.4.3` - API layer
- `@clerk/nextjs@6.23.3` - Auth

### AI & Sandbox
- `@inngest/agent-kit@0.8.3` - Agent orchestration
- `@e2b/code-interpreter@1.5.1` - Sandbox runtime
- `openai@5.10.1` - LLM API
- `inngest@3.40.0` - Workflow engine

### UI
- `@radix-ui/*` - Headless components
- `tailwindcss@4` - Styling
- `lucide-react@0.524.0` - Icons
- `framer-motion@12.23.6` - Animations

## 🔍 Key Files Explained

### `src/prompt.ts`
Contains the system prompts for AI agents:
- **PROMPT**: Detailed instructions for code generation
- **RESPONSE_PROMPT**: Final message formatting
- **FRAGMENT_TITLE_PROMPT**: Title generation rules

### `src/inngest/utils.ts`
Utility functions for sandbox management:
- `extractSandboxId`: Parse ID from URL
- `getSandbox`: Connect to E2B sandbox
- `parseAgentOutput`: Format AI responses

### `src/trpc/init.ts`
Sets up tRPC server with Clerk authentication context.

### `src/middleware.ts`
Clerk middleware for route protection and authentication.

## 🎓 Learning Resources

### Technologies Used
- Next.js App Router documentation
- tRPC for type-safe APIs
- Inngest for background jobs
- Prisma ORM
- Clerk authentication
- E2B sandboxes
- OpenAI GPT models

### Design Patterns
- Feature-based architecture
- Server/Client component separation
- Type-safe API layer
- Event-driven workflows
- Multi-agent AI orchestration

## 🤝 Contributing

This is a portfolio project demonstrating:
- Modern full-stack development
- AI integration and agent orchestration
- Real-time application generation
- Type-safe architecture
- Production-ready code patterns

## 📄 License

Private project for portfolio demonstration.

---

**Built with ❤️ using Next.js, AI, and modern web technologies**
