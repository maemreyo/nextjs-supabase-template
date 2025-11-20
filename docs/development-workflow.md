# Hướng Dẫn Quy Trình Phát Triển

Hướng dẫn toàn diện về quy trình phát triển với Next.js Supabase Template.

## 🌅 Quy Trình Hàng Ngày

### 1. Khởi Động Ngày Làm Việc

#### Kiểm Tra Environment
```bash
# Kiểm tra Node.js và npm versions
node --version
npm --version

# Kiểm tra Git status
git status

# Pull latest changes
git pull origin main

# Kiểm tra có conflicts không
git merge origin/main
```

#### Khởi Động Development Server
```bash
# Install dependencies nếu cần
npm install

# Khởi động development server
npm run dev

# Trong terminal khác, khởi động các services khác nếu cần
# npm run supabase:start  # Nếu dùng local Supabase
```

#### Kiểm Tra Quick Health
```bash
# Chạy type checking
npm run type-check

# Chạy linting
npm run lint

# Chạy tests nhanh
npm run test -- --passWithNoTests
```

### 2. Workflow Chi Tiết

#### Branch Strategy

```bash
# Tạo feature branch từ main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Hoặc tạo bugfix branch
git checkout -b bugfix/issue-number-description

# Hoặc tạo hotfix branch cho production
git checkout -b hotfix/critical-fix-description
```

#### Commit Convention

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types phổ biến:**
- `feat`: Feature mới
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi colons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(auth): add OAuth2 integration with Google"
git commit -m "fix(ai): resolve memory leak in AI service"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(components): add unit tests for Button component"
```

#### Daily Development Tasks

1. **Morning Setup** (15 phút)
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Switch to your branch
   git checkout feature/your-feature
   
   # Merge latest main vào feature branch
   git merge main
   
   # Start dev server
   npm run dev
   ```

2. **Development Session** (2-4 giờ)
   - Làm việc trên feature
   - Commit thường xuyên với descriptive messages
   - Run tests locally trước khi commit

3. **End of Day** (10 phút)
   ```bash
   # Stage changes
   git add .
   
   # Commit work in progress
   git commit -m "wip: implement partial feature X"
   
   # Push to remote
   git push origin feature/your-feature
   ```

## 🔄 Git Workflow

### Branch Naming Conventions

```bash
# Features
feature/user-authentication
feature/ai-chat-interface
feature/dashboard-analytics

# Bug fixes
bugfix/fix-login-validation
bugfix/resolve-memory-leak

# Hotfixes (production)
hotfix/critical-security-patch
hotfix/emergency-database-fix

# Releases
release/v1.0.0
release/v1.1.0-beta

# Chores
chore/update-dependencies
chore/upgrade-nextjs
```

### Pull Request Process

#### 1. Preparation
```bash
# Ensure branch is up to date
git checkout main
git pull origin main
git checkout feature/your-feature
git merge main

# Run full test suite
npm run test
npm run test:coverage
npm run type-check
npm run lint

# Build project
npm run build
```

#### 2. Create Pull Request

```bash
# Push feature branch
git push origin feature/your-feature

# Tạo PR qua GitHub UI hoặc CLI
# gh pr create --title "feat: Add user authentication" --body "..."
```

#### 3. PR Template

```markdown
## 📝 Description
Brief description of what this PR does and why it's needed.

## 🔄 Changes
- [ ] Added new feature X
- [ ] Fixed bug Y
- [ ] Updated documentation
- [ ] Added tests

## 🧪 Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing done

## 📸 Screenshots
Add screenshots if this PR includes UI changes.

## 🔗 Related Issues
Closes #123
Related to #456

## 📋 Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Build passes successfully
```

#### 4. Code Review Process

**Reviewers should check:**
- **Functionality**: Code works as intended
- **Code Quality**: Clean, readable, maintainable
- **Performance**: No performance regressions
- **Security**: No security vulnerabilities
- **Tests**: Adequate test coverage
- **Documentation**: Code is well-documented

**Author responsibilities:**
- Address all review comments
- Update tests if needed
- Keep PR history clean (squash commits if needed)

## 🧪 Testing Workflow

### 1. Local Testing

#### Unit Tests
```bash
# Run all unit tests
npm run test

# Run specific test file
npm run test -- Button.test.tsx

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

#### Integration Tests
```bash
# Test API routes
npm run test -- --testPathPattern=api

# Test database operations
npm run test -- --testPathPattern=database
```

#### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- --grep "Login flow"

# Run E2E with UI
npm run test:e2e:ui
```

### 2. Testing Strategy

#### Test Pyramid
```
    E2E Tests (10%)
   ─────────────────
  Integration Tests (20%)
 ─────────────────────────
Unit Tests (70%)
─────────────────────────────────
```

#### Test Structure
```
tests/
├── __mocks__/           # Mock files
├── components/          # Component unit tests
├── api/               # API route tests
├── hooks/             # Hook tests
├── utils/             # Utility function tests
├── integration/        # Integration tests
└── e2e/              # End-to-end tests
```

### 3. Writing Tests

#### Component Test Example
```typescript
// tests/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
  
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('applies variant styles correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })
})
```

#### API Route Test Example
```typescript
// tests/api/auth/login.test.ts
import { createApp } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'

describe('Login API', () => {
  it('returns success for valid credentials', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })
    
    const response = await createApp(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.user).toBeDefined()
  })
})
```

## 🔍 Code Review Checklist

### Pre-Commit Checklist

#### Functionality
- [ ] Feature works as specified
- [ ] Edge cases handled
- [ ] Error states implemented
- [ ] Loading states shown
- [ ] Form validation works

#### Code Quality
- [ ] Code is readable and maintainable
- [ ] Functions are small and focused
- [ ] No duplicate code
- [ ] Proper error handling
- [ ] Consistent naming conventions

#### Performance
- [ ] No unnecessary re-renders
- [ ] Efficient data fetching
- [ ] Optimized images and assets
- [ ] No memory leaks
- [ ] Bundle size impact considered

#### Security
- [ ] Input validation implemented
- [ ] No sensitive data exposed
- [ ] Proper authentication checks
- [ ] SQL injection prevention
- [ ] XSS prevention

#### Testing
- [ ] Unit tests added
- [ ] Integration tests updated
- [ ] Test coverage > 80%
- [ ] Tests cover edge cases
- [ ] Manual testing completed

### Review Process

#### 1. Self-Review (15 phút)
```bash
# Review own changes
git diff main...HEAD

# Check for issues
npm run lint
npm run type-check
npm run test:coverage

# Build to ensure no errors
npm run build
```

#### 2. Peer Review (30-60 phút)
- Review code functionality
- Check for potential bugs
- Suggest improvements
- Verify test coverage
- Check documentation

#### 3. Final Review (15 phút)
- Address all comments
- Run final tests
- Update documentation
- Prepare for merge

## 🚀 Deployment Workflow

### 1. Pre-Deployment Checklist

#### Environment Setup
```bash
# Verify environment variables
cat .env.production

# Test production build locally
npm run build
npm start

# Run production tests
npm run test:e2e -- --env=production
```

#### Performance Checks
```bash
# Analyze bundle size
npm run bundle:analyze

# Check Core Web Vitals
npm run lighthouse

# Performance profiling
npm run dev:profile
```

#### Security Checks
```bash
# Security audit
npm audit

# Check for vulnerabilities
npm run security:check

# Validate environment variables
npm run env:validate
```

### 2. Deployment Process

#### Automated Deployment (CI/CD)

**GitHub Actions Example:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

#### Manual Deployment
```bash
# Tag release
git tag v1.0.0
git push origin v1.0.0

# Deploy to Vercel
vercel --prod

# Deploy to other platforms
npm run deploy:staging
npm run deploy:production
```

### 3. Post-Deployment

#### Verification
```bash
# Check deployment status
curl https://yourapp.com/api/health

# Run smoke tests
npm run test:smoke

# Monitor logs
npm run logs:production
```

#### Monitoring
- Check error rates
- Monitor performance metrics
- Verify user analytics
- Watch for unusual activity

## 📋 Code Quality Standards

### 1. TypeScript Standards

#### Type Safety
```typescript
// ✅ Good - Explicit types
interface User {
  id: string
  name: string
  email: string
}

function createUser(user: User): User {
  return { ...user }
}

// ❌ Bad - Using 'any'
function createUser(user: any): any {
  return user
}
```

#### Generics
```typescript
// ✅ Good - Proper generics
interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

function fetchUser<T>(id: string): Promise<ApiResponse<T>> {
  // Implementation
}
```

### 2. React Standards

#### Component Structure
```typescript
// ✅ Good - Clean component structure
interface UserCardProps {
  user: User
  onEdit?: (user: User) => void
  className?: string
}

export function UserCard({ user, onEdit, className }: UserCardProps) {
  return (
    <div className={className}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {onEdit && (
        <Button onClick={() => onEdit(user)}>Edit</Button>
      )}
    </div>
  )
}
```

#### Hooks Usage
```typescript
// ✅ Good - Custom hook
function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchUser(id)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [id])
  
  return { user, loading, error }
}
```

### 3. CSS/Styling Standards

#### Tailwind CSS
```typescript
// ✅ Good - Consistent spacing and colors
<div className="flex flex-col space-y-4 p-6 bg-card rounded-lg shadow-sm">
  <h2 className="text-xl font-semibold text-card-foreground">
    Title
  </h2>
</div>

// ❌ Bad - Inconsistent styling
<div className="flex flex-col gap-4 p-6 bg-white rounded shadow">
  <h2 className="text-xl font-bold text-gray-900">
    Title
  </h2>
</div>
```

## 🛠️ Development Tools Setup

### 1. VS Code Extensions

**Essential Extensions:**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "yzhang.markdown-all-in-one"
  ]
}
```

**VS Code Settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### 2. Git Hooks

#### Husky Setup
```bash
# Install Husky
npm install --save-dev husky

# Initialize Husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run pre-commit"

# Add pre-push hook
npx husky add .husky/pre-push "npm run test"
```

#### Pre-commit Script
```bash
#!/bin/sh
# .husky/pre-commit

# Run linting
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed. Please fix linting errors."
  exit 1
fi

# Run type checking
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Type checking failed. Please fix TypeScript errors."
  exit 1
fi

echo "✅ Pre-commit checks passed!"
```

### 3. Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    
    "quality": {
      "lint": "next lint",
      "lint:fix": "next lint --fix",
      "type-check": "tsc --noEmit",
      "format": "prettier --write .",
      "format:check": "prettier --check ."
    },
    
    "test": {
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage",
      "test:e2e": "playwright test",
      "test:smoke": "playwright test --grep 'smoke'"
    },
    
    "db": {
      "db:generate": "supabase gen types typescript --local > src/lib/database.types.ts",
      "db:push": "supabase db push",
      "db:reset": "supabase db reset"
    },
    
    "deploy": {
      "deploy:staging": "vercel --env staging",
      "deploy:production": "vercel --prod"
    }
  }
}
```

## 📊 Performance Monitoring

### 1. Development Performance

#### Bundle Analysis
```bash
# Analyze bundle size
npm run bundle:analyze

# Check for large dependencies
npm ls --depth=0

# Find unused exports
npx ts-unused-exports tsconfig.json
```

#### Performance Profiling
```typescript
// Performance monitoring hook
function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      console.log(`${componentName} render time: ${endTime - startTime}ms`)
    }
  })
}
```

### 2. Production Monitoring

#### Core Web Vitals
```typescript
// app/layout.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  analytics.track('web-vital', metric)
}

export function reportWebVitals() {
  getCLS(sendToAnalytics)
  getFID(sendToAnalytics)
  getFCP(sendToAnalytics)
  getLCP(sendToAnalytics)
  getTTFB(sendToAnalytics)
}
```

#### Error Tracking
```typescript
// Error boundary with tracking
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Send error to monitoring service
    errorReporting.captureException(error, {
      extra: errorInfo,
      tags: {
        component: this.constructor.name
      }
    })
  }
}
```

## 🔄 Continuous Improvement

### 1. Weekly Review

#### Team Standup Template
```markdown
## Weekly Development Review

### 📊 Metrics
- Features completed: X
- Bugs fixed: Y
- Test coverage: Z%
- Performance score: P

### ✅ Accomplishments
- Feature X completed
- Critical bug Y fixed
- Test coverage improved by 10%

### 🚧 Blockers
- Issue with API integration
- Waiting for design review
- Database migration needed

### 📋 Next Week Goals
- Complete feature Z
- Improve test coverage to 90%
- Optimize bundle size by 15%
```

### 2. Retrospective

#### What Went Well
- Code review process improved
- New testing tools helped catch bugs early
- CI/CD pipeline worked smoothly

#### What Could Be Improved
- Need better documentation for onboarding
- Test coverage could be higher
- Performance testing needs more attention

#### Action Items
- Create onboarding guide
- Set up automated performance testing
- Improve test coverage requirements

---

## 📚 Resources & References

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Best Practices
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Git Best Practices](https://github.com/arslanbilal/git-tutorial#best-practices)

### Tools
- [GitHub Actions](https://github.com/features/actions)
- [Vercel Platform](https://vercel.com/docs)
- [Playwright Testing](https://playwright.dev/)
- [Jest Testing Framework](https://jestjs.io/)

---

Quy trình phát triển này giúp team làm việc hiệu quả và duy trì chất lượng code cao. Tùy chỉnh theo nhu cầu cụ thể của team bạn! 🚀