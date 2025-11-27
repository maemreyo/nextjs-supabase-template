import { useMemo } from 'react';

/**
 * Hook để xác định các lớp animation dựa trên trạng thái loading và error
 * @param loading - Trạng thái loading
 * @param error - Trạng thái error (có thể là null)
 * @returns Chuỗi các lớp CSS để áp dụng animation
 */
export const useAnalysisDialogAnimationClasses = (
  loading: boolean,
  error: string | null
): string => {
  return useMemo(() => {
    if (loading) return 'animate-pulse';
    if (error) return 'animate-shake';
    return '';
  }, [loading, error]);
};