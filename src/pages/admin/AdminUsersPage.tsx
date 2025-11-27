import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Shield, ShieldOff, Trophy, Image } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatNumber } from '@/lib/utils'
import { useToast } from '@/stores/uiStore'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Input from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import type { User } from '@/types'

export default function AdminUsersPage() {
  const toast = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    
    try {
      const { error } = await supabase
        .from('users')
        // @ts-ignore - Supabase types not generated yet
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ))
      toast.success('Role updated', `User is now ${newRole === 'admin' ? 'an admin' : 'a regular user'}.`)
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Error', 'Failed to update user role.')
    }
  }

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    (user.display_name?.toLowerCase().includes(search.toLowerCase()))
  )

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Users</h1>
          <p className="text-dark-400 mt-1">{users.length} total users</p>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left p-4 text-dark-400 font-medium">User</th>
                <th className="text-left p-4 text-dark-400 font-medium">Role</th>
                <th className="text-left p-4 text-dark-400 font-medium">Level</th>
                <th className="text-left p-4 text-dark-400 font-medium">Stats</th>
                <th className="text-left p-4 text-dark-400 font-medium">Joined</th>
                <th className="text-right p-4 text-dark-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-dark-800">
                  <td className="p-4">
                    <Link to={`/profile/${user.username}`} className="flex items-center gap-3 group">
                      <Avatar src={user.avatar_url} alt={user.username} size="md" />
                      <div>
                        <p className="font-medium text-white group-hover:text-primary-400">
                          {user.display_name || user.username}
                        </p>
                        <p className="text-sm text-dark-400">@{user.username}</p>
                        <p className="text-xs text-dark-500">{user.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4">
                    <Badge variant={user.role === 'admin' ? 'primary' : 'gray'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">Lv.{user.level}</span>
                      <span className="text-sm text-dark-400">({formatNumber(user.xp)} XP)</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-4 text-sm text-dark-400">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        {user.wins_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Image className="w-4 h-4" />
                        {user.entries_count}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-dark-400">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleAdmin(user.id, user.role)}
                        title={user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                      >
                        {user.role === 'admin' ? (
                          <ShieldOff className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-dark-400">No users found matching "{search}"</p>
        </div>
      )}
    </div>
  )
}
