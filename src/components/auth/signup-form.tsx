'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'admin', // Admin by default for this flow
          },
        },
      })

      if (error) {
        toast.error("Erreur d'inscription", {
          description: error.message,
        })
        return
      }

      toast.success('Inscription réussie !', {
        description: 'Veuillez confirmer votre e-mail pour continuer.',
      })
      router.push('/auth/login')
    } catch (err) {
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-white">Créer un compte Admin</CardTitle>
        <CardDescription className="text-zinc-400">
          Inscrivez votre entreprise pour commencer à gérer vos chantiers.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignup}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName" className="text-zinc-300">Nom Complet</Label>
            <Input
              id="fullName"
              placeholder="Ex: Ahmed Ben Salem"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="border-zinc-800 bg-zinc-900 text-white focus-visible:ring-brand-blue"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-zinc-300">Email Professionnel</Label>
            <Input
              id="email"
              type="email"
              placeholder="directeur@entreprise.tn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-zinc-800 bg-zinc-900 text-white focus-visible:ring-brand-blue"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-zinc-300">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-zinc-800 bg-zinc-900 text-white focus-visible:ring-brand-blue"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white" 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'S\'inscrire'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
