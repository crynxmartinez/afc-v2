import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Trophy, 
  Award, 
  BarChart3,
  User,
  X,
  LayoutDashboard,
  Image,
  Settings,
  Shield,
  LogIn,
  UserPlus
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'

export default function MobileNav() {
  const { user, isAuthenticated, isAdmin } = useAuthStore()
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore()

  if (!isMobileMenuOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={closeMobileMenu}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-dark-900 border-r border-dark-700 z-50 lg:hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AFC</span>
            </div>
            <span className="text-lg font-bold gradient-text">AFC</span>
          </div>
          <button
            onClick={closeMobileMenu}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        {isAuthenticated && user && (
          <div className="p-4 border-b border-dark-700">
            <div className="flex items-center gap-3">
              <Avatar
                src={user.avatar_url}
                alt={user.display_name || user.username}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">
                  {user.display_name || user.username}
                </p>
                <p className="text-sm text-dark-400 truncate">@{user.username}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Main Navigation */}
          <div>
            <h3 className="px-3 mb-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">
              Explore
            </h3>
            <ul className="space-y-1">
              <MobileNavItem href="/" icon={<Home className="w-5 h-5" />} label="Home" onClick={closeMobileMenu} />
              <MobileNavItem href="/contests" icon={<Trophy className="w-5 h-5" />} label="Contests" onClick={closeMobileMenu} />
              <MobileNavItem href="/winners" icon={<Award className="w-5 h-5" />} label="Winners" onClick={closeMobileMenu} />
              <MobileNavItem href="/leaderboard" icon={<BarChart3 className="w-5 h-5" />} label="Leaderboard" onClick={closeMobileMenu} />
            </ul>
          </div>

          {/* User Navigation */}
          {isAuthenticated ? (
            <div>
              <h3 className="px-3 mb-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                My Account
              </h3>
              <ul className="space-y-1">
                <MobileNavItem href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" onClick={closeMobileMenu} />
                <MobileNavItem href="/my-entries" icon={<Image className="w-5 h-5" />} label="My Entries" onClick={closeMobileMenu} />
                <MobileNavItem href={`/profile/${user?.username}`} icon={<User className="w-5 h-5" />} label="Profile" onClick={closeMobileMenu} />
                <MobileNavItem href="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" onClick={closeMobileMenu} />
              </ul>
            </div>
          ) : (
            <div>
              <h3 className="px-3 mb-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                Account
              </h3>
              <ul className="space-y-1">
                <MobileNavItem href="/login" icon={<LogIn className="w-5 h-5" />} label="Login" onClick={closeMobileMenu} />
                <MobileNavItem href="/register" icon={<UserPlus className="w-5 h-5" />} label="Sign Up" onClick={closeMobileMenu} />
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
                <MobileNavItem href="/admin" icon={<Shield className="w-5 h-5" />} label="Admin Panel" onClick={closeMobileMenu} isAdmin />
              </ul>
            </div>
          )}
        </nav>
      </div>
    </>
  )
}

interface MobileNavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  isAdmin?: boolean
}

function MobileNavItem({ href, icon, label, onClick, isAdmin }: MobileNavItemProps) {
  return (
    <li>
      <NavLink
        to={href}
        end={href === '/'}
        onClick={onClick}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            isActive
              ? isAdmin
                ? 'bg-red-500/10 text-red-400'
                : 'bg-primary-500/10 text-primary-400'
              : 'text-dark-300 hover:text-white hover:bg-dark-800'
          )
        }
      >
        {icon}
        {label}
      </NavLink>
    </li>
  )
}
