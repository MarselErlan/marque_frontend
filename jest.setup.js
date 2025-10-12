import '@testing-library/jest-dom'

// Mock localStorage with actual storage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()
global.localStorage = localStorageMock

// Mock fetch and Headers
global.fetch = jest.fn()
global.Headers = jest.fn().mockImplementation(function(init) {
  const headers = {}
  if (init) {
    Object.entries(init).forEach(([key, value]) => {
      headers[key] = value
    })
  }
  return {
    ...headers,
    get: jest.fn((key) => headers[key]),
    set: jest.fn((key, value) => { headers[key] = value }),
    has: jest.fn((key) => key in headers),
    append: jest.fn((key, value) => { headers[key] = value }),
    delete: jest.fn((key) => { delete headers[key] }),
    entries: jest.fn(() => Object.entries(headers)),
    keys: jest.fn(() => Object.keys(headers)),
    values: jest.fn(() => Object.values(headers)),
    forEach: jest.fn((callback) => Object.entries(headers).forEach(([k, v]) => callback(v, k, this))),
  }
})

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
})

