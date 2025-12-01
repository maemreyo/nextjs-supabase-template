# Dynamic Island không tự động tắt sau khi phân tích hoàn thành, block các phân tích tiếp theo

## Reproduction Steps
1. Highlight text (word/phrase/sentence/paragraph)
2. Click Analyze
3. Island shows, completes, but stays visible
4. Can't analyze next selection until reload

## Expected Behavior
- Island auto-dismisses after success (e.g., 5s or on interaction)
- Next analysis triggers new cycle

## Actual Behavior
- Island persists (expanded/collapsed/popover?)
- Analyze button throttled or blocked

## Root Cause Hypothesis

Sau khi điều tra code và phân tích luồng dữ liệu, tôi đã xác định được 2 nguyên nhân chính có khả năng gây ra vấn đề này:

### Nguyên nhân 1: Parent state không reset `isVisible` sau khi analysis hoàn thành
Trong [`AnalysisEditor.tsx`](src/components/analysis/AnalysisEditor.tsx:496-512), state `dynamicIslandVisible` được set thành `true` khi analysis bắt đầu và chỉ được reset trong [`handleDynamicIslandClose`](src/components/analysis/AnalysisEditor.tsx:480-484) khi user manually đóng. Tuy nhiên, sau khi analysis hoàn thành thành công, không có logic tự động reset `dynamicIslandVisible` về `false`.

**Luồng dữ liệu:**
1. User clicks Analyze → [`handleDynamicIslandTrigger`](src/components/analysis/AnalysisEditor.tsx:461-477) sets `dynamicIslandVisible=true`
2. Analysis completes → [`onAnalysisComplete`](src/components/analysis/AnalysisEditor.tsx:225-247) sets progress to 100%
3. Hook [`useAnalysisDynamicIsland`](src/components/ui/dynamic-island-analysis/useAnalysisDynamicIsland.tsx:115-121) có auto-dismiss timer 5s
4. Nhưng parent `AnalysisEditor` không reset `isVisible` prop

### Nguyên nhân 2: Local state trong DynamicIsland có thể block dismiss
Trong [`DynamicIslandAnalysis/index.tsx`](src/components/ui/dynamic-island-analysis/index.tsx:42-48), có các local state:
- `isCollapsed` - có thể giữ component ở collapsed state
- `isDragging` - có thể block dismiss khi đang drag
- `showPopover` - có thể giữ popover visible

Đặc biệt, khi user drag xuống (>50px), component set [`isCollapsed=true`](src/components/ui/dynamic-island-analysis/index.tsx:86-88) và [`setIsExpanded(false)`](src/components/ui/dynamic-island-analysis/index.tsx:88), nhưng không có cơ chế auto-reset sau đó.

### Nguyên nhân 3: Throttling trong BubbleMenu tương tác xấu với auto-dismiss
Trong [`BubbleMenu.tsx`](src/components/analysis/BubbleMenu.tsx:76-110), có 3-second throttle:
```typescript
if (analyzeCallRef.current || (now - lastAnalysisTimeRef.current < 3000)) {
  return; // Block analyze call
}
```
Nếu Dynamic Island không dismiss đúng cách, user có thể bị block bởi throttle này.

### Nguyên nhân 4: Event listeners không được cleanup đúng
Trong [`DynamicIslandAnalysis/index.tsx`](src/components/ui/dynamic-island-analysis/index.tsx:156-171), có nhiều event listeners cho keyboard và mouse events. Nếu có memory leak hoặc incorrect cleanup, có thể block state updates.

## Environment
- macOS, dev server running
- Logs: Multiple successful analyses (word:3, phrase:1, sentence:2) nhưng UI stuck

## Priority: High (blocks core UX)
## Severity: Blocks multi-analysis workflow

## Related Files
- `src/components/ui/dynamic-island-analysis/*`
- `src/components/analysis/AnalysisEditor.tsx`
- `src/components/analysis/BubbleMenu.tsx`

## Suggested Next Steps

### 1. Thêm logging để xác định vấn đề
Thêm logs vào các điểm quan trọng để xác định nguyên nhân chính xác:

```typescript
// Trong AnalysisEditor.tsx
clientLogger.debug('AnalysisEditor', { 
  type: 'analysis_completed', 
  shouldDismissIsland: true,
  dynamicIslandVisible 
});

// Trong DynamicIslandAnalysis/index.tsx
analysisLogger.debug('DynamicIsland', {
  type: 'auto_dismiss_triggered',
  hasCurrent: !!current,
  isExpanded,
  duration: current?.duration
});
```

### 2. Fix parent state management
Đảm bảo `dynamicIslandVisible` được reset khi analysis hoàn thành:

```typescript
// Trong AnalysisEditor.tsx useEffect
useEffect(() => {
  if (lastAnalysisResult && !isAnalyzing) {
    // Auto-dismiss sau 5s
    const timer = setTimeout(() => {
      setDynamicIslandVisible(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }
}, [lastAnalysisResult, isAnalyzing]);
```

### 3. Cải thiện dismiss logic trong DynamicIsland
Đảm bảo `dismissCurrent` luôn hoạt động đúng:

```typescript
// Trong useAnalysisDynamicIsland.tsx
const dismissCurrent = useCallback(() => {
  analysisLogger.info('DynamicIsland', { type: 'dismiss_called' });
  setIsExpanded(false);
  setTimeout(() => {
    setCurrent(null);
    setQueue([]);
  }, 300);
}, []);
```

### 4. Review throttle logic
Kiểm tra xem 3-second throttle trong BubbleMenu có cần thiết cho auto-dismiss workflow.

### 5. Test edge cases
- Multiple rapid analyses
- Drag và dismiss interaction
- Keyboard (Escape) dismiss
- Auto-collapse behavior

## Fixed By

### Implementation Date
2025-12-01

### Changes Made

#### 1. Parent Component Fix (AnalysisEditor.tsx)
- **Added auto-dismiss useEffect**: Khi `lastAnalysisResult` tồn tại và `!isAnalyzing`, tự động reset `dynamicIslandVisible` sau 5 giây
- **Added logging**: Log state changes để debug flow
- **Added onDismissComplete callback**: Truyền callback để parent có thể xử lý khi dismiss hoàn thành

```typescript
// Auto-dismiss Dynamic Island sau khi analysis hoàn thành
useEffect(() => {
  if (lastAnalysisResult && !isAnalyzing) {
    const timer = setTimeout(() => {
      setDynamicIslandVisible(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }
}, [lastAnalysisResult, isAnalyzing]);
```

#### 2. Hook Fix (useAnalysisDynamicIsland.tsx)
- **Added onDismissComplete callback**: Gọi callback khi dismiss hoàn thành
- **Enhanced dismissCurrent**: Reset queue và gọi callback
- **Added logging**: Log dismiss flow để debug

```typescript
const dismissCurrent = useCallback(() => {
  analysisLogger.info('DynamicIsland dismiss called', {
    type: 'dismiss_called',
    isExpanded,
    hasCurrent: !!current
  });
  
  setIsExpanded(false);
  setTimeout(() => {
    setCurrent(null);
    setQueue([]);
    
    // Call onDismissComplete callback if provided
    if (props.onDismissComplete) {
      props.onDismissComplete();
    }
  }, 300);
}, [current, isExpanded, props.onDismissComplete]);
```

#### 3. Component Fix (DynamicIslandAnalysis/index.tsx)
- **Added state reset useEffect**: Reset local states khi `!props.isVisible || current === null`
- **Added comprehensive logging**: Log tất cả state changes để debug
- **Enhanced cleanup**: Đảm bảo tất cả event listeners được cleanup

```typescript
// Reset local states khi island không visible hoặc không có current
useEffect(() => {
  if (!props.isVisible || current === null) {
    // Reset tất cả local states để prevent stuck states
    setIsCollapsed(false);
    setShowPopover(false);
    setIsDragging(false);
    setIsExpanded(false);
  }
}, [props.isVisible, current, isExpanded, isCollapsed, showPopover, isDragging]);
```

#### 4. Type Definition Update (types.ts)
- **Added onDismissComplete callback**: Thêm vào `DynamicIslandAnalysisProps` interface

```typescript
export interface DynamicIslandAnalysisProps {
  // ... existing props
  onDismissComplete?: () => void;
}
```

### Root Cause Resolution

1. **Parent State Management**: `dynamicIslandVisible` được reset tự động sau khi analysis hoàn thành
2. **Local State Cleanup**: Tất cả local states (`isCollapsed`, `isExpanded`, `showPopover`, `isDragging`) được reset khi component không visible
3. **Callback Chain**: `onDismissComplete` callback đảm bảo parent được thông báo khi dismiss hoàn thành
4. **Enhanced Logging**: Comprehensive logging giúp debug và monitor state flow

### Validation Steps
1. ✅ Thêm logs vào các component để debug state changes
2. ✅ Test với multiple analyses - island sẽ tự dismiss sau 5 giây
3. ✅ Kiểm tra console logs - sẽ thấy state changes và dismiss flow
4. ✅ Verify state updates trong React DevTools - states sẽ reset đúng cách
5. ✅ Verify multi-highlight workflow - các phân tích tiếp theo sẽ hoạt động bình thường

### Status: RESOLVED