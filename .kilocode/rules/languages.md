# Language Guidelines

## General Principles

### Code Readability
- Write self-documenting code with clear naming conventions
- Use consistent indentation and formatting
- Keep lines under 80-120 characters when possible
- Add comments for complex business logic, not obvious code
- Use meaningful variable and function names that describe purpose

### Error Handling
- Implement consistent error handling patterns across the application
- Use appropriate error types and custom error classes
- Provide meaningful error messages for debugging
- Log errors with sufficient context for troubleshooting
- Handle errors gracefully without exposing sensitive information

### Performance Considerations
- Choose appropriate data structures for the use case
- Optimize algorithms for time and space complexity
- Avoid unnecessary computations and redundant operations
- Implement lazy evaluation where beneficial
- Profile code to identify performance bottlenecks

## TypeScript/JavaScript

### Type Safety
- Use strict TypeScript configuration
- Define interfaces for all complex data structures
- Avoid using `any` type - prefer `unknown` or specific types
- Use generic types for reusable components
- Implement proper type guards for runtime type checking

### Modern JavaScript Features
- Use ES6+ features appropriately (arrow functions, destructuring, etc.)
- Implement async/await for asynchronous operations
- Use modules instead of global variables
- Leverage built-in collection methods (map, filter, reduce)
- Implement proper error boundaries in React applications

### Code Organization
- Group related functionality into modules
- Use consistent import/export patterns
- Implement proper separation of concerns
- Follow single responsibility principle
- Use dependency injection for better testability

## Python

### Pythonic Code
- Follow PEP 8 style guidelines
- Use list comprehensions and generators appropriately
- Leverage Python's built-in functions and libraries
- Implement context managers for resource management
- Use decorators for cross-cutting concerns

### Type Hints
- Add type hints for all function parameters and return values
- Use Union types for variables that can hold multiple types
- Implement Optional types for nullable parameters
- Use Protocol classes for duck typing
- Run mypy for static type checking

### Error Handling
- Use specific exception types instead of generic Exception
- Implement proper exception hierarchy
- Use context managers for resource cleanup
- Log exceptions with traceback information
- Implement retry mechanisms for transient failures

## SQL

### Query Optimization
- Use appropriate indexes for frequent queries
- Avoid SELECT * in production code
- Implement proper JOIN strategies
- Use EXISTS instead of IN when appropriate
- Optimize WHERE clauses with sargable predicates

### Database Design
- Follow proper normalization principles
- Use appropriate data types for columns
- Implement proper foreign key relationships
- Add constraints for data integrity
- Use consistent naming conventions

### Security
- Use parameterized queries to prevent SQL injection
- Implement proper access controls
- Validate input data before database operations
- Use principle of least privilege for database users
- Audit and log database operations

## CSS/SCSS

### Organization
- Use modular CSS architecture (BEM, SMACSS, etc.)
- Implement consistent naming conventions
- Group related styles together
- Use CSS variables for theming
- Implement responsive design with mobile-first approach

### Performance
- Minimize CSS bundle size
- Use efficient selectors
- Implement CSS containment for isolation
- Optimize for critical rendering path
- Use will-change property appropriately

### Maintainability
- Use CSS-in-JS solutions when appropriate
- Implement proper component styling patterns
- Avoid !important except when necessary
- Use CSS Grid and Flexbox for layouts
- Implement proper hover and focus states

## Shell Scripting

### Best Practices
- Use set -e to exit on errors
- Quote variables to prevent word splitting
- Use functions for reusable code
- Implement proper error handling
- Use absolute paths when possible

### Portability
- Write POSIX-compliant scripts when possible
- Avoid bash-specific features in portable scripts
- Test scripts on different shells
- Use shebang lines appropriately
- Document shell requirements

### Security
- Avoid evaluating user input
- Use absolute paths to prevent path hijacking
- Implement proper permission checks
- Sanitize input data
- Use secure temporary file creation

## Go

### Idiomatic Go
- Follow effective Go guidelines
- Use interfaces for abstraction
- Implement proper error handling with explicit returns
- Use goroutines and channels appropriately
- Leverage Go's standard library

### Concurrency
- Use channels for communication between goroutines
- Implement proper synchronization primitives
- Avoid shared memory when possible
- Use context for cancellation and timeouts
- Implement race condition detection in tests

### Performance
- Profile Go programs with pprof
- Use appropriate data structures
- Implement connection pooling
- Optimize memory allocation
- Use build tags for platform-specific code

## Rust

### Memory Safety
- Leverage Rust's ownership system
- Use borrowing instead of copying when possible
- Implement proper error handling with Result and Option
- Use lifetimes appropriately
- Avoid unsafe code unless absolutely necessary

### Performance
- Use zero-cost abstractions
- Implement efficient algorithms
- Optimize memory layout
- Use appropriate collections
- Profile with built-in tools

### Code Organization
- Use modules for code organization
- Implement traits for shared behavior
- Use cargo for dependency management
- Follow Rust naming conventions
- Write comprehensive tests

## General Language-Agnostic Guidelines

### Testing
- Write comprehensive unit tests
- Implement integration tests for critical paths
- Use test-driven development when appropriate
- Mock external dependencies
- Maintain high test coverage

### Documentation
- Document public APIs thoroughly
- Include code examples in documentation
- Document architectural decisions
- Keep documentation up to date
- Use consistent documentation style

### Version Control
- Write meaningful commit messages
- Use feature branches for development
- Implement proper code review process
- Tag releases appropriately
- Maintain clean commit history

### Security
- Validate all input data
- Implement proper authentication and authorization
- Use secure communication protocols
- Keep dependencies updated
- Follow security best practices for each language

### Performance
- Profile code to identify bottlenecks
- Choose appropriate algorithms and data structures
- Implement caching strategies when beneficial
- Optimize for the target platform
- Monitor performance in production

### Maintainability
- Follow consistent coding standards
- Implement proper error handling
- Use meaningful names for variables and functions
- Keep functions small and focused
- Refactor code regularly