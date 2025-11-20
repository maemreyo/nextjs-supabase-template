import { create } from 'zustand'
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware'
import { createStore, storeUtils, type LoadingState, type PaginationState } from '@/lib/store'

// Example feature data types
export interface ExampleItem {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  createdBy: string
  metadata?: Record<string, any>
}

export interface ExampleFilter {
  category?: string
  status?: ExampleItem['status']
  priority?: ExampleItem['priority']
  tags?: string[]
  dateRange?: {
    start: string
    end: string
  }
  createdBy?: string
}

// Example feature state interface
export interface ExampleFeatureState extends LoadingState, PaginationState {
  // Data
  items: ExampleItem[]
  selectedItem: ExampleItem | null
  
  // Filtering and sorting
  filters: ExampleFilter
  sortBy: keyof ExampleItem
  sortOrder: 'asc' | 'desc'
  searchQuery: string
  
  // UI state
  viewMode: 'grid' | 'list' | 'kanban'
  showFilters: boolean
  showArchived: boolean
  
  // Form state
  isEditing: boolean
  editingItem: Partial<ExampleItem> | null
  formData: Partial<ExampleItem>
  formErrors: Record<string, string>
  
  // Bulk operations
  selectedItems: string[]
  isBulkAction: boolean
  
  // Cache and performance
  lastFetchedAt: string | null
  cacheExpiry: number // in minutes
}

// Example feature actions interface
export interface ExampleFeatureActions {
  // Data actions
  setItems: (items: ExampleItem[]) => void
  addItem: (item: ExampleItem) => void
  updateItem: (id: string, updates: Partial<ExampleItem>) => void
  removeItem: (id: string) => void
  clearItems: () => void
  
  // Selection actions
  setSelectedItem: (item: ExampleItem | null) => void
  selectItem: (id: string) => void
  deselectItem: (id: string) => void
  selectAll: () => void
  deselectAll: () => void
  toggleItemSelection: (id: string) => void
  
  // Filter and sort actions
  setFilters: (filters: ExampleFilter) => void
  updateFilters: (updates: Partial<ExampleFilter>) => void
  clearFilters: () => void
  setSortBy: (sortBy: keyof ExampleItem) => void
  setSortOrder: (sortOrder: 'asc' | 'desc') => void
  setSearchQuery: (query: string) => void
  
  // UI actions
  setViewMode: (mode: ExampleFeatureState['viewMode']) => void
  toggleFilters: () => void
  setShowFilters: (show: boolean) => void
  setShowArchived: (show: boolean) => void
  
  // Form actions
  startEditing: (item?: ExampleItem) => void
  stopEditing: () => void
  setFormData: (data: Partial<ExampleItem>) => void
  updateFormData: (updates: Partial<ExampleItem>) => void
  setFormErrors: (errors: Record<string, string>) => void
  clearFormErrors: () => void
  resetForm: () => void
  saveItem: () => Promise<void>
  
  // Bulk actions
  setBulkAction: (isBulkAction: boolean) => void
  bulkDelete: () => Promise<void>
  bulkUpdate: (updates: Partial<ExampleItem>) => Promise<void>
  bulkArchive: () => Promise<void>
  
  // Data fetching actions
  fetchItems: () => Promise<void>
  fetchItem: (id: string) => Promise<void>
  refreshItems: () => Promise<void>
  
  // Utility actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Pagination actions
  updatePagination: (updates: Partial<PaginationState>) => void
  resetPagination: () => void
  
  // Reset actions
  resetFeature: () => void
}

// Combined example feature store type
export type ExampleFeatureStore = ExampleFeatureState & ExampleFeatureActions

// Initial state
const initialState: ExampleFeatureState = {
  // Data
  items: [],
  selectedItem: null,
  
  // Filtering and sorting
  filters: {},
  sortBy: 'createdAt',
  sortOrder: 'desc',
  searchQuery: '',
  
  // UI state
  viewMode: 'grid',
  showFilters: false,
  showArchived: false,
  
  // Form state
  isEditing: false,
  editingItem: null,
  formData: {},
  formErrors: {},
  
  // Bulk operations
  selectedItems: [],
  isBulkAction: false,
  
  // Cache and performance
  lastFetchedAt: null,
  cacheExpiry: 5, // 5 minutes
  
  // Loading and pagination
  loading: false,
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  hasMore: false,
}

// Example feature store implementation
export const useExampleFeatureStore = create<ExampleFeatureStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get) => ({
          ...initialState,

          // Data actions
          setItems: (items) => {
            set({ items }, false, 'setItems')
          },

          addItem: (item) => {
            set(
              (state) => ({
                items: [...state.items, item],
              }),
              false,
              'addItem'
            )
          },

          updateItem: (id, updates) => {
            set(
              (state) => ({
                items: state.items.map((item) =>
                  item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
                ),
                selectedItem:
                  state.selectedItem?.id === id
                    ? { ...state.selectedItem, ...updates, updatedAt: new Date().toISOString() }
                    : state.selectedItem,
              }),
              false,
              'updateItem'
            )
          },

          removeItem: (id) => {
            set(
              (state) => ({
                items: state.items.filter((item) => item.id !== id),
                selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
                selectedItems: state.selectedItems.filter((itemId) => itemId !== id),
              }),
              false,
              'removeItem'
            )
          },

          clearItems: () => {
            set(
              {
                items: [],
                selectedItem: null,
                selectedItems: [],
              },
              false,
              'clearItems'
            )
          },

          // Selection actions
          setSelectedItem: (selectedItem) => {
            set({ selectedItem }, false, 'setSelectedItem')
          },

          selectItem: (id) => {
            set(
              (state) => ({
                selectedItems: [...new Set([...state.selectedItems, id])],
              }),
              false,
              'selectItem'
            )
          },

          deselectItem: (id) => {
            set(
              (state) => ({
                selectedItems: state.selectedItems.filter((itemId) => itemId !== id),
              }),
              false,
              'deselectItem'
            )
          },

          selectAll: () => {
            set(
              (state) => ({
                selectedItems: state.items.map((item) => item.id),
              }),
              false,
              'selectAll'
            )
          },

          deselectAll: () => {
            set({ selectedItems: [] }, false, 'deselectAll')
          },

          toggleItemSelection: (id) => {
            set(
              (state) => ({
                selectedItems: state.selectedItems.includes(id)
                  ? state.selectedItems.filter((itemId) => itemId !== id)
                  : [...state.selectedItems, id],
              }),
              false,
              'toggleItemSelection'
            )
          },

          // Filter and sort actions
          setFilters: (filters) => {
            set({ filters }, false, 'setFilters')
          },

          updateFilters: (updates) => {
            set(
              (state) => ({
                filters: {
                  ...state.filters,
                  ...updates,
                },
              }),
              false,
              'updateFilters'
            )
          },

          clearFilters: () => {
            set({ filters: {} }, false, 'clearFilters')
          },

          setSortBy: (sortBy) => {
            set({ sortBy }, false, 'setSortBy')
          },

          setSortOrder: (sortOrder) => {
            set({ sortOrder }, false, 'setSortOrder')
          },

          setSearchQuery: (searchQuery) => {
            set({ searchQuery }, false, 'setSearchQuery')
          },

          // UI actions
          setViewMode: (viewMode) => {
            set({ viewMode }, false, 'setViewMode')
          },

          toggleFilters: () => {
            set(
              (state) => ({ showFilters: !state.showFilters }),
              false,
              'toggleFilters'
            )
          },

          setShowFilters: (showFilters) => {
            set({ showFilters }, false, 'setShowFilters')
          },

          setShowArchived: (showArchived) => {
            set({ showArchived }, false, 'setShowArchived')
          },

          // Form actions
          startEditing: (item) => {
            set(
              {
                isEditing: true,
                editingItem: item || null,
                formData: item ? { ...item } : {},
                formErrors: {},
              },
              false,
              'startEditing'
            )
          },

          stopEditing: () => {
            set(
              {
                isEditing: false,
                editingItem: null,
                formData: {},
                formErrors: {},
              },
              false,
              'stopEditing'
            )
          },

          setFormData: (formData) => {
            set({ formData }, false, 'setFormData')
          },

          updateFormData: (updates) => {
            set(
              (state) => ({
                formData: {
                  ...state.formData,
                  ...updates,
                },
              }),
              false,
              'updateFormData'
            )
          },

          setFormErrors: (formErrors) => {
            set({ formErrors }, false, 'setFormErrors')
          },

          clearFormErrors: () => {
            set({ formErrors: {} }, false, 'clearFormErrors')
          },

          resetForm: () => {
            set(
              {
                formData: {},
                formErrors: {},
              },
              false,
              'resetForm'
            )
          },

          saveItem: async () => {
            const { isEditing, editingItem, formData, setError, setLoading, addItem, updateItem } = get()
            
            try {
              setLoading(true)
              setError(null)
              
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              if (isEditing && editingItem?.id) {
                updateItem(editingItem.id, formData)
              } else {
                const newItem: ExampleItem = {
                  id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  title: formData.title || 'Untitled',
                  description: formData.description || '',
                  category: formData.category || 'general',
                  tags: formData.tags || [],
                  status: 'draft',
                  priority: 'medium',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  createdBy: 'current-user',
                  metadata: formData.metadata,
                }
                addItem(newItem)
              }
              
              get().stopEditing()
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to save item')
              throw error
            } finally {
              setLoading(false)
            }
          },

          // Bulk actions
          setBulkAction: (isBulkAction) => {
            set({ isBulkAction }, false, 'setBulkAction')
          },

          bulkDelete: async () => {
            const { selectedItems, removeItem, deselectAll, setLoading, setError } = get()
            
            try {
              setLoading(true)
              setError(null)
              
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              for (const id of selectedItems) {
                removeItem(id)
              }
              
              deselectAll()
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to delete items')
              throw error
            } finally {
              setLoading(false)
            }
          },

          bulkUpdate: async (updates) => {
            const { selectedItems, updateItem, deselectAll, setLoading, setError } = get()
            
            try {
              setLoading(true)
              setError(null)
              
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              for (const id of selectedItems) {
                updateItem(id, updates)
              }
              
              deselectAll()
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to update items')
              throw error
            } finally {
              setLoading(false)
            }
          },

          bulkArchive: async () => {
            const { selectedItems, updateItem, deselectAll, setLoading, setError } = get()
            
            try {
              setLoading(true)
              setError(null)
              
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              for (const id of selectedItems) {
                updateItem(id, { status: 'archived' })
              }
              
              deselectAll()
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to archive items')
              throw error
            } finally {
              setLoading(false)
            }
          },

          // Data fetching actions
          fetchItems: async () => {
            const { setLoading, setError, setItems, lastFetchedAt, cacheExpiry } = get()
            
            // Check cache
            if (lastFetchedAt) {
              const now = new Date()
              const lastFetch = new Date(lastFetchedAt)
              const diffMinutes = (now.getTime() - lastFetch.getTime()) / (1000 * 60)
              
              if (diffMinutes < cacheExpiry) {
                return // Use cached data
              }
            }
            
            try {
              setLoading(true)
              setError(null)
              
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              // Mock data
              const mockItems: ExampleItem[] = [
                {
                  id: '1',
                  title: 'Example Item 1',
                  description: 'This is an example item',
                  category: 'demo',
                  tags: ['example', 'demo'],
                  status: 'published',
                  priority: 'high',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  createdBy: 'user1',
                },
                {
                  id: '2',
                  title: 'Example Item 2',
                  description: 'Another example item',
                  category: 'demo',
                  tags: ['example'],
                  status: 'draft',
                  priority: 'medium',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  createdBy: 'user2',
                },
              ]
              
              setItems(mockItems)
              set({ lastFetchedAt: new Date().toISOString() }, false, 'fetchItems')
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to fetch items')
              throw error
            } finally {
              setLoading(false)
            }
          },

          fetchItem: async (id) => {
            const { setLoading, setError, items, setSelectedItem } = get()
            
            // Check if item exists in cache
            const existingItem = items.find(item => item.id === id)
            if (existingItem) {
              setSelectedItem(existingItem)
              return
            }
            
            try {
              setLoading(true)
              setError(null)
              
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 500))
              
              // Mock item
              const mockItem: ExampleItem = {
                id,
                title: `Item ${id}`,
                description: `Description for item ${id}`,
                category: 'demo',
                tags: ['example'],
                status: 'draft',
                priority: 'medium',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'user1',
              }
              
              setSelectedItem(mockItem)
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to fetch item')
              throw error
            } finally {
              setLoading(false)
            }
          },

          refreshItems: async () => {
            const { fetchItems } = get()
            await fetchItems()
          },

          // Utility actions
          setLoading: (loading) => {
            set(storeUtils.setLoading(loading), false, 'setLoading')
          },

          setError: (error) => {
            set(storeUtils.setError(error), false, 'setError')
          },

          clearError: () => {
            set({ error: null }, false, 'clearError')
          },

          // Pagination actions
          updatePagination: (updates) => {
            set(storeUtils.updatePagination(updates), false, 'updatePagination')
          },

          resetPagination: () => {
            set({
              page: 1,
              limit: 10,
              total: 0,
              hasMore: false,
            }, false, 'resetPagination')
          },

          // Reset actions
          resetFeature: () => {
            set(initialState, false, 'resetFeature')
          },
        }),
        {
          name: 'example-feature-storage',
          partialize: (state) => ({
            // Only persist UI preferences and filters
            viewMode: state.viewMode,
            showFilters: state.showFilters,
            showArchived: state.showArchived,
            filters: state.filters,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
            cacheExpiry: state.cacheExpiry,
          }),
          version: 1,
        }
      ),
      {
        name: 'example-feature-store',
        enabled: process.env.NODE_ENV === 'development',
      }
    )
  )
)

// Selectors
export const exampleFeatureSelectors = {
  // Data selectors
  items: (state: ExampleFeatureStore) => state.items,
  selectedItem: (state: ExampleFeatureStore) => state.selectedItem,
  itemCount: (state: ExampleFeatureStore) => state.items.length,
  
  // Filtered and sorted items
  filteredItems: (state: ExampleFeatureStore) => {
    let filtered = [...state.items]
    
    // Apply filters
    if (state.filters.category) {
      filtered = filtered.filter(item => item.category === state.filters.category)
    }
    
    if (state.filters.status) {
      filtered = filtered.filter(item => item.status === state.filters.status)
    }
    
    if (state.filters.priority) {
      filtered = filtered.filter(item => item.priority === state.filters.priority)
    }
    
    if (state.filters.tags && state.filters.tags.length > 0) {
      filtered = filtered.filter(item => 
        state.filters.tags!.some(tag => item.tags.includes(tag))
      )
    }
    
    if (state.filters.dateRange) {
      const { start, end } = state.filters.dateRange
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.createdAt)
        const startDate = new Date(start)
        const endDate = new Date(end)
        return itemDate >= startDate && itemDate <= endDate
      })
    }
    
    if (!state.showArchived) {
      filtered = filtered.filter(item => item.status !== 'archived')
    }
    
    // Apply search
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[state.sortBy]
      const bValue = b[state.sortBy]
      
      if (aValue === undefined || bValue === undefined) return 0
      if (aValue < bValue) return state.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return state.sortOrder === 'asc' ? 1 : -1
      return 0
    })
    
    return filtered
  },
  
  // Selection selectors
  selectedItems: (state: ExampleFeatureStore) => state.selectedItems,
  selectedItemCount: (state: ExampleFeatureStore) => state.selectedItems.length,
  isItemSelected: (state: ExampleFeatureStore, id: string) => 
    state.selectedItems.includes(id),
  isAllSelected: (state: ExampleFeatureStore) => 
    state.items.length > 0 && state.selectedItems.length === state.items.length,
  hasSelection: (state: ExampleFeatureStore) => state.selectedItems.length > 0,
  
  // Filter and sort selectors
  filters: (state: ExampleFeatureStore) => state.filters,
  sortBy: (state: ExampleFeatureStore) => state.sortBy,
  sortOrder: (state: ExampleFeatureStore) => state.sortOrder,
  searchQuery: (state: ExampleFeatureStore) => state.searchQuery,
  hasActiveFilters: (state: ExampleFeatureStore) => 
    Object.keys(state.filters).length > 0 || !!state.searchQuery,
  
  // UI selectors
  viewMode: (state: ExampleFeatureStore) => state.viewMode,
  showFilters: (state: ExampleFeatureStore) => state.showFilters,
  showArchived: (state: ExampleFeatureStore) => state.showArchived,
  
  // Form selectors
  isEditing: (state: ExampleFeatureStore) => state.isEditing,
  editingItem: (state: ExampleFeatureStore) => state.editingItem,
  formData: (state: ExampleFeatureStore) => state.formData,
  formErrors: (state: ExampleFeatureStore) => state.formErrors,
  hasFormErrors: (state: ExampleFeatureStore) => Object.keys(state.formErrors).length > 0,
  
  // Bulk action selectors
  isBulkAction: (state: ExampleFeatureStore) => state.isBulkAction,
  
  // Cache selectors
  lastFetchedAt: (state: ExampleFeatureStore) => state.lastFetchedAt,
  cacheExpiry: (state: ExampleFeatureStore) => state.cacheExpiry,
  isCacheExpired: (state: ExampleFeatureStore) => {
    if (!state.lastFetchedAt) return true
    const now = new Date()
    const lastFetch = new Date(state.lastFetchedAt)
    const diffMinutes = (now.getTime() - lastFetch.getTime()) / (1000 * 60)
    return diffMinutes >= state.cacheExpiry
  },
  
  // State selectors
  loading: (state: ExampleFeatureStore) => state.loading,
  error: (state: ExampleFeatureStore) => state.error,
  hasError: (state: ExampleFeatureStore) => !!state.error,
  
  // Pagination selectors
  pagination: (state: ExampleFeatureStore) => ({
    page: state.page,
    limit: state.limit,
    total: state.total,
    hasMore: state.hasMore,
  }),
  currentPage: (state: ExampleFeatureStore) => state.page,
  pageSize: (state: ExampleFeatureStore) => state.limit,
  totalItems: (state: ExampleFeatureStore) => state.total,
  hasNextPage: (state: ExampleFeatureStore) => state.hasMore,
}