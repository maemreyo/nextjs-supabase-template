# AI Semantic Analysis Editor - Documentation

## Tổng quan

Đây là tài liệu kỹ thuật chi tiết cho dự án AI Semantic Analysis Editor. Tài liệu được tổ chức theo từng module để dễ dàng truy cập và bảo trì.

## Cấu trúc thư mục

```
docs/spec/
├── README.md                    # Tổng quan và chỉ dẫn
├── vision.md                    # Vision và goals
├── phases/                      # Các giai đoạn triển khai
│   ├── 01-setup.md             # Phase 1: Setup & Core Editor
│   ├── 02-ai-analysis.md       # Phase 2: AI Semantic Analysis System
│   ├── 03-realtime-engine.md   # Phase 3: Real-time Analysis Engine
│   ├── 04-ui-ux.md             # Phase 4: UI/UX - Analysis Display
│   ├── 05-database.md          # Phase 5: Database & Persistence
│   └── 06-optimization.md      # Phase 6: Optimization & Production
├── architecture/                # Tài liệu kiến trúc
│   ├── tech-stack.md           # Tech Stack Summary
│   ├── project-structure.md    # Project Structure
│   └── ai-providers.md         # AI Provider Comparison
├── implementation/              # Chi tiết triển khai
│   ├── database-schema.md      # Database Schema
│   ├── api-routes.md           # API Routes
│   ├── state-management.md     # State Management
│   └── components.md           # UI Components
├── prompts/                     # Định nghĩa prompt
│   ├── word-analysis.md        # Prompt phân tích từ
│   ├── sentence-analysis.md    # Prompt phân tích câu
│   └── paragraph-analysis.md   # Prompt phân tích đoạn
├── deployment/                 # Triển khai
│   ├── cost-estimation.md      # Cost Estimation
│   ├── environment.md          # Environment Variables
│   └── deployment-guide.md     # Deployment Guide
├── planning/                    # Lập trình
│   ├── timeline.md             # Development Timeline
│   ├── next-steps.md           # Next Steps
│   └── advanced-features.md    # Advanced Features
└── resources/                   # Tài nguyên
    ├── documentation.md        # Documentation Links
    ├── examples.md             # Code Examples
    └── notes.md                # Important Notes
```

## Hướng dẫn sử dụng

### Đối với Developers
- Bắt đầu với [`vision.md`](vision.md) để hiểu rõ mục tiêu dự án
- Xem [`phases/`](phases/) để theo dõi tiến độ triển khai theo từng giai đoạn
- Tham khảo [`architecture/`](architecture/) để hiểu cấu trúc hệ thống
- Xem [`implementation/`](implementation/) cho chi tiết kỹ thuật

### Đối với Project Managers
- [`planning/timeline.md`](planning/timeline.md) để theo dõi tiến độ
- [`deployment/cost-estimation.md`](deployment/cost-estimation.md) để ước tính chi phí
- [`planning/next-steps.md`](planning/next-steps.md) để lên kế hoạch tiếp theo

### Đối với QA/Testers
- [`implementation/components.md`](implementation/components.md) để hiểu các component cần test
- [`implementation/api-routes.md`](implementation/api-routes.md) để test API endpoints

## Lịch sử thay đổi

- **2025-01-21**: Tạo cấu trúc tài liệu mới, tách từ file main-app.md
- **2025-01-20**: File main-app.md ban đầu với toàn bộ nội dung

## Liên hệ

Nếu có câu hỏi về tài liệu, vui lòng liên hệ team development.