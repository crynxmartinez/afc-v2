import { useParams } from 'react-router-dom'

export default function EntryDetailPage() {
  const { id } = useParams()
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Entry Details</h1>
      <p className="text-dark-400">Entry ID: {id}</p>
      <p className="text-dark-400">This page will show entry phases, reactions, and comments.</p>
    </div>
  )
}
