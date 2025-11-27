import { useMemo } from 'react';
import { DialogSize } from '../types/dialog-types';

/**
 * Hook để lấy CSS classes cho kích thước dialog
 * @param dialogSize Kích thước dialog
 * @returns Chuỗi CSS classes tương ứng với kích thước
 */
export const useAnalysisDialogSizeClasses = (dialogSize: DialogSize): string => {
  return useMemo(() => {
    switch (dialogSize) {
      case 'default':
        return 'w-5xl h-[80vh]';
      case 'large':
        return 'w-7xl h-[85vh]';
      case 'xlarge':
        return 'w-9xl h-[90vh]';
      case 'xxlarge':
        return 'w-14xl h-[95vh]';
      case 'xxxlarge':
        return 'w-screen-xl h-[98vh]';
      case 'ultra':
        return 'w-[95vw] sm:w-screen-xl md:w-screen-2xl lg:w-screen-2xl xl:w-[1920px] 2xl:w-[2240px] h-[98vh]';
      case 'mega':
        return 'w-[95vw] sm:w-screen-2xl md:w-[90vw] lg:w-[95vw] xl:w-[2560px] 2xl:w-[3200px] h-[98vh]';
      case 'ultra-wide':
        return 'w-[95vw] sm:w-screen-2xl md:w-[90vw] lg:w-[95vw] xl:w-[3200px] 2xl:w-[3840px] h-[98vh]';
      case 'fullscreen':
        return 'w-full h-full';
      default:
        return 'w-3xl h-[85vh]';
    }
  }, [dialogSize]);
};

export default useAnalysisDialogSizeClasses;