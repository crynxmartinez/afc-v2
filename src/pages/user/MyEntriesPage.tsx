import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Image, Heart, MessageCircle, Calendar, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatRelativeTime } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'

interface EntryWithContest {
  id: string
  title: string | null
  phase_1_url: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  reactions_count: number
  comments_count: number
  created_at: string
  contest: {
    id: string
    title: string
  }
}

export default function MyEntriesPage() {
  const { user } = useAuthStore()
  const [entries, setEntries] = useState<EntryWithContest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all')

  useEffect(() => {
    if (user) {
      fetchEntries()
    }
  }, [user])

  const fetchEntries = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('entries')
        .select(`
          id,
          title,
          phase_1_url,
          status,
          rejection_reason,
          reactions_count,
          comments_count,
          created_at,
          contest:contests(id, title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return true
    return entry.status === filter
  })

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Entries</h1>
          <p className="text-dark-400 mt-1">Your contest submissions</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-dark-800 rounded-lg p-1">
          {(['all', 'approved', 'pending', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                filter === status ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <Card className="text-center py-12">
          <Image className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">
            {filter === 'all' ? 'No entries yet' : `No ${filter} entries`}
          </p>
          <Link to="/contests" className="text-primary-400 hover:text-primary-300 mt-2 inline-block">
            Browse contests to submit
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

function EntryCard({ entry }: { entry: EntryWithContest }) {
  const statusVariant = {
    approved: 'success',
    pending: 'warning',
    rejected: 'danger',
    draft: 'gray',
  }[entry.status] as 'success' | 'warning' | 'danger' | 'gray'

  return (
    <Card className="overflow-hidden">
      <Link to={`/entry/${entry.id}`}>
        <div className="aspect-video bg-dark-800 -m-4 mb-4 relative">
          <img
            src={entry.phase_1_url}
            alt={entry.title || 'Entry'}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <Badge variant={statusVariant}>{entry.status}</Badge>
          </div>
        </div>
      </Link>

      <div className="space-y-3">
        <div>
          <h3 className="font-medium text-white line-clamp-1">
            {entry.title || 'Untitled Entry'}
          </h3>
          <Link 
            to={`/contest/${entry.contest?.id}`}
            className="text-sm text-dark-400 hover:text-primary-400 flex items-center gap-1"
          >
            {entry.contest?.title}
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {entry.status === 'rejected' && entry.rejection_reason && (
          <p className="text-sm text-red-400 bg-red-500/10 p-2 rounded">
            {entry.rejection_reason}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-dark-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {entry.reactions_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {entry.comments_count}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatRelativeTime(entry.created_at)}
          </span>
        </div>
      </div>
    </Card>
  )
}
