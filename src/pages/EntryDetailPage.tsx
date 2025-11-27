import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Heart, MessageCircle, ArrowLeft, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatRelativeTime } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { PageSpinner } from '@/components/ui/Spinner'
import type { Entry, Comment } from '@/types'

const REACTION_TYPES = ['❤️', '🔥', '👏', '😍', '🎨'] as const

export default function EntryDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [entry, setEntry] = useState<Entry | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activePhase, setActivePhase] = useState(1)

  useEffect(() => {
    if (id) {
      fetchEntry()
    }
  }, [id])

  const fetchEntry = async () => {
    try {
      // Fetch entry with user and contest
      // @ts-ignore - Supabase types not generated
      const { data: entryData, error: entryError } = await supabase
        .from('entries')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url),
          contest:contests(id, title, start_date, end_date, finalized_at)
        `)
        .eq('id', id)
        .single()

      if (entryError) throw entryError
      setEntry(entryData)

      // Fetch comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, user:users(id, username, display_name, avatar_url)')
        .eq('entry_id', id)
        .order('created_at', { ascending: true })

      setComments(commentsData || [])

      // Check user's reaction
      if (user) {
        const { data: reactionData } = await supabase
          .from('reactions')
          .select('reaction_type')
          .eq('entry_id', id)
          .eq('user_id', user.id)
          .single()

        setUserReaction(reactionData?.reaction_type || null)
      }
    } catch (error) {
      console.error('Error fetching entry:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReaction = async (reactionType: string) => {
    if (!user || !entry) return

    try {
      if (userReaction === reactionType) {
        // Remove reaction
        await supabase
          .from('reactions')
          .delete()
          .eq('entry_id', entry.id)
          .eq('user_id', user.id)
        setUserReaction(null)
        setEntry(prev => prev ? { ...prev, reactions_count: prev.reactions_count - 1 } : null)
      } else {
        if (userReaction) {
          // Update reaction
          await supabase
            .from('reactions')
            .update({ reaction_type: reactionType })
            .eq('entry_id', entry.id)
            .eq('user_id', user.id)
        } else {
          // Add reaction
          await supabase
            .from('reactions')
            .insert({ entry_id: entry.id, user_id: user.id, reaction_type: reactionType })
          setEntry(prev => prev ? { ...prev, reactions_count: prev.reactions_count + 1 } : null)
        }
        setUserReaction(reactionType)
      }
    } catch (error) {
      console.error('Error handling reaction:', error)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !entry || !newComment.trim()) return

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ entry_id: entry.id, user_id: user.id, content: newComment.trim() })
        .select('*, user:users(id, username, display_name, avatar_url)')
        .single()

      if (error) throw error
      setComments(prev => [...prev, data])
      setNewComment('')
      setEntry(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null)
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <PageSpinner />

  if (!entry) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">Entry not found</p>
        <Link to="/contests" className="text-primary-400 hover:text-primary-300 mt-2 inline-block">
          Browse contests
        </Link>
      </div>
    )
  }

  const phases = [
    { num: 1, url: entry.phase_1_url, label: 'Sketch' },
    { num: 2, url: entry.phase_2_url, label: 'Lineart' },
    { num: 3, url: entry.phase_3_url, label: 'Color' },
    { num: 4, url: entry.phase_4_url, label: 'Final' },
  ].filter(p => p.url)

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link 
        to={`/contest/${entry.contest?.id}`} 
        className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to contest
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <Card padding="none" className="overflow-hidden">
            <div className="aspect-square bg-dark-800">
              <img
                src={phases[activePhase - 1]?.url || entry.phase_1_url}
                alt={entry.title || 'Entry'}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Phase Selector */}
            {phases.length > 1 && (
              <div className="flex gap-2 p-4 border-t border-dark-700">
                {phases.map((phase) => (
                  <button
                    key={phase.num}
                    onClick={() => setActivePhase(phase.num)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      activePhase === phase.num
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-800 text-dark-400 hover:text-white'
                    }`}
                  >
                    {phase.label}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Reactions */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {REACTION_TYPES.map((reaction) => (
                  <button
                    key={reaction}
                    onClick={() => handleReaction(reaction)}
                    disabled={!user}
                    className={`p-2 rounded-lg text-xl transition-all ${
                      userReaction === reaction
                        ? 'bg-primary-500/20 scale-110'
                        : 'hover:bg-dark-800'
                    }`}
                  >
                    {reaction}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 text-dark-400">
                <span className="flex items-center gap-1">
                  <Heart className={`w-5 h-5 ${userReaction ? 'text-pink-500 fill-pink-500' : ''}`} />
                  {entry.reactions_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-5 h-5" />
                  {entry.comments_count}
                </span>
              </div>
            </div>
          </Card>

          {/* Comments */}
          <Card>
            <h3 className="font-semibold text-white mb-4">Comments ({comments.length})</h3>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleComment} className="mb-6">
                <div className="flex gap-3">
                  <Avatar src={user.avatar_url} alt={user.username} size="sm" />
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      rows={2}
                      className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button type="submit" size="sm" isLoading={isSubmitting} disabled={!newComment.trim()}>
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <p className="text-dark-400 text-sm mb-4">
                <Link to="/login" className="text-primary-400 hover:text-primary-300">Log in</Link> to comment
              </p>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-dark-400 text-center py-4">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Link to={`/profile/${comment.user?.username}`}>
                      <Avatar src={comment.user?.avatar_url} alt={comment.user?.username || ''} size="sm" />
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${comment.user?.username}`} className="font-medium text-white hover:text-primary-400">
                          {comment.user?.display_name || comment.user?.username}
                        </Link>
                        <span className="text-xs text-dark-500">{formatRelativeTime(comment.created_at)}</span>
                      </div>
                      <p className="text-dark-300 mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Artist Info */}
          <Card>
            <Link to={`/profile/${entry.user?.username}`} className="flex items-center gap-3 group">
              <Avatar src={entry.user?.avatar_url} alt={entry.user?.username || ''} size="lg" />
              <div>
                <p className="font-medium text-white group-hover:text-primary-400 transition-colors">
                  {entry.user?.display_name || entry.user?.username}
                </p>
                <p className="text-sm text-dark-400">@{entry.user?.username}</p>
              </div>
            </Link>
          </Card>

          {/* Entry Info */}
          <Card>
            <h3 className="font-semibold text-white mb-3">
              {entry.title || 'Untitled Entry'}
            </h3>
            {entry.description && (
              <p className="text-dark-300 text-sm mb-4">{entry.description}</p>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-dark-400">Contest</span>
                <Link to={`/contest/${entry.contest?.id}`} className="text-primary-400 hover:text-primary-300 flex items-center gap-1">
                  {entry.contest?.title}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">Submitted</span>
                <span className="text-white">{formatRelativeTime(entry.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">Status</span>
                <Badge variant={entry.status === 'approved' ? 'success' : 'warning'}>{entry.status}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
