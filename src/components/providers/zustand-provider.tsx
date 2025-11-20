'use client'

import { useEffect, ReactNode } from 'react'
import { useAuthInit, useAuthSessionMonitor } from '@/hooks/stores/use-auth-store'
import { useSystemTheme, useResponsiveDetection, useNotificationManager, useKeyboardShortcutManager, useFocusManager, useSidebarResponsive } from '@/hooks/stores/use-ui-store'

interface ZustandProviderProps {
  children: ReactNode
}

/**
 * Zustand Provider - Initializes and manages Zustand stores
 * 
 * This provider handles:
 * - Auth initialization and session monitoring
 * - System theme detection
 * - Responsive detection
 * - Notification management
 * - Keyboard shortcuts
 * - Focus management
 * - Sidebar responsive behavior
 */
export function ZustandProvider({ children }: ZustandProviderProps) {
  // Initialize auth and monitor session
  useAuthInit()
  useAuthSessionMonitor()
  
  // Initialize UI systems
  useSystemTheme()
  useResponsiveDetection()
  useNotificationManager()
  useKeyboardShortcutManager()
  useFocusManager()
  useSidebarResponsive()
  
  return <>{children}</>
}

/**
 * Development-only provider for Zustand debugging
 * Only renders in development mode
 */
export function ZustandDevProvider({ children }: ZustandProviderProps) {
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>
  }
  
  return (
    <div className="zustand-dev-tools">
      <div className="fixed top-4 right-4 z-50 bg-background border rounded-lg p-4 shadow-lg max-w-sm">
        <h3 className="font-semibold mb-2">Zustand Dev Tools</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Open Redux DevTools to debug Zustand stores
        </p>
        <div className="space-y-2 text-xs">
          <div>• Auth Store: auth-store</div>
          <div>• UI Store: ui-store</div>
          <div>• App Store: app-store</div>
          <div>• Example Store: example-feature-store</div>
        </div>
      </div>
      
      <style jsx>{`
        .zustand-dev-tools {
          font-family: monospace;
        }
      `}</style>
      
      {children}
    </div>
  )
}