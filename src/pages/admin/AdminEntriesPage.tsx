import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/stores/uiStore'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Input from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'

interface EntryWithDetails {
  id: string
  title: string | null
  phase_1_url: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  created_at: string
  user: { id: string; username: string; display_name: string | null; avatar_url: string | null }
  contest: { id: string; title: string }
}

export default function AdminEntriesPage() {
  const toast = useToast()
  const [entries, setEntries] = useState<EntryWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    fetchEntries()
  }, [filter])

  const fetchEntries = async () => {
    try {
      setIsLoading(true)
      let query = supabase
        .from('entries')
        .select(`
          id, title, phase_1_url, status, rejection_reason, created_at,
          user:users(id, username, display_name, avatar_url),
          contest:contests(id, title)
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query.limit(50)

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('entries')
        // @ts-ignore - Supabase types not generated yet
        .update({ status: 'approved', rejection_reason: null })
        .eq('id', entryId)

      if (error) throw error

      setEntries(prev => prev.map(e => 
        e.id === entryId ? { ...e, status: 'approved' as const, rejection_reason: null } : e
      ))
      toast.success('Entry approved', 'The entry is now visible.')
    } catch (error) {
      console.error('Error approving entry:', error)
      toast.error('Error', 'Failed to approve entry.')
    }
  }

  const handleReject = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('entries')
        // @ts-ignore - Supabase types not generated yet
        .update({ status: 'rejected', rejection_reason: rejectionReason || null })
        .eq('id', entryId)

      if (error) throw error

      setEntries(prev => prev.map(e => 
        e.id === entryId ? { ...e, status: 'rejected' as const, rejection_reason: rejectionReason || null } : e
      ))
      toast.success('Entry rejected', 'The entry has been rejected.')
      setRejectingId(null)
      setRejectionReason('')
    } catch (error) {
      console.error('Error rejecting entry:', error)
      toast.error('Error', 'Failed to reject entry.')
    }
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Entries</h1>
          <p className="text-dark-400 mt-1">Approve or reject submissions</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-dark-800 rounded-lg p-1">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
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

      {entries.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-dark-400">No {filter === 'all' ? '' : filter} entries</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <Card key={entry.id} className="overflow-hidden">
              {/* Image */}
              <Link to={`/entry/${entry.id}`}>
                <div className="aspect-video bg-dark-800 -m-4 mb-4 relative">
                  <img
                    src={entry.phase_1_url}
                    alt={entry.title || 'Entry'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge 
                      variant={
                        entry.status === 'approved' ? 'success' : 
                        entry.status === 'rejected' ? 'danger' : 'warning'
                      }
                    >
                      {entry.status}
                    </Badge>
                  </div>
                </div>
              </Link>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar src={entry.user?.avatar_url} alt={entry.user?.username || ''} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {entry.user?.display_name || entry.user?.username}
                    </p>
                    <p className="text-xs text-dark-400">{formatRelativeTime(entry.created_at)}</p>
                  </div>
                </div>

                <Link 
                  to={`/contest/${entry.contest?.id}`}
                  className="text-sm text-dark-400 hover:text-primary-400 flex items-center gap-1"
                >
                  {entry.contest?.title}
                  <ExternalLink className="w-3 h-3" />
                </Link>

                {entry.status === 'rejected' && entry.rejection_reason && (
                  <p className="text-sm text-red-400 bg-red-500/10 p-2 rounded">
                    {entry.rejection_reason}
                  </p>
                )}

                {/* Actions */}
                {entry.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    {rejectingId === entry.id ? (
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Rejection reason (optional)"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="danger" onClick={() => handleReject(entry.id)}>
                            Confirm
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1"
                          leftIcon={<Check className="w-4 h-4" />}
                          onClick={() => handleApprove(entry.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="flex-1"
                          leftIcon={<X className="w-4 h-4" />}
                          onClick={() => setRejectingId(entry.id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
