import { LoginForm } from '@/components/auth/login-form'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center justify-center space-y-2">
          <Image 
            src="/corex.png" 
            alt="Corex Logo" 
            width={220} 
            height={220} 
            className="object-contain mb-4 transform hover:scale-105 transition-transform"
            priority
          />
          <p className="text-sm text-zinc-400 font-medium italic mt-2">Gérez vos chantiers, simplement.</p>
        </div>
        
        <LoginForm />
        
        <p className="px-8 text-center text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-300 pointer-events-none opacity-50">
           2026 Corex. Tous droits réservés.
        </p>
      </div>
    </main>
  )
}
