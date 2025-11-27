import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Calendar, Trophy, Image, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/uiStore'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'

// Categories must match database constraint
const CATEGORIES = [
  { value: 'art', label: 'Art / Digital Art' },
  { value: 'cosplay', label: 'Cosplay' },
  { value: 'photography', label: 'Photography' },
  { value: 'music', label: 'Music' },
  { value: 'video', label: 'Video' }
]

interface ContestForm {
  title: string
  description: string
  category: string
  thumbnail_url: string
  start_date: string
  end_date: string
  has_sponsor: boolean
  sponsor_name: string
  sponsor_logo_url: string
}

const defaultForm: ContestForm = {
  title: '',
  description: '',
  category: 'art',
  thumbnail_url: '',
  start_date: '',
  end_date: '',
  has_sponsor: false,
  sponsor_name: '',
  sponsor_logo_url: ''
}

export default function AdminContestFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuthStore()
  const toast = useToast()
  const isEditing = Boolean(id)

  const [form, setForm] = useState<ContestForm>(defaultForm)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isEditing && id) {
      fetchContest(id)
    }
  }, [id, isEditing])

  const fetchContest = async (contestId: string) => {
    try {
      // @ts-ignore - Supabase types not generated
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('id', contestId)
        .single()

      if (error) throw error

      if (data) {
        const d = data as any
        setForm({
          title: d.title || '',
          description: d.description || '',
          category: d.category || 'art',
          thumbnail_url: d.thumbnail_url || '',
          start_date: d.start_date ? d.start_date.slice(0, 16) : '',
          end_date: d.end_date ? d.end_date.slice(0, 16) : '',
          has_sponsor: d.has_sponsor || false,
          sponsor_name: d.sponsor_name || '',
          sponsor_logo_url: d.sponsor_logo_url || ''
        })
      }
    } catch (error) {
      console.error('Error fetching contest:', error)
      toast.error('Failed to load contest')
      navigate('/admin/contests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setForm(prev => ({ ...prev, [name]: checked }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.title || !form.start_date || !form.end_date) {
      toast.error('Please fill in all required fields')
      return
    }

    if (new Date(form.end_date) <= new Date(form.start_date)) {
      toast.error('End date must be after start date')
      return
    }

    setIsSaving(true)

    try {
      // Store datetime as PH time (UTC+8) - append timezone offset
      const formatAsPHTime = (datetime: string) => {
        // datetime-local gives us "2025-11-28T10:00"
        // We append +08:00 to indicate PH timezone
        return `${datetime}:00+08:00`
      }

      const contestData = {
        title: form.title,
        description: form.description || null,
        category: form.category,
        thumbnail_url: form.thumbnail_url || null,
        start_date: formatAsPHTime(form.start_date),
        end_date: formatAsPHTime(form.end_date),
        has_sponsor: form.has_sponsor,
        sponsor_name: form.has_sponsor ? form.sponsor_name : null,
        sponsor_logo_url: form.has_sponsor ? form.sponsor_logo_url : null,
        created_by: user?.id
      }

      console.log('=== DEBUG: Contest Creation ===')
      console.log('User:', user)
      console.log('User ID:', user?.id)
      console.log('Contest Data:', contestData)

      if (isEditing && id) {
        console.log('Mode: EDITING contest', id)
        const { data, error } = await supabase
          .from('contests')
          // @ts-ignore - Supabase types not generated
          .update(contestData as any)
          .eq('id', id)
          .select()

        console.log('Update Response - Data:', data)
        console.log('Update Response - Error:', error)

        if (error) throw error
        if (!data || data.length === 0) {
          throw new Error('Update failed - no data returned (possibly RLS blocked)')
        }
        toast.success('Contest updated successfully')
      } else {
        console.log('Mode: CREATING new contest')
        const { data, error } = await supabase
          .from('contests')
          // @ts-ignore - Supabase types not generated
          .insert(contestData as any)
          .select()

        console.log('Insert Response - Data:', data)
        console.log('Insert Response - Error:', error)

        if (error) throw error
        if (!data || data.length === 0) {
          throw new Error('Insert failed - no data returned (possibly RLS blocked)')
        }
        toast.success('Contest created successfully')
      }

      navigate('/admin/contests')
    } catch (error: any) {
      console.error('Error saving contest:', error)
      toast.error(error?.message || 'Failed to save contest')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/contests')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Contest' : 'Create Contest'}
          </h1>
          <p className="text-dark-400 mt-1">
            {isEditing ? 'Update contest details' : 'Set up a new contest'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary-500" />
            Basic Information
          </h2>
          <div className="space-y-4">
            <Input
              label="Contest Title *"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter contest title"
              required
            />

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe the contest..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Thumbnail Image */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-primary-500" />
            Thumbnail Image
          </h2>
          <Input
            label="Thumbnail URL"
            name="thumbnail_url"
            value={form.thumbnail_url}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
          {form.thumbnail_url && (
            <div className="mt-4">
              <img
                src={form.thumbnail_url}
                alt="Thumbnail preview"
                className="w-full max-w-md h-48 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
        </Card>

        {/* Schedule */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            Schedule
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              name="start_date"
              type="datetime-local"
              value={form.start_date}
              onChange={handleChange}
              required
            />
            <Input
              label="End Date *"
              name="end_date"
              type="datetime-local"
              value={form.end_date}
              onChange={handleChange}
              required
            />
          </div>
        </Card>

        {/* Prize System Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary-500" />
            Prize System
          </h2>
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <p className="text-dark-300 mb-3">
              Prizes are <span className="text-primary-400 font-medium">automatically calculated</span> based on reactions (votes) when the contest ends:
            </p>
            <ul className="space-y-2 text-dark-400">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span><strong className="text-yellow-400">1st Place:</strong> 50% of total reactions from top 3 entries</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span><strong className="text-gray-300">2nd Place:</strong> 20% of total reactions from top 3 entries</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                <span><strong className="text-amber-500">3rd Place:</strong> 10% of total reactions from top 3 entries</span>
              </li>
            </ul>
            <p className="text-dark-500 text-sm mt-3">
              Winners are determined by the number of reactions their entries receive. Each reaction = 1 vote = 1 point in the prize pool.
            </p>
          </div>
        </Card>

        {/* Sponsor (Optional) */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Sponsor (Optional)</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="has_sponsor"
                checked={form.has_sponsor}
                onChange={handleChange}
                className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
              />
              <span className="text-dark-300">This contest has a sponsor</span>
            </label>

            {form.has_sponsor && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Sponsor Name"
                  name="sponsor_name"
                  value={form.sponsor_name}
                  onChange={handleChange}
                  placeholder="Sponsor company name"
                />
                <Input
                  label="Sponsor Logo URL"
                  name="sponsor_logo_url"
                  value={form.sponsor_logo_url}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/admin/contests')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEditing ? 'Update Contest' : 'Create Contest'}
          </Button>
        </div>
      </form>
    </div>
  )
}
