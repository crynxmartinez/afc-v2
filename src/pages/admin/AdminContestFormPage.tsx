import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Calendar, Trophy, DollarSign, Image } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/stores/uiStore'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'

const CATEGORIES = [
  'Photography',
  'Digital Art',
  'Illustration',
  'Graphic Design',
  'UI/UX Design',
  '3D Art',
  'Animation',
  'Mixed Media',
  'Other'
]

interface ContestForm {
  title: string
  description: string
  category: string
  cover_image_url: string
  start_date: string
  end_date: string
  prize_pool: number
  first_place_prize: number
  second_place_prize: number
  third_place_prize: number
  max_entries_per_user: number
  submission_guidelines: string
  judging_criteria: string
}

const defaultForm: ContestForm = {
  title: '',
  description: '',
  category: 'Photography',
  cover_image_url: '',
  start_date: '',
  end_date: '',
  prize_pool: 0,
  first_place_prize: 0,
  second_place_prize: 0,
  third_place_prize: 0,
  max_entries_per_user: 1,
  submission_guidelines: '',
  judging_criteria: ''
}

export default function AdminContestFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
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
        // @ts-ignore - Supabase types not generated
        const d = data as any
        setForm({
          title: d.title || '',
          description: d.description || '',
          category: d.category || 'Photography',
          cover_image_url: d.cover_image_url || '',
          start_date: d.start_date ? d.start_date.slice(0, 16) : '',
          end_date: d.end_date ? d.end_date.slice(0, 16) : '',
          prize_pool: d.prize_pool || 0,
          first_place_prize: d.first_place_prize || 0,
          second_place_prize: d.second_place_prize || 0,
          third_place_prize: d.third_place_prize || 0,
          max_entries_per_user: d.max_entries_per_user || 1,
          submission_guidelines: d.submission_guidelines || '',
          judging_criteria: d.judging_criteria || ''
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
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.title || !form.start_date || !form.end_date) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSaving(true)

    try {
      const contestData = {
        title: form.title,
        description: form.description,
        category: form.category,
        cover_image_url: form.cover_image_url || null,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        prize_pool: form.prize_pool,
        first_place_prize: form.first_place_prize,
        second_place_prize: form.second_place_prize,
        third_place_prize: form.third_place_prize,
        max_entries_per_user: form.max_entries_per_user,
        submission_guidelines: form.submission_guidelines || null,
        judging_criteria: form.judging_criteria || null
      }

      if (isEditing && id) {
        const { error } = await supabase
          .from('contests')
          // @ts-ignore - Supabase types not generated
          .update(contestData)
          .eq('id', id)

        if (error) throw error
        toast.success('Contest updated successfully')
      } else {
        const { error } = await supabase
          .from('contests')
          // @ts-ignore - Supabase types not generated
          .insert(contestData)

        if (error) throw error
        toast.success('Contest created successfully')
      }

      navigate('/admin/contests')
    } catch (error) {
      console.error('Error saving contest:', error)
      toast.error('Failed to save contest')
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Max Entries Per User"
                name="max_entries_per_user"
                type="number"
                min={1}
                value={form.max_entries_per_user}
                onChange={handleChange}
              />
            </div>
          </div>
        </Card>

        {/* Cover Image */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-primary-500" />
            Cover Image
          </h2>
          <Input
            label="Cover Image URL"
            name="cover_image_url"
            value={form.cover_image_url}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
          {form.cover_image_url && (
            <div className="mt-4">
              <img
                src={form.cover_image_url}
                alt="Cover preview"
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

        {/* Prizes */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-500" />
            Prizes (Points)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Total Prize Pool"
              name="prize_pool"
              type="number"
              min={0}
              value={form.prize_pool}
              onChange={handleChange}
            />
            <Input
              label="1st Place"
              name="first_place_prize"
              type="number"
              min={0}
              value={form.first_place_prize}
              onChange={handleChange}
            />
            <Input
              label="2nd Place"
              name="second_place_prize"
              type="number"
              min={0}
              value={form.second_place_prize}
              onChange={handleChange}
            />
            <Input
              label="3rd Place"
              name="third_place_prize"
              type="number"
              min={0}
              value={form.third_place_prize}
              onChange={handleChange}
            />
          </div>
        </Card>

        {/* Guidelines */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Guidelines & Criteria</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Submission Guidelines
              </label>
              <textarea
                name="submission_guidelines"
                value={form.submission_guidelines}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Rules and requirements for submissions..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Judging Criteria
              </label>
              <textarea
                name="judging_criteria"
                value={form.judging_criteria}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="How entries will be judged..."
              />
            </div>
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
