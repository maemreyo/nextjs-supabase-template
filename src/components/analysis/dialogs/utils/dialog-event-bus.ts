import {
  DialogEvent,
  DialogEventType
} from '../types/dialog-types';

/**
 * Dialog Event Bus for loose coupling between components
 */
class DialogEventBus {
  private listeners: Map<DialogEventType, Set<(event: DialogEvent<any>) => void>> = new Map();
  
  /**
   * Subscribe to dialog events
   */
  subscribe<T = any>(eventType: DialogEventType, callback: (event: DialogEvent<T>) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    const listenerSet = this.listeners.get(eventType)!;
    listenerSet.add(callback);
    
    // Return unsubscribe function
    return () => {
      listenerSet.delete(callback);
      if (listenerSet.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }
  
  /**
   * Emit dialog events
   */
  emit<T = any>(eventType: DialogEventType, payload: T): void {
    const event: DialogEvent<T> = {
      type: eventType,
      payload,
      timestamp: Date.now(),
    };
    
    const listenerSet = this.listeners.get(eventType);
    if (listenerSet) {
      listenerSet.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in dialog event listener for ${eventType}:`, error);
        }
      });
    }
  }
  
  /**
   * Clear all listeners for an event type
   */
  clear(eventType?: DialogEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Global event bus instance
export const dialogEventBus = new DialogEventBus();