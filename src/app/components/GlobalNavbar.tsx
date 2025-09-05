"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import DarkModeToggle from "./DarkModeToggle"
import LogoutButton from "./LogoutButton"

export default function GlobalNavbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) {
    return null // Don't show navbar for unauthenticated users
  }

  const navigationItems = [
    {
      href: "/dashboard",
      label: "Invoices",
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      href: "/clients",
      label: "Clients",
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      href: "/invoice-design",
      label: "Invoice Design",
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
      )
    }
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/invoices" || pathname.startsWith("/invoices/")
    }
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-8">BillCraft</h1>
          
          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'text-gray-700 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="ml-64">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {pathname === "/dashboard" && "Dashboard"}
                {pathname === "/clients" && "Clients"}
                {pathname === "/invoice-design" && "Invoice Design"}
                {pathname.startsWith("/invoices") && "Invoices"}
                {pathname === "/settings" && "Settings"}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {pathname === "/dashboard" && "Manage your invoices and business"}
                {pathname === "/clients" && "Manage your clients and contacts"}
                {pathname === "/invoice-design" && "Customize your invoice templates and branding"}
                {pathname.startsWith("/invoices") && "Create and manage your invoices"}
                {pathname === "/settings" && "Manage your account settings"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <DarkModeToggle />
              
              {/* Profile Button */}
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {(session.user?.name || session.user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {session.user?.name || 'User'}
                  </span>
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          {/* This will be replaced by the actual page content */}
        </div>
      </div>
    </div>
  )
}
