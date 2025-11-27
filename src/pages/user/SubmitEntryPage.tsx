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

// Phase configurations per category
const PHASE_CONFIG: Record<string, { num: number; label: string; description: string; required: boolean }[]> = {
  // Art categories - 4 phases
  art: [
    { num: 1, label: 'Sketch', description: 'Initial sketch or concept', required: true },
    { num: 2, label: 'Lineart', description: 'Clean linework', required: false },
    { num: 3, label: 'Color', description: 'Base colors applied', required: false },
    { num: 4, label: 'Final', description: 'Finished artwork', required: true },
  ],
  // Cosplay - 2 phases
  cosplay: [
    { num: 1, label: 'Work in Progress', description: 'Behind the scenes, making of, or costume construction', required: true },
    { num: 2, label: 'Final Cosplay', description: 'Finished cosplay photo', required: true },
  ],
  // Photography - 2 phases (raw + edited)
  photography: [
    { num: 1, label: 'Original/RAW', description: 'Original or unedited photo', required: true },
    { num: 2, label: 'Final Edit', description: 'Final edited photo', required: true },
  ],
  // Music - 2 phases (demo + final)
  music: [
    { num: 1, label: 'Demo/Draft', description: 'Work in progress or demo version', required: true },
    { num: 2, label: 'Final Track', description: 'Finished music piece', required: true },
  ],
  // Video - 2 phases (raw + edited)
  video: [
    { num: 1, label: 'Raw Footage', description: 'Unedited footage or storyboard', required: true },
    { num: 2, label: 'Final Video', description: 'Finished and edited video', required: true },
  ],
}

// Default fallback (4 phases like art)
const DEFAULT_PHASES = PHASE_CONFIG.art

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
  const [phaseFiles, setPhaseFiles] = useState<{ [key: number]: File | null }>({
    1: null, 2: null, 3: null, 4: null
  })
  const [previews, setPreviews] = useState<{ [key: number]: string }>({})

  // Get phases based on contest category
  const categoryPhases = contest?.category 
    ? (PHASE_CONFIG[contest.category] || DEFAULT_PHASES)
    : DEFAULT_PHASES

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
    setPhaseFiles(prev => ({ ...prev, [phaseNum]: file }))

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
    
    // Check required phases based on category
    const requiredPhases = categoryPhases.filter(p => p.required)
    const missingRequired = requiredPhases.some(p => !phaseFiles[p.num])
    
    if (!user || !contest || missingRequired) {
      toast.error('Missing required phases', 'Please upload all required phase images.')
      return
    }

    setIsSubmitting(true)
    try {
      // Upload images
      const timestamp = Date.now()
      const uploadedUrls: { [key: number]: string | null } = {}

      for (const phaseNum of [1, 2, 3, 4]) {
        const file = phaseFiles[phaseNum]
        if (file) {
          const path = `${user.id}/${contest.id}/${timestamp}_phase${phaseNum}.${file.name.split('.').pop()}`
          uploadedUrls[phaseNum] = await uploadImage(file, path)
        } else {
          uploadedUrls[phaseNum] = null
        }
      }

      // Create entry
      // @ts-ignore - Supabase types not generated
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
          <h2 className="font-semibold text-white mb-4">
            {contest.category === 'cosplay' ? 'Cosplay Phases' : 
             contest.category === 'photography' ? 'Photo Phases' :
             contest.category === 'music' ? 'Music Phases' :
             contest.category === 'video' ? 'Video Phases' :
             'Artwork Phases'}
          </h2>
          <p className="text-dark-400 text-sm mb-6">
            {contest.category === 'art' 
              ? 'Upload your artwork in phases to show your creative process. Sketch and Final are required.'
              : contest.category === 'cosplay'
              ? 'Upload your work-in-progress and final cosplay photos. Both phases are required.'
              : contest.category === 'photography'
              ? 'Upload your original/RAW photo and final edited version. Both are required.'
              : contest.category === 'music'
              ? 'Upload your demo/draft and final track. Both are required.'
              : contest.category === 'video'
              ? 'Upload your raw footage/storyboard and final video. Both are required.'
              : 'Upload your work in phases. Required phases are marked with *.'}
          </p>

          <div className={`grid gap-4 ${categoryPhases.length <= 2 ? 'md:grid-cols-2' : 'md:grid-cols-2'}`}>
            {categoryPhases.map((phase) => (
              <PhaseUpload
                key={phase.num}
                phase={phase}
                file={phaseFiles[phase.num]}
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
            disabled={categoryPhases.filter(p => p.required).some(p => !phaseFiles[p.num])}
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
