"use client"

import { Activity, TrendingDown, Info, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"

const backtestData = [
  { year: 2015, spot: 0.55, rawWin: 0.52 },
  { year: 2016, spot: 0.45, rawWin: 0.44 },
  { year: 2017, spot: 0.60, rawWin: 0.55 },
  { year: 2018, spot: 0.70, rawWin: 0.62 },
  { year: 2019, spot: 0.65, rawWin: 0.60 },
  { year: 2020, spot: 0.40, rawWin: 0.38 },
  { year: 2021, spot: 0.85, rawWin: 0.55 },
  { year: 2022, spot: 1.30, rawWin: 0.65 },
  { year: 2023, spot: 1.05, rawWin: 0.90 },
  { year: 2024, spot: 0.95, rawWin: 0.85 },
  { year: 2025, spot: 0.88, rawWin: 0.80 },
];

const strategyExplanations = [
  { year: "2015-2016", title: "Pétrole abondant", desc: "Le baril de Brent s'effondre face au boom du gaz de schiste américain. L'algorithme garde l'exposition sur le Spot pour profiter des creux à la pompe, atteignant 0.44 €/L." },
  { year: "2017-2018", title: "Reprise de l'OPEP", desc: "L'OPEP réduit ses quotas. L'IA déclenche des signaux d'achats à terme (contrats ICE Gasoil) dès la fin 2017, amortissant la hausse constante du fioul en 2018 (gain de 8 cts/L)." },
  { year: "2019-2020", title: "Choc COVID-19", desc: "Effondrement brutal de la demande mondiale de pétrole. Les prix s'écroulent à 0.40 €/L en 2020. L'IA saisit cette opportunité historique pour fixer massivement des volumes à très long terme pour 2021 et 2022." },
  { year: "2021", title: "Reprise Économique", desc: "La demande explose plus vite que l'offre, le pétrole flambe. L'agriculteur ne subit pas l'inflation car la majorité de son GNR a été sécurisée fin 2020 via des couvertures financières, obtenant un prix réel de 0.55 €/L contre 0.85 €/L au Spot." },
  { year: "2022", title: "Guerre en Ukraine", desc: "Crise énergétique sans précédent. Le GNR s'envole au-dessus de 1.30 €/L. Les positions long-terme prises par l'IA lors du creux Covid et début 2021 permettent de plafonner le prix de revient à 0.65 €/L, divisant par deux la facture carburant." },
  { year: "2023-2024", title: "Reflux et Volatilité", desc: "Le marché se détend lentement mais les marges de raffinage restent fortes. L'IA liquide ses très vieilles positions et adopte un mix 50/50, sécurisant sur des fenêtres de baisse tactiques (fin d'été) pour préparer les gros travaux de moisson." },
  { year: "2025", title: "Équilibre sous tension", desc: "Marché pétrolier balancé entre ralentissement économique et tensions en mer Rouge. Fixation partielle en fin 2024 sur des points d'appui techniques pour stabiliser la trésorerie." }
]

export function BacktestView() {
  return (
    <div className="space-y-6 lg:col-span-2">
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6 pt-8 px-8">
          <CardTitle className="text-xl flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-500" />
            Évolution des Prix GNR (Spot vs Couverture IA)
          </CardTitle>
          <CardDescription>
            Prix net moyen en €/Litre sur la décennie passée.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 min-h-[350px]">
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={backtestData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} unit="€" />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${Number(value).toFixed(2)} €/L`]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" name="Spot GNR Moyen" dataKey="spot" stroke="#cbd5e1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Couverture Smart Fields" dataKey="rawWin" stroke="#f59e0b" strokeWidth={4} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tableau récapitulatif */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 pt-6 px-8 flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-slate-800">Synthèse des économies par année</CardTitle>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800">
                <Info className="w-4 h-4 mr-2" />
                Comprendre la stratégie Smart Fields (Historique des positions)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">
                  Transparence & Stratégies GNR (2015 - 2025)
                </DialogTitle>
                <DialogDescription className="text-base">
                  Détail des recommandations d'achats algorithmiques qui ont permis d'atteindre les performances de couverture simulées sur le carburant agricole.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 space-y-6">
                {strategyExplanations.map((strat, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                        <Calendar className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        {strat.year} <span className="text-amber-500">—</span> {strat.title}
                      </h4>
                      <p className="mt-2 text-slate-600 leading-relaxed font-medium">
                        {strat.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Année</th>
                  <th className="px-6 py-4">Spot GNR (€/L)</th>
                  <th className="px-6 py-4">Smart Fields (€/L)</th>
                  <th className="px-6 py-4">Économie Générée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backtestData.map((row) => {
                  const diff = row.spot - row.rawWin;
                  const pct = (diff / row.spot) * 100;
                  return (
                    <tr key={row.year} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700">{row.year}</td>
                      <td className="px-6 py-4 text-slate-500">{row.spot.toFixed(2)} €</td>
                      <td className="px-6 py-4 font-semibold text-amber-600">{row.rawWin.toFixed(2)} €</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                          <TrendingDown className="w-4 h-4" />
                          <span>-{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
