import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Globe, Instagram, Twitter, Briefcase, Calendar, Image, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, formatNumber, getLevelTitle } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import type { User, Entry } from '@/types'

export default function ProfilePage() {
  const { username } = useParams()
  const { user: currentUser } = useAuthStore()
  const [profile, setProfile] = useState<User | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  const isOwnProfile = currentUser?.username === username

  useEffect(() => {
    if (username) {
      fetchProfile()
    }
  }, [username])

  const fetchProfile = async () => {
    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (userError) throw userError
      setProfile(userData)

      // Fetch user entries
      const { data: entriesData } = await supabase
        .from('entries')
        .select('*, contest:contests(id, title)')
        .eq('user_id', userData.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(12)

      setEntries(entriesData || [])

      // Check if following
      if (currentUser && currentUser.id !== userData.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', userData.id)
          .single()

        setIsFollowing(!!followData)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!currentUser || !profile) return

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id)
        setIsFollowing(false)
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: profile.id })
        setIsFollowing(true)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    }
  }

  if (isLoading) return <PageSpinner />

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">User not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="relative overflow-hidden">
        {/* Cover Photo */}
        <div className="h-32 -m-4 mb-0 bg-gradient-to-r from-primary-600 to-pink-600">
          {profile.cover_photo_url && (
            <img src={profile.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Profile Info */}
        <div className="relative pt-12 pb-2">
          {/* Avatar */}
          <div className="absolute -top-10 left-4">
            <Avatar src={profile.avatar_url} alt={profile.display_name || profile.username} size="xl" />
          </div>

          {/* Actions */}
          <div className="absolute top-4 right-0 flex gap-2">
            {isOwnProfile ? (
              <Link to="/settings">
                <Button variant="secondary" size="sm">Edit Profile</Button>
              </Link>
            ) : currentUser && (
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleFollow}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          {/* Name & Username */}
          <div className="mt-4">
            <h1 className="text-xl font-bold text-white">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-dark-400">@{profile.username}</p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-3 text-dark-300">{profile.bio}</p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-dark-400">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </span>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary-400">
                <Globe className="w-4 h-4" />
                Website
              </a>
            )}
            {profile.available_for_work && (
              <span className="flex items-center gap-1 text-green-400">
                <Briefcase className="w-4 h-4" />
                Available for work
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Joined {formatDate(profile.created_at)}
            </span>
          </div>

          {/* Social Links */}
          <div className="flex gap-3 mt-4">
            {profile.instagram_url && (
              <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-dark-400 hover:text-pink-400">
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {profile.twitter_url && (
              <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="text-dark-400 hover:text-blue-400">
                <Twitter className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{profile.level}</p>
          <p className="text-sm text-dark-400">Level</p>
          <p className="text-xs text-primary-400">{getLevelTitle(profile.level)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{formatNumber(profile.xp)}</p>
          <p className="text-sm text-dark-400">XP</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{profile.wins_count}</p>
          <p className="text-sm text-dark-400">Wins</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{profile.entries_count}</p>
          <p className="text-sm text-dark-400">Entries</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{formatNumber(profile.total_reactions_received)}</p>
          <p className="text-sm text-dark-400">Reactions</p>
        </Card>
      </div>

      {/* Entries */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Entries</h2>
        {entries.length === 0 ? (
          <Card className="text-center py-8">
            <Image className="w-10 h-10 text-dark-600 mx-auto mb-2" />
            <p className="text-dark-400">No entries yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {entries.map((entry) => (
              <Link key={entry.id} to={`/entry/${entry.id}`}>
                <div className="aspect-square bg-dark-800 rounded-lg overflow-hidden group relative">
                  <img
                    src={entry.phase_1_url}
                    alt={entry.title || 'Entry'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white">
                      <Heart className="w-5 h-5" />
                      <span>{entry.reactions_count}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
