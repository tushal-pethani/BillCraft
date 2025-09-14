import useSWR, { mutate } from 'swr'

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Cache keys
export const CACHE_KEYS = {
  INVOICES: '/api/invoices',
  CLIENTS: '/api/clients',
  TEMPLATES: '/api/templates',
  BUSINESS: '/api/business',
} as const

// Custom hooks with proper caching
export function useInvoices() {
  const { data, error, isLoading } = useSWR(CACHE_KEYS.INVOICES, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
    errorRetryCount: 3,
  })

  return {
    invoices: data?.invoices || [],
    isLoading,
    error,
    mutate: () => mutate(CACHE_KEYS.INVOICES),
  }
}

export function useClients() {
  const { data, error, isLoading } = useSWR(CACHE_KEYS.CLIENTS, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
    errorRetryCount: 3,
  })

  return {
    clients: data?.clients || [],
    isLoading,
    error,
    mutate: () => mutate(CACHE_KEYS.CLIENTS),
  }
}

export function useTemplates() {
  const { data, error, isLoading } = useSWR(CACHE_KEYS.TEMPLATES, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
    errorRetryCount: 3,
  })

  return {
    templates: data?.templates || [],
    isLoading,
    error,
    mutate: () => mutate(CACHE_KEYS.TEMPLATES),
  }
}

export function useBusiness() {
  const { data, error, isLoading } = useSWR(CACHE_KEYS.BUSINESS, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 300000, // 5 minutes
    errorRetryCount: 3,
  })

  return {
    business: data?.business || null,
    isLoading,
    error,
    mutate: () => mutate(CACHE_KEYS.BUSINESS),
  }
}

// Utility functions for cache invalidation
export function invalidateInvoices() {
  return mutate(CACHE_KEYS.INVOICES)
}

export function invalidateClients() {
  return mutate(CACHE_KEYS.CLIENTS)
}

export function invalidateTemplates() {
  return mutate(CACHE_KEYS.TEMPLATES)
}

export function invalidateBusiness() {
  return mutate(CACHE_KEYS.BUSINESS)
}

// Optimistic updates for better UX
export async function optimisticUpdateInvoice(invoiceId: string, updates: any) {
  // Optimistically update the cache
  mutate(CACHE_KEYS.INVOICES, (data: any) => {
    if (!data) return data
    return {
      ...data,
      invoices: data.invoices.map((inv: any) => 
        inv.id === invoiceId ? { ...inv, ...updates } : inv
      )
    }
  }, false)

  // Make the actual API call
  try {
    const response = await fetch('/api/invoices', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: invoiceId, ...updates })
    })
    
    if (!response.ok) {
      // Revert on error
      mutate(CACHE_KEYS.INVOICES)
      throw new Error('Failed to update invoice')
    }
    
    // Revalidate to ensure consistency
    mutate(CACHE_KEYS.INVOICES)
  } catch (error) {
    // Revert on error
    mutate(CACHE_KEYS.INVOICES)
    throw error
  }
}

export async function optimisticDeleteInvoice(invoiceId: string) {
  // Optimistically update the cache
  mutate(CACHE_KEYS.INVOICES, (data: any) => {
    if (!data) return data
    return {
      ...data,
      invoices: data.invoices.filter((inv: any) => inv.id !== invoiceId)
    }
  }, false)

  // Make the actual API call
  try {
    const response = await fetch(`/api/invoices?id=${invoiceId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      // Revert on error
      mutate(CACHE_KEYS.INVOICES)
      throw new Error('Failed to delete invoice')
    }
    
    // Revalidate to ensure consistency
    mutate(CACHE_KEYS.INVOICES)
  } catch (error) {
    // Revert on error
    mutate(CACHE_KEYS.INVOICES)
    throw error
  }
}

export async function optimisticDeleteClient(clientId: string) {
  // Optimistically update the cache
  mutate(CACHE_KEYS.CLIENTS, (data: any) => {
    if (!data) return data
    return {
      ...data,
      clients: data.clients.filter((client: any) => client.id !== clientId)
    }
  }, false)

  // Make the actual API call
  try {
    const response = await fetch(`/api/clients?id=${clientId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      // Revert on error
      mutate(CACHE_KEYS.CLIENTS)
      throw new Error('Failed to delete client')
    }
    
    // Revalidate to ensure consistency
    mutate(CACHE_KEYS.CLIENTS)
  } catch (error) {
    // Revert on error
    mutate(CACHE_KEYS.CLIENTS)
    throw error
  }
}

export async function optimisticDeleteTemplate(templateId: string) {
  // Optimistically update the cache
  mutate(CACHE_KEYS.TEMPLATES, (data: any) => {
    if (!data) return data
    return {
      ...data,
      templates: data.templates.filter((template: any) => template.id !== templateId)
    }
  }, false)

  // Make the actual API call
  try {
    const response = await fetch(`/api/templates?id=${templateId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      // Revert on error
      mutate(CACHE_KEYS.TEMPLATES)
      throw new Error('Failed to delete template')
    }
    
    // Revalidate to ensure consistency
    mutate(CACHE_KEYS.TEMPLATES)
  } catch (error) {
    // Revert on error
    mutate(CACHE_KEYS.TEMPLATES)
    throw error
  }
}
