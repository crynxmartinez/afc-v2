import { Link } from 'react-router-dom'
import { ArrowRight, Trophy, Users, Award, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full text-primary-400 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Welcome to AFC v2.0
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Arena for{' '}
          <span className="gradient-text">Creatives</span>
        </h1>
        
        <p className="text-lg text-dark-300 max-w-2xl mx-auto mb-8">
          Compete in art contests, showcase your creative process, and win prizes.
          Join the community of Filipino digital artists.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/contests">
            <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
              View Contests
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="secondary" size="lg">
              Join Now - It's Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-6">
        <FeatureCard
          icon={<Trophy className="w-8 h-8" />}
          title="Compete & Win"
          description="Join art contests and compete for prizes. Top 3 entries win based on community votes."
        />
        <FeatureCard
          icon={<Users className="w-8 h-8" />}
          title="Community Voting"
          description="Every reaction is a vote. The community decides who wins - no admin selection needed."
        />
        <FeatureCard
          icon={<Award className="w-8 h-8" />}
          title="Show Your Process"
          description="Submit your artwork in 4 phases - from sketch to final piece. Show your creative journey."
        />
      </section>

      {/* How It Works */}
      <section>
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <StepCard
            step={1}
            title="Join a Contest"
            description="Browse active contests and find one that matches your style."
          />
          <StepCard
            step={2}
            title="Submit Your Art"
            description="Upload your artwork in 4 phases showing your creative process."
          />
          <StepCard
            step={3}
            title="Get Votes"
            description="Community members vote on entries using reactions."
          />
          <StepCard
            step={4}
            title="Win Prizes"
            description="Top 3 entries automatically win when the contest ends."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-12 bg-gradient-to-r from-primary-900/50 to-pink-900/50 rounded-2xl border border-primary-500/20">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Compete?
        </h2>
        <p className="text-dark-300 mb-6">
          Join thousands of Filipino artists and start winning today.
        </p>
        <Link to="/register">
          <Button size="lg">
            Create Free Account
          </Button>
        </Link>
      </section>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 text-center">
      <div className="w-16 h-16 rounded-xl gradient-bg flex items-center justify-center mx-auto mb-4 text-white">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-dark-400">{description}</p>
    </div>
  )
}

interface StepCardProps {
  step: number
  title: string
  description: string
}

function StepCard({ step, title, description }: StepCardProps) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
        {step}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-dark-400 text-sm">{description}</p>
    </div>
  )
}
