"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
// Removed local AppLayout to use GlobalNavbar layout

interface Client {
  id: string
  gstNumber: string | null
  name: string
  address: string | null
  state: string | null
  gstData: any
  invoices: any[]
}

export default function ClientsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null)

  if (!session) {
    router.push("/") // redirect to signup/login if not logged in
    return null
  }

  // Load clients and check business status on component mount
  useEffect(() => {
    loadClients()
    checkBusinessStatus()
  }, [])

  const checkBusinessStatus = async () => {
    try {
      const response = await fetch('/api/business')
      if (response.ok) {
        const data = await response.json()
        setHasBusiness(!!data.business)
      } else {
        setHasBusiness(false)
      }
    } catch (error) {
      console.error('Failed to check business status:', error)
      setHasBusiness(false)
    }
  }

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Sending GST number:', gstNumber)
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gstNumber })
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        setGstNumber('')
        setShowAddForm(false)
        loadClients()
        checkBusinessStatus() // Refresh business status
      } else {
        setError(data.error || 'Failed to add client')
      }
    } catch (error) {
      console.error('Error adding client:', error)
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const deleteClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients?id=${clientId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadClients()
        setDeletingClient(null)
      } else {
        const data = await response.json()
        console.error('Failed to delete client:', data.error)
      }
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      {/* Header with Add Client Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Clients</h1>
        <button 
          onClick={() => {
            if (hasBusiness === false) {
              router.push('/business')
            } else {
              setShowAddForm(true)
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>{hasBusiness === false ? 'Set Up Business First' : 'Add Client'}</span>
        </button>
      </div>

      {/* Add Client Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Add New Client
            </h3>
            
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {error}
          {(error.includes("business information first") || hasBusiness === false) && (
            <div className="mt-2">
              <button
                onClick={() => router.push('/business')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                Set up your business information here
              </button>
            </div>
          )}
        </div>
      )}

            <form onSubmit={handleAddClient}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GST Number *
                </label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter GST number (e.g., 23AAACR5055K2ZE)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  We'll validate the GST number and fetch company details automatically
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setError('')
                    setGstNumber('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Validating...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clients Grid */}
      {clients.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
            <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No clients yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Add your first client by entering their GST number</p>
            <button 
              onClick={() => {
                if (hasBusiness === false) {
                  router.push('/business')
                } else {
                  setShowAddForm(true)
                }
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {hasBusiness === false ? 'Set Up Business First' : 'Add First Client'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div 
              key={client.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/clients/${client.id}`)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-medium text-lg">
                          {getInitials(client.name)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{client.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{client.gstNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingClient(client)
                    }}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                    title="Delete client"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-medium">Address:</span> {client.address || 'Not available'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-medium">State:</span> {client.state || 'Not available'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.gstData?.status)}`}>
                      {client.gstData?.status || 'Unknown'}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {client.invoices?.length || 0} invoices
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Click to view invoices</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Delete Client
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{deletingClient.name}"? This action cannot be undone.
              <br />
              <span className="text-sm text-gray-500 dark:text-gray-500">
                Note: Invoices for this client will not be deleted.
              </span>
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setDeletingClient(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteClient(deletingClient.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
