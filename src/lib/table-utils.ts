/**
 * Table Utilities (Legacy - DEPRECATED)
 * 
 * ⚠️  DEPRECATED: This file has been split for better architecture:
 * - Use table-utils-client.ts for React components (requires "use client")
 * - Server utilities are re-exported below for backward compatibility
 * 
 * This file now only re-exports client utilities for backward compatibility
 */

// Re-export client utilities (for backward compatibility)
export {
  useDataTable,
  columnUtils,
  filterUtils,
  paginationUtils,
  sortingUtils,
  flexRender
} from './table-utils-client';

// Export types for external use
export type {
  UseDataTableProps
} from './table-utils-client';