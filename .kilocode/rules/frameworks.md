# Framework Best Practices

## React/Next.js

### Component Architecture
- Sử dụng functional components với hooks thay vì class components
- Áp dụng component composition pattern thay vì inheritance
- Giữ components nhỏ và tập trung vào một responsibility duy nhất
- Sử dụng memoization (React.memo, useMemo, useCallback) cho performance optimization khi cần thiết

### State Management
- Ưu tiên local state cho component-specific data
- Sử dụng Zustand cho global state management theo project convention
- Tránh prop drilling bằng cách sử dụng context hoặc state management library
- Sử dụng useReducer cho complex state logic trong components

### Performance Optimization
- Implement code splitting với dynamic imports
- Sử dụng Next.js Image component cho optimization
- Lazy load components và routes khi appropriate
- Optimize bundle size với tree shaking

### TypeScript Integration
- Sử dụng strict TypeScript configuration
- Định nghĩa proper interfaces cho props và state
- Tránh sử dụng `any` type
- Sử dụng generic types cho reusable components

## Supabase

### Database Design
- Sử dụng proper foreign key relationships
- Implement Row Level Security (RLS) cho tất cả tables
- Sử dụng proper indexes cho query optimization
- Follow naming conventions (snake_case cho columns)

### Authentication
- Sử dụng Supabase Auth cho user management
- Implement proper session handling
- Sử dụng JWT tokens cho API authentication
- Handle auth state changes properly

### API Integration
- Sử dụng Supabase client library thay vì direct API calls
- Implement proper error handling
- Sử dụng typed queries với TypeScript
- Cache responses khi appropriate

## Database Patterns

### Query Optimization
- Sử dụng proper indexes cho frequent queries
- Avoid N+1 query problems
- Sử dụng database functions cho complex operations
- Implement proper pagination

### Migration Management
- Sử dụng descriptive migration names
- Review migrations trước khi apply
- Keep migrations reversible
- Document schema changes

### Data Validation
- Implement database constraints
- Sử dụng proper data types
- Validate input tại cả client và server
- Handle null values appropriately

## Testing Framework

### Unit Testing
- Test components với React Testing Library
- Mock external dependencies
- Test business logic riêng biệt
- Maintain high test coverage

### Integration Testing
- Test API endpoints
- Test database interactions
- Test user workflows
- Use realistic test data

### E2E Testing
- Test critical user journeys
- Test cross-browser compatibility
- Test responsive design
- Automate regression testing