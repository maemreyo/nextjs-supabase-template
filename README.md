# AI Semantic Analysis Editor

<div align="center">

![AI Semantic Analysis Editor](https://img.shields.io/badge/AI-Semantic%20Analysis-blue?style=for-the-badge&logo=openai&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Một công cụ phân tích ngữ nghĩa AI mạnh mẽ cho từ, câu và đoạn văn với multi-provider support**

[![Live Demo](https://img.shields.io/badge/Demo-Online-brightgreen?style=for-the-badge)](https://your-demo-url.com)
[![Documentation](https://img.shields.io/badge/Documentation-Latest-blue?style=for-the-badge)](./docs)

</div>

## ✨ Tính Năng Nổi Bật

### 🧠 **AI-Powered Analysis**
- **Word Analysis**: Phân tích chi tiết từ vựng bao gồm định nghĩa, đồng nghĩa, trái nghĩa, và cách dùng
- **Sentence Analysis**: Phân tích cấu trúc ngữ pháp, ý nghĩa, và gợi ý cải thiện câu
- **Paragraph Analysis**: Phân tích toàn diện đoạn văn về cấu trúc, mạch lạc, và phong cách viết

### 🤖 **Multi-Provider Support**
- **OpenAI**: GPT-3.5, GPT-4, GPT-4o models
- **Anthropic**: Claude 3 Haiku, Sonnet, Opus models
- **Google AI**: Gemini Pro, Gemini 1.5 models
- **Cohere**: Command, Command Light, Command R models

### 📊 **Intelligent Features**
- **Smart Rate Limiting**: Quản lý usage theo user tiers
- **Usage Tracking**: Monitor cost và token usage
- **Intelligent Caching**: Cache results để tối ưu performance
- **Error Handling**: Fallback strategies cho reliability
- **Real-time Analysis**: Phân tích tức thì với responsive UI

### 🎨 **Modern UI/UX**
- **Responsive Design**: Mobile-first approach
- **Dark/Light Theme**: System detection và manual toggle
- **Interactive Editor**: Text selection và real-time analysis
- **Rich Display**: Comprehensive result visualization
- **History Tracking**: Lưu lịch sử phân tích

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** và **npm** hoặc **yarn**
- **Supabase account** ([đăng ký miễn phí](https://supabase.com))
- **AI Provider API keys** (OpenAI, Anthropic, Google AI, hoặc Cohere)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd ai-semantic-analysis-editor

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local với API keys của bạn

# Start development server
npm run dev
```

### Environment Setup

1. **Tạo Supabase Project**:
   - Vào [supabase.com](https://supabase.com)
   - Click "New Project"
   - Lấy **Project URL** và **anon key**

2. **Configure AI Providers**:
   ```env
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Anthropic
   ANTHROPIC_API_KEY=your_anthropic_api_key
   
   # Google AI
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   
   # Cohere
   COHERE_API_KEY=your_cohere_api_key
   ```

3. **Run Database Setup**:
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
ai-semantic-analysis-editor/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes cho AI analysis
│   │   ├── analysis/          # Analysis page
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/             # React components
│   │   ├── ui/               # Shadcn UI components
│   │   ├── analysis/         # Analysis-specific components
│   │   └── providers/        # Context providers
│   ├── lib/                   # Utilities và business logic
│   │   ├── ai/               # AI module với multi-provider support
│   │   ├── supabase/         # Supabase client configuration
│   │   └── utils/            # General utilities
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # State management (Zustand)
│   └── types/                # TypeScript definitions
├── supabase/                # Supabase migrations và config
├── docs/                     # Documentation
└── scripts/                  # Utility scripts
```

## 🛠️ Available Scripts

### Development
```bash
npm run dev              # Start development server
npm run build            # Build cho production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checking
```

### Testing
```bash
npm run test             # Run tất cả tests
npm run test:watch       # Run tests trong watch mode
npm run test:coverage    # Run tests với coverage report
```

### AI Module
```bash
npm run ai:test-providers    # Test AI providers
npm run ai:usage-report     # Generate AI usage report
npm run ai:cache-clear       # Clear AI cache
```

### Database
```bash
npm run db:push          # Push migrations đến database
npm run db:reset         # Reset database
npm run db:generate      # Generate types từ database
```

## 🎨 Components Overview

### Analysis Components

#### **AnalysisEditor**
- Text editor với selection capabilities
- Real-time text statistics
- Integration với analysis hooks

#### **WordAnalysisDisplay**
- Comprehensive word analysis visualization
- Synonyms và antonyms với interactive elements
- IPA pronunciation và CEFR level display

#### **SentenceAnalysisDisplay**
- Grammar breakdown visualization
- Rewrite suggestions với apply functionality
- Semantic analysis results

#### **ParagraphAnalysisDisplay**
- Structure breakdown với sentence-by-sentence analysis
- Constructive feedback với actionable suggestions
- Coherence và flow analysis

### AI Provider Integration

#### **Multi-Provider Architecture**
- Automatic fallback giữa providers
- Provider-specific optimizations
- Unified interface cho tất cả AI models

#### **Usage Management**
- Real-time usage tracking
- Cost optimization với smart caching
- Rate limiting per user tier

## 🧪 Testing

### Test Structure
```
tests/
├── components/          # Component tests
├── api/               # API route tests
├── hooks/             # Hook tests
├── integration/       # Integration tests
└── e2e/             # End-to-end tests
```

### Running Tests
```bash
# Unit tests
npm run test

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📊 Usage Analytics

### Built-in Monitoring
- **Request Tracking**: Monitor tất cả AI requests
- **Cost Analysis**: Track spending per provider và model
- **Performance Metrics**: Response times và success rates
- **User Analytics**: Usage patterns và popular features

### Dashboard Features
- Real-time usage statistics
- Cost optimization recommendations
- Provider performance comparison
- User tier management

## 🔧 Configuration

### Environment Variables

#### Required Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### AI Provider Configuration
```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORGANIZATION=your_openai_org_id

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google AI
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Cohere
COHERE_API_KEY=your_cohere_api_key
```

#### AI Default Settings
```env
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect GitHub Repository** đến Vercel
2. **Configure Environment Variables** trong Vercel dashboard
3. **Deploy** tự động trên mỗi push đến main branch

### Environment Configuration

#### Development
```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Production
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 📚 API Documentation

### Analysis Endpoints

#### Word Analysis
```typescript
POST /api/ai/analyze-word
{
  "word": "example",
  "sentenceContext": "This is an example sentence.",
  "paragraphContext": "This paragraph contains examples.",
  "maxItems": 5
}
```

#### Sentence Analysis
```typescript
POST /api/ai/analyze-sentence
{
  "sentence": "The quick brown fox jumps over the lazy dog.",
  "paragraphContext": "This paragraph describes animal actions."
}
```

#### Paragraph Analysis
```typescript
POST /api/ai/analyze-paragraph
{
  "paragraph": "This is a full paragraph with multiple sentences..."
}
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

### Development Process

1. **Fork repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** với proper testing
4. **Follow commit conventions**
5. **Create pull request** với detailed description

## 📄 License

Distributed under **MIT License**. See [LICENSE](LICENSE) cho details.

## 🙏 Acknowledgments

### Core Technologies
- **[Next.js](https://nextjs.org/)** - The React framework
- **[Supabase](https://supabase.com/)** - Backend as a Service
- **[React](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS

### AI Services
- **[OpenAI](https://openai.com/)** - GPT models
- **[Anthropic](https://anthropic.com/)** - Claude models
- **[Google AI](https://ai.google.dev/)** - Gemini models
- **[Cohere](https://cohere.com/)** - Command models

### UI Components
- **[Shadcn UI](https://ui.shadcn.com/)** - Beautiful UI components
- **[Radix UI](https://www.radix-ui.com/)** - Low-level UI primitives
- **[Lucide React](https://lucide.dev/)** - Icon library

---

<div align="center">

**[⭐ Star this repository](https://github.com/your-username/ai-semantic-analysis-editor)** nếu nó giúp bạn!  
**[🐛 Report issues](https://github.com/your-username/ai-semantic-analysis-editor/issues)** để chúng tôi cải thiện

Made với ❤️ bởi AI Semantic Analysis Team

</div>
