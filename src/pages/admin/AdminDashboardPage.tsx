import { Link } from 'react-router-dom'
import { Trophy, FileCheck, Users, BarChart3 } from 'lucide-react'
import Card from '@/components/ui/Card'

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-dark-400 mt-1">Manage contests, entries, and users</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/contests">
          <Card hover className="text-center">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="font-semibold text-white">Contests</h3>
            <p className="text-sm text-dark-400">Manage contests</p>
          </Card>
        </Link>

        <Link to="/admin/entries">
          <Card hover className="text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
              <FileCheck className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white">Entries</h3>
            <p className="text-sm text-dark-400">Review submissions</p>
          </Card>
        </Link>

        <Link to="/admin/users">
          <Card hover className="text-center">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-semibold text-white">Users</h3>
            <p className="text-sm text-dark-400">Manage users</p>
          </Card>
        </Link>

        <Card className="text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="font-semibold text-white">Analytics</h3>
          <p className="text-sm text-dark-400">Coming soon</p>
        </Card>
      </div>
    </div>
  )
}
