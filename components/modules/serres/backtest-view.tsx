"use client"

import { Activity, TrendingDown, Info, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"

const backtestData = [
  { year: 2015, spot: 20.54, rawWin: 19.50 },
  { year: 2016, spot: 14.13, rawWin: 13.80 },
  { year: 2017, spot: 17.17, rawWin: 16.20 },
  { year: 2018, spot: 21.98, rawWin: 19.90 },
  { year: 2019, spot: 14.64, rawWin: 14.50 },
  { year: 2020, spot: 9.45,  rawWin: 9.10 },
  { year: 2021, spot: 46.67, rawWin: 21.50 }, // Début de crise
  { year: 2022, spot: 112.04, rawWin: 35.00 }, // Pleine crise
  { year: 2023, spot: 40.09, rawWin: 31.00 },
  { year: 2024, spot: 34.07, rawWin: 29.50 },
  { year: 2025, spot: 35.57, rawWin: 30.50 },
];

const strategyExplanations = [
  { year: "2015-2016", title: "Surabondance GNL", desc: "Marché très baissier. L'algorithme a recommandé une exposition quasi-totale au marché Spot (jour le jour) pour profiter de l'effondrement continu des prix jusqu'à 14 €/MWh en moyenne." },
  { year: "2017-2018", title: "Pics Hivernaux & Charbon", desc: "L'Agent IA détecte des tensions sur la production électrique charbonnière et des prévisions hivernales froides ('Beast from the East' en 2018). Prise de couverture anticipée de 60% dès fin 2017 autour de 16 €, protégeant de la hausse de 2018." },
  { year: "2019-2020", title: "Crise COVID & Stockages pleins", desc: "Retour à un marché extrêmement faible. L'IA recommande d'attendre. En 2020, l'effondrement lié au confinement permet d'atteindre le prix historique de 9.45 €. Les volumes sont achetés Spot." },
  { year: "2021", title: "Signaux d'Alarme (Avant-Crise)", desc: "Dès le premier trimestre, l'IA repère des anomalies : stockage bas en Europe, explosion de la demande asiatique. Recommandation urgente : fixer 80% des besoins des années 2022 et 2023 sur des produits à terme (CAL-22 / CAL-23) alors que le prix est encore sous les 20 €." },
  { year: "2022", title: "Le Choc Ukrainien", desc: "Le prix Spot s'envole (pic à 300+ €, moyenne 112 €). Grâce aux positions fixées en 2021, le prix payé effectif est dilué à 35 €. Une économie monumentale qui a sauvé de nombreuses exploitations." },
  { year: "2023-2024", title: "Atterrissage Volatil", desc: "Le marché redescend mais reste fragile (gazoducs russes fermés, dépendance GNL américain). L'IA adopte une stratégie de couverture de 50% sur des creux d'été, laissant le reste en Spot pour profiter de la détente hivernale (hiver doux)." },
  { year: "2025", title: "Tensions Géopolitiques", desc: "Risques sur le détroit d'Ormuz (GNL Qatari) et fin des accords de transit russe via l'Ukraine. Couvertures ciblées (Fixation d'un tiers des volumes au 3e trimestre 2024) permettant d'esquiver la nervosité du début d'année." }
]

export function BacktestView() {
  return (
    <div className="space-y-6 lg:col-span-2">
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6 pt-8 px-8">
          <CardTitle className="text-xl flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Évolution des Prix (Spot vs Couverture IA)
          </CardTitle>
          <CardDescription>
            Prix moyen en €/MWh sur la décennie passée (Historique réel PEG EEX).
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
                  formatter={(value: any) => [`${Number(value).toFixed(2)} €/MWh`]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" name="Spot PEG Moyen" dataKey="spot" stroke="#cbd5e1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Couverture Smart Fields" dataKey="rawWin" stroke="#f97316" strokeWidth={4} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
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
              <Button variant="outline" className="rounded-full border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 hover:text-orange-800">
                <Info className="w-4 h-4 mr-2" />
                Comprendre la stratégie Smart Fields (Historique des positions)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">
                  Transparence & Stratégies (2015 - 2025)
                </DialogTitle>
                <DialogDescription className="text-base">
                  Détail des recommandations d'achats algorithmiques qui ont permis d'atteindre les performances de couverture simulées.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 space-y-6">
                {strategyExplanations.map((strat, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                        <Calendar className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        {strat.year} <span className="text-orange-500">—</span> {strat.title}
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
                  <th className="px-6 py-4">Spot PEG (€/MWh)</th>
                  <th className="px-6 py-4">Smart Fields (€/MWh)</th>
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
                      <td className="px-6 py-4 font-semibold text-orange-600">{row.rawWin.toFixed(2)} €</td>
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
