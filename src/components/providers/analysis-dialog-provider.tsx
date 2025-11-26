'use client'

import { ReactNode } from 'react'
import { useAnalysisDialogInit } from '@/hooks/stores/use-analysis-dialog-store'

interface AnalysisDialogProviderProps {
  children: ReactNode
}

/**
 * Analysis Dialog Provider - Initializes analysis dialog store
 *
 * This provider specifically handles the analysis dialog store initialization
 * without causing infinite loops that might occur in the main ZustandProvider
 */
export function AnalysisDialogProvider({ children }: AnalysisDialogProviderProps) {
  // Initialize the analysis dialog store
  useAnalysisDialogInit()
  
  return <>{children}</>
}