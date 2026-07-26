import { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BrainCircuit, Activity, Wheat, ShieldCheck, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BacktestView } from "@/components/modules/cereales/backtest-view"

export const metadata: Metadata = {
  title: "Module Céréales - Couverture MATIF",
  description: "Backtesting de l'Agent IA Smart Fields sur les marchés Blé, Colza et GNR.",
}

export default function CerealesModulePage() {
  return (
    <main className="flex-1 min-h-screen bg-slate-50/50 pb-24 animate-in fade-in duration-700">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl filter pointer-events-none"></div>
        
        <div className="container mx-auto px-6 md:px-12 pt-16 pb-20 relative z-10 max-w-6xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-sm font-bold tracking-wide uppercase mb-6">
            <Wheat className="w-4 h-4" />
            <span>Marchés MATIF & Énergies</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-tight">
            Performances Historiques <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-500">Agent IA Smart Fields</span>
          </h1>
          
          <p className="text-xl text-slate-600 font-medium max-w-3xl leading-relaxed mb-10">
            Protégez vos marges sur le Blé et le Colza, et sécurisez vos achats de GNR. Nos algorithmes analysent 10 ans de données historiques pour déclencher les meilleures fenêtres d'achat et de vente.
          </p>
          
          <div className="flex gap-4">
            <Button asChild size="lg" className="rounded-full px-8 bg-amber-600 hover:bg-amber-700 h-14 text-base font-bold shadow-xl shadow-amber-600/20">
              <Link href="/dashboard/cereales/parametrage">
                Lancer la Simulation Déclarative
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
            <p className="text-slate-500 font-medium text-lg">Comparaison de la marge nette entre un achat "Spot" de GNR et un achat couvert par l'IA.</p>
          </div>
          <div className="hidden md:flex p-4 bg-white rounded-2xl shadow-sm border border-slate-100 items-center gap-4">
             <div className="p-3 bg-green-100 text-green-700 rounded-full">
               <ShieldCheck className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-slate-500 font-medium">Gain moyen sur marge nette</p>
               <p className="text-2xl font-black text-slate-900">+18.5% / an</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart Card & Table */}
          <BacktestView />

          {/* Stats Cards */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-amber-600 text-white overflow-hidden relative">
              <div className="absolute -right-6 -top-6 opacity-10">
                <BrainCircuit className="w-32 h-32" />
              </div>
              <CardContent className="p-8 relative z-10">
                <h3 className="text-amber-100 font-bold mb-1">Volatilité Absorbée</h3>
                <div className="text-5xl font-black mb-4">78%</div>
                <p className="text-sm text-amber-50 leading-relaxed font-medium">
                  De la volatilité des cours du GNR et du Blé est absorbée par les prises de positions anticipées de l'algorithme.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white">
              <CardContent className="p-8">
                <h3 className="text-slate-900 font-bold mb-6 text-lg">Principe du Conseil Smart Fields</h3>
                <ul className="space-y-4">
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-600">Déclarez vos surfaces et volumes cibles annuels.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-600">Nos algorithmes simulent vos coûts et vos prix d'équilibre.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-600">Appliquez des stratégies de couverture à terme et visualisez votre nouvelle marge.</span>
                  </li>
                </ul>
                <Button asChild className="w-full mt-8 bg-slate-900 text-white hover:bg-slate-800 rounded-xl">
                  <Link href="/dashboard/cereales/parametrage">Commencer la simulation</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
      
    </main>
  )
}
