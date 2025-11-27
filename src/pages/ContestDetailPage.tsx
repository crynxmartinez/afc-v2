import { useParams } from 'react-router-dom'

export default function ContestDetailPage() {
  const { id } = useParams()
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Contest Details</h1>
      <p className="text-dark-400">Contest ID: {id}</p>
      <p className="text-dark-400">This page will show contest details and entries.</p>
    </div>
  )
}
