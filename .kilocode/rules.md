# Quy tắc Kilo Code cho dự án LNEDT

## Quy tắc chính

**Khi thực hiện bất kỳ tác vụ nào, phải nghiên cứu thư mục docs/ trước tiên**

Đây là quy tắc bắt buộc và quan trọng nhất khi làm việc với dự án này. Mọi thay đổi, bổ sung, hoặc sửa lỗi đều đòi hỏi việc tìm hiểu kỹ lưỡng tài liệu đã có.

## Hướng dẫn chi tiết về cách nghiên cứu docs/

### Các file quan trọng cần đọc trước khi bắt đầu

Trước khi thực hiện bất kỳ tác vụ nào, bắt buộc phải đọc các file sau:

1. **docs/architecture.md** - Hiểu rõ kiến trúc tổng thể của dự án
2. **docs/development-workflow.md** - Nắm vững quy trình phát triển
3. **docs/getting-started.md** - Các bước thiết lập và cấu hình ban đầu
4. **docs/quick-reference.md** - Tham khảo nhanh các API và patterns quan trọng

### Các file docs/ khác cần tham khảo dựa trên loại tác vụ

- **Tác vụ liên quan đến AI:**
  - docs/ai-module-guide.md
  - docs/ai-setup-guide.md
  - docs/tanstack-query-guide.md

- **Tác vụ liên quan đến migration/thay đổi cấu trúc:**
  - docs/migration-guide.md
  - docs/template-replication-guide.md

- **Tác vụ liên quan đến troubleshooting:**
  - docs/troubleshooting.md

- **Tác vụ liên quan đến state management:**
  - docs/zustand-usage.md

- **Tác vụ liên quan đến scripts:**
  - docs/scripts-guide.md

## Quy trình kiểm tra docs/ trước khi implement

### Bước 1: Xác định loại tác vụ
Xác định rõ loại tác vụ đang thực hiện:
- Feature mới
- Bug fix
- Refactoring
- Performance improvement
- Documentation update

### Bước 2: Đọc các file docs/ liên quan
Dựa vào loại tác vụ, đọc tất cả các file tài liệu liên quan được liệt kê ở trên.

### Bước 3: Kiểm tra các patterns và best practices đã được định nghĩa
Tìm hiểu và nắm rõ:
- Các patterns đã được định nghĩa trong dự án
- Quy trình coding standards
- Cách tổ chức file và thư mục
- Các utilities và helpers đã có

### Bước 4: Áp dụng kiến thức từ docs/ vào giải pháp
Sử dụng kiến thức đã thu thập để:
- Thiết kế giải pháp phù hợp với kiến trúc hiện tại
- Sử dụng lại các components và utilities đã có
- Tuân thủ các patterns và best practices
- Đảm bảo tính nhất quán với codebase hiện tại

## Các quy tắc bổ sung dựa trên phân tích dự án

### Tuân thủ quy tắc phát triển đã có trong dự án
- Sử dụng TypeScript cho tất cả các file mới
- Tuân thủ ESLint configuration đã được định nghĩa
- Sử dụng các components từ thư mục src/components/ui/
- Áp dụng Tailwind CSS cho styling

### Sử dụng các patterns và components đã được định nghĩa
- State management: Sử dụng Zustand (tham khảo docs/zustand-usage.md)
- Data fetching: Sử dụng TanStack Query (tham khảo docs/tanstack-query-guide.md)
- Authentication: Sử dụng Supabase Auth
- Database: Sử dụng Supabase với các migrations đã định nghĩa

### Tuân thủ quy trình testing và code quality
- Chạy các scripts trong thư mục scripts/ khi cần thiết
- Sử dụng scripts/lint-fix.sh để fix các vấn đề linting
- Sử dụng scripts/test-coverage.sh để kiểm tra coverage
- Sử dụng scripts/bundle-analyze.sh để phân tích bundle size

## Lưu ý quan trọng

1. **Không bao giờ bỏ qua bước nghiên cứu docs/** - Đây là nguyên nhân chính gây ra các vấn đề về kiến trúc và tính nhất quán
2. **Luôn kiểm tra xem feature tương tự đã tồn tại chưa** trước khi implement mới
3. **Khi gặp vấn đề, tham khảo docs/troubleshooting.md** trước khi tìm giải pháp ngoài dự án
4. **Giữ cho tài liệu được cập nhật** - Khi thêm feature mới hoặc thay đổi quy trình, cập nhật các file docs liên quan

## Hậu quả của việc không tuân thủ

Việc không tuân thủ quy tắc này có thể dẫn đến:
- Code không nhất quán với kiến trúc dự án
- Trùng lặp functionality đã có
- Vi phạm các patterns đã được định nghĩa
- Tăng technical debt
- Khó maintain trong tương lai

Hãy luôn nhớ: **"Docs first, code second"** - Tài liệu là kim chỉ nam cho mọi development trong dự án này.