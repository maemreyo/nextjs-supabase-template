'use client';

import { useState, useEffect } from 'react';
import { VocabularyCard } from './VocabularyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useVocabularyStore } from '@/stores/vocabulary-store';
import type { VocabularyWord } from '@/types/vocabulary';
import { Search, Plus, Filter, Grid, List, Volume2, BookOpen } from 'lucide-react';

interface VocabularyListProps {
  onCreateWord?: () => void;
  onEditWord?: (word: VocabularyWord) => void;
  onPracticeWord?: (wordId: string) => void;
  onPlayAudio?: (word: VocabularyWord) => void;
  className?: string;
}

export function VocabularyList({
  onCreateWord,
  onEditWord,
  onPracticeWord,
  onPlayAudio,
  className
}: VocabularyListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [masteryFilter, setMasteryFilter] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [compactView, setCompactView] = useState(false);
  const [page, setPage] = useState(0);
  const [limit] = useState(12);

  const {
    words,
    collections,
    isLoading,
    error,
    loadWords,
    deleteWord,
    markWordAsReviewed,
    totalWords
  } = useVocabularyStore();

  useEffect(() => {
    loadWords({
      search: searchTerm,
      mastery: masteryFilter === 'all' ? undefined : masteryFilter as 'new' | 'learning' | 'mastered',
      collection: collectionFilter === 'all' ? undefined : collectionFilter
    });
  }, [searchTerm, masteryFilter, collectionFilter, page, limit, loadWords]);

  const handleDeleteWord = async (wordId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa từ này?')) {
      await deleteWord(wordId);
    }
  };

  const handlePracticeWord = async (wordId: string) => {
    const result = window.confirm('Đáp án đúng? (OK = đúng, Cancel = sai)');
    await markWordAsReviewed(wordId, result);
  };

  const handlePlayAudio = (word: VocabularyWord) => {
    if (word.audio_url) {
      const audio = new Audio(word.audio_url);
      audio.play().catch(console.error);
    }
    onPlayAudio?.(word);
  };

  const filteredWords = words.filter(word => {
    const matchesSearch = word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.definition_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.definition_vi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.vietnamese_translation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMastery = masteryFilter === 'all' || word.mastery_level === parseInt(masteryFilter);
    const matchesCollection = collectionFilter === 'all' || word.source_type === collectionFilter;
    
    return matchesSearch && matchesMastery && matchesCollection;
  });

  const totalPages = Math.ceil(totalWords / limit);
  const hasMore = page < totalPages - 1;

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">Lỗi tải từ vựng</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => loadWords()}>
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
          <h2 className="text-2xl font-bold">Từ vựng</h2>
          <p className="text-muted-foreground">
            {totalWords} từ tổng cộng
          </p>
        </div>
        <Button onClick={onCreateWord} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Thêm từ mới
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm từ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">

          <Select value={masteryFilter} onValueChange={setMasteryFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Thành thạo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="0">Mới</SelectItem>
              <SelectItem value="1">Yếu</SelectItem>
              <SelectItem value="2">Trung bình</SelectItem>
              <SelectItem value="3">Tốt</SelectItem>
              <SelectItem value="4">Thành thạo</SelectItem>
              <SelectItem value="5">Bậc thầy</SelectItem>
            </SelectContent>
          </Select>

          <Select value={collectionFilter} onValueChange={setCollectionFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Bộ sưu tập" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.name}
                </SelectItem>
              ))}
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

          <Button
            variant={compactView ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCompactView(!compactView)}
          >
            Compact
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {(difficultyFilter !== 'all' || masteryFilter !== 'all' || collectionFilter !== 'all' || searchTerm) && (
        <div className="flex flex-wrap gap-2">
          {difficultyFilter !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setDifficultyFilter('all')}>
              Độ khó: {difficultyFilter} ×
            </Badge>
          )}
          {masteryFilter !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setMasteryFilter('all')}>
              Thành thạo: {masteryFilter} ×
            </Badge>
          )}
          {collectionFilter !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setCollectionFilter('all')}>
              Bộ sưu tập: {collections.find(c => c.id === collectionFilter)?.name} ×
            </Badge>
          )}
          {searchTerm && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchTerm('')}>
              Tìm kiếm: {searchTerm} ×
            </Badge>
          )}
        </div>
      )}

      {/* Words Grid/List */}
      {isLoading ? (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
          : 'space-y-4'
        }>
          {Array.from({ length: 8 }).map((_, i) => (
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
      ) : filteredWords.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Không tìm thấy từ</CardTitle>
            <CardDescription>
              {searchTerm || difficultyFilter !== 'all' || masteryFilter !== 'all' || collectionFilter !== 'all'
                ? 'Thử thay đổi bộ lọc hoặc tìm kiếm của bạn'
                : 'Bắt đầu bằng cách thêm từ đầu tiên của bạn'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {!searchTerm && difficultyFilter === 'all' && masteryFilter === 'all' && collectionFilter === 'all' && (
              <Button onClick={onCreateWord}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm từ mới
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
          : 'space-y-4'
        }>
          {filteredWords.map((word) => (
            <VocabularyCard
              key={word.id}
              word={word}
              compact={compactView}
              onEdit={onEditWord}
              onPractice={handlePracticeWord}
              onPlayAudio={handlePlayAudio}
              onDelete={handleDeleteWord}
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