# Hướng Dẫn Sao Chép Template

Hướng dẫn chi tiết về cách sao chép và tùy chỉnh Next.js Supabase Template cho các dự án mới.

## 🎯 Mục Đích Template

Template này được thiết kế cho:
- **SaaS Applications** với authentication và database
- **E-commerce Platforms** với payment integration
- **Educational Platforms** với AI-powered features
- **Content Management Systems** với rich editing
- **Dashboard Applications** với real-time data
- **API-first Applications** với mobile clients

## 📋 Yêu Cầu Trước Khi Bắt Đầu

### Kiểm Tra Environment
```bash
# Kiểm tra Node.js version (cần 18+)
node --version

# Kiểm tra npm version
npm --version

# Kiểm tra Git
git --version

# Kiểm tra disk space (cần ít nhất 2GB)
df -h
```

### Công Cụ Cần Thiết
- **Git** - Version control
- **Node.js 18+** - Runtime environment
- **VS Code** (khuyến nghị) - Code editor
- **Supabase Account** - Backend services
- **Vercel Account** (khuyến nghị) - Deployment platform

## 🚀 Bước 1: Clone Template

### Method 1: Direct Clone

```bash
# Clone template repository
git clone https://github.com/maemreyo/nextjs-supabase-template.git my-new-project

# Di chuyển vào project directory
cd my-new-project

# Remove original git history
rm -rf .git

# Initialize new git repository
git init

# Set remote to your new repository
git remote add origin https://github.com/maemreyo/my-new-project.git
git branch -M main
```

### Method 2: Using GitHub CLI

```bash
# Tạo new repository từ template
gh repo create my-new-project --template your-username/nextjs-supabase-template --clone

# Di chuyển vào project directory
cd my-new-project
```

### Method 3: Download and Extract

```bash
# Download template as ZIP
wget https://github.com/maemreyo/nextjs-supabase-template/archive/main.zip

# Extract
unzip main.zip
mv nextjs-supabase-template-main my-new-project
cd my-new-project

# Initialize git
git init
git add .
git commit -m "Initial commit from template"
```

## 🔧 Bước 2: Cấu Hình Project Mới

### 2.1 Cập Nhật Package Information

```bash
# Mở package.json và cập nhật:
{
  "name": "my-new-project",
  "version": "0.1.0",
  "description": "Description of your new project",
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/maemreyo/my-new-project.git"
  },
  "bugs": {
    "url": "https://github.com/maemreyo/my-new-project/issues"
  },
  "homepage": "https://github.com/maemreyo/my-new-project#readme"
}
```

### 2.2 Cập Nhật Environment Variables

```bash
# Copy environment template
cp .env.example .env.local

# Mở và cập nhật .env.local
nano .env.local
```

**Các biến cần cập nhật:**
```env
# Project Information
NEXT_PUBLIC_APP_NAME=My New Project
NEXT_PUBLIC_APP_DESCRIPTION=Description of your project
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration (cần tạo mới)
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key

# AI Configuration (tùy chọn)
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-3.5-turbo
```

### 2.3 Cập Nhật Metadata Files

#### `next.config.ts`
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cập nhật với thông tin project của bạn
  experimental: {
    // Các experimental features cần thiết
  },
  
  // Cấu hình images
  images: {
    domains: ['your-domain.com'], // Thêm domains của bạn
  },
  
  // Environment variables
  env: {
    CUSTOM_VAR: process.env.CUSTOM_VAR,
  },
}

module.exports = nextConfig
```

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    // Cập nhật paths nếu cần
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

## 🗂️ Bước 3: Tùy Chọn Cấu Trúc

### 3.1 Xác Định Project Type

#### E-commerce Project
```
src/
├── app/
│   ├── (auth)/
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   └── orders/
├── components/
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   └── orders/
├── lib/
│   ├── payments/
│   ├── inventory/
│   └── shipping/
└── types/
    ├── product.ts
    ├── cart.ts
    └── order.ts
```

#### SaaS Application
```
src/
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── settings/
│   ├── billing/
│   └── api/
├── components/
│   ├── dashboard/
│   ├── settings/
│   └── billing/
├── lib/
│   ├── subscriptions/
│   ├── billing/
│   └── analytics/
└── types/
    ├── subscription.ts
    ├── billing.ts
    └── analytics.ts
```

#### Content Platform
```
src/
├── app/
│   ├── (auth)/
│   ├── content/
│   ├── editor/
│   └── media/
├── components/
│   ├── content/
│   ├── editor/
│   └── media/
├── lib/
│   ├── content/
│   ├── editor/
│   └── media/
└── types/
    ├── content.ts
    ├── editor.ts
    └── media.ts
```

### 3.2 Remove Unnecessary Features

#### Remove AI Module (không cần thiết)
```bash
# Xóa AI-related files
rm -rf src/lib/ai
rm -rf src/hooks/useAI*.ts
rm -rf src/components/examples/ai-examples.tsx
rm -rf src/app/api/ai

# Xóa AI dependencies từ package.json
npm uninstall openai anthropic @anthropic-ai/sdk

# Xóa AI environment variables từ .env.local
# OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.
```

#### Remove Authentication (nếu dùng custom auth)
```bash
# Xóa Supabase auth
rm -rf src/lib/supabase
rm -rf src/components/providers/supabase-provider.tsx
rm -rf src/app/(auth)

# Xóa Supabase dependencies
npm uninstall @supabase/auth-helpers-nextjs @supabase/auth-ui-react @supabase/supabase-js

# Implement custom authentication system
```

#### Remove Specific UI Components
```bash
# Xóa components không cần thiết
rm -rf src/components/ui/dialog.tsx
rm -rf src/components/ui/table.tsx
rm -rf src/components/ui/tabs.tsx

# Hoặc giữ lại nhưng không import
# Components sẽ không ảnh hưởng đến bundle size nếu không được sử dụng
```

### 3.3 Add Custom Features

#### Thêm New Service
```bash
# Tạo service directory
mkdir -p src/lib/my-service

# Tạo interface
touch src/lib/my-service/types.ts

# Tạo client
touch src/lib/my-service/client.ts

# Tạo server
touch src/lib/my-service/server.ts
```

#### Thêm New Component Library
```bash
# Install new UI library
npm install @mui/material @emotion/react @emotion/styled

# Configure in project
# Tạo theme provider
touch src/components/providers/mui-provider.tsx

# Tạo components
mkdir -p src/components/mui
```

## 🎨 Bước 4: Custom Styling

### 4.1 Update Theme Configuration

#### `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom colors cho brand của bạn
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        // Custom color palette
      },
      
      // Custom fonts
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      // Custom spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      
      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    // Thêm plugins cần thiết
  ],
}
```

#### Custom CSS Variables
```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom CSS variables cho theme */
:root {
  /* Brand colors */
  --brand-primary: 59 130 246;
  --brand-primary-foreground: 255 255 255;
  
  /* Custom colors */
  --custom-accent: 168 85 247;
  --custom-accent-foreground: 255 255 255;
  
  /* Custom borders */
  --custom-border: 226 232 240;
  --custom-border-hover: 203 213 225;
  
  /* Custom backgrounds */
  --custom-background: 255 255 255;
  --custom-foreground: 15 23 42;
}

.dark {
  /* Dark theme colors */
  --custom-background: 15 23 42;
  --custom-foreground: 255 255 255;
  --custom-border: 30 41 59;
  --custom-border-hover: 51 65 85;
}

/* Custom utility classes */
@layer utilities {
  .text-gradient {
    @apply bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent;
  }
  
  .glass-effect {
    @apply bg-white/10 backdrop-blur-md border border-white/20;
  }
  
  .custom-shadow {
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  }
}
```

### 4.2 Update Component Styling

#### Custom Button Variant
```typescript
// src/components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Custom variant
        brand: "bg-brand-500 text-white hover:bg-brand-600 shadow-lg",
        gradient: "text-gradient bg-transparent border-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
```

## 🗄️ Bước 5: Database Setup

### 5.1 Tạo Supabase Project Mới

1. **Vào [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Click "New Project"**
3. **Điền thông tin**:
   - **Project Name**: Tên project của bạn
   - **Database Password**: Mật khẩu mạnh
   - **Region**: Chọn region gần nhất
4. **Wait for project creation** (1-2 phút)

### 5.2 Database Schema Design

#### Basic Schema cho E-commerce
```sql
-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category_id UUID REFERENCES categories(id),
  images TEXT[],
  inventory_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
```

#### Schema cho SaaS Application
```sql
-- Organizations table
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members
CREATE TABLE organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5.3 Generate TypeScript Types

```bash
# Generate types từ database schema
npm run db:generate-types-remote

# Hoặc generate từ local database
npm run db:generate
```

### 5.4 Create Database Functions

```sql
-- Function để create organization
CREATE OR REPLACE FUNCTION create_organization(
  org_name TEXT,
  org_slug TEXT,
  user_id UUID
) RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Tạo organization
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO org_id;
  
  -- Thêm user làm owner
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (org_id, user_id, 'owner');
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function để check user role
CREATE OR REPLACE FUNCTION get_user_role(
  org_slug TEXT,
  user_id UUID
) RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT om.role
    FROM organization_members om
    JOIN organizations o ON om.organization_id = o.id
    WHERE o.slug = org_slug AND om.user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔐 Bước 6: Authentication Setup

### 6.1 Configure Supabase Auth

1. **Vào Authentication → Settings** trong Supabase dashboard
2. **Cấu hình Site URL**:
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**: `https://your-domain.com/auth/callback`

3. **Bật các providers cần thiết**:
   - **Email** (mặc định)
   - **GitHub** (nếu cần)
   - **Google** (nếu cần)
   - **Magic Links** (nếu cần)

### 6.2 Custom Auth Components

```typescript
// src/components/auth/login-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Login error:', error)
      // Handle error display
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}
```

## 🚀 Bước 7: Deployment Configuration

### 7.1 Vercel Setup

1. **Connect GitHub Repository**:
   - Vào [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import từ GitHub
   - Chọn repository của bạn

2. **Configure Build Settings**:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm install",
     "framework": "nextjs"
   }
   ```

3. **Add Environment Variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # AI keys (nếu có)
   OPENAI_API_KEY=your-openai-key
   ```

### 7.2 Custom Domain Setup

1. **Vào Project Settings → Domains**
2. **Add custom domain**:
   - `your-domain.com`
   - `www.your-domain.com`

3. **Configure DNS**:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### 7.3 SSL Certificate

Vercel tự động cung cấp SSL certificate cho custom domains.

## 🧪 Bước 8: Testing Setup

### 8.1 Configure Test Environment

```bash
# Tạo test environment file
cp .env.example .env.test

# Cấu hình test database
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
```

### 8.2 Test Database Setup

```sql
-- Tạo test data
INSERT INTO products (name, description, price) VALUES
  ('Test Product 1', 'Description 1', 99.99),
  ('Test Product 2', 'Description 2', 149.99);

-- Tạo test user
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test@example.com');
```

### 8.3 E2E Test Configuration

```typescript
// tests/e2e/config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## 📋 Bước 9: Cleanup và Optimization

### 9.1 Remove Unused Dependencies

```bash
# Kiểm tra dependencies
npm ls

# Tìm unused dependencies
npx depcheck

# Xóa unused dependencies
npm uninstall package1 package2 package3
```

### 9.2 Optimize Bundle Size

```bash
# Phân tích bundle
npm run bundle:analyze

# Kiểm tra large packages
npx bundlephobia analyze

# Optimize imports
# Sử dụng dynamic imports cho large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
})
```

### 9.3 Performance Optimization

```typescript
// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Enable experimental features
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
```

## 🔄 Bước 10: Maintenance

### 10.1 Update Dependencies

```bash
# Kiểm tra outdated packages
npm outdated

# Update packages
npm update

# Update major versions
npm install package@latest
```

### 10.2 Security Updates

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Security audit cho production
npm audit --production
```

### 10.3 Database Maintenance

```sql
-- Cleanup old data
DELETE FROM ai_usage_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- Reindex tables
REINDEX TABLE products;
REINDEX TABLE orders;

-- Update statistics
ANALYZE products;
ANALYZE orders;
```

## 📊 Project Types Customization

### E-commerce Template

**Features cần thêm:**
- Product catalog với search và filtering
- Shopping cart với persistence
- Checkout process với payment integration
- Order management và tracking
- Inventory management
- Customer reviews và ratings

**Files cần tạo:**
```bash
# Components
mkdir -p src/components/products
mkdir -p src/components/cart
mkdir -p src/components/checkout
mkdir -p src/components/orders

# Pages
mkdir -p src/app/products/[slug]
mkdir -p src/app/cart
mkdir -p src/app/checkout
mkdir -p src/app/orders

# Services
mkdir -p src/lib/payments
mkdir -p src/lib/inventory
mkdir -p src/lib/shipping

# Types
touch src/types/product.ts
touch src/types/cart.ts
touch src/types/order.ts
touch src/types/payment.ts
```

### SaaS Template

**Features cần thêm:**
- Multi-tenant architecture
- Subscription management
- Team collaboration
- Billing và invoicing
- Analytics dashboard
- API rate limiting

**Files cần tạo:**
```bash
# Components
mkdir -p src/components/organizations
mkdir -p src/components/subscriptions
mkdir -p src/components/billing
mkdir -p src/components/analytics

# Pages
mkdir -p src/app/organizations
mkdir -p src/app/billing
mkdir -p src/app/analytics

# Services
mkdir -p src/lib/subscriptions
mkdir -p src/lib/billing
mkdir -p src/lib/analytics

# Types
touch src/types/organization.ts
touch src/types/subscription.ts
touch src/types/billing.ts
```

### Content Platform Template

**Features cần thêm:**
- Rich text editor
- Media management
- Content versioning
- SEO optimization
- Comment system
- Social sharing

**Files cần tạo:**
```bash
# Components
mkdir -p src/components/editor
mkdir -p src/components/media
mkdir -p src/components/content

# Pages
mkdir -p src/app/content/[slug]
mkdir -p src/app/editor
mkdir -p src/app/media

# Services
mkdir -p src/lib/editor
mkdir -p src/lib/media
mkdir -p src/lib/content

# Types
touch src/types/content.ts
touch src/types/media.ts
touch src/types/editor.ts
```

## 🎯 Best Practices

### 1. Folder Structure
- Giữ structure nhất quán
- Sử dụng barrel exports cho clean imports
- Colocate related files
- Separate concerns rõ ràng

### 2. Naming Conventions
- Components: PascalCase
- Files: kebab-case
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE

### 3. Code Organization
- Custom hooks trong `hooks/`
- Utilities trong `lib/utils/`
- Types trong `types/`
- Components theo feature grouping

### 4. Performance
- Sử dụng React.memo cho expensive components
- Implement lazy loading cho code splitting
- Optimize images và assets
- Use caching strategies

### 5. Security
- Validate tất cả inputs
- Implement proper authentication
- Use HTTPS cho production
- Regular security audits

---

## 📞 Support và Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Community
- [GitHub Issues](https://github.com/maemreyo/nextjs-supabase-template/issues)
- [Discord Community](https://discord.gg/your-server)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/nextjs-supabase)

### Templates và Examples
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)
- [Supabase Examples](https://github.com/supabase/supabase/tree/master/examples)
- [Tailwind Components](https://tailwindui.com/)

Chúc bạn thành công với dự án mới! 🚀

Template này cung cấp nền tảng vững chắc để xây dựng các ứng dụng hiện đại với Next.js và Supabase. Tùy chỉnh theo nhu cầu cụ thể của bạn và follow best practices để maintain chất lượng code cao.