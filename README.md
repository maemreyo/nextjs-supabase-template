# Next.js Supabase Template

<div align="center">

![Next.js Supabase Template](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Một production-ready template hiện đại với Next.js 16, Supabase, TypeScript, và AI integration**

[![Live Demo](https://img.shields.io/badge/Demo-Online-brightgreen?style=for-the-badge)](https://your-demo-url.com)
[![Documentation](https://img.shields.io/badge/Documentation-Latest-blue?style=for-the-badge)](./docs)
[![GitHub stars](https://img.shields.io/github/stars/your-username/nextjs-supabase-template?style=for-the-badge)](https://github.com/maemreyo/nextjs-supabase-template)
[![GitHub forks](https://img.shields.io/github/forks/your-username/nextjs-supabase-template?style=for-the-badge)](https://github.com/maemreyo/nextjs-supabase-template)
[![GitHub issues](https://img.shields.io/github/issues/your-username/nextjs-supabase-template?style=for-the-badge)](https://github.com/maemreyo/nextjs-supabase-template/issues)
[![GitHub license](https://img.shields.io/github/license/your-username/nextjs-supabase-template?style=for-the-badge)](https://github.com/maemreyo/nextjs-supabase-template/blob/main/LICENSE)

</div>

## ✨ Tính Năng Nổi Bật

### 🚀 **Framework & Platform**
- **Next.js 16** với App Router
- **React 19** với Server Components
- **TypeScript** cho type safety
- **Tailwind CSS** cho styling
- **ESLint & Prettier** cho code quality

### 🔐 **Authentication & Security**
- **Supabase Auth** với multiple providers
- **Row Level Security (RLS)** cho data protection
- **JWT token management** với httpOnly cookies
- **OAuth integration** (Google, GitHub, etc.)
- **Password reset** và email verification
- **Middleware protection** cho routes

### 🗄️ **Database & Backend**
- **PostgreSQL** với Supabase
- **Real-time subscriptions** với Supabase Realtime
- **Database migrations** với version control
- **Type-safe database access** với generated types
- **Connection pooling** và optimization
- **Backup và restore** utilities

### 🧠 **AI Module Integration**
- **Multi-provider support**: OpenAI, Anthropic, Google AI, Cohere
- **Smart rate limiting** với user tiers
- **Usage tracking** và cost monitoring
- **Intelligent caching** cho performance
- **Error handling** với fallback strategies
- **Prompt management** system
- **Cost optimization** với model selection

### 🎨 **UI Components & Styling**
- **Shadcn UI** components library
- **Dark/Light theme** với system detection
- **Responsive design** với mobile-first approach
- **Custom animations** và transitions
- **Form validation** với Zod
- **Data tables** với sorting và filtering
- **Toast notifications** với Sonner

### 📊 **State Management & Data Fetching**
- **Zustand** cho client state
- **React Query (TanStack Query)** cho server state
- **Optimistic updates** cho better UX
- **Background refetching** và cache invalidation
- **Pagination** và infinite scroll
- **Error boundaries** và error handling

### 🧪 **Testing & Quality**
- **Jest** cho unit testing
- **Playwright** cho E2E testing
- **Testing Library** cho component testing
- **Coverage reporting** với thresholds
- **Mock utilities** cho isolated testing
- **CI/CD integration** với GitHub Actions

### ⚡ **Performance & Optimization**
- **Code splitting** với dynamic imports
- **Image optimization** với Next.js Image
- **Bundle analysis** với webpack-bundle-analyzer
- **Core Web Vitals** monitoring
- **Lazy loading** cho components và routes
- **Service Worker** cho offline support

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** và **npm** hoặc **yarn**
- **Supabase account** ([đăng ký miễn phí](https://supabase.com))
- **Git** cho version control

### Installation

```bash
# Clone repository
git clone https://github.com/maemreyo/nextjs-supabase-template.git
cd nextjs-supabase-template

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local với Supabase credentials

# Start development server
npm run dev
```

### Environment Setup

1. **Tạo Supabase Project**:
   - Vào [supabase.com](https://supabase.com)
   - Click "New Project"
   - Lấy **Project URL** và **anon key**

2. **Configure Environment**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   
   # AI Configuration (tùy chọn)
   OPENAI_API_KEY=your-openai-key
   ANTHROPIC_API_KEY=your-anthropic-key
   ```

3. **Run Database Migrations**:
   ```bash
   npm run db:push
   npm run db:generate-types-remote
   ```

4. **Start Development**:
   ```bash
   npm run dev
   ```
   Mở [http://localhost:3000](http://localhost:3000) trong browser.

## 📁 Project Structure

```
nextjs-supabase-template/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── api/               # API routes
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/             # React components
│   │   ├── ui/               # Shadcn UI components
│   │   ├── forms/             # Form components
│   │   ├── layout/            # Layout components
│   │   ├── providers/         # Context providers
│   │   ├── examples/          # Component examples
│   │   └── features/         # Feature-specific components
│   ├── lib/                   # Utilities và business logic
│   │   ├── supabase/         # Supabase client configuration
│   │   ├── auth/              # Authentication utilities
│   │   ├── ai/               # AI module
│   │   ├── utils/             # General utilities
│   │   └── validations/       # Form validation schemas
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # State management (Zustand)
│   └── types/                # TypeScript definitions
├── supabase/                # Supabase migrations và config
├── docs/                     # Documentation
├── scripts/                  # Utility scripts
└── tests/                    # Test files
```

## 🛠️ Available Scripts

### Development
```bash
npm run dev              # Start development server
npm run build            # Build cho production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # Run TypeScript type checking
npm run format           # Format code với Prettier
```

### Testing
```bash
npm run test             # Run tất cả tests
npm run test:watch       # Run tests trong watch mode
npm run test:coverage    # Run tests với coverage report
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests với UI
```

### Database
```bash
npm run db:generate       # Generate types từ local database
npm run db:generate-types-remote  # Generate types từ remote database
npm run db:push          # Push migrations đến database
npm run db:reset         # Reset database
npm run db:migrate        # Run database migrations
```

### AI Module
```bash
npm run ai:test-providers    # Test AI providers
npm run ai:usage-report     # Generate AI usage report
npm run ai:cache-clear       # Clear AI cache
```

### Utilities
```bash
npm run bundle:analyze   # Analyze bundle size
npm run cleanup           # Cleanup project
npm run dev:setup         # Setup development environment
```

## 🎨 Components & Features

### Shadcn UI Components

Template includes các Shadcn UI components sau:

#### **Form Components**
- **Button** - Multiple variants và sizes
- **Input** - Form inputs với validation
- **Label** - Labels cho form fields
- **Form** - Complete form patterns với Zod validation
- **Select** - Dropdown selections
- **Checkbox** - Toggle inputs
- **Textarea** - Multi-line text inputs

#### **Layout Components**
- **Card** - Container components với header, content, footer
- **Dialog** - Modal dialogs và confirmations
- **Sheet** - Slide-out panels
- **Tabs** - Tabbed navigation
- **Avatar** - User profile images
- **Badge** - Status indicators

#### **Feedback Components**
- **Alert** - Notification messages
- **Toast** - Toast notifications với Sonner
- **Progress** - Progress bars và indicators
- **Spinner** - Loading states

#### **Data Display**
- **Table** - Data tables với sorting và filtering
- **Data Table** - Advanced table với pagination
- **Skeleton** - Loading placeholders

### Authentication Features

#### **User Management**
- **Sign up/Sign in** với email/password
- **OAuth providers** (Google, GitHub, etc.)
- **Password reset** với email verification
- **Profile management** với avatar upload
- **Session management** với automatic refresh

#### **Security Features**
- **Row Level Security (RLS)** policies
- **Rate limiting** cho API endpoints
- **CSRF protection** với Next.js middleware
- **Input validation** với Zod schemas

### AI Module Features

#### **Multi-Provider Support**
- **OpenAI** (GPT-3.5, GPT-4, GPT-4o)
- **Anthropic** (Claude 3 Haiku, Sonnet, Opus)
- **Google AI** (Gemini Pro, Gemini 1.5)
- **Cohere** (Command, Command Light, Command R)

#### **Usage Tracking & Management**
- **Real-time usage monitoring** với dashboard
- **Cost tracking** per provider và model
- **Rate limiting** với user tiers
- **Smart caching** để reduce costs
- **Usage analytics** và reporting

#### **Developer Tools**
- **AI provider testing** utilities
- **Usage report generation**
- **Cache management** tools
- **Error logging** và monitoring

## 🧪 Testing Strategy

### Test Pyramid

```
    E2E Tests (10%)
   ─────────────────
  Integration Tests (20%)
 ─────────────────────────
Unit Tests (70%)
─────────────────────────────────
```

### Test Structure

```
tests/
├── __mocks__/           # Mock files
├── components/          # Component tests
├── api/               # API route tests
├── hooks/             # Hook tests
├── utils/             # Utility function tests
├── integration/        # Integration tests
└── e2e/              # End-to-end tests
```

### Coverage Requirements

- **Unit Tests**: > 80% coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Main user flows covered

## 🚀 Deployment

### Vercel (Khuyến nghị)

1. **Connect GitHub Repository** đến Vercel
2. **Configure Environment Variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # AI Keys (nếu có)
   OPENAI_API_KEY=your-openai-key
   ```
3. **Deploy** tự động trên mỗi push đến main branch

### Docker Deployment

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN npm ci --only=production

# Build application
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### Environment Configuration

#### Development
```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
```

#### Production
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
```

## 📊 Performance & Monitoring

### Core Web Vitals

Template được optimized cho Core Web Vitals:
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Performance Tools

- **Bundle Analyzer**: `npm run bundle:analyze`
- **Lighthouse**: Integrated trong development
- **Speed Insights**: Vercel Analytics
- **Error Tracking**: Configurable với Sentry

### Monitoring Dashboard

AI module includes built-in monitoring:
- **Usage Analytics**: Real-time usage tracking
- **Cost Monitoring**: Per-provider cost breakdown
- **Performance Metrics**: Response times và success rates
- **Error Tracking**: Automatic error logging

## 🔧 Configuration

### Environment Variables

#### Required Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Optional Variables
```env
# AI Provider Configuration
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
COHERE_API_KEY=your_cohere_api_key

# AI Default Settings
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback

# Optional: Redis Configuration
REDIS_URL=redis://localhost:6379

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
SENTRY_DSN=your_sentry_dsn
```

### Customization

#### Theme Configuration
```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    }
  }
}
```

#### Component Customization
```typescript
// Custom component example
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CustomButtonProps {
  variant?: 'default' | 'brand' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

export function CustomButton({ 
  variant = 'default', 
  size = 'md',
  className,
  ...props 
}: CustomButtonProps) {
  return (
    <Button 
      className={cn(
        'custom-styles',
        variant === 'brand' && 'bg-brand-500 hover:bg-brand-600',
        className
      )}
      size={size}
      {...props}
    />
  )
}
```

## 📚 Documentation

### Comprehensive Guides

- **[Getting Started Guide](./docs/getting-started.md)** - Hướng dẫn chi tiết setup
- **[AI Setup Guide](./docs/ai-setup-guide.md)** - Cấu hình AI module
- **[Development Workflow](./docs/development-workflow.md)** - Quy trình phát triển
- **[Template Replication](./docs/template-replication-guide.md)** - Sao chép template
- **[Quick Reference](./docs/quick-reference.md)** - Commands và patterns
- **[Troubleshooting](./docs/troubleshooting.md)** - Gỡ rối phổ biến
- **[Migration Guide](./docs/migration-guide.md)** - Migration từ existing projects

### API Documentation

- **[Architecture Guide](./docs/architecture.md)** - Architecture overview
- **[AI Module Guide](./docs/ai-module-guide.md)** - AI module documentation
- **[Scripts Guide](./docs/scripts-guide.md)** - Utility scripts documentation
- **[TanStack Query Guide](./docs/tanstack-query-guide.md)** - Data fetching patterns
- **[Zustand Usage](./docs/zustand-usage.md)** - State management patterns

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./docs/contributing.md) cho details.

### Development Process

1. **Fork repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** với proper testing
4. **Follow commit conventions**
5. **Create pull request** với detailed description

### Code Standards

- **TypeScript strict mode** enabled
- **ESLint** configuration enforced
- **Prettier** formatting required
- **Unit tests** cho new features
- **Documentation updates** cho API changes

### Issue Reporting

Please use the [issue template](.github/ISSUE_TEMPLATE.md) khi reporting bugs.

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) cho details.

## 🙏 Acknowledgments

### Core Technologies

- **[Next.js](https://nextjs.org/)** - The React framework
- **[Supabase](https://supabase.com/)** - Backend as a Service
- **[React](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS

### UI Components

- **[Shadcn UI](https://ui.shadcn.com/)** - Beautiful UI components
- **[Radix UI](https://www.radix-ui.com/)** - Low-level UI primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications

### Development Tools

- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Jest](https://jestjs.io/)** - Testing framework
- **[Playwright](https://playwright.dev/)** - E2E testing
- **[TanStack Query](https://tanstack.com/query)** - Data fetching

### AI Services

- **[OpenAI](https://openai.com/)** - GPT models
- **[Anthropic](https://anthropic.com/)** - Claude models
- **[Google AI](https://ai.google.dev/)** - Gemini models
- **[Cohere](https://cohere.com/)** - Command models

---

<div align="center">

**[⭐ Star this repository](https://github.com/maemreyo/nextjs-supabase-template)** nếu nó giúp bạn!  
**[🐛 Report issues](https://github.com/maemreyo/nextjs-supabase-template/issues)** để chúng tôi cải thiện  
**[📖 Read documentation](./docs)** để hiểu thêm về template**

Made với ❤️ bởi [Your Name](https://github.com/maemreyo)

</div>
