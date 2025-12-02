# 🔧 Hướng Dẫn Tích Hợp ClaudeKit vào Kilo Code

## 📋 Tổng Quan

Hướng dẫn này giúp bạn chuyển đổi các **Claude Skills, Commands, Agents và Modes** từ ClaudeKit sang Kilo Code để tận dụng tối đa khả năng của cả hai công cụ.

## 🎯 Mapping Giữa ClaudeKit và Kilo Code

### 1. **ClaudeKit Commands** → **Kilo Code Custom Modes**

| ClaudeKit Command | Kilo Code Tương Ứng |
|-------------------|---------------------|
| `/feature` | Custom Mode: Feature Developer |
| `/fix` | Built-in Debug Mode (hoặc tùy chỉnh) |
| `/review` | Custom Mode: Code Reviewer |
| `/test` | Custom Mode: Test Engineer |
| `/tdd` | Custom Mode: TDD Specialist |
| `/doc` | Custom Mode: Documentation Writer |
| `/refactor` | Custom Mode: Refactor Expert |
| `/security-scan` | Custom Mode: Security Auditor |
| `/plan` | Built-in Architect Mode (hoặc tùy chỉnh) |

### 2. **ClaudeKit Agents** → **Kilo Code Custom Modes**

ClaudeKit có 20 agents chuyên biệt. Bạn có thể chuyển đổi chúng thành Custom Modes trong Kilo Code:

- **Planner** → Architect Mode (custom)
- **Debugger** → Debug Mode (custom)
- **Tester** → Test Engineer Mode
- **Code Reviewer** → Code Review Mode
- **Git Manager** → Git Assistant Mode
- **Docs Manager** → Documentation Mode
- **Security Auditor** → Security Mode

### 3. **ClaudeKit Skills** → **Kilo Code Custom Rules & Instructions**

ClaudeKit có 30+ skills được chia thành:
- **Frameworks** (FastAPI, Next.js, React)
- **Languages** (Python, TypeScript, JavaScript)
- **Methodology** (TDD, debugging, planning)
- **Optimization** (token efficiency)

Trong Kilo Code, bạn sẽ chuyển đổi chúng thành **Custom Rules** và **Custom Instructions**.

### 4. **ClaudeKit Modes** → **Kilo Code Behavioral Modes**

| ClaudeKit Mode | Kilo Code Tương Ứng |
|----------------|---------------------|
| `default` | Code Mode (default) |
| `brainstorm` | Ask Mode + Custom Instructions |
| `token-efficient` | Custom Mode với format concise |
| `deep-research` | Ask Mode + Research Instructions |
| `implementation` | Code Mode (focused) |
| `review` | Custom Review Mode |
| `orchestration` | Orchestrator Mode |

---

## 🚀 Triển Khai Từng Bước

### **Bước 1: Chuẩn Bị Cấu Trúc Thư Mục**

Trong dự án của bạn, tạo cấu trúc sau:

```
your-project/
├── .kilocode/
│   ├── custom_modes.yaml          # Custom modes (global hoặc project)
│   ├── rules/                      # Custom rules
│   │   ├── frameworks.md
│   │   ├── methodology.md
│   │   ├── optimization.md
│   │   └── security.md
│   └── system-prompt.md           # (Optional) Custom system prompt
```

### **Bước 2: Tạo Custom Modes**

#### 2.1. Tạo Mode Qua UI

1. Mở Kilo Code trong VS Code
2. Click vào biểu tượng **Prompts** (💬) ở thanh menu
3. Click nút **➕** bên cạnh "Modes"
4. Điền thông tin mode mới

#### 2.2. Tạo Mode Qua File YAML

Tạo file `.kilocode/custom_modes.yaml`:

```yaml
customModes:
  # Feature Developer Mode (tương đương /feature)
  - slug: feature-dev
    name: 🚀 Feature Developer
    description: Full-stack feature development with planning and testing
    roleDefinition: |
      You are an expert full-stack developer specializing in feature development.
      You follow these principles:
      - Break down features into small, manageable tasks (2-5 minutes each)
      - Write tests before implementation (TDD approach)
      - Request code review between tasks
      - Provide implementation plans before coding
      - Focus on clean, maintainable code
    whenToUse: |
      Use this mode when developing new features from scratch.
      Ideal for: API endpoints, UI components, database schemas, integrations.
    groups:
      - read
      - edit
      - command
      - browser
    customInstructions: |
      ## Workflow
      1. Create detailed implementation plan
      2. Write failing tests first
      3. Implement feature in small increments
      4. Run tests and verify
      5. Request code review
      6. Document changes
      
      ## Tech Stack Preferences
      - Backend: FastAPI, Django
      - Frontend: Next.js, React
      - Database: PostgreSQL, MongoDB
      - Testing: pytest, vitest

  # Code Reviewer Mode (tương đương /review)
  - slug: code-reviewer
    name: 👀 Code Reviewer
    description: Security-focused code review with OWASP best practices
    roleDefinition: |
      You are a senior code reviewer with expertise in security, performance, and best practices.
      Focus on: security vulnerabilities, performance issues, code smells, maintainability.
    whenToUse: |
      Use for code review, security audits, and quality assurance checks.
    groups:
      - read
    customInstructions: |
      ## Review Checklist
      - ✅ Security: Check for OWASP Top 10 vulnerabilities
      - ✅ Performance: Identify bottlenecks and optimization opportunities
      - ✅ Testing: Verify test coverage and quality
      - ✅ Documentation: Check inline comments and API docs
      - ✅ Best Practices: Follow framework/language conventions
      
      ## Output Format
      Provide feedback in this structure:
      1. **Critical Issues** (must fix)
      2. **Warnings** (should fix)
      3. **Suggestions** (nice to have)
      4. **Praise** (what's done well)

  # TDD Specialist Mode (tương đương /tdd)
  - slug: tdd-specialist
    name: 🧪 TDD Specialist
    description: Test-Driven Development with strict red-green-refactor cycle
    roleDefinition: |
      You are a TDD expert who strictly follows the red-green-refactor cycle.
      Never write production code without a failing test first.
    whenToUse: |
      Use when developing features using TDD methodology.
    groups:
      - read
      - edit
      - command
    customInstructions: |
      ## TDD Strict Rules
      1. **Red**: Write a failing test first
      2. **Green**: Write minimal code to make it pass
      3. **Refactor**: Improve code while keeping tests green
      
      ## Test Guidelines
      - Use descriptive test names
      - Follow AAA pattern (Arrange, Act, Assert)
      - Test edge cases and error conditions
      - Maintain 90%+ code coverage
      - Use mocking for external dependencies

  # Documentation Writer Mode (tương đương /doc)
  - slug: docs-writer
    name: 📝 Documentation Writer
    description: Technical documentation specialist
    roleDefinition: |
      You are a technical writer specializing in clear, comprehensive documentation.
      Focus on: API docs, README files, inline comments, user guides.
    whenToUse: |
      Use for creating or updating project documentation.
    groups:
      - read
      - edit
    fileRegex: '\.(md|mdx|txt)$'
    customInstructions: |
      ## Documentation Standards
      - Use clear, concise language
      - Include code examples
      - Add diagrams where helpful (Mermaid)
      - Follow project's documentation style guide
      - Include installation, usage, and troubleshooting sections

  # Security Auditor Mode (tương đương /security-scan)
  - slug: security-auditor
    name: 🔒 Security Auditor
    description: Security vulnerability scanning and remediation
    roleDefinition: |
      You are a security expert specializing in identifying and fixing vulnerabilities.
      Follow OWASP guidelines and security best practices.
    whenToUse: |
      Use for security audits, vulnerability scanning, and security-focused code reviews.
    groups:
      - read
      - edit
    customInstructions: |
      ## Security Focus Areas
      - SQL Injection & NoSQL Injection
      - XSS (Cross-Site Scripting)
      - CSRF (Cross-Site Request Forgery)
      - Authentication & Authorization flaws
      - Sensitive data exposure
      - Insecure dependencies
      - Security misconfiguration
      
      ## Remediation Steps
      1. Identify vulnerability with severity (Critical/High/Medium/Low)
      2. Explain the risk and potential impact
      3. Provide secure code example
      4. Suggest testing approach to verify fix

  # Git Assistant Mode (tương đương /commit, /pr, /ship)
  - slug: git-assistant
    name: 🔧 Git Assistant
    description: Smart Git operations and conventional commits
    roleDefinition: |
      You are a Git expert helping with commits, PRs, and Git workflows.
      Follow conventional commits specification.
    whenToUse: |
      Use for creating commits, pull requests, and managing Git workflows.
    groups:
      - read
      - command
    customInstructions: |
      ## Conventional Commit Format
      <type>(<scope>): <subject>
      
      <body>
      
      <footer>
      
      ## Types
      - feat: New feature
      - fix: Bug fix
      - docs: Documentation changes
      - style: Code style changes (formatting)
      - refactor: Code refactoring
      - test: Adding/updating tests
      - chore: Maintenance tasks
      
      ## Best Practices
      - Keep subject line under 50 characters
      - Use imperative mood ("Add feature" not "Added feature")
      - Explain "what" and "why" in body, not "how"
      - Reference issues/tickets in footer

  # Orchestrator Mode - Quản lý nhiều task song song
  - slug: orchestrator
    name: 🎭 Orchestrator
    description: Multi-task coordination and parallel execution
    roleDefinition: |
      You are a project orchestrator managing multiple parallel tasks and coordinating between different modes/agents.
    whenToUse: |
      Use when you need to coordinate multiple tasks simultaneously or manage complex workflows.
    groups:
      - read
      - edit
      - command
      - browser
    customInstructions: |
      ## Orchestration Workflow
      1. Break down complex project into parallel tasks
      2. Assign appropriate mode to each task
      3. Coordinate execution and dependencies
      4. Aggregate results and ensure consistency
      5. Provide comprehensive summary
      
      ## Task Delegation
      - Planning tasks → Architect mode
      - Coding tasks → Code mode
      - Testing tasks → TDD Specialist
      - Review tasks → Code Reviewer
      - Documentation → Docs Writer
```

### **Bước 3: Tạo Custom Rules (Skills)**

Tạo các file rules trong `.kilocode/rules/`:

#### 3.1. Framework Skills → `frameworks.md`

```markdown
# Framework Best Practices

## FastAPI
- Use dependency injection for database sessions
- Implement proper error handling with HTTPException
- Use Pydantic models for request/response validation
- Follow RESTful API conventions
- Add OpenAPI documentation

## Next.js
- Use App Router (not Pages Router) for new projects
- Implement proper data fetching with Server Components
- Use Server Actions for mutations
- Optimize images with next/image
- Implement proper SEO with metadata API

## React
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo() for performance optimization
- Follow component composition patterns
- Use TypeScript for type safety
```

#### 3.2. Methodology Skills → `methodology.md`

```markdown
# Development Methodology

## Test-Driven Development (TDD)
- **STRICT RULE**: No production code without failing test first
- Follow Red-Green-Refactor cycle religiously
- Write tests that describe behavior, not implementation
- Maintain 90%+ code coverage

## Verification Before Completion
- Never claim task completion without evidence
- Run tests and show results
- Demonstrate feature works as expected
- Check for edge cases and error conditions

## Systematic Debugging
1. Reproduce the error consistently
2. Isolate the problematic code
3. Form hypothesis about root cause
4. Test hypothesis with targeted changes
5. Verify fix with tests

## Bite-Sized Tasks
- Break work into 2-5 minute increments
- Each increment should be:
  - Self-contained
  - Testable
  - Reviewable
  - Include exact code (no placeholders)

## Code Review Gates
- Request code review between every task
- Address all feedback before proceeding
- Use review as quality checkpoint
- Learn from feedback for future tasks
```

#### 3.3. Optimization Skills → `optimization.md`

```markdown
# Code Optimization Guidelines

## Performance
- Use database indexes appropriately
- Implement caching where beneficial
- Optimize N+1 queries
- Use pagination for large datasets
- Profile before optimizing

## Token Efficiency
- Write concise, clear code
- Avoid unnecessary verbosity
- Use descriptive but short variable names
- Remove commented-out code
- Minimize repetition

## Code Quality
- Follow DRY principle
- Use appropriate design patterns
- Keep functions small and focused
- Maintain clear separation of concerns
- Write self-documenting code
```

#### 3.4. Security Rules → `security.md`

```markdown
# Security Guidelines

## Restricted Files
Files in this list contain sensitive data and MUST NOT be read or modified:
- .env
- .env.local
- secrets.yaml
- credentials.json
- private_keys/*

## Security Checklist
- ✅ Validate all user inputs
- ✅ Use parameterized queries (prevent SQL injection)
- ✅ Implement proper authentication & authorization
- ✅ Use HTTPS for all external communications
- ✅ Hash passwords with bcrypt/argon2
- ✅ Implement rate limiting
- ✅ Use CSRF tokens for state-changing operations
- ✅ Sanitize output to prevent XSS
- ✅ Keep dependencies updated
- ✅ Don't log sensitive information

## OWASP Top 10 Compliance
Always check for and prevent:
1. Injection attacks
2. Broken authentication
3. Sensitive data exposure
4. XML external entities (XXE)
5. Broken access control
6. Security misconfiguration
7. XSS attacks
8. Insecure deserialization
9. Using components with known vulnerabilities
10. Insufficient logging & monitoring
```

### **Bước 4: Tích Hợp MCP Servers (Optional)**

ClaudeKit hỗ trợ MCP servers như Context7, Sequential Thinking, Puppeteer. Kilo Code cũng hỗ trợ MCP!

Tạo file `.kilocode/settings.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

### **Bước 5: Sử Dụng Custom Modes**

#### Trong Chat Interface:
1. Mở Kilo Code panel
2. Click vào dropdown chọn mode
3. Chọn custom mode bạn vừa tạo
4. Bắt đầu chat với mode đó

#### Chuyển Đổi Mode Nhanh:
- Kilo Code sẽ tự động suggest mode phù hợp
- Bạn có thể chủ động switch mode bất cứ lúc nào

#### Ví Dụ Workflow:

```
1. Dùng "🏗️ Architect" để plan feature
2. Switch sang "🚀 Feature Developer" để implement
3. Switch sang "🧪 TDD Specialist" để viết tests
4. Switch sang "👀 Code Reviewer" để review code
5. Switch sang "🔧 Git Assistant" để commit & PR
```

---

## 🎨 Tùy Chỉnh Nâng Cao

### Custom Instructions Cho Từng Mode

Mỗi mode có thể có custom instructions riêng. Ví dụ, trong mode "Feature Developer", bạn có thể thêm:

```yaml
customInstructions: |
  ## Project-Specific Rules
  - Always use TypeScript strict mode
  - Follow Airbnb style guide
  - Use Tailwind CSS for styling
  - Implement i18n for all user-facing text
  - Add Storybook stories for UI components
```

### Global Custom Instructions

Tạo instructions áp dụng cho TẤT CẢ modes:

1. Mở VS Code Settings (Cmd/Ctrl + ,)
2. Search "Kilo Code Custom Instructions"
3. Thêm instructions chung

Hoặc edit file settings:

```json
{
  "kilocode.customInstructions": "Always write clean, maintainable code. Use TypeScript. Follow SOLID principles."
}
```

### Mode-Specific Rules

Tạo rules chỉ áp dụng cho mode cụ thể:

```
.kilocode/
├── rules-feature-dev/
│   ├── planning.md
│   └── implementation.md
├── rules-code-reviewer/
│   └── review-checklist.md
```

---

## 🔄 Migration Checklist

- [ ] Cài đặt Kilo Code extension
- [ ] Tạo cấu trúc thư mục `.kilocode/`
- [ ] Tạo custom modes YAML file
- [ ] Tạo custom rules files
- [ ] (Optional) Cấu hình MCP servers
- [ ] Test từng mode để đảm bảo hoạt động đúng
- [ ] Share với team qua Git

---

## 💡 Tips & Best Practices

### 1. **Start Small**
Không cần chuyển đổi tất cả 27 commands và 30+ skills cùng lúc. Bắt đầu với những mode bạn dùng nhiều nhất.

### 2. **Iterate & Improve**
Custom modes không cần perfect ngay từ đầu. Sử dụng, thu thập feedback, và cải thiện dần.

### 3. **Share với Team**
Commit `.kilocode/` vào Git để team có thể dùng chung modes và rules.

### 4. **Kết Hợp Với Sticky Models**
Kilo Code tự động nhớ model bạn dùng cho từng mode. Ví dụ:
- Feature Developer → Claude Sonnet 4.5 (coding)
- Code Reviewer → GPT-4o (analysis)
- TDD Specialist → Claude Opus 4 (complex reasoning)

### 5. **Export & Import Modes**
Kilo Code cho phép export modes thành YAML file để:
- Backup
- Share với team
- Tạo templates cho project types khác nhau

---

## 📚 Tài Nguyên Tham Khảo

- **ClaudeKit GitHub**: https://github.com/maemreyo/claudekit
- **Kilo Code Docs**: https://kilo.ai/docs/
- **Custom Modes Guide**: https://kilo.ai/docs/features/custom-modes
- **Custom Rules Guide**: https://kilo.ai/docs/advanced-usage/custom-rules
- **MCP Documentation**: https://modelcontextprotocol.io/

---

## 🆘 Troubleshooting

### Modes không hiện trong dropdown?
- Kiểm tra syntax YAML file
- Reload VS Code window (Cmd/Ctrl + Shift + P → "Reload Window")

### Rules không được apply?
- Đảm bảo files nằm trong `.kilocode/rules/`
- Toggle rules on/off trong UI để force reload

### MCP servers không kết nối?
- Kiểm tra MCP server đã được cài đặt
- Xem logs trong Kilo Code panel

---

## 🎉 Kết Luận

Với hướng dẫn này, bạn đã có thể:
✅ Chuyển đổi ClaudeKit commands thành Kilo Code modes
✅ Tích hợp ClaudeKit skills thành custom rules
✅ Tạo workflow hiệu quả với multi-mode system
✅ Tùy chỉnh Kilo Code theo phong cách ClaudeKit

Happy coding! 🚀