'use client';

import { useState, useEffect } from 'react';
import { SessionCard } from './SessionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSessionStore } from '@/stores/session-store';
import type { AnalysisSession } from '@/types/sessions';
import { Search, Plus, Filter, Grid, List } from 'lucide-react';

interface SessionListProps {
  onCreateSession?: () => void;
  onOpenSession?: (sessionId: string) => void;
  onEditSession?: (session: AnalysisSession) => void;
  onSessionSettings?: (sessionId: string) => void;
  className?: string;
}

export function SessionList({
  onCreateSession,
  onOpenSession,
  onEditSession,
  onSessionSettings,
  className
}: SessionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(0);
  const [limit] = useState(12);

  const {
    sessions,
    isLoading,
    error,
    loadSessions,
    deleteSession,
    totalSessions
  } = useSessionStore();

  useEffect(() => {
    loadSessions({
      search: searchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter as 'active' | 'archived' | 'deleted',
      type: typeFilter === 'all' ? undefined : typeFilter as 'word' | 'sentence' | 'paragraph' | 'mixed'
    });
  }, [searchTerm, statusFilter, typeFilter, loadSessions]);

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiên này?')) {
      await deleteSession(sessionId);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    const matchesType = typeFilter === 'all' || session.session_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(totalSessions / limit);
  const hasMore = page < totalPages - 1;

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">Lỗi tải phiên</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => loadSessions()}>
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Phiên phân tích</h2>
          <p className="text-muted-foreground">
            {totalSessions} phiên tổng cộng
          </p>
        </div>
        <Button onClick={onCreateSession} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tạo phiên mới
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm phiên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="archived">Lưu trữ</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="paragraph">Đoạn văn</SelectItem>
              <SelectItem value="sentence">Câu</SelectItem>
              <SelectItem value="word">Từ</SelectItem>
              <SelectItem value="mixed">Hỗn hợp</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(statusFilter !== 'all' || typeFilter !== 'all' || searchTerm) && (
        <div className="flex flex-wrap gap-2">
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter('all')}>
              Trạng thái: {statusFilter} ×
            </Badge>
          )}
          {typeFilter !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setTypeFilter('all')}>
              Loại: {typeFilter} ×
            </Badge>
          )}
          {searchTerm && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchTerm('')}>
              Tìm kiếm: {searchTerm} ×
            </Badge>
          )}
        </div>
      )}

      {/* Sessions Grid/List */}
      {isLoading ? (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Không tìm thấy phiên</CardTitle>
            <CardDescription>
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Thử thay đổi bộ lọc hoặc tìm kiếm của bạn'
                : 'Bắt đầu bằng cách tạo phiên phân tích đầu tiên của bạn'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
              <Button onClick={onCreateSession}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo phiên mới
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onOpen={onOpenSession}
              onEdit={onEditSession}
              onSettings={onSessionSettings}
              onDelete={handleDeleteSession}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={!hasMore}
          >
            Tiếp theo
          </Button>
        </div>
      )}
    </div>
  );
}