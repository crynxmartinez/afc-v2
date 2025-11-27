import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Calendar, Users, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, getContestStatus } from '@/lib/utils'
import { useToast } from '@/stores/uiStore'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import type { Contest } from '@/types'

export default function AdminContestsPage() {
  const toast = useToast()
  const [contests, setContests] = useState<Contest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('contests')
        .delete()
        .eq('id', deleteId)

      if (error) throw error

      setContests(prev => prev.filter(c => c.id !== deleteId))
      toast.success('Contest deleted', 'The contest has been removed.')
    } catch (error) {
      console.error('Error deleting contest:', error)
      toast.error('Error', 'Failed to delete contest.')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleFinalize = async (contestId: string) => {
    try {
      const { error } = await supabase.rpc('finalize_contest_and_select_winners', {
        p_contest_id: contestId
      })

      if (error) throw error

      toast.success('Contest finalized', 'Winners have been selected.')
      fetchContests()
    } catch (error) {
      console.error('Error finalizing contest:', error)
      toast.error('Error', 'Failed to finalize contest.')
    }
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Contests</h1>
          <p className="text-dark-400 mt-1">Create and manage art contests</p>
        </div>
        <Link to="/admin/contests/create">
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Create Contest
          </Button>
        </Link>
      </div>

      {contests.length === 0 ? (
        <Card className="text-center py-12">
          <Trophy className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">No contests yet</p>
          <Link to="/admin/contests/create" className="mt-4 inline-block">
            <Button>Create First Contest</Button>
          </Link>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left p-4 text-dark-400 font-medium">Contest</th>
                  <th className="text-left p-4 text-dark-400 font-medium">Status</th>
                  <th className="text-left p-4 text-dark-400 font-medium">Dates</th>
                  <th className="text-left p-4 text-dark-400 font-medium">Entries</th>
                  <th className="text-left p-4 text-dark-400 font-medium">Prize</th>
                  <th className="text-right p-4 text-dark-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {contests.map((contest) => {
                  const statusVariant = {
                    upcoming: 'warning',
                    active: 'success',
                    ended: 'gray',
                    finalized: 'primary',
                  }[contest.status || 'upcoming'] as 'warning' | 'success' | 'gray' | 'primary'

                  return (
                    <tr key={contest.id} className="hover:bg-dark-800">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {contest.thumbnail_url && (
                            <img
                              src={contest.thumbnail_url}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-white">{contest.title}</p>
                            {contest.category && (
                              <p className="text-sm text-dark-400">{contest.category}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={statusVariant}>{contest.status}</Badge>
                      </td>
                      <td className="p-4 text-sm text-dark-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(contest.start_date)} - {formatDate(contest.end_date)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-dark-400">
                          <Users className="w-4 h-4" />
                          {contest.entries_count}
                        </div>
                      </td>
                      <td className="p-4 text-primary-400">
                        {contest.prize_pool > 0 ? `${contest.prize_pool} pts` : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {contest.status === 'ended' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleFinalize(contest.id)}
                            >
                              Finalize
                            </Button>
                          )}
                          <Link to={`/admin/contests/edit/${contest.id}`}>
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(contest.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Contest"
        message="Are you sure you want to delete this contest? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
