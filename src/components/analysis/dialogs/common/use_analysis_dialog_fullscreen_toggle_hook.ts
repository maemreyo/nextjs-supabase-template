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
    console.log('🐛 DEBUG: useEffect sync triggered', {
      localState: isFullscreen,
      propState: propFullscreen,
      needsSync: isFullscreen !== propFullscreen,
      timestamp: new Date().toISOString()
    });
    if (isFullscreen !== propFullscreen) {
      console.log('🐛 DEBUG: Syncing prop to local state', {
        from: isFullscreen,
        to: propFullscreen,
        timestamp: new Date().toISOString()
      });
      setIsFullscreen(propFullscreen);
    }
  }, [propFullscreen]); // Only depend on propFullscreen, not isFullscreen
  
  // Toggle function using useCallback for performance
  const toggleFullscreen = useCallback(() => {
    console.log('🐛 DEBUG: toggleFullscreen called', {
      currentState: isFullscreen,
      newState: !isFullscreen,
      timestamp: new Date().toISOString()
    });
    setIsFullscreen(prev => {
      const newState = !prev;
      console.log('🐛 DEBUG: setIsFullscreen called', {
        previousState: prev,
        newState: newState,
        timestamp: new Date().toISOString()
      });
      return newState;
    });
  }, []); // Remove isFullscreen from dependencies to prevent closure issues
  
  return {
    isFullscreen,
    toggleFullscreen
  };
};