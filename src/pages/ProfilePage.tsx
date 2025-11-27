import { useParams } from 'react-router-dom'

export default function ProfilePage() {
  const { username } = useParams()
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Profile</h1>
      <p className="text-dark-400">@{username}</p>
      <p className="text-dark-400">User profile and entries will be displayed here.</p>
    </div>
  )
}
