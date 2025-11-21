import '@testing-library/jest-dom'

// Mock Web APIs for Node.js environment
global.Request = class Request {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = init.method || 'GET'
    this.headers = new Map()
    if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key, value)
      })
    }
    this._body = init.body || null
  }

  async json() {
    if (!this._body) throw new Error('No body')
    return JSON.parse(this._body)
  }

  async text() {
    return this._body || ''
  }

  clone() {
    return new Request(this.url, {
      method: this.method,
      headers: Object.fromEntries(this.headers),
      body: this._body
    })
  }
}

global.Response = class Response {
  constructor(body = null, init = {}) {
    this.status = init.status || 200
    this._body = body
  }

  async json() {
    return this._body
  }

  async text() {
    return JSON.stringify(this._body)
  }
}

global.fetch = jest.fn()

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Next.js image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}))

// Mock window.matchMedia (only in jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Mock IntersectionObserver (only in jsdom environment)
if (typeof window !== 'undefined') {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))

  // Mock ResizeObserver (only in jsdom environment)
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
}

// Suppress console warnings in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})