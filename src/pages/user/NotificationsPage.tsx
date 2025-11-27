import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Heart, MessageCircle, UserPlus, Trophy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatRelativeTime } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import type { Notification } from '@/types'

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:users!notifications_actor_id_fkey(id, username, display_name, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-dark-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <Check className="w-4 h-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="text-center py-12">
          <Bell className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">No notifications yet</p>
        </Card>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-dark-700">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={() => markAsRead(notification.id)}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function NotificationItem({ 
  notification, 
  onMarkRead 
}: { 
  notification: Notification
  onMarkRead: () => void 
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'reaction':
        return <Heart className="w-5 h-5 text-pink-400" />
      case 'comment':
      case 'reply':
        return <MessageCircle className="w-5 h-5 text-blue-400" />
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-400" />
      case 'winner':
        return <Trophy className="w-5 h-5 text-yellow-400" />
      default:
        return <Bell className="w-5 h-5 text-dark-400" />
    }
  }

  const getLink = () => {
    if (notification.entry_id) return `/entry/${notification.entry_id}`
    if (notification.contest_id) return `/contest/${notification.contest_id}`
    if (notification.actor_id) return `/profile/${notification.actor?.username}`
    return '#'
  }

  return (
    <div
      className={`flex items-start gap-4 p-4 hover:bg-dark-800 transition-colors ${
        !notification.is_read ? 'bg-primary-500/5' : ''
      }`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link to={getLink()} className="block">
          <p className="font-medium text-white">{notification.title}</p>
          <p className="text-sm text-dark-400 mt-0.5">{notification.message}</p>
          <p className="text-xs text-dark-500 mt-1">
            {formatRelativeTime(notification.created_at)}
          </p>
        </Link>
      </div>

      {/* Actions */}
      {!notification.is_read && (
        <button
          onClick={onMarkRead}
          className="flex-shrink-0 p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
          title="Mark as read"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
