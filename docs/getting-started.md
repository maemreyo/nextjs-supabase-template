# Hướng Dẫn Bắt Đầu Next.js Supabase Template

Hướng dẫn toàn diện này sẽ giúp bạn thiết lập và sử dụng Next.js Supabase Template một cách hiệu quả.

## 📋 Yêu Cầu Hệ Thống

Trước khi bắt đầu, đảm bảo bạn có:

### Phần Cần Thiết
- **Node.js 18+** - [Tải tại đây](https://nodejs.org/)
- **npm** (thường đi kèm với Node.js) hoặc **yarn**
- **Git** - [Tải tại đây](https://git-scm.com/)
- **VS Code** (khuyến nghị) với các extension:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
  - ESLint

### Tài Khoản Dịch Vụ
- **Supabase Account** - [Đăng ký miễn phí](https://supabase.com)
- **AI Provider API Keys** (tùy chọn):
  - OpenAI API Key
  - Anthropic API Key
  - Google AI API Key
  - Cohere API Key

### Kiểm Tra Môi Trường

Mở terminal và chạy các lệnh sau để kiểm tra:

```bash
# Kiểm tra Node.js version
node --version  # Phải >= 18.0.0

# Kiểm tra npm version
npm --version   # Phải >= 8.0.0

# Kiểm tra Git
git --version
```

## 🚀 Bước 1: Cài Đặt Project

### Clone Repository

```bash
# Clone template
git clone <repository-url>
cd nextjs-supabase-template

# Hoặc sử dụng với GitHub CLI
gh repo clone <username>/nextjs-supabase-template
cd nextjs-supabase-template
```

### Cài Đặt Dependencies

```bash
# Sử dụng npm
npm install

# Hoặc sử dụng yarn
yarn install

# Hoặc sử dụng pnpm
pnpm install
```

### Cấu Hình Môi Trường

1. **Sao chép file môi trường**:
   ```bash
   cp .env.example .env.local
   ```

2. **Mở file `.env.local`** và cập nhật thông tin:
   ```env
   # Supabase Configuration - BẮT BUỘC
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   
   # AI Provider Configuration - TÙY CHỌN
   OPENAI_API_KEY=sk-your-openai-key
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
   GOOGLE_AI_API_KEY=your-google-ai-key
   COHERE_API_KEY=your-cohere-key
   
   # AI Default Settings
   AI_DEFAULT_PROVIDER=openai
   AI_DEFAULT_MODEL=gpt-3.5-turbo
   AI_MAX_TOKENS=1000
   AI_TEMPERATURE=0.7
   
   # Application Configuration
   NODE_ENV=development
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback
   ```

## 🔧 Bước 2: Thiết Lập Supabase

### Tạo Supabase Project

1. **Truy cập [supabase.com](https://supabase.com)**
2. **Đăng nhập** hoặc **đăng ký**
3. **Click "New Project"**
4. **Điền thông tin project**:
   - **Organization**: Chọn organization của bạn
   - **Project Name**: Tên project (ví dụ: `my-app`)
   - **Database Password**: Mật khẩu database mạnh
   - **Region**: Chọn region gần nhất với bạn
5. **Click "Create new project"**

### Lấy Thông Tin Project

1. **Chờ project được tạo** (1-2 phút)
2. **Vào Settings → API**
3. **Sao chép các thông tin sau**:
   - **Project URL**
   - **anon public key**
   - **service_role key** (cần cho server-side operations)

### Cập Nhật Environment Variables

Quay lại file `.env.local` và cập nhật:

```env
# Thay thế bằng thông tin thực tế
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Cấu Hình Authentication

1. **Vào Authentication → Settings**
2. **Cấu hình Site URL**:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback`
3. **Bật các providers cần thiết**:
   - Email/Password (mặc định)
   - GitHub (nếu cần)
   - Google (nếu cần)

### Tạo Database Schema (Tùy chọn)

Nếu bạn muốn sử dụng hệ thống user profile:

1. **Vào SQL Editor** trong Supabase dashboard
2. **Chạy SQL sau**:

```sql
-- Tạo profiles table
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  
  constraint username_length check (char_length(username) >= 3),
  constraint username_length check (char_length(username) <= 24)
);

-- Bật Row Level Security
alter table profiles enable row level security;

-- Tạo policies
create policy "Users can view their own profile."
  on profiles for select
  using ( auth.uid() = id );
  
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );
  
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Tạo trigger tự động tạo profile
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Chạy Database Migrations

```bash
# Generate types từ remote database
npm run db:generate-types-remote

# Push migrations (nếu có)
npm run db:push
```

## 🏃‍♂️ Bước 3: Khởi Chạy Ứng Dụng

### Development Server

```bash
# Khởi động development server
npm run dev

# Server sẽ chạy tại http://localhost:3000
```

### Kiểm Tra Cài Đặt

1. **Mở browser** và truy cập `http://localhost:3000`
2. **Kiểm tra console** cho bất kỳ lỗi nào
3. **Test authentication**:
   - Đăng ký tài khoản mới
   - Đăng nhập với tài khoản đã đăng ký
4. **Kiểm tra database connection**:
   - Vào Supabase dashboard → Authentication
   - Xem users đã được tạo chưa

### Verify AI Module (Nếu đã cấu hình)

1. **Test AI functionality**:
   - Vào trang AI examples
   - Thử generate text
   - Kiểm tra usage tracking

## 📁 Bước 4: Hiểu Cấu Trúc Project

### Tổng Quan Directory Structure

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
│   ├── lib/                   # Utilities and business logic
│   │   ├── supabase/         # Supabase client configuration
│   │   ├── auth/              # Authentication utilities
│   │   ├── ai/               # AI module
│   │   ├── utils/             # General utilities
│   │   └── validations/       # Form validation schemas
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # State management (Zustand)
│   └── types/                # TypeScript definitions
├── supabase/                # Supabase migrations
├── docs/                     # Documentation
├── scripts/                  # Utility scripts
└── tests/                    # Test files
```

### Các File Quan Trọng

#### Core Configuration
- **`src/app/layout.tsx`** - Root layout với providers
- **`src/middleware.ts`** - Middleware cho authentication
- **`next.config.ts`** - Next.js configuration
- **`tailwind.config.js`** - Tailwind CSS configuration

#### Supabase Integration
- **`src/lib/supabase/client.ts`** - Client-side Supabase instance
- **`src/lib/supabase/server.ts`** - Server-side Supabase instance
- **`src/components/providers/supabase-provider.tsx`** - Authentication context

#### AI Module
- **`src/lib/ai/ai-service.ts`** - Core AI service
- **`src/lib/ai/types.ts`** - AI TypeScript definitions
- **`src/hooks/useAIService.ts`** - AI service hook

#### State Management
- **`src/stores/auth-store.ts`** - Authentication state
- **`src/stores/ui-store.ts`** - UI state management

## 🎨 Bước 5: Sử Dụng Shadcn UI

### Components Có Sẵn

Template đã include các Shadcn UI components sau:

#### Basic Components
- **Button** - Nhiều variants và sizes
- **Input** - Form inputs với validation
- **Label** - Labels cho form fields
- **Card** - Container components
- **Avatar** - User profile images

#### Advanced Components
- **Dialog** - Modal dialogs
- **Table** - Data tables với styling
- **Form** - Complete form patterns
- **Tabs** - Tabbed navigation
- **Select** - Dropdown selections
- **Checkbox** - Toggle inputs
- **Badge** - Status indicators
- **Alert** - Notification messages
- **Sheet** - Slide-out panels
- **Sonner** - Toast notifications

### Sử Dụng Components

```typescript
// Import components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function MyComponent() {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Họ và tên</Label>
          <Input id="name" placeholder="Nhập họ và tên" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="nhập email" />
        </div>
        <Button variant="outline" className="w-full">
          Lưu thay đổi
        </Button>
      </CardContent>
    </Card>
  )
}
```

### Theme System

Template include dark/light theme support:

```typescript
// Theme toggle component
import { ThemeToggle } from '@/components/ui/theme-toggle'

function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <h1 className="text-2xl font-bold">Ứng dụng của tôi</h1>
      <ThemeToggle />
    </header>
  )
}
```

### Thêm Component Mới

```bash
# Thêm component từ Shadcn
npx shadcn@latest add [component-name]

# Ví dụ:
npx shadcn@latest add accordion
npx shadcn@latest add calendar
npx shadcn@latest add popover
```

## 🧠 Bước 6: Cấu Hình AI Module

### Thiết Lập AI Providers

1. **Lấy API Keys**:
   - **OpenAI**: [platform.openai.com](https://platform.openai.com)
   - **Anthropic**: [console.anthropic.com](https://console.anthropic.com)
   - **Google AI**: [ai.google.dev](https://ai.google.dev)
   - **Cohere**: [cohere.com](https://cohere.com)

2. **Cập nhật `.env.local`**:
   ```env
   # OpenAI
   OPENAI_API_KEY=sk-your-openai-key
   
   # Anthropic
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
   
   # Google AI
   GOOGLE_AI_API_KEY=your-google-ai-key
   
   # Cohere
   COHERE_API_KEY=your-cohere-key
   ```

### Sử Dụng AI Service

```typescript
// Server-side usage
import { createAIService } from '@/lib/ai/ai-service-server'

export async function generateContent(prompt: string) {
  const aiService = createAIService()
  
  try {
    const response = await aiService.generateText({
      prompt,
      model: 'gpt-3.5-turbo',
      maxTokens: 500,
      temperature: 0.7
    })
    
    return response.text
  } catch (error) {
    console.error('AI generation failed:', error)
    throw error
  }
}
```

```typescript
// Client-side usage
'use client'
import { useAIService } from '@/hooks/useAIService'

function AIComponent() {
  const { generateText, isLoading, error } = useAIService()
  
  const handleGenerate = async () => {
    try {
      const response = await generateText({
        prompt: 'Viết một bài thơ về công nghệ',
        model: 'gpt-3.5-turbo'
      })
      console.log('AI Response:', response.text)
    } catch (error) {
      console.error('Generation failed:', error)
    }
  }
  
  return (
    <div>
      <Button 
        onClick={handleGenerate} 
        disabled={isLoading}
      >
        {isLoading ? 'Đang tạo...' : 'Tạo nội dung'}
      </Button>
      {error && <p className="text-red-500">Lỗi: {error.message}</p>}
    </div>
  )
}
```

## 📊 Bước 7: Testing

### Chạy Tests

```bash
# Chạy tất cả tests
npm run test

# Chạy trong watch mode
npm run test:watch

# Chạy với coverage report
npm run test:coverage

# Chạy E2E tests
npm run test:e2e

# Chạy E2E với UI
npm run test:e2e:ui
```

### Test Structure

```
tests/
├── __mocks__/           # Mock files
├── components/          # Component tests
├── api/               # API route tests
├── hooks/             # Hook tests
└── utils/             # Utility function tests
```

### Viết Test Example

```typescript
// tests/components/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders correctly with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
  
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## 🚀 Bước 8: Deployment

### Deployment trên Vercel (Khuyến nghị)

1. **Connect GitHub Repository**:
   - Vào [vercel.com](https://vercel.com)
   - Import project từ GitHub
   - Chọn repository `nextjs-supabase-template`

2. **Configure Environment Variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
   
   # AI Keys (nếu có)
   OPENAI_API_KEY=your-production-openai-key
   ```

3. **Deploy**:
   - Vercel sẽ tự động deploy trên mỗi push đến main branch
   - Preview URLs cho mỗi pull request

### Deployment trên các nền tảng khác

#### Netlify
```bash
# Build command
npm run build

# Publish directory
out
```

#### Railway
```bash
# Build command
npm run build

# Start command
npm start
```

#### Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 🔍 Bước 9: Verification & Testing

### Checklist Verification

Sau khi cài đặt, hãy kiểm tra các mục sau:

#### ✅ Basic Functionality
- [ ] Trang home load thành công
- [ ] Navigation hoạt động
- [ ] Theme toggle (dark/light mode)
- [ ] Responsive design trên mobile

#### ✅ Authentication
- [ ] Đăng ký user mới
- [ ] Đăng nhập với user đã có
- [ ] Đăng xuất thành công
- [ ] Protected routes redirect đúng

#### ✅ Database Connection
- [ ] Supabase connection thành công
- [ ] Data persistence hoạt động
- [ ] Realtime subscriptions (nếu có)

#### ✅ AI Module (nếu đã cấu hình)
- [ ] AI providers hoạt động
- [ ] Usage tracking ghi nhận
- [ ] Error handling đúng

#### ✅ Performance
- [ ] Page load time < 3 seconds
- [ ] Core Web Vitals trong giới hạn
- [ ] Không có memory leaks

### Debugging Tools

#### Browser DevTools
```javascript
// Kiểm tra Supabase connection
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

// Kiểm tra user session
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
supabase.auth.getSession().then(console.log)
```

#### Network Tab
- Kiểm tra API calls
- Xem response status codes
- Monitor request timing

#### Console Errors
- TypeScript errors
- Runtime errors
- Warning messages

## 🐛 Troubleshooting

### Common Issues

#### "Database connection failed"
**Nguyên nhân**: Sai Supabase URL hoặc API keys
**Giải pháp**:
1. Kiểm tra `.env.local` values
2. Verify Supabase project đang active
3. Check network connectivity

#### "Auth not working"
**Nguyên nhân**: Sai redirect URLs hoặc missing cookies
**Giải pháp**:
1. Check redirect URLs trong Supabase settings
2. Ensure cookies enabled trong browser
3. Verify environment variables

#### "TypeScript errors"
**Nguyên nhân**: Import paths sai hoặc missing types
**Giải pháp**:
1. Run `npm run type-check`
2. Check imports và type definitions
3. Restart TypeScript server

#### "Build fails"
**Nguyên nhân**: Missing environment variables hoặc syntax errors
**Giải pháp**:
1. Check tất cả environment variables
2. Run `npm run lint` để check errors
3. Clear Next.js cache: `rm -rf .next`

#### "AI module not working"
**Nguyên nhân**: Missing API keys hoặc invalid configuration
**Giải pháp**:
1. Verify AI provider API keys
2. Check AI module configuration
3. Review AI service logs

### Getting Help

#### Resources
- **This guide** - Các solutions phổ biến
- **Architecture documentation** - Hiểu structure
- **Supabase docs** - Database issues
- **Next.js docs** - Framework questions
- **AI Module Guide** - AI-related issues

#### Community
- **GitHub Issues** - Bug reports và feature requests
- **Discord/Slack** - Real-time help
- **Stack Overflow** - General questions

## 📚 Next Steps

Sau khi hoàn thành setup:

### Learning Resources
1. **Study architecture** trong `docs/architecture.md`
2. **Review component examples** trong `src/components/examples/`
3. **Read AI module guide** trong `docs/ai-module-guide.md`
4. **Explore scripts** trong `scripts/` directory

### Development Workflow
1. **Set up Git workflow** với branching strategy
2. **Configure pre-commit hooks** cho code quality
3. **Set up CI/CD** cho automated testing
4. **Monitor performance** trong production

### Customization
1. **Add your own components** dựa trên patterns
2. **Customize styling** với Tailwind
3. **Add new features** sử dụng established patterns
4. **Integrate additional services** cần thiết

Chúc mừng! Bạn đã sẵn sàng để phát triển ứng dụng với Next.js Supabase Template. 🎉

---

## 📞 Support

Nếu bạn gặp vấn đề hoặc có câu hỏi:

1. **Check documentation** trong `docs/` folder
2. **Search existing issues** trên GitHub
3. **Create new issue** với detailed description
4. **Join community discussions** để nhận help

Happy coding! 🚀