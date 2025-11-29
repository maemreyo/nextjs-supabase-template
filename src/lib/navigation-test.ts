/**
 * Navigation Test Utilities
 *
 * File này chứa các utilities để test luồng điều hướng
 * giữa SessionList và AnalysisEditor
 */

import { NavigationUtils, NavigationValidation } from './navigation';
import { clientLogger } from '@/services/logger';

/**
 * Test các URL parameters
 */
export function testNavigationUrls() {
  // Test tạo URL analysis với session ID
  const testSessionId = 'test-session-123';
  const analysisUrl = NavigationUtils.goToAnalysis(testSessionId);
  
  // Test sessions URL
  const sessionsUrl = NavigationUtils.goToSessions();
  
  // Test URL với parameters
  const urlWithParams = NavigationUtils.createUrlWithParams('/analysis', {
    sessionId: testSessionId,
    tab: 'word',
    autoSave: true
  });
}

/**
 * Test validation session ID
 */
export function testSessionIdValidation() {
  const testCases = [
    { id: 'valid-session-id', expected: true },
    { id: '', expected: false },
    { id: 'null', expected: false },
    { id: 'undefined', expected: false },
    { id: '123', expected: true },
    { id: 'session-with-dashes', expected: true },
  ];
  
  testCases.forEach(({ id, expected }) => {
    const isValid = NavigationValidation.isValidSessionId(id);
  });
}

/**
 * Test breadcrumb generation
 */
export function testBreadcrumbGeneration() {
  // Import dynamically để avoid circular dependency
  const { createBreadcrumbItems } = require('./navigation');
  
  // Test breadcrumb cho sessions
  const sessionsBreadcrumbs = createBreadcrumbItems('/sessions');
  
  // Test breadcrumb cho analysis với session
  const analysisBreadcrumbs = createBreadcrumbItems(
    '/analysis',
    'test-session-id',
    'Test Session Title'
  );
}

/**
 * Test luồng điều hướng hoàn chỉnh
 */
export function testCompleteNavigationFlow() {
  // Simulate luồng từ Sessions List -> Analysis Editor
  const sessionId = 'session-abc-123';
  const analysisUrl = NavigationUtils.goToAnalysis(sessionId);
  
  // Simulate extracting session ID từ URL
  const mockSearchParams = new URLSearchParams(`sessionId=${sessionId}`);
  const extractedSessionId = NavigationValidation.getValidatedSessionId(mockSearchParams);
  
  // Simulate luồng từ Analysis Editor -> Sessions List
  const sessionsUrl = NavigationUtils.goToSessions();
}

/**
 * Run all navigation tests
 */
export function runAllNavigationTests() {
  try {
    testNavigationUrls();
    testSessionIdValidation();
    testBreadcrumbGeneration();
    testCompleteNavigationFlow();
  } catch (error) {
    clientLogger.error('Navigation test error', { error });
  }
}

/**
 * Test responsive navigation
 */
export function testResponsiveNavigation() {
  // Test mobile breadcrumb truncation
  const longSessionTitle = 'This is a very long session title that should be truncated on mobile devices for better user experience';
  const breadcrumbs = require('./navigation').createBreadcrumbItems(
    '/analysis',
    'test-session',
    longSessionTitle
  );
}

// Export test runner để có thể gọi từ browser console
if (typeof window !== 'undefined') {
  (window as any).runNavigationTests = runAllNavigationTests;
  (window as any).testResponsiveNav = testResponsiveNavigation;
}