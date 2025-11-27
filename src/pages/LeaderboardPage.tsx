import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Heart, Image } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatNumber } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'

interface LeaderboardUser {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  xp: number
  level: number
  wins_count: number
  entries_count: number
  total_reactions_received: number
}

type SortBy = 'xp' | 'wins' | 'reactions'

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortBy>('xp')

  useEffect(() => {
    fetchLeaderboard()
  }, [sortBy])

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true)
      
      let orderColumn = 'xp'
      if (sortBy === 'wins') orderColumn = 'wins_count'
      if (sortBy === 'reactions') orderColumn = 'total_reactions_received'

      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url, xp, level, wins_count, entries_count, total_reactions_received')
        .order(orderColumn, { ascending: false })
        .limit(50)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-dark-400 mt-1">Top artists in the community</p>
        </div>

        {/* Sort Tabs */}
        <div className="flex bg-dark-800 rounded-lg p-1">
          <button
            onClick={() => setSortBy('xp')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'xp' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'
            }`}
          >
            XP
          </button>
          <button
            onClick={() => setSortBy('wins')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'wins' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'
            }`}
          >
            Wins
          </button>
          <button
            onClick={() => setSortBy('reactions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'reactions' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'
            }`}
          >
            Reactions
          </button>
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : users.length === 0 ? (
        <Card className="text-center py-12">
          <Trophy className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">No users yet</p>
        </Card>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-dark-700">
            {users.map((user, index) => (
              <LeaderboardRow key={user.id} user={user} rank={index + 1} sortBy={sortBy} />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function LeaderboardRow({ user, rank, sortBy }: { user: LeaderboardUser; rank: number; sortBy: SortBy }) {
  const getRankStyle = () => {
    if (rank === 1) return 'text-yellow-400 font-bold'
    if (rank === 2) return 'text-gray-300 font-bold'
    if (rank === 3) return 'text-amber-600 font-bold'
    return 'text-dark-400'
  }

  const getRankEmoji = () => {
    if (rank === 1) return '🏆'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-dark-800 transition-colors">
      {/* Rank */}
      <div className={`w-8 text-center ${getRankStyle()}`}>
        {getRankEmoji() || `#${rank}`}
      </div>

      {/* User Info */}
      <Link to={`/profile/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar src={user.avatar_url} alt={user.display_name || user.username} size="md" />
        <div className="min-w-0">
          <p className="font-medium text-white truncate">
            {user.display_name || user.username}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-400">@{user.username}</span>
            <Badge variant="primary" size="sm">Lv.{user.level}</Badge>
          </div>
        </div>
      </Link>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1 text-dark-400">
          <Trophy className="w-4 h-4" />
          <span>{user.wins_count}</span>
        </div>
        <div className="flex items-center gap-1 text-dark-400">
          <Image className="w-4 h-4" />
          <span>{user.entries_count}</span>
        </div>
        <div className="flex items-center gap-1 text-dark-400">
          <Heart className="w-4 h-4" />
          <span>{formatNumber(user.total_reactions_received)}</span>
        </div>
      </div>

      {/* Main Stat */}
      <div className="text-right">
        <p className="text-lg font-bold text-white">
          {sortBy === 'xp' && formatNumber(user.xp)}
          {sortBy === 'wins' && user.wins_count}
          {sortBy === 'reactions' && formatNumber(user.total_reactions_received)}
        </p>
        <p className="text-xs text-dark-400">
          {sortBy === 'xp' && 'XP'}
          {sortBy === 'wins' && 'Wins'}
          {sortBy === 'reactions' && 'Reactions'}
        </p>
      </div>
    </div>
  )
}
