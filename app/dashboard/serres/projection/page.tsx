"use client"

import React, { useState, useEffect, useMemo } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { TrendingUp, ArrowLeft, Info, Euro, Target } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

const MARKET_PRICES: Record<string, number> = {
  "2026 Q3": 45.52,
  "2026 Q4": 44.64,
  "2027 Q1": 43.36,
  "2027 Q2": 35.25,
  "2027 Q3": 33.63,
  "2027 Q4": 33.87,
  "2028 Q1": 32.81,
  "2028 Q2": 26.66,
  "2028 Q3": 24.77,
  "2028 Q4": 25.75,
  "2029 Q1": 26.14,
  "2029 Q2": 22.61,
  "2029 Q3": 22.40,
  "2029 Q4": 23.16,
  "2030 Q1": 24.15,
  "2030 Q2": 22.48,
  "2030 Q3": 20.41,
  "2030 Q4": 21.50,
}

// Couleurs pour les lignes du graphique
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6"]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border shadow-2xl p-4 rounded-2xl min-w-[200px]">
        <p className="text-muted-foreground font-black mb-3">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            const isDotted = entry.name.includes("Contexte");
            if (isDotted) {
              return (
                <div key={index} className="flex justify-between items-center gap-4 text-[10px] opacity-60">
                  <span style={{ color: entry.color }} className="font-medium">{entry.name}</span>
                  <span className="font-semibold">{Number(entry.value).toFixed(2)} €/m²</span>
                </div>
              )
            }
            return (
              <div key={index} className="flex justify-between items-center gap-4 text-sm font-black">
                <span style={{ color: entry.color }}>{entry.name}</span>
                <span>{Number(entry.value).toFixed(2)} €/m²</span>
              </div>
            )
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function ProjectionSerresPage() {
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])
  const [segmentsList, setSegmentsList] = useState<string[]>([])
  const [gasCostsYearly, setGasCostsYearly] = useState<Record<number, any>>({})

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        let settings = null
        if (user) {
          const { data } = await supabase
            .from('greenhouse_settings')
            .select('*')
            .eq('user_id', user.id)
            .single()
          settings = data
        } else {
          const local = localStorage.getItem('greenhouse_settings_guest')
          if (local) {
            try {
              settings = JSON.parse(local)
            } catch (e) {}
          }
        }

        if (settings) {
          const segments = settings.segments || []
          const gasHedging = settings.gas_hedging || {}
          const gasTaxes = settings.gas_taxes || {}
          const gasTotalMWhDoc = settings.gas_total_mwh_doc || 0
          const gasMoleculePrice = settings.gas_molecule_price || 45
          const laborRate = settings.labor_rate || 25
          const segmentLaborHHa = settings.segment_labor_h_ha || {}
          const expenses = settings.expenses || {}
          const historicalGasTotal = settings.historical_gas_total || Array(12).fill(0)
          const gasLegumesPercents = settings.gas_legumes_percents || Array(12).fill(100)

          // 1. Calcul du taux de taxes par MWh
          const gasTaxesTotal = (gasTaxes.transport || 0) + (gasTaxes.ticgn || 0) + (gasTaxes.abonnement || 0) + (gasTaxes.cta || 0)
          const gasTaxRatePerMWh = gasTotalMWhDoc > 0 ? gasTaxesTotal / gasTotalMWhDoc : 0

          // 2. Calcul du coût moyen de la molécule par année (WAC) et Scénarios (Spot 10€ / 200€)
          const years = [2026, 2027, 2028, 2029, 2030]
          const gasCostsPerYear: Record<number, any> = {}

          years.forEach(year => {
            let sumWac = 0
            let sumWacLow = 0
            let sumWacHigh = 0
            let sumExposure = 0
            let count = 0
            ;["Q1", "Q2", "Q3", "Q4"].forEach(q => {
              const period = `${year} ${q}`
              const marketPrice = MARKET_PRICES[period]
              if (marketPrice !== undefined) {
                const hedge = gasHedging[period] || { percentage: 0, price: 0 }
                const expRatio = Math.max(0, 1 - (hedge.percentage / 100)) // Part exposée au spot
                
                // Coût moyen pondéré = (% couverture * prix couverture) + (% résiduel * prix marché)
                sumWac += (hedge.percentage / 100 * hedge.price) + (expRatio * marketPrice)
                // Scénario Spot 20€ (Contexte 2012-2020) sur le résiduel
                sumWacLow += (hedge.percentage / 100 * hedge.price) + (expRatio * 20)
                // Scénario Spot 90€ (Contexte 2022) sur le résiduel
                sumWacHigh += (hedge.percentage / 100 * hedge.price) + (expRatio * 90)
                
                sumExposure += (expRatio * 100)
                count++
              }
            })
            
            // Si pas de marché (ex: Q1/Q2 2026 passés), on ne compte que les trimestres futurs pour la moyenne de l'année
            const avgMoleculeCost = count > 0 ? sumWac / count : gasMoleculePrice
            const avgMoleculeLow = count > 0 ? sumWacLow / count : gasMoleculePrice
            const avgMoleculeHigh = count > 0 ? sumWacHigh / count : gasMoleculePrice
            const avgExposure = count > 0 ? sumExposure / count : 100
            
            // On ajoute les taxes (constantes) au coût de la molécule
            gasCostsPerYear[year] = {
              cost: avgMoleculeCost + gasTaxRatePerMWh,
              low: avgMoleculeLow + gasTaxRatePerMWh,
              high: avgMoleculeHigh + gasTaxRatePerMWh,
              exposure: avgExposure
            }
          })

          setGasCostsYearly(gasCostsPerYear)

          // 3. Calcul des Frais Fixes au m² (indépendants du gaz)
          const totalSurface = segments.reduce((acc: number, s: any) => acc + (s.surfaceCible || s.surfaceN1 || 0), 0)
          const totalSurfaceM2 = Math.max(1, totalSurface * 10000)

          const totalOperationalLaborCost = segments.reduce((acc: number, seg: any) => {
            const sHa = seg.surfaceCible || seg.surfaceN1 || 0
            const hHa = segmentLaborHHa[seg.id] || 0
            return acc + (sHa * hHa * laborRate)
          }, 0)

          const totalLaborCharges = expenses.c64_personnel || 0
          const residualLaborCost = Math.max(0, totalLaborCharges - totalOperationalLaborCost)
          const laborOtherCostM2 = residualLaborCost / totalSurfaceM2

          const c60M2 = Number(expenses.c60_achats || 0) / totalSurfaceM2
          const elecCostM2 = Number(expenses.c60_elec || 0) / totalSurfaceM2
          const c61_62M2 = Number(expenses.c61_62_externes || 0) / totalSurfaceM2
          const c63M2 = Number(expenses.c63_impots || 0) / totalSurfaceM2
          const c65M2 = Number(expenses.c65_autres || 0) / totalSurfaceM2
          const c66_67M2 = Number(expenses.c66_67_fin_exc || 0) / totalSurfaceM2
          const c68M2 = Number(expenses.c68_amort || 0) / totalSurfaceM2

          const fixedCostsM2 = laborOtherCostM2 + elecCostM2 + c60M2 + c61_62M2 + c63M2 + c65M2 + c66_67M2 + c68M2

          // 4. Projection des coûts de production par année et par segment
          const validSegments = segments.filter((s: any) => s.culture && (s.surfaceCible > 0 || s.surfaceN1 > 0))
          setSegmentsList(validSegments.map((s: any) => s.culture))

          const chartOutput = years.map(year => {
            const row: any = { year: year.toString() }
            
            validSegments.forEach((seg: any) => {
              const hHa = segmentLaborHHa[seg.id] || 0
              const moOpM2 = (hHa * laborRate) / 10000
              
              const segTotalKwhM2 = (seg.gasMonthly && seg.gasMonthly.some((v: number) => v > 0))
                  ? seg.gasMonthly.reduce((a: number, b: number) => a + b, 0)
                  : (historicalGasTotal.reduce((a: number, b: number) => a + b, 0) * (gasLegumesPercents.reduce((a: number, b: number) => a + b, 0) / (12 * 100))) / (totalSurfaceM2 / 10000 || 1)
              
              const segMWhM2 = segTotalKwhM2 / 1000
              
              // Scénario de Base (Marché prévisionnel)
              const energyCostM2 = segMWhM2 * gasCostsPerYear[year].cost
              row[seg.culture] = Number((moOpM2 + fixedCostsM2 + energyCostM2).toFixed(2))
              
              // Scénario Bas (Spot à 20€ - Contexte 2012-2020)
              const energyCostLowM2 = segMWhM2 * gasCostsPerYear[year].low
              row[`${seg.culture} (Contexte 2012-2020)`] = Number((moOpM2 + fixedCostsM2 + energyCostLowM2).toFixed(2))
              
              // Scénario Haut (Spot à 90€ - Contexte 2022)
              const energyCostHighM2 = segMWhM2 * gasCostsPerYear[year].high
              row[`${seg.culture} (Contexte 2022)`] = Number((moOpM2 + fixedCostsM2 + energyCostHighM2).toFixed(2))
            })
            
            return row
          })

          setChartData(chartOutput)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  if (loading) {
    return (
      <div className="container mx-auto p-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">Calcul des projections en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 md:p-12 max-w-7xl space-y-8 animate-in fade-in duration-700">
      
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-8">
        <div className="space-y-3">
          <Link href="/dashboard/serres/conseil" className="inline-flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-widest hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Retour au Conseil Smart Fields
          </Link>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase flex items-center gap-4">
            <TrendingUp className="h-10 w-10 text-purple-500" /> 
            Projections <span className="text-purple-500 italic">Financières</span>
          </h2>
          <p className="text-muted-foreground text-xl font-medium max-w-3xl">
            Évolution anticipée de vos coûts de production au m² (2026-2030), intégrant vos frais de structure, vos taxes et votre stratégie de couverture gazière.
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2 bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20">
          <Badge className="bg-purple-500 text-white hover:bg-purple-600 font-bold px-3 py-1">
            <Target className="h-3 w-3 mr-1" /> Horizon 5 ans
          </Badge>
          <p className="text-xs font-bold text-muted-foreground mt-1">Impact direct du Hedging</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* GRAPHIQUE DES PROJECTIONS */}
        <Card className="shadow-2xl border-border/50 bg-card/50 backdrop-blur-md overflow-hidden rounded-[2rem]">
          <CardHeader className="p-8 pb-4 bg-muted/30 border-b border-border/50">
            <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-purple-500" /> Évolution du Coût de Revient au m²
            </CardTitle>
            <CardDescription className="text-base">
              Lecture directe de l'impact des marchés et de votre stratégie sur la rentabilité de vos segments.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 130, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="year" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 800, fontSize: 14 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12 }}
                    tickFormatter={(val) => `${val} €`}
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '30px', fontWeight: 800, fontSize: '12px' }}
                  />
                  
                  {segmentsList.map((segment, index) => (
                    <React.Fragment key={segment}>
                      {/* Ligne Principale */}
                      <Line 
                        type="monotone" 
                        dataKey={segment} 
                        name={segment}
                        stroke={COLORS[index % COLORS.length]} 
                        strokeWidth={4}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                        animationDuration={1500}
                      />
                      {/* Ligne Basse (20€ - 2012-2020) */}
                      <Line 
                        type="monotone" 
                        dataKey={`${segment} (Contexte 2012-2020)`} 
                        name={`${segment} (Contexte 2012-2020)`}
                        stroke={COLORS[index % COLORS.length]} 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={false}
                        legendType="none"
                        opacity={0.4}
                        animationDuration={1500}
                        label={(props: any) => {
                          if (props.index === chartData.length - 1) {
                            return <text x={props.x + 8} y={props.y} fill={COLORS[index % COLORS.length]} fontSize={10} fontWeight={700} opacity={0.8} dominantBaseline="middle">2012-2020 (20€/MWh)</text>
                          }
                          return null;
                        }}
                      />
                      {/* Ligne Haute (90€ - 2022) */}
                      <Line 
                        type="monotone" 
                        dataKey={`${segment} (Contexte 2022)`} 
                        name={`${segment} (Contexte 2022)`}
                        stroke={COLORS[index % COLORS.length]} 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={false}
                        legendType="none"
                        opacity={0.4}
                        animationDuration={1500}
                        label={(props: any) => {
                          if (props.index === chartData.length - 1) {
                            return <text x={props.x + 8} y={props.y} fill={COLORS[index % COLORS.length]} fontSize={10} fontWeight={700} opacity={0.8} dominantBaseline="middle">2022 (90€/MWh)</text>
                          }
                          return null;
                        }}
                      />
                    </React.Fragment>
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* TABLEAU DES COUTS DE GAZ MOYENS PAR ANNÉE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-xl border-border/50 bg-card overflow-hidden rounded-[2rem]">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <Euro className="h-6 w-6 text-emerald-500" /> Détail : Coût global du Gaz
              </CardTitle>
              <CardDescription>
                Coût final calculé (Molécule + Taxes) par année.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="space-y-4">
                {Object.entries(gasCostsYearly).map(([year, data]) => {
                  let barColor = "bg-emerald-500";
                  let textColor = "text-emerald-500";
                  if (data.exposure > 75) { barColor = "bg-red-500"; textColor = "text-red-500"; }
                  else if (data.exposure > 25) { barColor = "bg-orange-500"; textColor = "text-orange-500"; }
                  
                  return (
                    <div key={year} className="flex flex-col p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-emerald-500/30 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-lg">{year}</span>
                          <span className="text-xs text-muted-foreground font-semibold mt-1">
                            Exposition Spot : <span className={`font-bold ${textColor}`}>{data.exposure.toFixed(0)}%</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-emerald-500 text-xl">{data.cost.toFixed(2)} €</span>
                          <span className="text-xs text-muted-foreground font-bold ml-1">/ MWh</span>
                        </div>
                      </div>
                      {/* BarChart visuel de l'exposition */}
                      <div className="w-full bg-border/50 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor} transition-all duration-1000`} style={{ width: `${data.exposure}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-border/50 bg-card overflow-hidden rounded-[2rem] bg-gradient-to-br from-purple-500/5 to-transparent">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <Info className="h-6 w-6 text-purple-500" /> Comment lire ce graphique ?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                Cette projection fusionne l'intégralité de votre paramétrage financier. Pour chaque segment et chaque année, nous calculons :
              </p>
              <ul className="space-y-4 text-sm font-medium text-foreground">
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                  <p><span className="font-bold text-purple-500">Les Frais Fixes :</span> Main d'œuvre, amortissements, électricité et autres charges répartis au m² (considérés constants).</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                  <p><span className="font-bold text-emerald-500">La Molécule Gaz :</span> L'évolution du prix de la molécule issue de votre stratégie de couverture (Hedging) et du cours moyen du marché PEG sur l'année.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                  <p><span className="font-bold text-blue-500">Les Taxes Gaz :</span> Le TICGN, CTA, Transport et Abonnements lissés par MWh.</p>
                </li>
              </ul>
              <div className="mt-6 p-4 rounded-xl bg-purple-500 text-white font-bold text-sm text-center shadow-lg shadow-purple-500/20">
                L'évolution des courbes reflète donc 100% de l'impact énergétique.
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
