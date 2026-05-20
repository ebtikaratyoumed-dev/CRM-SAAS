import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Scan, 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Zap,
  Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-brand-cyan/30">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-zinc-900/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center group cursor-pointer">
            <Image 
              src="/corex.png" 
              alt="Corex Logo" 
              width={140} 
              height={50} 
              className="object-contain hover:scale-105 transition-transform"
            />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-black uppercase tracking-widest text-zinc-400">
            <Link href="#features" className="hover:text-brand-cyan transition-colors">Solutions</Link>
            <Link href="#pricing" className="hover:text-brand-cyan transition-colors">Tarifs</Link>
            <Link href="/auth/login">
              <Button variant="outline" className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-white font-black px-8 rounded-full transition-all">
                Connexion
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <Badge className="mb-6 px-4 py-1 bg-brand-blue/10 text-brand-cyan border-brand-cyan/20 text-[10px] font-black uppercase tracking-[0.2em] rounded-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
            SaaS CRM pour la Construction 2.0
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-8 leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Gérez vos chantiers, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue via-brand-cyan to-white tracking-widest uppercase italic">Simplement.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-400 font-medium mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
             Optimisez la gestion de vos factures, le suivi de vos tâches et de vos interventions sur le terrain avec notre CRM taillé pour le BTP.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-brand-cyan text-black hover:bg-white font-black text-sm uppercase tracking-widest px-10 h-14 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all group overflow-hidden">
                Démarrer l'essai gratuit
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="ghost" size="lg" className="text-white font-black text-sm uppercase tracking-widest hover:bg-zinc-900 px-10 h-14 rounded-full">
              Voir la Démo
            </Button>
          </div>
        </div>

        {/* Abstract Background Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-blue/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-24 bg-zinc-950/50 border-y border-zinc-900 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <div className="aspect-video rounded-xl bg-zinc-950 overflow-hidden flex items-center justify-center border border-zinc-800/50 relative">
                <div className="absolute flex flex-col items-center gap-4">
                   <div className="h-16 w-16 bg-brand-cyan/20 rounded-full flex items-center justify-center">
                      <LayoutDashboard className="h-8 w-8 text-brand-cyan animate-pulse" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Aperçu du Tableau de Bord</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="mb-24 text-center">
             <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Fonctionnalités Clés</h2>
             <div className="h-1 w-20 bg-brand-cyan mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Scan} 
              title="Scan Intelligent" 
              description="Extractez automatiquement les données de vos factures fournisseurs grâce à notre IA propriétaire."
            />
            <FeatureCard 
              icon={Zap} 
              title="Suivi de Chantier" 
              description="Visualisez l'avancement de vos projets en temps réel, de la planification à la livraison."
            />
            <FeatureCard 
              icon={ShieldCheck} 
              title="Conformité Totale" 
              description="Archivage sécurisé de tous vos documents légaux et financiers dans le cloud."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-black overflow-hidden relative">
        <div className="absolute inset-0 bg-brand-blue/5" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter mb-8 leading-tight">Prêt à transformer <br />votre gestion ?</h2>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-black hover:bg-brand-cyan font-black text-sm uppercase tracking-widest px-12 h-16 rounded-full transition-all scale-110 hover:scale-125">
                Rejoignez Corex
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-900 bg-black">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center">
             <Image 
               src="/corex.png" 
               alt="Corex Logo" 
               width={120} 
               height={40} 
               className="object-contain"
             />
          </div>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            © 2026 Corex Construction CRM. Tous droits réservés. Tunise.
          </p>
          <div className="flex items-center gap-6 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
             <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
             <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-10 rounded-3xl border border-zinc-900 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-zinc-800 transition-all group">
      <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl">
        <Icon className="h-6 w-6 text-brand-cyan" />
      </div>
      <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4">{title}</h3>
      <p className="text-zinc-500 font-medium leading-relaxed underline decoration-zinc-800 decoration-2 underline-offset-4">
        {description}
      </p>
    </div>
  )
}
