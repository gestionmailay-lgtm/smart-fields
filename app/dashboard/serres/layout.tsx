import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Settings, BarChart3, Lightbulb, TrendingUp, ArrowRight, Activity, Leaf } from "lucide-react"

export default function SerresLayout({
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
          src="/serres.jpg"
          alt="Serres agricoles"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        
        {/* Texte Central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 drop-shadow-md">
            Module Serres
          </h1>
          <p className="max-w-[800px] text-lg text-white/90 drop-shadow-sm mb-4">
            Optimisation et pilotage financier de vos cultures sous serres.
          </p>
          <Link
            href="/dashboard/aranet"
            className="group flex items-center gap-2 px-6 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md border border-emerald-500 rounded-full text-xs font-bold text-white transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <Activity className="h-4 w-4 text-emerald-300 group-hover:animate-pulse" />
            Accéder aux Capteurs Aranet IoT
          </Link>
        </div>

        {/* Boutons de navigation intégrés au bandeau (en bas) - Processus en 3 étapes */}
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 w-full max-w-6xl items-center">
            
            {/* Colonne Gauche : Fondations */}
            <div className="relative flex flex-col gap-3 h-full">
              <Link 
                href="/dashboard/serres/parametrage"
                className="relative flex items-center gap-3 px-4 py-3 pl-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg group h-full overflow-hidden"
              >
                <div className="absolute top-1/2 -translate-y-1/2 left-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/40 border border-white/20 text-xs font-bold text-white/80 z-10">1</div>
                <div className="bg-green-400/20 p-2 rounded-lg shrink-0">
                  <Settings className="h-4 w-4 text-green-400 group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <span className="text-sm">Paramétrage des données</span>
              </Link>
              <Link 
                href="/dashboard/serres/cout-production"
                className="relative flex items-center gap-3 px-4 py-3 pl-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg group h-full overflow-hidden"
              >
                <div className="absolute top-1/2 -translate-y-1/2 left-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/40 border border-white/20 text-xs font-bold text-white/80 z-10">2</div>
                <div className="bg-blue-400/20 p-2 rounded-lg shrink-0">
                  <BarChart3 className="h-4 w-4 text-blue-400 group-hover:-translate-y-1 transition-transform" />
                </div>
                <span className="text-sm">Construction des coûts de production</span>
              </Link>

              {/* Flèche vers Conseil */}
              <div className="hidden md:flex absolute top-1/2 -right-5 md:-right-7 -translate-y-1/2 z-20">
                <ArrowRight className="h-8 w-8 text-white/40 drop-shadow-lg" />
              </div>
            </div>

            {/* Colonne Centrale : Conseil Smart Fields (Flashy) */}
            <div className="relative h-full">
              <Link 
                href="/dashboard/serres/conseil"
                className="relative flex flex-col items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:via-orange-500/30 hover:to-amber-500/30 backdrop-blur-xl border-2 border-amber-400/50 rounded-2xl text-white font-bold transition-all hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_30px_-5px_rgba(251,191,36,0.4)] hover:shadow-[0_0_50px_-5px_rgba(251,191,36,0.6)] group overflow-hidden h-full"
              >
                <div className="absolute top-3 left-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/60 border border-amber-300/60 text-xs font-bold text-amber-50 z-10">3</div>
                
                {/* Effet de brillance au survol */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                
                <div className="bg-amber-400/20 p-3 rounded-full mb-1">
                  <Lightbulb className="h-8 w-8 text-amber-400 group-hover:animate-pulse" />
                </div>
                <span className="text-xl tracking-tight text-center">Conseil Raw&apos;win</span>
              </Link>

              {/* Flèche vers Projection */}
              <div className="hidden md:flex absolute top-1/2 -right-5 md:-right-7 -translate-y-1/2 z-20">
                <ArrowRight className="h-8 w-8 text-white/40 drop-shadow-lg" />
              </div>
            </div>

            {/* Colonne Droite : Projection, Graphique & Analyse Agronomique */}
            <div className="relative flex flex-col gap-3 h-full">
              <Link 
                href="/dashboard/serres/projection"
                className="relative flex items-center gap-3 px-4 py-3 pl-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg group h-full overflow-hidden"
              >
                <div className="absolute top-1/2 -translate-y-1/2 left-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/60 border border-purple-300/60 text-xs font-bold text-purple-50 z-10">4</div>
                <div className="bg-purple-400/20 p-2 rounded-lg shrink-0">
                  <TrendingUp className="h-4 w-4 text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <span className="text-sm">Projection des coûts de production</span>
              </Link>
              <Link 
                href="/dashboard/serres/analyse-graphe"
                className="relative flex items-center gap-3 px-4 py-3 pl-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg group h-full overflow-hidden"
              >
                <div className="absolute top-1/2 -translate-y-1/2 left-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/60 border border-cyan-300/60 text-xs font-bold text-cyan-50 z-10">5</div>
                <div className="bg-cyan-400/20 p-2 rounded-lg shrink-0">
                  <BarChart3 className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-sm">Graphique</span>
              </Link>
              <Link 
                href="/dashboard/serres/analyse-agronomique"
                className="relative flex items-center gap-3 px-4 py-3 pl-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg group h-full overflow-hidden"
              >
                <div className="absolute top-1/2 -translate-y-1/2 left-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/60 border border-emerald-300/60 text-xs font-bold text-emerald-50 z-10">6</div>
                <div className="bg-emerald-400/20 p-2 rounded-lg shrink-0">
                  <Leaf className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-sm">Analyse agronomique</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu de la page */}
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  )
}
