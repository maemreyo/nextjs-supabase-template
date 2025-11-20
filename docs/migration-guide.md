# Hướng Dẫn Migration

Hướng dẫn chi tiết về việc migrate từ existing projects sang Next.js Supabase Template.

## 🎯 Mục Tiêu Migration

Hướng dẫn này giúp bạn:
- **Migrate từ Next.js cũ** sang App Router
- **Chuyển từ authentication system khác** sang Supabase
- **Upgrade database schema** sang Supabase
- **Port existing features** sang template structure
- **Preserve data và user accounts**

## 📋 Yêu Cầu Trước Khi Migration

### 1. Backup Existing Data

```bash
# Backup database
mysqldump -u username -p database_name > backup_$(date +%Y%m%d).sql

# Backup user data
pg_dump -U username -h localhost database_name > backup_$(date +%Y%m%d).sql

# Backup files và assets
tar -czf assets_backup_$(date +%Y%m%d).tar.gz public/ uploads/

# Backup configuration
cp .env .env.backup
cp package.json package.json.backup
```

### 2. Environment Assessment

```bash
# Kiểm tra current Node.js version
node --version

# Kiểm tra Next.js version
npm list next

# Kiểm tra dependencies
npm ls --depth=0

# Kiểm tra database type
# MySQL, PostgreSQL, MongoDB, etc.
```

### 3. Feature Inventory

```markdown
## Migration Checklist

### Authentication System
- [ ] Current auth provider (Auth0, Firebase, Custom, etc.)
- [ ] User data structure
- [ ] Session management
- [ ] Password hashing method
- [ ] Social providers (Google, GitHub, etc.)

### Database Schema
- [ ] Tables list và structure
- [ ] Relationships và foreign keys
- [ ] Indexes và constraints
- [ ] Stored procedures/functions
- [ ] Triggers và events

### Application Features
- [ ] Core features list
- [ ] API endpoints
- [ ] File uploads/storage
- [ ] Email notifications
- [ ] Background jobs
- [ ] Third-party integrations

### Frontend Components
- [ ] UI component library
- [ ] Styling approach (CSS, SCSS, Tailwind, etc.)
- [ ] State management (Redux, Context, etc.)
- [ ] Routing structure
- [ ] Form handling
```

## 🔄 Migration Strategies

### 1. Phased Migration (Khuyến nghị)

```mermaid
graph TD
    A[Phase 1: Setup] --> B[Phase 2: Data Migration]
    B --> C[Phase 3: Feature Migration]
    C --> D[Phase 4: Testing]
    D --> E[Phase 5: Deployment]
    E --> F[Phase 6: Cleanup]
```

#### Phase 1: Environment Setup
- Tạo new project từ template
- Cấu hình development environment
- Setup database connections
- Verify basic functionality

#### Phase 2: Data Migration
- Migrate user accounts
- Transfer database schema
- Import existing data
- Validate data integrity

#### Phase 3: Feature Migration
- Port core functionality
- Implement business logic
- Migrate API endpoints
- Update frontend components

#### Phase 4: Testing & Validation
- Unit testing migrated features
- Integration testing
- User acceptance testing
- Performance testing

#### Phase 5: Deployment
- Staging deployment
- Production deployment
- Monitoring setup
- Rollback plan

#### Phase 6: Cleanup
- Remove old codebase
- Archive old database
- Update documentation
- Team training

### 2. Big Bang Migration

- Migrate tất cả cùng một lúc
- Rủi ro hơn nhưng nhanh hơn
- Phù hợp cho small projects
- Cần careful planning và testing

## 🗄️ Database Migration

### 1. Schema Analysis

```sql
-- Analyze existing database structure
-- MySQL Example
SHOW TABLES;
DESCRIBE users;
DESCRIBE posts;

-- PostgreSQL Example  
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
\d users;
\d posts;

-- Generate schema documentation
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

### 2. Schema Conversion

#### MySQL sang PostgreSQL

```sql
-- MySQL Schema
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- PostgreSQL Equivalent
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### MongoDB sang PostgreSQL

```javascript
// MongoDB Schema
{
  _id: ObjectId,
  email: String,
  profile: {
    firstName: String,
    lastName: String,
    avatar: String
  },
  preferences: {
    theme: String,
    notifications: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}

// PostgreSQL Schema
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  theme TEXT DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Data Migration Scripts

#### MySQL sang PostgreSQL

```python
#!/usr/bin/env python3
# migrate_mysql_to_postgres.py

import mysql.connector
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

# Configuration
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'mysql_user',
    'password': 'mysql_password',
    'database': 'old_database'
}

POSTGRES_CONFIG = {
    'host': 'localhost',
    'user': 'postgres_user',
    'password': 'postgres_password',
    'database': 'new_database'
}

def migrate_users():
    # Connect to MySQL
    mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)
    mysql_cursor = mysql_conn.cursor(dictionary=True)
    
    # Connect to PostgreSQL
    pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
    pg_cursor = pg_conn.cursor(cursor_factory=RealDictCursor)
    
    # Read from MySQL
    mysql_cursor.execute("SELECT * FROM users")
    mysql_users = mysql_cursor.fetchall()
    
    # Transform và insert vào PostgreSQL
    for user in mysql_users:
        # Convert MySQL datetime to PostgreSQL timestamp
        created_at = user['created_at'] if user['created_at'] else datetime.now()
        
        # Hash password nếu cần
        password_hash = hash_password(user['password']) if user['password'] else None
        
        # Insert vào PostgreSQL
        pg_cursor.execute("""
            INSERT INTO users (id, email, password, first_name, last_name, created_at)
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s)
        """, (
            user['email'],
            password_hash,
            user.get('first_name'),
            user.get('last_name'),
            created_at
        ))
    
    pg_conn.commit()
    mysql_cursor.close()
    pg_cursor.close()
    mysql_conn.close()
    pg_conn.close()

if __name__ == "__main__":
    migrate_users()
```

#### MongoDB sang PostgreSQL

```javascript
// migrate_mongodb_to_postgres.js
const { MongoClient } = require('mongodb');
const { Client } = require('pg');

const mongoUrl = 'mongodb://localhost:27017';
const postgresUrl = 'postgresql://user:password@localhost:5432/database';

async function migrateUsers() {
  // Connect to MongoDB
  const mongoClient = new MongoClient(mongoUrl);
  await mongoClient.connect();
  const mongoDb = mongoClient.db('old_database');
  const usersCollection = mongoDb.collection('users');
  
  // Connect to PostgreSQL
  const pgClient = new Client({ connectionString: postgresUrl });
  await pgClient.connect();
  
  // Read from MongoDB
  const users = await usersCollection.find({}).toArray();
  
  // Transform và insert vào PostgreSQL
  for (const user of users) {
    const query = `
      INSERT INTO users (id, email, first_name, last_name, avatar_url, theme, notifications_enabled, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    
    const values = [
      user._id.toString(),
      user.email,
      user.profile?.firstName,
      user.profile?.lastName,
      user.profile?.avatar,
      user.preferences?.theme || 'light',
      user.preferences?.notifications || true,
      user.createdAt || new Date()
    ];
    
    await pgClient.query(query, values);
  }
  
  await pgClient.end();
  await mongoClient.close();
}

migrateUsers().catch(console.error);
```

### 4. Data Validation

```sql
-- Validation queries
-- Check row counts match
SELECT 
  (SELECT COUNT(*) FROM mysql_users) as mysql_count,
  (SELECT COUNT(*) FROM postgres_users) as postgres_count;

-- Check data integrity
SELECT 
  'users' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as null_emails,
  COUNT(CASE WHEN created_at IS NULL THEN 1 END) as null_created_at
FROM users;

-- Check duplicates
SELECT email, COUNT(*) as duplicate_count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```

## 🔐 Authentication Migration

### 1. Password Hash Migration

```typescript
// src/lib/migration/auth-migration.ts
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Old password hashing (example)
function oldHashMethod(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex')
}

// New password hashing (bcrypt)
async function newHashMethod(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Migration function
export async function migratePasswordHash(
  plainPassword: string,
  oldHash: string
): Promise<string> {
  // Verify old hash
  const isOldHashValid = oldHashMethod(plainPassword) === oldHash
  
  if (!isOldHashValid) {
    throw new Error('Invalid password for migration')
  }
  
  // Create new hash
  return await newHashMethod(plainPassword)
}

// Usage in migration script
async function migrateUserPasswords() {
  const { data: users } = await supabase
    .from('users_temp')
    .select('id, email, password_hash')
  
  for (const user of users) {
    try {
      const newHash = await migratePasswordHash(user.password, user.password_hash)
      
      await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', user.id)
        
      console.log(`Migrated password for user: ${user.email}`)
    } catch (error) {
      console.error(`Failed to migrate password for ${user.email}:`, error)
    }
  }
}
```

### 2. Session Migration

```typescript
// src/lib/migration/session-migration.ts
import { createClient } from '@/lib/supabase/server'

// Create Supabase session from old session data
export async function createSupabaseSession(
  userId: string,
  oldSessionData: any
) {
  const supabase = await createClient()
  
  // Extract user data from old session
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (!user) {
    throw new Error('User not found')
  }
  
  // Create auth session
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: oldSessionData.password, // User needs to reset password
    email_confirm: true,
    user_metadata: {
      migrated_from: 'old_system',
      migration_date: new Date().toISOString(),
      old_user_id: oldSessionData.oldUserId,
    }
  })
  
  if (error) {
    console.error('Failed to create Supabase session:', error)
    throw error
  }
  
  return data
}

// Batch migration
export async function migrateAllSessions() {
  const oldSessions = await getOldSessions() // Your function to get old sessions
  
  for (const session of oldSessions) {
    try {
      await createSupabaseSession(session.userId, session)
      console.log(`Migrated session for user: ${session.userId}`)
    } catch (error) {
      console.error(`Failed to migrate session for ${session.userId}:`, error)
    }
  }
}
```

### 3. Social Provider Migration

```typescript
// src/lib/migration/social-auth-migration.ts
import { createClient } from '@/lib/supabase/server'

interface SocialAccount {
  id: string
  userId: string
  provider: 'google' | 'github' | 'facebook'
  providerUserId: string
  accessToken: string
  refreshToken?: string
}

export async function migrateSocialAccounts() {
  const supabase = await createClient()
  const socialAccounts = await getOldSocialAccounts() // Your function
  
  for (const account of socialAccounts) {
    try {
      // Get user info
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', account.userId)
        .single()
      
      // Create identity link
      const { error } = await supabase.auth.admin.linkIdentity({
        userId: user.id,
        provider: account.provider,
        identity: {
          provider_id: account.providerUserId,
          access_token: account.accessToken,
          refresh_token: account.refreshToken,
        }
      })
      
      if (error) {
        console.error(`Failed to link ${account.provider} for ${user.email}:`, error)
      } else {
        console.log(`Migrated ${account.provider} account for ${user.email}`)
      }
    } catch (error) {
      console.error(`Error migrating ${account.provider} account:`, error)
    }
  }
}
```

## 🎨 Frontend Migration

### 1. Component Migration

#### From Class Components sang Functional Components

```typescript
// Old Class Component
import React from 'react'

class OldButton extends React.Component {
  constructor(props) {
    super(props)
    this.state = { isLoading: false }
    this.handleClick = this.handleClick.bind(this)
  }
  
  handleClick() {
    this.setState({ isLoading: true })
    // Handle click logic
  }
  
  render() {
    return (
      <button 
        onClick={this.handleClick}
        disabled={this.state.isLoading}
        className={this.props.className}
      >
        {this.props.children}
      </button>
    )
  }
}

// New Functional Component
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NewButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function NewButton({ children, className, onClick }: NewButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleClick = () => {
    setIsLoading(true)
    onClick?.()
  }
  
  return (
    <Button 
      onClick={handleClick}
      disabled={isLoading}
      className={cn('default-styles', className)}
    >
      {children}
    </Button>
  )
}
```

#### From Redux sang Zustand

```typescript
// Old Redux Setup
// store/index.js
import { createStore, combineReducers } from 'redux'
import { Provider } from 'react-redux'

const userReducer = (state = null, action) => {
  switch (action.type) {
    case 'SET_USER':
      return action.payload
    case 'CLEAR_USER':
      return null
    default:
      return state
  }
}

const store = createStore(combineReducers({
  user: userReducer,
  // other reducers...
}))

// New Zustand Setup
// stores/user-store.ts
import { create } from 'zustand'

interface UserStore {
  user: User | null
  setUser: (user: User | null) => void
  clearUser: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))

// Usage in component
import { useUserStore } from '@/stores/user-store'

function UserProfile() {
  const { user, setUser, clearUser } = useUserStore()
  
  return (
    <div>
      {user ? (
        <div>
          <h1>{user.name}</h1>
          <button onClick={clearUser}>Logout</button>
        </div>
      ) : (
        <div>Please log in</div>
      )}
    </div>
  )
}
```

### 2. Routing Migration

#### From Pages Router sang App Router

```typescript
// Old Pages Router Structure
// pages/users.js
export default function UsersPage({ users }) {
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}

export async function getServerSideProps() {
  const users = await fetchUsers()
  return { props: { users } }
}

// New App Router Structure
// app/users/page.tsx
import { getUsers } from '@/lib/users'

export default async function UsersPage() {
  const users = await getUsers()
  
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 3. Styling Migration

#### From CSS/SCSS sang Tailwind CSS

```css
/* Old CSS */
.button {
  background-color: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  transition: background-color 0.2s;
}

.button:hover {
  background-color: #2563eb;
}

.button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

/* New Tailwind Classes */
/* In component */
<button className="bg-blue-500 text-white py-2 px-4 rounded-md font-medium transition-colors hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
  Button text
</button>
```

#### Component Library Migration

```typescript
// Old Custom Components
// components/Button.js
import React from 'react'
import './Button.css'

export default function Button({ children, variant, size, ...props }) {
  const className = `button button--${variant} button--${size}`
  return (
    <button className={className} {...props}>
      {children}
    </button>
  )
}

// New Shadcn UI Components
// components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
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

## 📡 API Migration

### 1. Route Structure Migration

```typescript
// Old API Routes (Pages Router)
// pages/api/users.js
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const users = await getUsers()
    res.status(200).json(users)
  } else if (req.method === 'POST') {
    const user = await createUser(req.body)
    res.status(201).json(user)
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}

// New API Routes (App Router)
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const users = await getUsers()
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const user = await createUser(body)
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 400 }
    )
  }
}
```

### 2. Middleware Migration

```typescript
// Old Middleware (Pages Router)
// middleware.js
export function middleware(req, res, next) {
  const token = req.cookies.token
  if (!token && req.path.startsWith('/api/protected')) {
    res.redirect(307, '/login')
  } else {
    next()
  }
}

// New Middleware (App Router)
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient(req, res)
  
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  // Protect routes
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*']
}
```

## 🧪 Testing Migration

### 1. Test Migration Strategy

```typescript
// tests/migration/user-migration.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@/lib/supabase/server'

describe('User Migration', () => {
  const supabase = createClient()
  
  beforeEach(async () => {
    // Setup test data
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  })
  
  afterEach(async () => {
    // Cleanup test data
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  })
  
  it('should migrate user data correctly', async () => {
    // Test migration logic
    const oldUserData = {
      email: 'test@example.com',
      name: 'Test User',
      oldPasswordHash: 'md5_hash'
    }
    
    const migratedUser = await migrateUser(oldUserData)
    
    expect(migratedUser.email).toBe(oldUserData.email)
    expect(migratedUser.name).toBe(oldUserData.name)
    expect(migratedUser.passwordHash).not.toBe(oldUserData.oldPasswordHash)
  })
  
  it('should preserve user relationships', async () => {
    // Test relationship migration
    const userId = 'test-user-id'
    await migrateUserWithRelations(userId)
    
    const { data: relations } = await supabase
      .from('user_relations')
      .select('*')
      .eq('user_id', userId)
    
    expect(relations).toHaveLengthGreaterThan(0)
  })
})
```

### 2. Integration Testing

```typescript
// tests/integration/migration-flow.test.ts
import { test, expect } from '@playwright/test'

test.describe('Migration Flow', () => {
  test('user can login with migrated credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Test login with migrated user
    await page.fill('[data-testid=email]', 'migrated@example.com')
    await page.fill('[data-testid=password]', 'new_password')
    await page.click('[data-testid=login-button]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Should show user data
    await expect(page.locator('[data-testid=user-name]')).toContainText('Migrated User')
  })
  
  test('migrated data is accessible', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await loginAsMigratedUser(page)
    
    // Navigate to data pages
    await page.goto('/profile')
    await expect(page.locator('[data-testid=profile-data]')).toBeVisible()
    
    await page.goto('/settings')
    await expect(page.locator('[data-testid=settings-form]')).toBeVisible()
  })
})
```

## 🚀 Deployment Migration

### 1. Staging Deployment

```bash
#!/bin/bash
# scripts/deploy-staging.sh

echo "🚀 Deploying to Staging"

# Build application
npm run build

# Run tests
npm run test

# Deploy to staging
vercel --env staging --confirm

# Run smoke tests
npm run test:smoke --env=staging

echo "✅ Staging deployment complete"
```

### 2. Production Migration

```bash
#!/bin/bash
# scripts/production-migration.sh

echo "🚀 Starting Production Migration"

# Pre-migration checks
npm run health-check
npm run backup-production

# Deploy new version
npm run build
npm run deploy:production

# Post-migration verification
npm run verify-production
npm run smoke-tests:production

echo "✅ Production migration complete"
```

### 3. Rollback Plan

```bash
#!/bin/bash
# scripts/rollback.sh

echo "🔄 Rolling back deployment"

# Get previous version
PREVIOUS_VERSION=$(git describe --tags --abbrev=0 HEAD~1)

# Checkout previous version
git checkout $PREVIOUS_VERSION

# Build and deploy
npm run build
npm run deploy:production

# Verify rollback
npm run verify-production

echo "✅ Rollback complete"
```

## 📊 Monitoring Migration

### 1. Migration Metrics

```typescript
// src/lib/migration/metrics.ts
interface MigrationMetrics {
  totalUsers: number
  migratedUsers: number
  failedMigrations: number
  startTime: Date
  endTime?: Date
  errors: Array<{
    userId: string
    error: string
    timestamp: Date
  }>
}

export class MigrationMonitor {
  private metrics: MigrationMetrics = {
    totalUsers: 0,
    migratedUsers: 0,
    failedMigrations: 0,
    startTime: new Date(),
    errors: []
  }
  
  startMigration(totalUsers: number) {
    this.metrics.totalUsers = totalUsers
    this.metrics.startTime = new Date()
    console.log(`Starting migration for ${totalUsers} users`)
  }
  
  recordSuccess(userId: string) {
    this.metrics.migratedUsers++
    console.log(`Successfully migrated user ${userId}`)
    this.logProgress()
  }
  
  recordFailure(userId: string, error: string) {
    this.metrics.failedMigrations++
    this.metrics.errors.push({
      userId,
      error,
      timestamp: new Date()
    })
    console.error(`Failed to migrate user ${userId}: ${error}`)
    this.logProgress()
  }
  
  private logProgress() {
    const progress = (this.metrics.migratedUsers / this.metrics.totalUsers) * 100
    console.log(`Migration progress: ${progress.toFixed(2)}% (${this.metrics.migratedUsers}/${this.metrics.totalUsers})`)
  }
  
  generateReport(): MigrationMetrics {
    this.metrics.endTime = new Date()
    return { ...this.metrics }
  }
}
```

### 2. Health Checks

```typescript
// src/lib/migration/health-check.ts
export async function runHealthChecks() {
  const checks = [
    await checkDatabaseConnection(),
    await checkUserAuthentication(),
    await checkDataIntegrity(),
    await checkAPIEndpoints(),
    await checkFrontendFunctionality()
  ]
  
  const results = {
    total: checks.length,
    passed: checks.filter(check => check.passed).length,
    failed: checks.filter(check => !check.passed).length,
    details: checks
  }
  
  return results
}

async function checkDatabaseConnection() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('users').select('count').single()
    
    return {
      name: 'Database Connection',
      passed: !error,
      details: error ? error.message : 'Connected successfully'
    }
  } catch (error) {
    return {
      name: 'Database Connection',
      passed: false,
      details: error.message
    }
  }
}
```

## 📋 Migration Checklist

### Pre-Migration Checklist

```markdown
## Environment Preparation
- [ ] Backup current database
- [ ] Backup application files
- [ ] Document current system architecture
- [ ] Create migration branch in Git
- [ ] Setup staging environment
- [ ] Prepare rollback plan

## Data Analysis
- [ ] Document database schema
- [ ] Identify data relationships
- [ ] Analyze data volume
- [ ] Plan data transformation
- [ ] Estimate migration time

## Testing Preparation
- [ ] Write migration tests
- [ ] Setup test data
- [ ] Prepare performance benchmarks
- [ ] Configure monitoring
- [ ] Setup error tracking
```

### Post-Migration Checklist

```markdown
## Verification
- [ ] All data migrated successfully
- [ ] User accounts working
- [ ] Authentication functioning
- [ ] API endpoints responding
- [ ] Frontend features working
- [ ] Performance acceptable

## Cleanup
- [ ] Remove temporary migration scripts
- [ ] Archive old codebase
- [ ] Update documentation
- [ ] Train team on new system
- [ ] Decommission old infrastructure

## Monitoring
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] User feedback collection
- [ ] Regular health checks
- [ ] Automated alerts setup
```

## 🆘 Emergency Procedures

### Migration Failure Recovery

```bash
#!/bin/bash
# scripts/emergency-recovery.sh

echo "🚨 Emergency Migration Recovery"

# 1. Stop new application
pm2 stop new-app

# 2. Restore old application
git checkout main
npm install
npm run build
pm2 start old-app

# 3. Restore database if needed
if [ "$1" = "database" ]; then
  psql -h localhost -U postgres -d old_database < backup_latest.sql
fi

# 4. Notify team
./scripts/notify-team.sh "Migration failed, rolled back to previous version"

echo "✅ Emergency recovery complete"
```

---

## 📞 Support và Resources

### Migration Assistance

Nếu bạn gặp khó khăn trong quá trình migration:

1. **Review this guide** carefully
2. **Check existing issues** trong repository
3. **Create detailed issue** với:
   - Current system information
   - Migration steps attempted
   - Error messages encountered
   - Expected vs actual behavior

### Professional Services

Cho các projects lớn hoặc phức tạp:
- **Consulting services** cho migration planning
- **Technical support** cho critical issues
- **Training sessions** cho team migration

### Documentation References

- [Next.js Migration Guide](https://nextjs.org/docs/migrating-from-create-next-app)
- [Supabase Migration Guide](https://supabase.com/docs/guides/migrating)
- [Database Migration Best Practices](https://www.postgresql.org/docs/current/migration.html)

---

Migration là quá trình phức tạp nhưng cần thiết. Hãy follow checklist và test kỹ lưỡng trước khi deploy production! 🚀

Chúc bạn migration thành công! 🎉