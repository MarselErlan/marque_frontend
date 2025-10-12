import { renderHook, act } from '@testing-library/react'
import { CatalogProvider, useCatalog } from '@/contexts/CatalogContext'

describe('CatalogContext', () => {
  it('should provide initial state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider>{children}</CatalogProvider>
    )

    const { result } = renderHook(() => useCatalog(), { wrapper })

    expect(result.current.isOpen).toBe(false)
  })

  it('should open catalog', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider>{children}</CatalogProvider>
    )

    const { result } = renderHook(() => useCatalog(), { wrapper })

    act(() => {
      result.current.openCatalog()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('should close catalog', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider>{children}</CatalogProvider>
    )

    const { result } = renderHook(() => useCatalog(), { wrapper })

    act(() => {
      result.current.openCatalog()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.closeCatalog()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('should toggle catalog', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider>{children}</CatalogProvider>
    )

    const { result } = renderHook(() => useCatalog(), { wrapper })

    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.toggleCatalog()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.toggleCatalog()
    })
    expect(result.current.isOpen).toBe(false)
  })
})

