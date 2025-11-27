import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, Users, Trophy, Clock, Heart, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, getContestStatus, getTimeRemaining } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { PageSpinner } from '@/components/ui/Spinner'
import type { Contest, Entry } from '@/types'

export default function ContestDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [contest, setContest] = useState<Contest | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {
    if (id) {
      fetchContest()
    }
  }, [id])

  const fetchContest = async () => {
    try {
      // Fetch contest
      const { data: contestData, error: contestError } = await supabase
        .from('contests')
        .select('*')
        .eq('id', id)
        .single()

      if (contestError) throw contestError

      const status = getContestStatus(contestData.start_date, contestData.end_date, contestData.finalized_at)
      setContest({ ...contestData, status })

      // Fetch entries
      const { data: entriesData } = await supabase
        .from('entries')
        .select('*, user:users(id, username, display_name, avatar_url)')
        .eq('contest_id', id)
        .eq('status', 'approved')
        .order('reactions_count', { ascending: false })

      setEntries(entriesData || [])

      // Check if user has submitted
      if (user) {
        const { data: userEntry } = await supabase
          .from('entries')
          .select('id')
          .eq('contest_id', id)
          .eq('user_id', user.id)
          .single()

        setHasSubmitted(!!userEntry)
      }
    } catch (error) {
      console.error('Error fetching contest:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <PageSpinner />

  if (!contest) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">Contest not found</p>
        <Link to="/contests" className="text-primary-400 hover:text-primary-300 mt-2 inline-block">
          Back to contests
        </Link>
      </div>
    )
  }

  const statusVariant = {
    upcoming: 'warning',
    active: 'success',
    ended: 'gray',
    finalized: 'primary',
  }[contest.status || 'upcoming'] as 'warning' | 'success' | 'gray' | 'primary'

  const canSubmit = contest.status === 'active' && user && !hasSubmitted

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link to="/contests" className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to contests
      </Link>

      {/* Contest Header */}
      <Card className="overflow-hidden">
        {/* Thumbnail */}
        {contest.thumbnail_url && (
          <div className="h-48 -m-4 mb-4">
            <img src={contest.thumbnail_url} alt={contest.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={statusVariant}>{contest.status}</Badge>
                {contest.category && <Badge variant="gray">{contest.category}</Badge>}
              </div>
              <h1 className="text-2xl font-bold text-white">{contest.title}</h1>
            </div>
            {canSubmit && (
              <Link to={`/submit/${contest.id}`}>
                <Button>Submit Entry</Button>
              </Link>
            )}
          </div>

          {contest.description && (
            <p className="text-dark-300">{contest.description}</p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2 text-dark-400">
              <Calendar className="w-4 h-4" />
              <span>Ends {formatDate(contest.end_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-dark-400">
              <Users className="w-4 h-4" />
              <span>{contest.entries_count} entries</span>
            </div>
            {contest.prize_pool > 0 && (
              <div className="flex items-center gap-2 text-primary-400">
                <Trophy className="w-4 h-4" />
                <span>{contest.prize_pool} pts prize pool</span>
              </div>
            )}
            {contest.status === 'active' && (
              <div className="flex items-center gap-2 text-green-400">
                <Clock className="w-4 h-4" />
                <span>{getTimeRemaining(contest.end_date)}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Entries */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Entries ({entries.length})
        </h2>

        {entries.length === 0 ? (
          <Card className="text-center py-12">
            <Trophy className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400">No entries yet. Be the first!</p>
            {canSubmit && (
              <Link to={`/submit/${contest.id}`} className="mt-4 inline-block">
                <Button>Submit Entry</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {entries.map((entry, index) => (
              <EntryCard key={entry.id} entry={entry} rank={index + 1} isFinalized={contest.status === 'finalized'} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EntryCard({ entry, rank, isFinalized }: { entry: Entry; rank: number; isFinalized: boolean }) {
  const showRank = isFinalized && rank <= 3

  return (
    <Link to={`/entry/${entry.id}`}>
      <div className="group relative aspect-square bg-dark-800 rounded-lg overflow-hidden">
        <img
          src={entry.phase_1_url}
          alt={entry.title || 'Entry'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Rank Badge */}
        {showRank && (
          <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-dark-900/80 backdrop-blur-sm flex items-center justify-center text-lg">
            {rank === 1 && '🏆'}
            {rank === 2 && '🥈'}
            {rank === 3 && '🥉'}
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Avatar src={entry.user?.avatar_url} alt={entry.user?.username || ''} size="sm" />
              <span className="text-sm text-white truncate">
                {entry.user?.display_name || entry.user?.username}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-dark-300">
              <Heart className="w-4 h-4" />
              {entry.reactions_count}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
