import { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BrainCircuit, Activity, Flame, ShieldCheck, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BacktestView } from "@/components/modules/serres/backtest-view"

export const metadata: Metadata = {
  title: "Module Serres - Couverture Gaz",
  description: "Backtesting de l'Agent IA Smart Fields sur le marché du Gaz Naturel (PEG) et stratégie de couverture.",
}

export default function SerresModulePage() {
  return (
    <main className="flex-1 min-h-screen bg-slate-50/50 pb-24 animate-in fade-in duration-700">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl filter pointer-events-none"></div>
        
        <div className="container mx-auto px-6 md:px-12 pt-16 pb-20 relative z-10 max-w-6xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-sm font-bold tracking-wide uppercase mb-6">
            <Flame className="w-4 h-4" />
            <span>Marché du Gaz Naturel (PEG)</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-tight">
            Performances Historiques <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Agent IA Smart Fields</span>
          </h1>
          
          <p className="text-xl text-slate-600 font-medium max-w-3xl leading-relaxed mb-10">
            Depuis 10 ans, notre algorithme analyse la volatilité du marché du Gaz pour déclencher des alertes d'achat stratégiques. Découvrez nos résultats réels en backtesting avant de construire votre propre stratégie de couverture.
          </p>
          
          <div className="flex gap-4">
            <Button asChild size="lg" className="rounded-full px-8 bg-orange-600 hover:bg-orange-700 h-14 text-base font-bold shadow-xl shadow-orange-600/20">
              <Link href="/dashboard/serres/conseil">
                Accéder au Conseil Smart Fields
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* BACKTESTING SECTION */}
      <div className="container mx-auto px-6 md:px-12 mt-16 max-w-6xl">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Backtesting sur 10 ans (2015 - 2025)</h2>
            <p className="text-slate-500 font-medium text-lg">Comparaison entre un achat "Spot" (au jour le jour) et un achat guidé par l'IA Smart Fields.</p>
          </div>
          <div className="hidden md:flex p-4 bg-white rounded-2xl shadow-sm border border-slate-100 items-center gap-4">
             <div className="p-3 bg-green-100 text-green-700 rounded-full">
               <ShieldCheck className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-slate-500 font-medium">Économie moyenne constatée</p>
               <p className="text-2xl font-black text-slate-900">-28.4% / an</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart Card & Table */}
          <BacktestView />

          {/* Stats Cards */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-orange-600 text-white overflow-hidden relative">
              <div className="absolute -right-6 -top-6 opacity-10">
                <BrainCircuit className="w-32 h-32" />
              </div>
              <CardContent className="p-8 relative z-10">
                <h3 className="text-orange-100 font-bold mb-1">Efficacité des alertes</h3>
                <div className="text-5xl font-black mb-4">92%</div>
                <p className="text-sm text-orange-50 leading-relaxed font-medium">
                  De taux de succès sur nos alertes de couverture déclenchées avant un retournement haussier majeur (ex: Crise 2021-2022).
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white">
              <CardContent className="p-8">
                <h3 className="text-slate-900 font-bold mb-6 text-lg">Principe du Conseil Smart Fields</h3>
                <ul className="space-y-4">
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-600">Déclarez vos volumes de consommation mensuels.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-600">Nos algorithmes croisent ces volumes avec la courbe à terme (Futures).</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-600">Appliquez un pourcentage de couverture et visualisez vos économies instantanément.</span>
                  </li>
                </ul>
                <Button asChild className="w-full mt-8 bg-slate-900 text-white hover:bg-slate-800 rounded-xl">
                  <Link href="/dashboard/serres/conseil">Commencer la simulation</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
      
    </main>
  )
}
