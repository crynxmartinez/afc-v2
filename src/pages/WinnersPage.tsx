import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Calendar, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, getPlacementEmoji, getPlacementSuffix } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import { PageSpinner } from '@/components/ui/Spinner'

interface Winner {
  id: string
  placement: number
  reactions_count: number
  prize_amount: number
  awarded_at: string
  contest: {
    id: string
    title: string
    category: string
  }
  entry: {
    id: string
    title: string
    phase_1_url: string
  }
  user: {
    id: string
    username: string
    display_name: string
    avatar_url: string
  }
}

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWinners()
  }, [])

  const fetchWinners = async () => {
    try {
      const { data, error } = await supabase
        .from('contest_winners')
        .select(`
          id,
          placement,
          reactions_count,
          prize_amount,
          awarded_at,
          contest:contests(id, title, category),
          entry:entries(id, title, phase_1_url),
          user:users(id, username, display_name, avatar_url)
        `)
        .order('awarded_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setWinners(data || [])
    } catch (error) {
      console.error('Error fetching winners:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Hall of Fame</h1>
        <p className="text-dark-400 mt-1">Celebrating our contest winners</p>
      </div>

      {winners.length === 0 ? (
        <Card className="text-center py-12">
          <Trophy className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">No winners yet. Be the first!</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {winners.map((winner) => (
            <WinnerCard key={winner.id} winner={winner} />
          ))}
        </div>
      )}
    </div>
  )
}

function WinnerCard({ winner }: { winner: Winner }) {
  return (
    <Card className="overflow-hidden">
      {/* Entry Image */}
      <Link to={`/entry/${winner.entry?.id}`}>
        <div className="aspect-video bg-dark-800 -m-4 mb-4 relative">
          {winner.entry?.phase_1_url ? (
            <img
              src={winner.entry.phase_1_url}
              alt={winner.entry.title || 'Entry'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-dark-600">
              No Image
            </div>
          )}
          {/* Placement Badge */}
          <div className="absolute top-3 left-3 px-3 py-1 bg-dark-900/80 backdrop-blur-sm rounded-full text-sm font-medium">
            {getPlacementEmoji(winner.placement)} {getPlacementSuffix(winner.placement)} Place
          </div>
        </div>
      </Link>

      {/* Winner Info */}
      <div className="space-y-3">
        <Link to={`/profile/${winner.user?.username}`} className="flex items-center gap-3 group">
          <Avatar
            src={winner.user?.avatar_url}
            alt={winner.user?.display_name || winner.user?.username || ''}
            size="md"
          />
          <div>
            <p className="font-medium text-white group-hover:text-primary-400 transition-colors">
              {winner.user?.display_name || winner.user?.username}
            </p>
            <p className="text-sm text-dark-400">@{winner.user?.username}</p>
          </div>
        </Link>

        <Link to={`/contest/${winner.contest?.id}`} className="block">
          <p className="text-sm text-dark-400">Contest</p>
          <p className="font-medium text-white hover:text-primary-400 transition-colors line-clamp-1">
            {winner.contest?.title}
          </p>
        </Link>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-dark-400">
            <Heart className="w-4 h-4" />
            {winner.reactions_count} votes
          </div>
          <div className="flex items-center gap-1 text-dark-400">
            <Calendar className="w-4 h-4" />
            {formatDate(winner.awarded_at)}
          </div>
        </div>

        {winner.prize_amount > 0 && (
          <div className="pt-2 border-t border-dark-700">
            <span className="text-sm text-dark-400">Prize: </span>
            <span className="text-primary-400 font-semibold">{winner.prize_amount} pts</span>
          </div>
        )}
      </div>
    </Card>
  )
}
