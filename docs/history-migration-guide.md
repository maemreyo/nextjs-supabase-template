# History Migration Guide

## Overview

This guide documents the complete implementation of migrating analysis history from local storage to a database-driven system with hybrid architecture.

## Architecture

### Hybrid Approach
The system uses a hybrid approach combining:
- **Local Cache**: Fast access and offline support
- **Database**: Persistent storage and cross-device sync
- **Memory Cache**: Ultra-fast access for frequently used items

### Components

#### 1. API Endpoints

##### `/api/analyses/recent`
- **Method**: POST
- **Purpose**: Fetch recent analyses from database
- **Features**:
  - Filtering by type (word/sentence/paragraph)
  - Pagination support
  - Multiple sorting options
  - User-specific queries

**Request Schema**:
```typescript
{
  limit?: number;        // Default: 20
  offset?: number;       // Default: 0
  type?: 'all' | 'word' | 'sentence' | 'paragraph';
  sort_by?: 'created_at' | 'analysis_type';
  sort_order?: 'asc' | 'desc';
}
```

**Response Schema**:
```typescript
{
  success: boolean;
  data: {
    analyses: AnalysisHistoryItem[];
    total: number;
    pagination: {
      limit: number;
      offset: number;
      has_more: boolean;
    };
  };
}
```

##### `/api/analyses/sync`
- **Method**: POST
- **Purpose**: Sync local history with database
- **Features**:
  - Conflict detection and resolution
  - Batch processing
  - Bidirectional sync

##### `/api/analyses/add`
- **Method**: POST/PUT
- **Purpose**: Add single or multiple analyses to database
- **Features**:
  - Single item support (POST)
  - Batch support (PUT)
  - Duplicate handling

#### 2. Cache Management

##### HistoryCacheManager
Multi-level caching system:
- **L1 (Memory)**: Fastest access, limited size
- **L2 (LocalStorage)**: Medium speed, persistent
- **L3 (Database)**: Slowest but most reliable

**Key Features**:
- Write-through strategy
- Automatic expiration
- Size limits
- Priority-based eviction

#### 3. Offline Support

##### OfflineHistoryManager
Handles offline scenarios:
- Operation queuing
- Automatic retry with exponential backoff
- Network status monitoring
- Batch processing

#### 4. Migration Strategy

##### HistoryMigration
Handles transition from local to database:
- Backup creation
- Data comparison
- Conflict resolution
- Progress tracking
- Rollback support

**Conflict Resolution Strategies**:
- `local`: Prefer local data
- `remote`: Prefer remote data
- `latest`: Prefer most recent timestamp
- `merge`: Intelligent field merging

#### 5. UI Components

##### HistoryComponent
Enhanced history interface:
- Search and filtering
- Pagination
- Real-time sync status
- Migration prompts
- Item actions (edit/share/delete)

##### HistoryMigrationDialog
Migration interface:
- Progress tracking
- Error handling
- Stage indicators
- Cancel support

## Implementation Details

### Database Schema

Uses existing `session_analyses` table:
```sql
CREATE TABLE session_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id TEXT NOT NULL,
  session_id TEXT,
  analysis_type TEXT NOT NULL,
  analysis_title TEXT,
  analysis_summary TEXT,
  analysis_data JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_id TEXT,
  position INTEGER
);
```

### Data Flow

1. **Initial Load**:
   - Check memory cache
   - Check localStorage cache
   - Fetch from database if needed
   - Update caches

2. **New Analysis**:
   - Add to all cache levels
   - Queue for sync if offline
   - Update UI immediately

3. **Sync Process**:
   - Compare local and remote
   - Detect conflicts
   - Apply resolution strategy
   - Update all caches

### Error Handling

#### Network Errors
- Automatic retry with exponential backoff
- Offline mode activation
- User notification

#### Database Errors
- Graceful degradation
- Fallback to local cache
- Error logging

#### Conflict Resolution
- Multiple strategies available
- User notification
- Audit trail

## Migration Process

### Pre-Migration
1. Check if migration is needed
2. Create backup of local data
3. Validate data integrity

### Migration Steps
1. **Backup**: Save local history to backup storage
2. **Download**: Fetch existing database history
3. **Upload**: Send local-only items to database
4. **Merge**: Combine histories with conflict resolution
5. **Cleanup**: Remove temporary files

### Post-Migration
1. Verify data integrity
2. Update cache systems
3. Clean up old local storage
4. Log migration completion

## Performance Optimization

### Caching Strategy
- Memory cache for recent items (last 50)
- LocalStorage for extended history (last 500)
- Database queries with proper indexing

### Database Optimization
- Indexed queries on `user_id`, `created_at`, `analysis_type`
- Pagination to limit result sets
- Connection pooling

### Network Optimization
- Batch API calls
- Compression for large payloads
- Intelligent sync intervals

## Testing

### Unit Tests
- Migration logic validation
- Cache management testing
- Error scenario handling
- Conflict resolution verification

### Integration Tests
- API endpoint testing
- Database interaction validation
- End-to-end migration testing

### Performance Tests
- Large dataset handling
- Cache hit rates
- Sync performance metrics

## Security Considerations

### Data Protection
- User-specific data isolation
- Authentication validation
- Input sanitization

### Privacy
- No sensitive data in logs
- Secure data transmission
- Local storage encryption (future)

## Monitoring and Analytics

### Metrics to Track
- Migration success rates
- Cache hit/miss ratios
- Sync performance
- Error frequency
- User engagement patterns

### Logging Strategy
- Structured logging format
- Error categorization
- Performance metrics
- Audit trails

## Troubleshooting

### Common Issues

#### Migration Failures
**Symptoms**: Migration doesn't complete
**Solutions**:
1. Check network connectivity
2. Verify authentication
3. Clear browser cache
4. Check database status

#### Sync Conflicts
**Symptoms**: Data inconsistency
**Solutions**:
1. Review conflict resolution strategy
2. Check timestamps
3. Manual conflict resolution
4. Full resync option

#### Performance Issues
**Symptoms**: Slow loading/response
**Solutions**:
1. Check cache sizes
2. Verify database indexes
3. Monitor network latency
4. Optimize query patterns

### Debug Tools

#### Migration Logs
```typescript
// Access migration logs
const migration = new HistoryMigration();
const logs = migration.getLogs();
console.log('Migration logs:', logs);
```

#### Cache Status
```typescript
// Check cache status
const cacheManager = new HistoryCacheManager();
const stats = cacheManager.getStats();
console.log('Cache stats:', stats);
```

#### Sync Status
```typescript
// Monitor sync status
const offlineManager = new OfflineHistoryManager();
const status = offlineManager.getStatus();
console.log('Sync status:', status);
```

## Future Enhancements

### Planned Features
1. **Real-time Sync**: WebSocket-based instant updates
2. **Advanced Conflict Resolution**: AI-powered conflict handling
3. **Selective Sync**: User-controlled sync preferences
4. **Analytics Dashboard**: Usage insights and patterns
5. **Export/Import**: Data portability features

### Performance Improvements
1. **Service Workers**: Background sync processing
2. **IndexedDB**: More robust local storage
3. **CDN Integration**: Faster data access
4. **Compression**: Reduced bandwidth usage

## Conclusion

The history migration system provides a robust, scalable solution for managing analysis history across devices and sessions. The hybrid approach ensures optimal performance while maintaining data integrity and user experience.

Key benefits:
- ✅ Cross-device synchronization
- ✅ Offline functionality
- ✅ Performance optimization
- ✅ Data integrity protection
- ✅ Graceful error handling
- ✅ Comprehensive testing coverage

The system is production-ready and designed for future scalability and enhancement.