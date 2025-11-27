import { Link } from 'react-router-dom'
import { Trophy, Image, Star, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import { formatNumber, getLevelTitle, calculateLevelProgress } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useAuthStore()

  if (!user) return null

  const levelProgress = calculateLevelProgress(user.xp)

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center gap-4">
        <Avatar src={user.avatar_url} alt={user.display_name || user.username} size="xl" />
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user.display_name || user.username}!
          </h1>
          <p className="text-dark-400">
            Level {user.level} • {getLevelTitle(user.level)}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Wins"
          value={user.wins_count}
          color="text-yellow-400"
        />
        <StatCard
          icon={<Image className="w-5 h-5" />}
          label="Entries"
          value={user.entries_count}
          color="text-blue-400"
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Points"
          value={user.points_balance}
          color="text-green-400"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="XP"
          value={user.xp}
          color="text-purple-400"
        />
      </div>

      {/* XP Progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-dark-400">Level Progress</span>
          <span className="text-sm text-white">
            {formatNumber(user.xp)} / {formatNumber(levelProgress.next)} XP
          </span>
        </div>
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full gradient-bg rounded-full transition-all duration-500"
            style={{ width: `${levelProgress.progress}%` }}
          />
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/contests">
          <Card hover className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Browse Contests</h3>
              <p className="text-sm text-dark-400">Find a contest to join</p>
            </div>
          </Card>
        </Link>
        <Link to="/my-entries">
          <Card hover className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Image className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">My Entries</h3>
              <p className="text-sm text-dark-400">View your submissions</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <Card className="text-center">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-dark-800 ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{formatNumber(value)}</p>
      <p className="text-sm text-dark-400">{label}</p>
    </Card>
  )
}
