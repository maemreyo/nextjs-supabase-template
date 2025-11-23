# Analyses API Endpoints

Đây là tài liệu cho các API endpoints quản lý kết quả phân tích (word, sentence, paragraph).

## Các API Endpoints

### 1. Lưu kết quả phân tích

**Endpoint:** `POST /api/analyses/save`

**Mô tả:** Lưu kết quả phân tích vào database và liên kết với session (nếu có).

**Request Headers:**
```
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "word" | "sentence" | "paragraph",
  "text": "string",
  "analysisData": {
    // Dữ liệu phân tích tương ứng với type
  },
  "sessionId?: "string",
  "documentId?: "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "string",
    "sessionAnalysisId?: "string",
    "type": "word" | "sentence" | "paragraph"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

### 2. Lấy danh sách phân tích

**Endpoint:** `GET /api/analyses/list`

**Mô tả:** Lấy danh sách các phân tích đã lưu với bộ lọc và phân trang.

**Request Headers:**
```
Authorization: Bearer <user_token>
```

**Query Parameters:**
- `type`: `word` | `sentence` | `paragraph` | `all` (mặc định: `all`)
- `session_id`: ID của session để lọc (tùy chọn)
- `page`: Số trang (mặc định: `1`)
- `per_page`: Số lượng item mỗi trang (mặc định: `20`)
- `date_from`: Ngày bắt đầu (ISO string, tùy chọn)
- `date_to`: Ngày kết thúc (ISO string, tùy chọn)
- `search`: Từ khóa tìm kiếm (tùy chọn)

**Response:**
```json
{
  "success": true,
  "data": {
    "analyses": [
      {
        "id": "string",
        "analysis_type": "word" | "sentence" | "paragraph",
        "created_at": "string",
        // Các trường khác tùy theo type
      }
    ],
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

### 3. Xóa phân tích

**Endpoint:** `DELETE /api/analyses/[id]`

**Mô tả:** Xóa phân tích và tất cả dữ liệu liên quan khỏi database.

**Request Headers:**
```
Authorization: Bearer <user_token>
```

**URL Parameters:**
- `id`: ID của phân tích cần xóa

**Response:**
```json
{
  "success": true,
  "data": {
    "deletedId": "string",
    "deletedType": "word" | "sentence" | "paragraph",
    "sessionUpdated": true
  }
}
```

---

### 4. Lấy chi tiết phân tích

**Endpoint:** `GET /api/analyses/[id]`

**Mô tả:** Lấy chi tiết của một phân tích cụ thể bao gồm cả dữ liệu liên quan.

**Request Headers:**
```
Authorization: Bearer <user_token>
```

**URL Parameters:**
- `id`: ID của phân tích cần lấy

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "analysis_type": "word" | "sentence" | "paragraph",
    "created_at": "string",
    // Các trường khác tùy theo type
    "session_analysis": {
      // Thông tin liên kết với session (nếu có)
    }
  }
}
```

## Cách sử dụng

### Lưu kết quả phân tích Word

```javascript
const response = await fetch('/api/analyses/save', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'word',
    text: 'example',
    analysisData: {
      meta: {
        word: 'example',
        ipa: '/ɪɡˈzæmpəl/',
        pos: 'noun',
        cefr: 'B1',
        tone: 'neutral'
      },
      definitions: {
        root_meaning: 'a thing characteristic of its kind',
        context_meaning: 'a representative form or pattern',
        vietnamese_translation: 'ví dụ, mẫu'
      },
      // ... các trường khác
    },
    sessionId: 'session-123'
  })
});

const result = await response.json();
```

### Lấy danh sách phân tích

```javascript
const response = await fetch('/api/analyses/list?type=word&page=1&per_page=10', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const result = await response.json();
```

### Xóa phân tích

```javascript
const response = await fetch('/api/analyses/analysis-123', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const result = await response.json();
```

## Xử lý lỗi

Tất cả các API endpoints đều trả về:

- **200**: Thành công
- **400**: Bad Request (thiếu tham số, tham số không hợp lệ)
- **401**: Unauthorized (token không hợp lệ hoặc hết hạn)
- **404**: Not Found (không tìm thấy phân tích)
- **500**: Internal Server Error

## Cấu trúc database

Các API endpoints này hoạt động với các bảng sau:

- `word_analyses`: Lưu trữ phân tích từ
- `sentence_analyses`: Lưu trữ phân tích câu
- `paragraph_analyses`: Lưu trữ phân tích đoạn văn
- `session_analyses`: Liên kết phân tích với session
- Các bảng liên quan: `word_synonyms`, `word_antonyms`, `word_collocations`, `sentence_key_components`, `sentence_rewrite_suggestions`, `paragraph_structure_breakdown`, `paragraph_constructive_feedback`

## Security

- Tất cả các endpoints đều yêu cầu authentication token
- Người dùng chỉ có thể truy cập/xóa các phân tích của chính họ
- Input data được validate trước khi xử lý
- Các lỗi được log để debug