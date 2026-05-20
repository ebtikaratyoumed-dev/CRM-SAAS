import { SignupForm } from '@/components/auth/signup-form'
import Image from 'next/image'

export default function SignupPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center justify-center space-y-2">
          <Image 
            src="/corex.png" 
            alt="Corex Logo" 
            width={200} 
            height={200} 
            className="object-contain mb-2 transform hover:scale-105 transition-transform"
            priority
          />
          <p className="text-sm text-zinc-400 font-medium italic mt-2">Commencez l'aventure Corex.</p>
        </div>
        
        <SignupForm />
        
        <p className="text-center text-sm text-zinc-500">
          Vous avez déjà un compte ?{' '}
          <a href="/auth/login" className="text-brand-cyan hover:underline hover:text-brand-cyan/80 transition-colors">
            Se connecter
          </a>
        </p>
      </div>
    </main>
  )
}
