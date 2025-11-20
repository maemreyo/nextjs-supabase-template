# Hướng Dẫn Gỡ Rối (Troubleshooting)

Hướng dẫn toàn diện về các vấn đề phổ biến và cách giải quyết khi làm việc với Next.js Supabase Template.

## 🔍 Quick Diagnosis

### Check System Health

```bash
# Kiểm tra Node.js version
node --version  # Cần >= 18.0.0

# Kiểm tra npm version  
npm --version   # Cần >= 8.0.0

# Kiểm tra Git status
git status

# Kiểm tra port usage
lsof -i :3000

# Kiểm tra disk space
df -h

# Kiểm tra memory usage
free -h
```

### Environment Check Script

```bash
#!/bin/bash
# scripts/health-check.sh

echo "🔍 System Health Check"
echo "===================="

# Node.js version
NODE_VERSION=$(node --version)
echo "Node.js: $NODE_VERSION"
if [[ $(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
  echo "❌ Node.js version too old. Please upgrade to v18+"
else
  echo "✅ Node.js version OK"
fi

# npm version
NPM_VERSION=$(npm --version)
echo "npm: $NPM_VERSION"

# Git status
if git rev-parse --git-dir > /dev/null 2>&1; then
  echo "✅ Git repository detected"
  if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  You have uncommitted changes"
  else
    echo "✅ Working directory clean"
  fi
else
  echo "❌ Not a Git repository"
fi

# Environment variables
if [[ -f ".env.local" ]]; then
  echo "✅ .env.local file exists"
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
    echo "✅ Supabase URL configured"
  else
    echo "❌ Supabase URL missing"
  fi
else
  echo "❌ .env.local file missing"
fi

echo "===================="
echo "Health check complete!"
```

## 🚀 Development Issues

### Server Not Starting

#### Issue: Port already in use
```bash
# Error message
Error: listen EADDRINUSE: address already in use :::3000

# Solutions
# 1. Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# 2. Use different port
npm run dev -- --port 3001

# 3. Find and kill process
ps aux | grep "next dev" | grep -v grep
kill -9 <PID>

# 4. Check all ports
netstat -tulpn | grep :3000
```

#### Issue: Module not found
```bash
# Error message
Module not found: Can't resolve '@/components/ui/button'

# Solutions
# 1. Check tsconfig.json paths
cat tsconfig.json | grep -A 10 '"paths"'

# 2. Restart TypeScript server
# VS Code: Cmd+Shift+P -> "TypeScript: Restart TS Server"

# 3. Clear Next.js cache
rm -rf .next
npm run dev

# 4. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Hot reload not working
```bash
# Solutions
# 1. Check file watching limits
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 2. Restart development server
npm run dev

# 3. Check for syntax errors
npm run type-check

# 4. Verify file permissions
ls -la src/
```

## 🔐 Authentication Issues

### Supabase Connection Failed

#### Issue: Invalid credentials
```bash
# Error message
{"error":"Invalid API key"}

# Solutions
# 1. Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. Check Supabase project status
# Go to https://supabase.com/dashboard/project/settings

# 3. Regenerate API keys
# In Supabase dashboard: Settings -> API -> Regenerate

# 4. Update .env.local
nano .env.local
```

#### Issue: CORS errors
```bash
# Error message
Access to fetch at 'http://localhost:3000/api/auth' from origin 'http://localhost:3000' has been blocked by CORS policy

# Solutions
# 1. Check redirect URLs in Supabase
# Settings -> Authentication -> URL Configuration

# 2. Verify site URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback

# 3. Check middleware configuration
# src/middleware.ts
```

#### Issue: Session not persisting
```typescript
// Debug session state
// src/components/debug-session.tsx
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DebugSession() {
  useEffect(() => {
    const supabase = createClient()
    
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Current session:', session)
    })
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  return null
}
```

## 🗄️ Database Issues

### Connection Timeouts

#### Issue: Database connection timeout
```bash
# Error message
Database connection timeout after 30000ms

# Solutions
# 1. Check Supabase project status
curl -I https://your-project.supabase.co/rest/v1/

# 2. Increase timeout in configuration
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'Connection': 'keep-alive',
      },
    },
  }
)
```

#### Issue: Row Level Security (RLS) blocking access
```sql
-- Debug RLS policies
-- Run in Supabase SQL Editor

-- Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public';

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public';

-- Temporarily disable RLS for debugging
ALTER TABLE your_table_name DISABLE ROW LEVEL SECURITY;
```

#### Issue: Migration failures
```bash
# Error message
Migration failed: relation "your_table" already exists

# Solutions
# 1. Check migration status
npm run supabase:status

# 2. Reset database (DESTRUCTIVE)
npm run db:reset

# 3. Manual migration
# Create migration file manually
supabase migration new fix_table_creation

# 4. Apply specific migration
supabase db push --db-url postgresql://postgres:password@localhost:5432/postgres
```

## 🎨 UI/Styling Issues

### Tailwind CSS Not Working

#### Issue: Classes not applying
```bash
# Error message
Class 'bg-primary' does not exist

# Solutions
# 1. Check Tailwind configuration
cat tailwind.config.js | grep -A 5 "content"

# 2. Verify CSS imports
# src/app/globals.css should contain:
@tailwind base;
@tailwind components;
@tailwind utilities;

# 3. Restart development server
npm run dev

# 4. Check for CSS conflicts
# Look for conflicting CSS in dev tools
```

#### Issue: Dark mode not working
```typescript
// Debug theme provider
// src/components/debug-theme.tsx
'use client'

import { useTheme } from 'next-themes'

export function DebugTheme() {
  const { theme, systemTheme, setTheme } = useTheme()
  
  useEffect(() => {
    console.log('Current theme:', theme)
    console.log('System theme:', systemTheme)
    console.log('HTML class:', document.documentElement.className)
  }, [theme, systemTheme])
  
  return (
    <div className="fixed top-0 right-0 bg-red-500 text-white p-2 z-50">
      Theme: {theme}
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
    </div>
  )
}
```

#### Issue: Component styles not responsive
```css
/* Debug responsive styles */
/* Add temporarily to globals.css */

/* Show breakpoints */
@media (min-width: 640px) {
  body::before {
    content: "sm (640px+)";
    position: fixed;
    top: 0;
    right: 0;
    background: red;
    color: white;
    padding: 4px;
    font-size: 12px;
    z-index: 9999;
  }
}

@media (min-width: 768px) {
  body::before {
    content: "md (768px+)";
    background: orange;
  }
}

@media (min-width: 1024px) {
  body::before {
    content: "lg (1024px+)";
    background: green;
  }
}
```

## 🧠 AI Module Issues

### API Key Problems

#### Issue: Invalid API key
```bash
# Error message
{"error":"Invalid API key","type":"authentication_error"}

# Solutions
# 1. Test API key manually
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Hello"}]}'

# 2. Check environment variables
printenv | grep AI

# 3. Verify key format
# OpenAI keys start with 'sk-'
# Anthropic keys start with 'sk-ant-'
```

#### Issue: Rate limiting
```bash
# Error message
{"error":"Rate limit exceeded","type":"rate_limit_error"}

# Solutions
# 1. Implement exponential backoff
// src/lib/ai/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

# 2. Use fallback providers
const providers = ['openai', 'anthropic', 'google']
for (const provider of providers) {
  try {
    return await generateWithProvider(provider)
  } catch (error) {
    console.warn(`${provider} failed, trying next...`)
    continue
  }
}
```

#### Issue: High costs
```typescript
// Cost monitoring utility
// src/lib/ai/cost-monitor.ts
export function trackCost(provider: string, model: string, tokens: number) {
  const costPerToken = {
    'openai': { 'gpt-3.5-turbo': 0.000002, 'gpt-4': 0.00003 },
    'anthropic': { 'claude-3-haiku': 0.00000025, 'claude-3-sonnet': 0.000003 },
  }
  
  const cost = tokens * (costPerToken[provider]?.[model] || 0)
  
  console.log(`AI Usage - Provider: ${provider}, Model: ${model}, Tokens: ${tokens}, Cost: $${cost.toFixed(6)}`)
  
  // Alert if cost exceeds threshold
  if (cost > 0.01) { // $0.01 threshold
    console.warn(`High cost request: $${cost.toFixed(6)}`)
  }
  
  return cost
}

// Usage in AI service
trackCost('openai', 'gpt-3.5-turbo', 1000)
```

## 🧪 Testing Issues

### Jest Configuration Problems

#### Issue: Module resolution failures
```bash
# Error message
Cannot find module '@/components/ui/button' from 'button.test.tsx'

# Solutions
# 1. Update Jest configuration
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
}

# 2. Create jest setup file
// jest.setup.js
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))
```

#### Issue: Test timeouts
```bash
# Error message
Timeout - Async callback was not invoked within the 5000ms timeout

# Solutions
# 1. Increase timeout
// jest.config.js
module.exports = {
  testTimeout: 10000, // 10 seconds
}

# 2. Mock async operations
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test' } } }),
    },
    from: () => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}))
```

### E2E Testing Issues

#### Issue: Browser not launching
```bash
# Error message
browserType.launch: Executable doesn't exist

# Solutions
# 1. Install browsers
npx playwright install

# 2. Update Playwright
npm install @playwright/test@latest

# 3. Check system dependencies
# Ubuntu/Debian
sudo apt-get install -y libnss3-dev libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2

# macOS
xcode-select --install
```

#### Issue: Flaky tests
```typescript
// Improve test reliability
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  // Wait for network idle
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  
  // Use explicit waits
  await page.fill('[data-testid=email]', 'test@example.com')
  await page.fill('[data-testid=password]', 'password123')
  
  // Wait for element to be visible and enabled
  await page.waitForSelector('[data-testid=login-button]', { 
    state: 'visible',
    timeout: 5000 
  })
  
  await expect(page.locator('[data-testid=login-button]')).toBeEnabled()
  await page.click('[data-testid=login-button]')
  
  // Wait for navigation
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  
  // Verify success
  await expect(page.locator('h1')).toContainText('Welcome')
})
```

## 🚀 Deployment Issues

### Build Failures

#### Issue: TypeScript errors in build
```bash
# Error message
Type error: Type 'string' is not assignable to type 'number'

# Solutions
# 1. Run type checking locally
npm run type-check

# 2. Check specific files
npx tsc --noEmit --project tsconfig.json

# 3. Fix type errors
// Example fix
// Before:
const count: string = getCount()

// After:
const count: number = getCount()

// Or use type assertion
const count = getCount() as number
```

#### Issue: Environment variable not found
```bash
# Error message
Error: NEXT_PUBLIC_SUPABASE_URL is not defined

# Solutions
# 1. Check .env files
ls -la .env*

# 2. Verify deployment platform environment variables
# Vercel: Project Settings -> Environment Variables
# Netlify: Site settings -> Build & deploy -> Environment

# 3. Add validation
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

export const env = envSchema.parse(process.env)
```

### Performance Issues

#### Issue: Slow page loads
```typescript
// Performance monitoring
// src/lib/performance.ts
export function measurePageLoad(pageName: string) {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart
      
      console.log(`${pageName} load time: ${loadTime}ms`)
      
      // Alert if slow
      if (loadTime > 3000) {
        console.warn(`Slow load detected for ${pageName}: ${loadTime}ms`)
      }
    })
  }
}

// Usage in page
// src/app/dashboard/page.tsx
import { measurePageLoad } from '@/lib/performance'

measurePageLoad('Dashboard')
```

#### Issue: Large bundle size
```bash
# Analyze bundle size
npm run bundle:analyze

# Solutions
# 1. Dynamic imports
const HeavyComponent = dynamic(() => import('./HeavyComponent'))

# 2. Tree shaking
// Only import what you need
import { Button } from '@/components/ui/button' // ✅
import * as UI from '@/components/ui' // ❌

# 3. Optimize images
import Image from 'next/image'
// Use next/image instead of regular img tags

# 4. Remove unused dependencies
npx depcheck
npm uninstall unused-package
```

## 🔧 Debugging Tools

### VS Code Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "program": "node",
      "args": [
        "--inspect",
        "--preserve-symlinks-main-cache",
        "node_modules/.bin/next"
      ],
      "cwd": "${workspaceFolder}",
      "env": {
        "NODE_OPTIONS": "--inspect"
      },
      "console": "integratedTerminal"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Browser DevTools Setup

```javascript
// Debug utilities for browser console
// Add to bookmarks for easy access

// 1. Supabase session debug
(() => {
  const supabase = window.supabase
  if (supabase) {
    supabase.auth.getSession().then(console.log)
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth change:', event, session)
    })
  }
})()

// 2. Component props debug
// React DevTools Profiler
// Install React DevTools browser extension

// 3. Network request debug
// Monitor API calls in Network tab
// Filter by /api/ to see backend calls

// 4. Performance debug
// Performance tab -> Record -> Interact with page -> Stop
// Analyze flame graph for bottlenecks
```

### Logging Utilities

```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private context: string
  
  constructor(context: string) {
    this.context = context
  }
  
  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      data,
    }
    
    if (process.env.NODE_ENV === 'development') {
      console[level](`[${timestamp}] [${this.context}] ${message}`, data)
    } else {
      // Send to logging service
      this.sendToService(logEntry)
    }
  }
  
  debug(message: string, data?: any) {
    this.log('debug', message, data)
  }
  
  info(message: string, data?: any) {
    this.log('info', message, data)
  }
  
  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }
  
  error(message: string, data?: any) {
    this.log('error', message, data)
  }
  
  private async sendToService(logEntry: any) {
    // Send to your logging service (Sentry, LogRocket, etc.)
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      })
    } catch (error) {
      console.error('Failed to send log:', error)
    }
  }
}

export const logger = {
  auth: new Logger('auth'),
  api: new Logger('api'),
  db: new Logger('database'),
  ai: new Logger('ai'),
}

// Usage
logger.auth.info('User logged in', { userId: '123' })
logger.api.error('API request failed', { endpoint: '/api/users', error: 'Network error' })
```

## 🆘 Getting Help

### Debug Information Collection

```bash
# Create debug info script
#!/bin/bash
# scripts/collect-debug-info.sh

echo "🔍 Collecting Debug Information"
echo "================================="

# System info
echo "=== System Information ==="
uname -a
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Git: $(git --version)"

# Project info
echo "=== Project Information ==="
echo "Working directory: $(pwd)"
echo "Git branch: $(git branch --show-current)"
echo "Git status: $(git status --porcelain)"
echo "Last commit: $(git log -1 --oneline)"

# Dependencies
echo "=== Dependencies ==="
echo "Next.js: $(grep '"next"' package.json | cut -d'"' -f4)"
echo "React: $(grep '"react"' package.json | cut -d'"' -f4)"
echo "Supabase: $(grep '@supabase' package.json | cut -d'"' -f4 || echo 'Not installed')"

# Environment
echo "=== Environment Variables ==="
echo "NODE_ENV: $NODE_ENV"
echo "NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL"
echo "NEXT_PUBLIC_SUPABASE_URL configured: $(if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then echo "Yes"; else echo "No"; fi)"

# Network
echo "=== Network Information ==="
if command -v curl &> /dev/null; then
  echo "Internet connectivity: $(curl -s --max-time 5 https://google.com > /dev/null && echo "OK" || echo "Failed")"
fi

echo "================================="
echo "Debug information collected!"
```

### Community Resources

#### Official Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)

#### Community Forums
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/nextjs+supabase)
- [Discord Communities](https://discord.gg/)

#### Issue Reporting Template

```markdown
## Bug Report

### Environment
- OS: [e.g. macOS 13.0, Ubuntu 22.04]
- Node.js: [e.g. 18.17.0]
- Browser: [e.g. Chrome 118, Firefox 119]
- Template version: [e.g. v0.1.0]

### Description
[Brief description of the issue]

### Steps to Reproduce
1. Go to...
2. Click on...
3. See error...

### Expected Behavior
[What you expected to happen]

### Actual Behavior
[What actually happened]

### Error Messages
[Paste any error messages here]

### Additional Context
[Any additional information that might be helpful]
```

## 📋 Prevention Checklist

### Before Starting Development
- [ ] Node.js 18+ installed
- [ ] Latest dependencies installed
- [ ] Environment variables configured
- [ ] Git repository initialized
- [ ] Code editor extensions installed

### During Development
- [ ] Regular commits with descriptive messages
- [ ] Code reviewed before merging
- [ ] Tests written for new features
- [ ] Performance considered
- [ ] Security implications checked

### Before Deployment
- [ ] All tests passing
- [ ] Build successful
- [ ] Environment variables verified
- [ ] Performance tested
- [ ] Security audit completed

---

## 🔧 Emergency Procedures

### Database Corruption
```bash
# Emergency database restore
npm run db:backup  # Create backup first
npm run db:restore  # Restore from backup
```

### Security Breach
```bash
# 1. Rotate all API keys
# 2. Invalidate user sessions
# 3. Review access logs
# 4. Update dependencies
npm audit fix
npm update
```

### Production Outage
```bash
# 1. Check deployment status
# 2. Review error logs
# 3. Rollback if necessary
git revert HEAD~1
npm run build
npm run deploy
```

---

Khi gặp vấn đề, hãy theo thứ tự sau:

1. **Check error messages** carefully
2. **Consult this guide** for known solutions  
3. **Search existing issues** in repositories
4. **Ask for help** in community forums
5. **Create detailed issue report** if needed

Chúc bạn gỡ rối thành công! 🔧✨