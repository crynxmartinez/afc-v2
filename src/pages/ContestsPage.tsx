import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Calendar, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getContestStatus, formatDate } from '@/lib/utils'
import type { Contest } from '@/types'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'

type StatusFilter = 'all' | 'upcoming' | 'active' | 'ended' | 'finalized'

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchContests()
  }, [])

  const fetchContests = async () => {
    try {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Add computed status to each contest
      const contestsWithStatus = (data || []).map(contest => ({
        ...contest,
        status: getContestStatus(contest.start_date, contest.end_date, contest.finalized_at)
      }))

      setContests(contestsWithStatus)
    } catch (error) {
      console.error('Error fetching contests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredContests = contests.filter(contest => {
    const matchesStatus = statusFilter === 'all' || contest.status === statusFilter
    const matchesSearch = contest.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Contests</h1>
        <p className="text-dark-400 mt-1">Browse and join art competitions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search contests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dark-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="finalized">Finalized</option>
          </select>
        </div>
      </div>

      {/* Contest Grid */}
      {filteredContests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-dark-400">No contests found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ContestCardProps {
  contest: Contest
}

function ContestCard({ contest }: ContestCardProps) {
  const statusVariant = {
    upcoming: 'warning',
    active: 'success',
    ended: 'gray',
    finalized: 'primary',
  }[contest.status || 'upcoming'] as 'warning' | 'success' | 'gray' | 'primary'

  return (
    <Link to={`/contest/${contest.id}`}>
      <Card hover className="overflow-hidden">
        {/* Thumbnail */}
        <div className="aspect-video bg-dark-800 -m-4 mb-4">
          {contest.thumbnail_url ? (
            <img
              src={contest.thumbnail_url}
              alt={contest.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-dark-600">
              No Image
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white line-clamp-1">{contest.title}</h3>
            <Badge variant={statusVariant}>{contest.status}</Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-dark-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(contest.end_date)}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {contest.entries_count} entries
            </div>
          </div>

          {contest.status === 'finalized' && contest.prize_pool > 0 && (
            <div className="text-sm">
              <span className="text-dark-400">Prize Pool: </span>
              <span className="text-primary-400 font-medium">{contest.prize_pool} pts</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
