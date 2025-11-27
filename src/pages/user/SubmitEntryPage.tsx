import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Upload, X, ArrowLeft, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/uiStore'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import type { Contest } from '@/types'

const PHASES = [
  { num: 1, label: 'Sketch', description: 'Initial sketch or concept', required: true },
  { num: 2, label: 'Lineart', description: 'Clean linework', required: false },
  { num: 3, label: 'Color', description: 'Base colors applied', required: false },
  { num: 4, label: 'Final', description: 'Finished artwork', required: false },
]

export default function SubmitEntryPage() {
  const { contestId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const toast = useToast()

  const [contest, setContest] = useState<Contest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [phases, setPhases] = useState<{ [key: number]: File | null }>({
    1: null, 2: null, 3: null, 4: null
  })
  const [previews, setPreviews] = useState<{ [key: number]: string }>({})

  useEffect(() => {
    if (contestId) {
      fetchContest()
    }
  }, [contestId])

  const fetchContest = async () => {
    try {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('id', contestId)
        .single()

      if (error) throw error
      setContest(data)

      // Check if user already submitted
      if (user) {
        const { data: existingEntry } = await supabase
          .from('entries')
          .select('id')
          .eq('contest_id', contestId)
          .eq('user_id', user.id)
          .single()

        if (existingEntry) {
          toast.error('Already submitted', 'You have already submitted an entry to this contest.')
          navigate(`/contest/${contestId}`)
        }
      }
    } catch (error) {
      console.error('Error fetching contest:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (phaseNum: number, file: File | null) => {
    setPhases(prev => ({ ...prev, [phaseNum]: file }))

    // Create preview
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [phaseNum]: reader.result as string }))
      }
      reader.readAsDataURL(file)
    } else {
      setPreviews(prev => {
        const newPreviews = { ...prev }
        delete newPreviews[phaseNum]
        return newPreviews
      })
    }
  }

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('entries')
      .upload(path, file, { upsert: true })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('entries')
      .getPublicUrl(data.path)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !contest || !phases[1]) return

    setIsSubmitting(true)
    try {
      // Upload images
      const timestamp = Date.now()
      const uploadedUrls: { [key: number]: string | null } = {}

      for (const phaseNum of [1, 2, 3, 4]) {
        const file = phases[phaseNum]
        if (file) {
          const path = `${user.id}/${contest.id}/${timestamp}_phase${phaseNum}.${file.name.split('.').pop()}`
          uploadedUrls[phaseNum] = await uploadImage(file, path)
        } else {
          uploadedUrls[phaseNum] = null
        }
      }

      // Create entry
      const { error } = await supabase
        .from('entries')
        .insert({
          contest_id: contest.id,
          user_id: user.id,
          title: title || null,
          description: description || null,
          phase_1_url: uploadedUrls[1],
          phase_2_url: uploadedUrls[2],
          phase_3_url: uploadedUrls[3],
          phase_4_url: uploadedUrls[4],
          status: 'pending',
        })

      if (error) throw error

      toast.success('Entry submitted!', 'Your entry is pending review.')
      navigate(`/contest/${contest.id}`)
    } catch (error) {
      console.error('Error submitting entry:', error)
      toast.error('Error', 'Failed to submit entry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <PageSpinner />

  if (!contest) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">Contest not found</p>
        <Link to="/contests" className="text-primary-400 hover:text-primary-300 mt-2 inline-block">
          Browse contests
        </Link>
      </div>
    )
  }

  const now = new Date()
  const isActive = new Date(contest.start_date) <= now && new Date(contest.end_date) >= now

  if (!isActive) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Contest Not Active</h2>
        <p className="text-dark-400 mb-4">This contest is not currently accepting submissions.</p>
        <Link to={`/contest/${contest.id}`}>
          <Button variant="secondary">View Contest</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link 
        to={`/contest/${contest.id}`} 
        className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to contest
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Submit Entry</h1>
        <p className="text-dark-400 mt-1">Contest: {contest.title}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entry Details */}
        <Card>
          <h2 className="font-semibold text-white mb-4">Entry Details</h2>
          <div className="space-y-4">
            <Input
              label="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your entry a title"
            />
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your artwork..."
                rows={3}
                className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Phases */}
        <Card>
          <h2 className="font-semibold text-white mb-4">Artwork Phases</h2>
          <p className="text-dark-400 text-sm mb-6">
            Upload your artwork in phases to show your creative process. At least Phase 1 (Sketch) is required.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {PHASES.map((phase) => (
              <PhaseUpload
                key={phase.num}
                phase={phase}
                file={phases[phase.num]}
                preview={previews[phase.num]}
                onChange={(file) => handleFileChange(phase.num, file)}
              />
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link to={`/contest/${contest.id}`}>
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
          <Button 
            type="submit" 
            isLoading={isSubmitting}
            disabled={!phases[1]}
          >
            Submit Entry
          </Button>
        </div>
      </form>
    </div>
  )
}

interface PhaseUploadProps {
  phase: { num: number; label: string; description: string; required: boolean }
  file: File | null
  preview?: string
  onChange: (file: File | null) => void
}

function PhaseUpload({ phase, preview, onChange }: PhaseUploadProps) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      onChange(droppedFile)
    }
  }, [onChange])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onChange(selectedFile)
    }
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
        preview ? 'border-primary-500 bg-primary-500/5' : 'border-dark-700 hover:border-dark-600'
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      {preview ? (
        <div className="relative">
          <img src={preview} alt={phase.label} className="w-full aspect-square object-cover rounded-lg" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            className="absolute top-2 right-2 p-1 bg-dark-900/80 rounded-full text-white hover:bg-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <Upload className="w-8 h-8 text-dark-500 mx-auto mb-2" />
          <p className="font-medium text-white">
            Phase {phase.num}: {phase.label}
            {phase.required && <span className="text-red-400 ml-1">*</span>}
          </p>
          <p className="text-sm text-dark-400 mt-1">{phase.description}</p>
          <p className="text-xs text-dark-500 mt-2">Click or drag to upload</p>
        </div>
      )}
    </div>
  )
}
