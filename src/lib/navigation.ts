import { useRouter } from 'next/navigation';

/**
 * Navigation constants để tránh hardcoding URLs
 */
export const NAVIGATION_PATHS = {
  SESSIONS: '/sessions',
  ANALYSIS: '/analysis',
  AUTH: {
    SIGNIN: '/auth/signin',
    SIGNUP: '/auth/signup',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
} as const;

/**
 * Navigation utility functions
 */
export class NavigationUtils {
  /**
   * Điều hướng đến Analysis Editor với session ID
   */
  static goToAnalysis(sessionId: string) {
    return `${NAVIGATION_PATHS.ANALYSIS}?sessionId=${encodeURIComponent(sessionId)}`;
  }

  /**
   * Điều hướng đến Sessions List
   */
  static goToSessions() {
    return NAVIGATION_PATHS.SESSIONS;
  }

  /**
   * Lấy session ID từ URL hiện tại
   */
  static getSessionIdFromUrl(searchParams: URLSearchParams): string | null {
    return searchParams.get('sessionId');
  }

  /**
   * Tạo URL với query parameters
   */
  static createUrlWithParams(basePath: string, params: Record<string, string | number | boolean | null | undefined>) {
    const url = new URL(basePath, window.location.origin);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
    
    return url.pathname + url.search;
  }
}

/**
 * Custom hook để sử dụng navigation utilities
 */
export function useAppNavigation() {
  const router = useRouter();

  return {
    /**
     * Điều hướng đến Analysis Editor với session ID
     */
    navigateToAnalysis: (sessionId: string) => {
      router.push(NavigationUtils.goToAnalysis(sessionId));
    },

    /**
     * Điều hướng đến Sessions List
     */
    navigateToSessions: () => {
      router.push(NavigationUtils.goToSessions());
    },

    /**
     * Điều hướng đến trang đăng nhập
     */
    navigateToSignIn: () => {
      router.push(NAVIGATION_PATHS.AUTH.SIGNIN);
    },

    /**
     * Quay lại trang trước
     */
    goBack: () => {
      router.back();
    },

    /**
     * Làm mới trang hiện tại
     */
    refresh: () => {
      router.refresh();
    },
  };
}

/**
 * Breadcrumb item type
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

/**
 * Tạo breadcrumb items cho navigation
 */
export function createBreadcrumbItems(
  currentPath: string,
  sessionId?: string | null,
  sessionTitle?: string
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    {
      label: 'Trang chủ',
      href: '/',
    },
  ];

  // Add Sessions breadcrumb
  if (currentPath.startsWith('/sessions') || currentPath.startsWith('/analysis')) {
    items.push({
      label: 'Phiên làm việc',
      href: NAVIGATION_PATHS.SESSIONS,
    });
  }

  // Add Session detail breadcrumb
  if (currentPath.startsWith('/analysis') && sessionId && sessionTitle) {
    items.push({
      label: sessionTitle,
      isActive: true,
    });
  }

  return items;
}

/**
 * Validation utilities
 */
export class NavigationValidation {
  /**
   * Kiểm tra session ID có hợp lệ không
   */
  static isValidSessionId(sessionId: string): boolean {
    return typeof sessionId === 'string' && sessionId.length > 0 && sessionId !== 'undefined' && sessionId !== 'null';
  }

  /**
   * Lấy session ID đã được validate từ search params
   */
  static getValidatedSessionId(searchParams: URLSearchParams): string | null {
    const sessionId = searchParams.get('sessionId');
    return sessionId && NavigationValidation.isValidSessionId(sessionId) ? sessionId : null;
  }
}