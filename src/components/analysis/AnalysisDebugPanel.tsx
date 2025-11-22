'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function AnalysisDebugPanel() {
  const [debugInfo, setDebugInfo] = useState({
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
    url: typeof window !== 'undefined' ? window.location.href : 'SSR',
    theme: null as string | null,
    cssVars: {} as Record<string, string>,
    authState: null as any,
  });

  // Use the hook properly at the top level
  const authState = useAuthStore();

  useEffect(() => {
    // Check CSS variables
    const rootElement = document.documentElement;
    const computedStyle = getComputedStyle(rootElement);
    const cssVars: Record<string, string> = {};
    
    ['--background', '--foreground', '--card', '--primary', '--border'].forEach(varName => {
      cssVars[varName] = computedStyle.getPropertyValue(varName);
    });

    // Check theme
    const theme = document.body.classList.contains('dark') ? 'dark' : 'light';

    // Update debug info with auth state
    setDebugInfo(prev => ({
      ...prev,
      theme,
      cssVars,
      authState: {
        user: !!authState.user,
        isLoading: authState.isLoading,
        isAuthenticated: authState.isAuthenticated,
        isInitialized: authState.isInitialized,
      }
    }));
  }, [authState]);

  return (
    <div 
      className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded shadow-lg z-50 max-w-sm"
      style={{
        backgroundColor: '#ef4444',
        color: 'white',
        fontSize: '12px',
        lineHeight: '1.4',
        fontFamily: 'monospace'
      }}
    >
      <h3 className="font-bold mb-2">🔍 DEBUG PANEL</h3>
      <div className="space-y-1">
        <div><strong>Time:</strong> {debugInfo.timestamp}</div>
        <div><strong>URL:</strong> {debugInfo.url}</div>
        <div><strong>Theme:</strong> {debugInfo.theme}</div>
        <div><strong>CSS Vars:</strong></div>
        <div className="ml-2 text-xs">
          {Object.entries(debugInfo.cssVars).map(([key, value]) => (
            <div key={key}>{key}: {value || 'UNDEFINED'}</div>
          ))}
        </div>
        <div><strong>Auth State:</strong></div>
        <div className="ml-2 text-xs">
          {debugInfo.authState ? (
            <>
              <div>User: {debugInfo.authState.user ? 'YES' : 'NO'}</div>
              <div>Loading: {debugInfo.authState.isLoading ? 'YES' : 'NO'}</div>
              <div>Authenticated: {debugInfo.authState.isAuthenticated ? 'YES' : 'NO'}</div>
              {debugInfo.authState.error && (
                <div className="text-yellow-300">Error: {debugInfo.authState.error}</div>
              )}
            </>
          ) : (
            <div>Auth state unavailable</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalysisDebugPanel;