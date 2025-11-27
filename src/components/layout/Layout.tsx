import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function Layout() {
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname)
  const hideSidebar = isHomePage || isAuthPage

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Navbar */}
      <Navbar />

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar (Desktop) - Hidden on home page */}
        {!hideSidebar && <Sidebar />}

        {/* Page Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 ${hideSidebar ? 'max-w-7xl' : 'max-w-6xl'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
