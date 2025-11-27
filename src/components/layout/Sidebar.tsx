import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Trophy, 
  Award, 
  BarChart3,
  Settings,
  LayoutDashboard,
  Image,
  Shield,
  FileCheck,
  UserCog
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const publicNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: <Home className="w-5 h-5" /> },
  { label: 'Contests', href: '/contests', icon: <Trophy className="w-5 h-5" /> },
  { label: 'Winners', href: '/winners', icon: <Award className="w-5 h-5" /> },
  { label: 'Leaderboard', href: '/leaderboard', icon: <BarChart3 className="w-5 h-5" /> },
]

const userNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'My Entries', href: '/my-entries', icon: <Image className="w-5 h-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
]

const adminNavItems: NavItem[] = [
  { label: 'Admin Panel', href: '/admin', icon: <Shield className="w-5 h-5" /> },
  { label: 'Manage Contests', href: '/admin/contests', icon: <Trophy className="w-5 h-5" /> },
  { label: 'Review Entries', href: '/admin/entries', icon: <FileCheck className="w-5 h-5" /> },
  { label: 'Manage Users', href: '/admin/users', icon: <UserCog className="w-5 h-5" /> },
]

export default function Sidebar() {
  const { isAuthenticated, isAdmin } = useAuthStore()

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-dark-900 border-r border-dark-700 min-h-[calc(100vh-4rem)]">
      <nav className="flex-1 p-4 space-y-6">
        {/* Public Navigation */}
        <div>
          <h3 className="px-3 mb-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">
            Explore
          </h3>
          <ul className="space-y-1">
            {publicNavItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'text-dark-300 hover:text-white hover:bg-dark-800'
                    )
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* User Navigation */}
        {isAuthenticated && (
          <div>
            <h3 className="px-3 mb-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">
              My Account
            </h3>
            <ul className="space-y-1">
              {userNavItems.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-500/10 text-primary-400'
                          : 'text-dark-300 hover:text-white hover:bg-dark-800'
                      )
                    }
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Admin Navigation */}
        {isAdmin && (
          <div>
            <h3 className="px-3 mb-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">
              Admin
            </h3>
            <ul className="space-y-1">
              {adminNavItems.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-red-500/10 text-red-400'
                          : 'text-dark-300 hover:text-white hover:bg-dark-800'
                      )
                    }
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-700">
        <div className="text-center text-xs text-dark-500">
          <p>AFC v2.0</p>
          <p className="mt-1">© 2024 Arena for Creatives</p>
        </div>
      </div>
    </aside>
  )
}
