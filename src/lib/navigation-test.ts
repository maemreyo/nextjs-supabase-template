/**
 * Navigation Test Utilities
 * 
 * File này chứa các utilities để test luồng điều hướng
 * giữa SessionList và AnalysisEditor
 */

import { NavigationUtils, NavigationValidation } from './navigation';

/**
 * Test các URL parameters
 */
export function testNavigationUrls() {
  console.group('🧪 Testing Navigation URLs');
  
  // Test tạo URL analysis với session ID
  const testSessionId = 'test-session-123';
  const analysisUrl = NavigationUtils.goToAnalysis(testSessionId);
  console.log('✅ Analysis URL:', analysisUrl);
  console.log('Expected: /analysis?sessionId=test-session-123');
  console.log('Match:', analysisUrl === '/analysis?sessionId=test-session-123');
  
  // Test sessions URL
  const sessionsUrl = NavigationUtils.goToSessions();
  console.log('✅ Sessions URL:', sessionsUrl);
  console.log('Expected: /sessions');
  console.log('Match:', sessionsUrl === '/sessions');
  
  // Test URL với parameters
  const urlWithParams = NavigationUtils.createUrlWithParams('/analysis', {
    sessionId: testSessionId,
    tab: 'word',
    autoSave: true
  });
  console.log('✅ URL with params:', urlWithParams);
  
  console.groupEnd();
}

/**
 * Test validation session ID
 */
export function testSessionIdValidation() {
  console.group('🧪 Testing Session ID Validation');
  
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
    console.log(`ID: "${id}" -> Valid: ${isValid}, Expected: ${expected}`, 
      isValid === expected ? '✅' : '❌');
  });
  
  console.groupEnd();
}

/**
 * Test breadcrumb generation
 */
export function testBreadcrumbGeneration() {
  console.group('🧪 Testing Breadcrumb Generation');
  
  // Import dynamically để avoid circular dependency
  const { createBreadcrumbItems } = require('./navigation');
  
  // Test breadcrumb cho sessions
  const sessionsBreadcrumbs = createBreadcrumbItems('/sessions');
  console.log('Sessions breadcrumbs:', sessionsBreadcrumbs);
  
  // Test breadcrumb cho analysis với session
  const analysisBreadcrumbs = createBreadcrumbItems(
    '/analysis', 
    'test-session-id', 
    'Test Session Title'
  );
  console.log('Analysis breadcrumbs:', analysisBreadcrumbs);
  
  console.groupEnd();
}

/**
 * Test luồng điều hướng hoàn chỉnh
 */
export function testCompleteNavigationFlow() {
  console.group('🧪 Testing Complete Navigation Flow');
  
  // Simulate luồng từ Sessions List -> Analysis Editor
  console.log('📍 Flow 1: Sessions List -> Analysis Editor');
  const sessionId = 'session-abc-123';
  const analysisUrl = NavigationUtils.goToAnalysis(sessionId);
  console.log('Step 1 - Navigate to:', analysisUrl);
  
  // Simulate extracting session ID từ URL
  const mockSearchParams = new URLSearchParams(`sessionId=${sessionId}`);
  const extractedSessionId = NavigationValidation.getValidatedSessionId(mockSearchParams);
  console.log('Step 2 - Extracted session ID:', extractedSessionId);
  console.log('Step 2 - Valid extraction:', extractedSessionId === sessionId);
  
  // Simulate luồng từ Analysis Editor -> Sessions List
  console.log('\n📍 Flow 2: Analysis Editor -> Sessions List');
  const sessionsUrl = NavigationUtils.goToSessions();
  console.log('Step 1 - Navigate to:', sessionsUrl);
  
  console.groupEnd();
}

/**
 * Run all navigation tests
 */
export function runAllNavigationTests() {
  console.log('🚀 Running Navigation Tests...\n');
  
  try {
    testNavigationUrls();
    testSessionIdValidation();
    testBreadcrumbGeneration();
    testCompleteNavigationFlow();
    
    console.log('\n✅ All navigation tests completed!');
  } catch (error) {
    console.error('\n❌ Navigation tests failed:', error);
  }
}

/**
 * Test responsive navigation
 */
export function testResponsiveNavigation() {
  console.group('🧪 Testing Responsive Navigation');
  
  // Test mobile breadcrumb truncation
  const longSessionTitle = 'This is a very long session title that should be truncated on mobile devices for better user experience';
  const breadcrumbs = require('./navigation').createBreadcrumbItems(
    '/analysis',
    'test-session',
    longSessionTitle
  );
  
  console.log('Long title breadcrumbs:', breadcrumbs);
  console.log('Mobile truncation working:', breadcrumbs[breadcrumbs.length - 1]?.label.length < 50);
  
  console.groupEnd();
}

// Export test runner để có thể gọi từ browser console
if (typeof window !== 'undefined') {
  (window as any).runNavigationTests = runAllNavigationTests;
  (window as any).testResponsiveNav = testResponsiveNavigation;
}