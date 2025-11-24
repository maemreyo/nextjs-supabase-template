# Complete API Refactor Plan

## Tổng quan

Dựa trên khảo sát, có **25 API routes** cần refactor để áp dụng pattern authentication mới. Hiện tại mới có **5 APIs** được refactor.

## APIs cần refactor (Grouped by priority)

### Priority 1: Critical APIs (High usage)
1. **`src/app/api/sessions/route.ts`** - 263 lines
   - GET và POST methods với complex authentication
   - Filters, pagination, sorting logic
   - Session creation và listing

2. **`src/app/api/sessions/[id]/load/route.ts`** - 187 lines  
   - Core session loading logic
   - Used bởi `useSessionData` hook

3. **`src/app/api/sessions/[id]/duplicate/route.ts`** - 237 lines
   - Complex duplication logic với analyses, settings, tags
   - High usage feature

### Priority 2: AI APIs (Frequently used)
4. **`src/app/api/ai/analyze-sentence/route.ts`** - 150 lines
   - Duplicate authentication pattern
   - Similar structure với analyze-paragraph

5. **`src/app/api/ai/analyze-word/route.ts`** - 174 lines
   - Complex validation logic
   - Multiple context parameters

6. **`src/app/api/ai/generate-text/route.ts`** - 76 lines
   - Simple nhưng cần consistency
   - Used cho AI text generation

7. **`src/app/api/ai/check-usage/route.ts`** - ?
8. **`src/app/api/ai/generate-embedding/route.ts`** - ?
9. **`src/app/api/ai/models/route.ts`** - ?
10. **`src/app/api/ai/provider-status/route.ts`** - ?

### Priority 3: Session Management APIs
11. **`src/app/api/sessions/[id]/route.ts`** - ?
12. **`src/app/api/sessions/[id]/analyses/route.ts`** - ?
13. **`src/app/api/sessions/[id]/analytics/route.ts`** - ?
14. **`src/app/api/sessions/[id]/export/route.ts`** - ?
15. **`src/app/api/sessions/[id]/rename/route.ts`** - ?
16. **`src/app/api/sessions/[id]/settings/route.ts`** - ?
17. **`src/app/api/sessions/recent/route.ts`** - ?
18. **`src/app/api/sessions/search/route.ts`** - ?

### Priority 4: Analysis APIs
19. **`src/app/api/analyses/list/route.ts`** - ?
20. **`src/app/api/analyses/[id]/route.ts`** - ?

### Priority 5: Vocabulary APIs
21. **`src/app/api/vocabulary/collections/route.ts`** - 143 lines
22. **`src/app/api/vocabulary/collections/[id]/route.ts`** - ?
23. **`src/app/api/vocabulary/collections/[id]/words/route.ts`** - ?
24. **`src/app/api/vocabulary/words/[id]/route.ts`** - ?

## Hooks cần refactor

### Priority 1: Core Session Hooks
1. **`src/hooks/useSessions.ts`** - 513 lines
   - Complex CRUD operations
   - Manual fetch logic duplication

2. **`src/hooks/useSessionData.ts`** - 237 lines
   - Core session data loading
   - Multiple helper functions

3. **`src/hooks/useAnalysisSave.ts`** - ?
4. **`src/hooks/useSavedAnalyses.ts`** - ?
5. **`src/hooks/useSavedAnalysisDetail.ts`** - ?

### Priority 2: AI Hooks
6. **`src/hooks/useParagraphAnalysis.ts`** - ?
7. **`src/hooks/useSentenceAnalysis.ts`** - ?
8. **`src/hooks/useWordAnalysis.ts`** - ?

### Priority 3: Other Hooks
9. **`src/hooks/useAIService.ts`** - ?
10. **`src/hooks/useAIUsageOptimized.ts`** - ?

## Components cần update

### Priority 1: Analysis Components
1. **`src/components/analysis/AnalysisEditor.tsx`** - ?
2. **`src/components/analysis/EditorToolbar.tsx`** - ?
3. **`src/components/analysis/AnalysisActions.ts`** - ?

### Priority 2: Session Components  
4. **`src/components/sessions/SessionManager.tsx`** - ?
5. **`src/components/sessions/SessionDetail.tsx`** - ?

## Refactor Strategy

### Phase 1: Infrastructure Enhancement (1-2 days)
1. **Enhance API Client**:
   - Add missing endpoints đến `api` object
   - Add retry logic cho failed requests
   - Add request/response interceptors
   - Add better error types

2. **Enhance Server Helpers**:
   - Add request validation helpers
   - Add response caching helpers
   - Add logging utilities
   - Add rate limiting support

### Phase 2: Critical APIs (2-3 days)
1. **Sessions APIs**:
   - `sessions/route.ts` → `withAuth()` pattern
   - `sessions/[id]/load/route.ts` → Simplified logic
   - `sessions/[id]/duplicate/route.ts` → Clean implementation

2. **AI APIs**:
   - `ai/analyze-sentence/route.ts` → Consistent pattern
   - `ai/analyze-word/route.ts` → Standardized validation
   - `ai/generate-text/route.ts` → Fixed authentication

### Phase 3: Extended APIs (3-4 days)
1. **Remaining Session APIs**:
   - Analytics, export, rename, settings APIs
   - Recent, search, list APIs

2. **Analysis APIs**:
   - List, detail APIs

3. **Vocabulary APIs**:
   - Collections và words APIs

### Phase 4: Hooks Migration (4-5 days)
1. **Core Hooks**:
   - `useSessions.ts` → `api.sessions.*`
   - `useSessionData.ts` → `api.sessions.get()`

2. **AI Hooks**:
   - Analysis hooks → `api.ai.*`

3. **Utility Hooks**:
   - Service hooks → New patterns

### Phase 5: Component Updates (5-6 days)
1. **Analysis Components**:
   - Update để sử dụng new hooks
   - Remove old fetch patterns

2. **Session Components**:
   - Update CRUD operations
   - Simplify state management

### Phase 6: Testing & Documentation (6-7 days)
1. **Testing**:
   - Unit tests cho API client
   - Integration tests cho refactored APIs
   - E2E tests cho critical flows

2. **Documentation**:
   - API usage examples
   - Migration guide
   - Best practices documentation

## Expected Benefits

### Code Metrics
- **Total lines reduced**: 2,000+ lines (estimated 25-35% reduction)
- **Authentication duplication**: 100% eliminated
- **Error handling**: Centralized across all APIs

### Development Experience
- **Faster development**: No more boilerplate
- **Better IntelliSense**: Complete type coverage
- **Easier debugging**: Centralized logging

### Code Quality
- **Consistency**: 100% standardized patterns
- **Maintainability**: Single source of truth
- **Scalability**: Easy to extend

## Implementation Checklist

### For Each API Route:
- [ ] Replace manual authentication với `withAuth()`
- [ ] Replace `NextResponse.json()` với response helpers
- [ ] Remove debug logs (if not needed)
- [ ] Standardize error handling
- [ ] Add proper TypeScript types
- [ ] Test the refactored endpoint

### For Each Hook:
- [ ] Replace manual fetch với `api.*` calls
- [ ] Remove header creation logic
- [ ] Simplify error handling
- [ ] Update TypeScript types
- [ ] Test the refactored hook

### For Each Component:
- [ ] Update để sử dụng new hooks
- [ ] Remove old patterns
- [ ] Test component functionality
- [ ] Update TypeScript types

## Risk Mitigation

### Breaking Changes:
- **Response format changes**: Ensure backward compatibility
- **Import changes**: Update all imports gradually
- **Type changes**: Maintain existing interfaces

### Testing Strategy:
- **Parallel development**: Keep old versions during refactor
- **Gradual rollout**: Refactor endpoint by endpoint
- **Rollback plan**: Keep original code as backup

## Success Metrics

### Quantitative:
- **Code reduction**: Target 25%+ reduction per file
- **API consistency**: 100% standardized authentication
- **Type coverage**: 100% TypeScript coverage
- **Test coverage**: 90%+ coverage for refactored code

### Qualitative:
- **Developer satisfaction**: Easier và faster development
- **Code maintainability**: Single source of truth
- **Bug reduction**: Centralized, tested logic
- **Onboarding speed**: New developers pick up faster

## Timeline

| Week | Tasks | Deliverables |
|-------|--------|-------------|
| Week 1 | Phase 1-2: Infrastructure + Critical APIs | Enhanced API client, 3 critical APIs refactored |
| Week 2 | Phase 3: Extended APIs | All remaining APIs refactored |
| Week 3 | Phase 4: Hooks Migration | Core hooks refactored |
| Week 4 | Phase 5: Components + Testing | Components updated, tests added |
| Week 5 | Phase 6: Documentation + Cleanup | Complete documentation, cleanup |

## Next Actions

1. **Start với `sessions/route.ts`** - Most complex, highest impact
2. **Create API client enhancements** - Support remaining endpoints
3. **Set up testing framework** - Ensure quality throughout refactor
4. **Create migration scripts** - Help with gradual rollout

## Conclusion

Kế hoạch này sẽ đảm bảo:
- **Complete coverage** của tất cả APIs và hooks
- **Gradual migration** để avoid breaking changes
- **Quality assurance** thông qua testing
- **Developer productivity** thông qua better patterns

Total estimated effort: **5 weeks** cho complete refactor với **2,000+ lines code reduction** và **100% consistency**.