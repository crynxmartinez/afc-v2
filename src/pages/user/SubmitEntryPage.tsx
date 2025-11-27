import { useParams } from 'react-router-dom'

export default function SubmitEntryPage() {
  const { contestId } = useParams()
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Submit Entry</h1>
      <p className="text-dark-400">Contest ID: {contestId}</p>
      <p className="text-dark-400">Entry submission form will be here.</p>
    </div>
  )
}
