import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Settings, BarChart3, Lightbulb, TrendingUp, ArrowRight } from "lucide-react"

export default function CerealesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header Héro avec image de fond et boutons de navigation */}
      <div className="relative h-[50vh] w-full shrink-0">
        {/* Lien retour en haut à gauche */}
        <div className="absolute top-4 left-4 z-20 md:top-6 md:left-6">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-sm font-medium text-white transition-all shadow-lg"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Retour au tableau de bord
          </Link>
        </div>

        <Image
          src="/cereales.jpg"
          alt="Cultures céréalières"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        
        {/* Texte Central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 drop-shadow-md">
            Module Céréales
          </h1>
          <p className="max-w-[800px] text-lg text-white/90 drop-shadow-sm">
            Optimisation des marges, pilotage des achats (GNR, Engrais) et stratégie de vente (Blé, Colza, Maïs).
          </p>
        </div>

        {/* Boutons de navigation intégrés au bandeau (en bas) - Processus en 4 étapes */}
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-7xl items-center">
            
            {/* Étape 1 : Paramétrage */}
            <div className="relative flex flex-col gap-3 h-full">
              <Link 
                href="/dashboard/cereales/parametrage"
                className="relative flex flex-col items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg group h-full overflow-hidden"
              >
                <div className="absolute top-2 left-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/40 border border-white/20 text-[10px] font-bold text-white/80 z-10">1</div>
                <div className="bg-green-400/20 p-2 rounded-lg">
                  <Settings className="h-5 w-5 text-green-400 group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <span className="text-xs text-center font-semibold">Paramétrage Cultures & Intrants</span>
              </Link>
              <div className="hidden lg:flex absolute top-1/2 -right-4 -translate-y-1/2 z-20">
                <ArrowRight className="h-6 w-6 text-white/40 drop-shadow-lg" />
              </div>
            </div>

            {/* Étape 2 : Coûts */}
            <div className="relative flex flex-col gap-3 h-full">
              <Link 
                href="/dashboard/cereales/cout-production"
                className="relative flex flex-col items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg group h-full overflow-hidden"
              >
                <div className="absolute top-2 left-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/40 border border-white/20 text-[10px] font-bold text-white/80 z-10">2</div>
                <div className="bg-blue-400/20 p-2 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-400 group-hover:-translate-y-1 transition-transform" />
                </div>
                <span className="text-xs text-center font-semibold">Construction des coûts</span>
              </Link>
              <div className="hidden lg:flex absolute top-1/2 -right-4 -translate-y-1/2 z-20">
                <ArrowRight className="h-6 w-6 text-white/40 drop-shadow-lg" />
              </div>
            </div>

            {/* Étape 3 : Conseil Smart Fields (Flashy) */}
            <div className="relative h-full">
              <Link 
                href="/dashboard/cereales/conseil"
                className="relative flex flex-col items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:via-orange-500/30 hover:to-amber-500/30 backdrop-blur-xl border-2 border-amber-400/50 rounded-2xl text-white font-bold transition-all hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_30px_-5px_rgba(251,191,36,0.4)] hover:shadow-[0_0_50px_-5px_rgba(251,191,36,0.6)] group overflow-hidden h-full"
              >
                <div className="absolute top-2 left-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/60 border border-amber-300/60 text-[10px] font-bold text-amber-50 z-10">3</div>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                
                <div className="bg-amber-400/20 p-2 rounded-full">
                  <Lightbulb className="h-6 w-6 text-amber-400 group-hover:animate-pulse" />
                </div>
                <span className="text-sm tracking-tight text-center">Stratégie Achat & Vente</span>
              </Link>
              <div className="hidden lg:flex absolute top-1/2 -right-4 -translate-y-1/2 z-20">
                <ArrowRight className="h-6 w-6 text-white/40 drop-shadow-lg" />
              </div>
            </div>

            {/* Étape 4 : Projection */}
            <div className="relative h-full">
              <Link 
                href="/dashboard/cereales/projection"
                className="relative flex flex-col items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl group h-full overflow-hidden"
              >
                <div className="absolute top-2 left-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/60 border border-purple-300/60 text-[10px] font-bold text-purple-50 z-10">4</div>
                
                <div className="bg-purple-400/20 p-2 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-purple-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
                <span className="text-xs text-center">Projection des Marges</span>
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Contenu de la page */}
      <main className="flex-1 bg-background relative z-10">
        {children}
      </main>
    </div>
  )
}
