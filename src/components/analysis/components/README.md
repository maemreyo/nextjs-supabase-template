# AnalysisItemCard Dialog System Integration

Component `AnalysisItemCard` đã được cập nhật để tích hợp với dialog system mới, cung cấp các tính năng mở rộng cho việc quản lý và tương tác với các analysis item.

## 🚀 Tính năng mới

### Dialog System Integration
- **Feature Flag**: `enableDialogSystem` để bật/tắt dialog system
- **Action Handlers**: Các handler mới cho view, edit, export, vocabulary, practice
- **Backward Compatibility**: Hoạt động với existing props khi dialog system bị tắt
- **Accessibility**: ARIA labels và keyboard navigation
- **Error Handling**: Loading và error states với proper UI feedback

## 📋 Props Interface

```typescript
interface AnalysisItemCardProps extends AnalysisItemProps {
  // Dialog system integration props
  enableDialogSystem?: boolean; // Feature flag (default: true)
  onViewDetails?: (analysis: AnalysisItem) => void;
  onEdit?: (analysis: AnalysisItem) => void;
  onExport?: (analysis: AnalysisItem, format?: ExportFormat) => void;
  onAddToVocabulary?: (analysis: AnalysisItem) => void;
  onPractice?: (analysis: AnalysisItem) => void;
  
  // Dialog options
  dialogOptions?: {
    size?: 'default' | 'large' | 'xlarge' | 'xxlarge' | 'fullscreen';
    enableFullscreen?: boolean;
    enableResize?: boolean;
  };
  
  // Loading và error states
  loading?: boolean;
  error?: string | null;
  
  // Accessibility
  ariaLabels?: {
    viewDetails?: string;
    edit?: string;
    export?: string;
    addToVocabulary?: string;
    practice?: string;
    remove?: string;
  };
}
```

## 🔧 Cách sử dụng

### Basic Usage với Dialog System

```tsx
import { AnalysisItemCard } from './components/AnalysisItemCard';

function MyComponent({ analysis }: { analysis: AnalysisItem }) {
  return (
    <AnalysisItemCard
      analysis={analysis}
      enableDialogSystem={true}
      onViewDetails={(analysis) => {
        // Mở view details dialog
        console.log('View details:', analysis);
      }}
      onEdit={(analysis) => {
        // Mở edit dialog
        console.log('Edit:', analysis);
      }}
      onExport={(analysis, format) => {
        // Mở export dialog với format cụ thể
        console.log('Export:', analysis, format);
      }}
      onAddToVocabulary={(analysis) => {
        // Thêm vào vocabulary
        console.log('Add to vocabulary:', analysis);
      }}
      onPractice={(analysis) => {
        // Mở practice dialog
        console.log('Practice:', analysis);
      }}
      dialogOptions={{
        size: 'large',
        enableFullscreen: true,
      }}
      ariaLabels={{
        viewDetails: 'Xem chi tiết phân tích',
        edit: 'Chỉnh sửa phân tích',
        export: 'Xuất phân tích',
        addToVocabulary: 'Thêm vào từ vựng',
        practice: 'Luyện tập với phân tích này',
        remove: 'Xóa phân tích',
      }}
    />
  );
}
```

### Backward Compatibility

```tsx
// Component vẫn hoạt động với props cũ khi dialog system bị tắt
<AnalysisItemCard
  analysis={analysis}
  enableDialogSystem={false}
  onClick={(analysis) => {
    // Legacy behavior
    console.log('Legacy click:', analysis);
  }}
  onAnalyze={(analysis) => {
    console.log('Legacy analyze:', analysis);
  }}
  onRemove={(analysisId, analysisType) => {
    console.log('Legacy remove:', analysisId, analysisType);
  }}
/>
```

### Với Loading và Error States

```tsx
<AnalysisItemCard
  analysis={analysis}
  loading={isLoading}
  error={errorMessage}
  enableDialogSystem={true}
  onViewDetails={handleViewDetails}
/>
```

## 🎯 Action Handlers

### View Details
- Mở dialog xem chi tiết với mode 'view'
- Tự động chọn size phù hợp dựa trên analysis type
- Support fullscreen và resize options

### Edit
- Mở dialog chỉnh sửa với mode 'edit'
- Fallback về `onAnalyze` khi dialog system bị tắt

### Export
- Mở dialog export với format tùy chọn (PDF, JSON, CSV, TXT, HTML)
- Fallback về download JSON khi dialog system bị tắt

### Add to Vocabulary
- Thêm item vào vocabulary system
- Emit custom event `analysis:add-to-vocabulary`
- Fallback về console.log khi dialog system bị tắt

### Practice
- Mở practice dialog hoặc redirect đến practice page
- Emit custom event `analysis:practice`
- Fallback về `onAnalyze` khi dialog system bị tắt

## 🎨 UI/UX Features

### Loading States
- Loading overlay với spinner và message
- Disabled interactions khi loading
- Opacity reduction để indicate loading state

### Error States
- Error display với dismiss button
- Border highlighting cho error states
- Clear error functionality

### Accessibility
- ARIA labels cho tất cả action buttons
- Keyboard navigation support
- Screen reader compatibility
- Focus management

### Responsive Design
- Mobile-friendly dropdown menu
- Touch-friendly button sizes
- Proper spacing cho different screen sizes

## 🔧 Dialog Dispatcher

Dialog dispatcher cung cấp các method:

```typescript
import { useDialogDispatcher } from '../dialogs/utils/dialog-dispatcher';

const {
  openViewDetails,
  openEditDialog,
  openExportDialog,
  addToVocabulary,
  openPracticeDialog,
  isDialogSystemEnabled,
} = useDialogDispatcher();
```

### Features
- Type-safe mapping analysis type → dialog component
- Error handling với fallback behavior
- Feature flag checking
- Event emission cho custom integrations
- Recommended dialog size calculation

## 📱 Mobile Considerations

- Dropdown menu được tối ưu cho mobile
- Touch-friendly hit targets (44px minimum)
- Proper spacing để avoid accidental taps
- Swipe gestures support cho practice mode

## 🧪 Testing

Example component có sẵn tại `./examples/AnalysisItemCardWithDialogExample.tsx` với các scenarios:
- Dialog system enabled
- Backward compatibility
- Mixed usage
- Loading và error states

## 🔄 Migration Guide

### Từ Legacy Props
```tsx
// Old way
<AnalysisItemCard
  analysis={analysis}
  onClick={handleClick}
  onAnalyze={handleAnalyze}
  onRemove={handleRemove}
/>
```

### Đến Dialog System Props
```tsx
// New way
<AnalysisItemCard
  analysis={analysis}
  enableDialogSystem={true}
  onViewDetails={handleViewDetails}
  onEdit={handleEdit}
  onExport={handleExport}
  onAddToVocabulary={handleAddToVocabulary}
  onPractice={handlePractice}
/>
```

### Gradual Migration
1. Enable dialog system với feature flag
2. Add new handlers alongside legacy ones
3. Test từng handler riêng biệt
4. Remove legacy props khi đã migration xong

## 🐛 Troubleshooting

### Dialog không mở
- Kiểm tra `enableDialogSystem` có được set đúng không
- Kiểm tra console logs cho error messages
- Verify dialog store state

### Performance Issues
- Sử dụng `useCallback` cho custom handlers
- Enable dialog system chỉ khi cần thiết
- Monitor memory usage với nhiều dialogs

### TypeScript Errors
- Kiểm tra import paths cho dialog components
- Verify type definitions cho `AnalysisItemCardProps`
- Check `strict` mode trong tsconfig.json

## 📚 Dependencies

Component này phụ thuộc vào:
- Dialog system components (`../dialogs/*`)
- Dialog dispatcher (`../dialogs/utils/dialog-dispatcher`)
- Dialog types (`../dialogs/types/dialog-types`)
- Base UI components (`@/components/ui/*`)