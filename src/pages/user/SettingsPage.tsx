import { useState } from 'react'
import { User, Lock, Bell, Globe, Instagram, Twitter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/uiStore'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'

type Tab = 'profile' | 'account' | 'notifications'

export default function SettingsPage() {
  const { user, updateProfile } = useAuthStore()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [isLoading, setIsLoading] = useState(false)

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [location, setLocation] = useState(user?.location || '')
  const [website, setWebsite] = useState(user?.website || '')
  const [instagramUrl, setInstagramUrl] = useState(user?.instagram_url || '')
  const [twitterUrl, setTwitterUrl] = useState(user?.twitter_url || '')
  const [availableForWork, setAvailableForWork] = useState(user?.available_for_work || false)

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: displayName || null,
          bio: bio || null,
          location: location || null,
          website: website || null,
          instagram_url: instagramUrl || null,
          twitter_url: twitterUrl || null,
          available_for_work: availableForWork,
        })
        .eq('id', user.id)

      if (error) throw error

      await updateProfile()
      toast.success('Profile updated', 'Your profile has been saved.')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Error', 'Failed to update profile.')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'account' as Tab, label: 'Account', icon: Lock },
    { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
  ]

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-dark-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <Avatar src={user.avatar_url} alt={user.username} size="xl" />
                    <div>
                      <p className="font-medium text-white">@{user.username}</p>
                      <p className="text-sm text-dark-400">Profile picture synced with your account</p>
                    </div>
                  </div>

                  <Input
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                  />

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                    />
                  </div>

                  <Input
                    label="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                    leftIcon={<Globe className="w-4 h-4" />}
                  />

                  <Input
                    label="Website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    leftIcon={<Globe className="w-4 h-4" />}
                  />

                  <Input
                    label="Instagram"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/username"
                    leftIcon={<Instagram className="w-4 h-4" />}
                  />

                  <Input
                    label="Twitter"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://twitter.com/username"
                    leftIcon={<Twitter className="w-4 h-4" />}
                  />

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availableForWork}
                      onChange={(e) => setAvailableForWork(e.target.checked)}
                      className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                    />
                    <span className="text-dark-300">Available for work / commissions</span>
                  </label>

                  <div className="flex justify-end">
                    <Button type="submit" isLoading={isLoading}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-white mb-2">Email</h3>
                    <p className="text-dark-400">{user.email}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-white mb-2">Password</h3>
                    <Button variant="secondary" size="sm">
                      Change Password
                    </Button>
                  </div>

                  <div className="pt-6 border-t border-dark-700">
                    <h3 className="font-medium text-red-400 mb-2">Danger Zone</h3>
                    <p className="text-dark-400 text-sm mb-4">
                      Once you delete your account, there is no going back.
                    </p>
                    <Button variant="danger" size="sm">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'New reactions on your entries', key: 'reactions' },
                    { label: 'New comments on your entries', key: 'comments' },
                    { label: 'New followers', key: 'followers' },
                    { label: 'Contest updates', key: 'contests' },
                    { label: 'Winner announcements', key: 'winners' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between cursor-pointer">
                      <span className="text-dark-300">{item.label}</span>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                      />
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
