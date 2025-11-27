import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing fullscreen state in analysis dialogs
 * 
 * @param propFullscreen - External fullscreen prop from parent component
 * @returns Object containing isFullscreen state and toggleFullscreen function
 */
export const useAnalysisDialogFullscreenToggle = (propFullscreen: boolean): {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
} => {
  // Local state initialized with prop value
  const [isFullscreen, setIsFullscreen] = useState<boolean>(propFullscreen);

  // Sync local state with prop when prop changes
  useEffect(() => {

    if (isFullscreen !== propFullscreen) {

      setIsFullscreen(propFullscreen);
    }
  }, [propFullscreen]); // Only depend on propFullscreen, not isFullscreen

  // Toggle function using useCallback for performance
  const toggleFullscreen = useCallback(() => {

    setIsFullscreen(prev => {
      const newState = !prev;

      return newState;
    });
  }, []); // Remove isFullscreen from dependencies to prevent closure issues

  return {
    isFullscreen,
    toggleFullscreen
  };
};