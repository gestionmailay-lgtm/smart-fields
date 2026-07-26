"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, ArrowRight, Lightbulb, ShieldCheck, ShoppingCart, TrendingUp, Sparkles, CheckCircle2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/client"

const supabase = createClient()

export default function ConseilCerealesPage() {
  const router = useRouter()
  const [cultures, setCultures] = useState<any[]>([])
  
  // États de couverture
  const [gnrHedging, setGnrHedging] = useState<{ volume: number, price: number }>({ volume: 0, price: 0 })
  const [fertHedging, setFertHedging] = useState<{ volume: number, price: number }>({ volume: 0, price: 0 })
  
  // Couverture de vente par culture (id -> { volume, price })
  const [salesHedging, setSalesHedging] = useState<{ [key: string]: { volume: number, price: number } }>({})
  
  const [prices, setPrices] = useState({ gnr_price: 1.0, fertilizer_price: 350 })
  const [saving, setSaving] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // Totaux
  const [totalGnrLiters, setTotalGnrLiters] = useState(0)
  const [totalFertKg, setTotalFertKg] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: settingsData } = await supabase
        .from('cereales_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (settingsData) {
        setCultures(settingsData.cultures || [])
        setPrices({
            gnr_price: settingsData.gnr_price || 1.0,
            fertilizer_price: settingsData.fertilizer_price || 350
        })
        
        if (settingsData.gnr_hedging) setGnrHedging(settingsData.gnr_hedging)
        if (settingsData.fertilizer_hedging) setFertHedging(settingsData.fertilizer_hedging)
        if (settingsData.sales_hedging) setSalesHedging(settingsData.sales_hedging)

        // Calcul des besoins totaux
        let gnrTotal = 0
        let fertTotal = 0
        ;(settingsData.cultures || []).forEach((c: any) => {
            const ha = c.surfaceCible || 0
            const gnrSum = (c.gnrQuarterly || [0,0,0,0]).reduce((a:number,b:number)=>a+b,0)
            const fertSum = (c.fertilizerMonthly || []).reduce((a:number,b:number)=>a+b,0)
            gnrTotal += gnrSum * ha
            fertTotal += fertSum * ha
        })
        setTotalGnrLiters(gnrTotal)
        setTotalFertKg(fertTotal)
        
        setIsDataLoaded(true)
      }
    }
    fetchData()
  }, [])

  const handleSalesHedgingChange = (cultId: string, field: 'volume' | 'price', value: string) => {
      setSalesHedging(prev => ({
          ...prev,
          [cultId]: {
              ...prev[cultId],
              [field]: parseFloat(value) || 0
          }
      }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('cereales_settings').upsert({
        user_id: user.id,
        gnr_hedging: gnrHedging,
        fertilizer_hedging: fertHedging,
        sales_hedging: salesHedging,
        updated_at: new Date().toISOString()
      })
      router.push("/dashboard/cereales/projection")
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const getSpotColor = (spotPct: number) => {
      if (spotPct <= 25) return "bg-green-500"
      if (spotPct <= 75) return "bg-orange-400"
      return "bg-red-500"
  }
  
  const getSpotTextColor = (spotPct: number) => {
      if (spotPct <= 25) return "text-green-600"
      if (spotPct <= 75) return "text-orange-600"
      return "text-red-600"
  }

  if (!isDataLoaded) return null

  return (
    <div className="container mx-auto p-6 md:p-12 max-w-7xl animate-in fade-in duration-500">
      
      <div className="mb-12 flex justify-between items-center border-b border-slate-100 pb-8">
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
                Conseil <span className="text-amber-600 italic">Smart Fields</span>
            </h2>
            <p className="text-slate-500 font-medium text-lg mt-2">
                Stratégie de couverture Achats & Ventes pour sécuriser votre Marge.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard/cereales/cout-production")} className="rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour Coûts
          </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          
          {/* SECTION ACHATS (GNR & ENGRAIS) */}
          <div className="space-y-8">
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-xl text-red-600"><ShoppingCart className="w-6 h-6" /></div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase">Stratégie Achats</h3>
              </div>
              
              <Alert className="bg-amber-50 border-amber-200 text-amber-900 rounded-[1.5rem]">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <AlertTitle className="font-bold text-amber-800">Conseil IA Smart Fields</AlertTitle>
                <AlertDescription className="mt-2 text-sm leading-relaxed">
                  Au vu de la volatilité actuelle, nous conseillons de sécuriser <strong>70% de vos besoins</strong> totaux en Engrais et en GNR avant le début de la campagne pour limiter l'exposition au marché spot.
                </AlertDescription>
              </Alert>

              <Card className="border-none shadow-xl rounded-[2rem] bg-white">
                  <CardHeader className="bg-slate-50 rounded-t-[2rem]">
                      <CardTitle className="text-sm font-black uppercase text-slate-700">Couverture Intrants</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                      {/* GNR */}
                      <div className="p-4 border rounded-2xl bg-orange-50/30 border-orange-100">
                          <h4 className="font-bold text-orange-800 mb-4 flex justify-between">
                              GNR <span>Besoin total : {totalGnrLiters.toLocaleString('fr-FR', {maximumFractionDigits:0})} L</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase text-slate-500">Volume Couvert (L)</Label>
                                  <Input type="number" value={gnrHedging.volume} onChange={(e) => setGnrHedging(p => ({...p, volume: parseFloat(e.target.value)||0}))} />
                              </div>
                              <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase text-slate-500">Prix Verrouillé (€/L)</Label>
                                  <Input type="number" step="0.01" value={gnrHedging.price} onChange={(e) => setGnrHedging(p => ({...p, price: parseFloat(e.target.value)||0}))} />
                              </div>
                          </div>
                          {(() => {
                              const spotPct = Math.max(0, 100 - (gnrHedging.volume / (totalGnrLiters||1)) * 100)
                              return (
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>Exposition Spot</span>
                                        <span className={getSpotTextColor(spotPct)}>{spotPct.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${getSpotColor(spotPct)}`} style={{width: `${spotPct}%`}} />
                                    </div>
                                </div>
                              )
                          })()}
                      </div>

                      {/* ENGRAIS */}
                      <div className="p-4 border rounded-2xl bg-blue-50/30 border-blue-100">
                          <h4 className="font-bold text-blue-800 mb-4 flex justify-between">
                              Engrais <span>Besoin total : {(totalFertKg/1000).toLocaleString('fr-FR', {maximumFractionDigits:1})} T</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase text-slate-500">Volume Couvert (T)</Label>
                                  <Input type="number" value={fertHedging.volume} onChange={(e) => setFertHedging(p => ({...p, volume: parseFloat(e.target.value)||0}))} />
                              </div>
                              <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase text-slate-500">Prix Verrouillé (€/T)</Label>
                                  <Input type="number" value={fertHedging.price} onChange={(e) => setFertHedging(p => ({...p, price: parseFloat(e.target.value)||0}))} />
                              </div>
                          </div>
                          {(() => {
                              const spotPct = Math.max(0, 100 - (fertHedging.volume / ((totalFertKg/1000)||1)) * 100)
                              return (
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>Exposition Spot</span>
                                        <span className={getSpotTextColor(spotPct)}>{spotPct.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${getSpotColor(spotPct)}`} style={{width: `${spotPct}%`}} />
                                    </div>
                                </div>
                              )
                          })()}
                      </div>
                  </CardContent>
              </Card>
          </div>

          {/* SECTION VENTES (MATIF) */}
          <div className="space-y-8">
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl text-green-600"><TrendingUp className="w-6 h-6" /></div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase">Stratégie Ventes</h3>
              </div>

              <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900 rounded-[1.5rem]">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <AlertTitle className="font-bold text-emerald-800">Sécurisation du Chiffre d'Affaires</AlertTitle>
                <AlertDescription className="mt-2 text-sm leading-relaxed">
                  Afin de garantir votre marge par rapport au Prix d'Équilibre calculé, il est recommandé de sécuriser progressivement <strong>jusqu'à 60% de votre production cible</strong> sur les marchés à terme (MATIF) avant la moisson.
                </AlertDescription>
              </Alert>

              <Card className="border-none shadow-xl rounded-[2rem] bg-white">
                  <CardHeader className="bg-slate-50 rounded-t-[2rem]">
                      <CardTitle className="text-sm font-black uppercase text-slate-700">Couverture Récoltes (Ventes à Terme)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                      {cultures.map(cult => {
                          const state = salesHedging[cult.id] || { volume: 0, price: 0 }
                          const volTotal = cult.volume || 1
                          const covPct = Math.min(100, (state.volume / volTotal) * 100)
                          const spotPct = Math.max(0, 100 - covPct)

                          return (
                              <div key={cult.id} className="p-4 border rounded-2xl bg-green-50/20 border-green-100">
                                  <h4 className="font-bold text-green-800 mb-4 flex justify-between">
                                      {cult.name} <span>Prod estimée : {cult.volume.toLocaleString('fr-FR')} T</span>
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                          <Label className="text-xs font-bold uppercase text-slate-500">Volume Vendu (T)</Label>
                                          <Input type="number" value={state.volume} onChange={(e) => handleSalesHedgingChange(cult.id, 'volume', e.target.value)} />
                                      </div>
                                      <div className="space-y-2">
                                          <Label className="text-xs font-bold uppercase text-slate-500">Prix de Vente (€/T)</Label>
                                          <Input type="number" value={state.price} onChange={(e) => handleSalesHedgingChange(cult.id, 'price', e.target.value)} />
                                      </div>
                                  </div>
                                  <div className="mt-4">
                                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                          <span>Exposition Spot (Non-vendu)</span>
                                          <span className={getSpotTextColor(spotPct)}>{spotPct.toFixed(0)}%</span>
                                      </div>
                                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full transition-all ${getSpotColor(spotPct)}`} style={{width: `${spotPct}%`}} />
                                      </div>
                                  </div>
                              </div>
                          )
                      })}
                  </CardContent>
              </Card>

          </div>

      </div>

      <div className="mt-16 flex justify-end">
          <Button 
              size="lg" 
              onClick={handleSave}
              disabled={saving}
              className="rounded-full h-16 px-12 text-lg font-black uppercase tracking-widest bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/30"
          >
              {saving ? "Génération..." : "Calculer la Projection Financière"} <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
      </div>

    </div>
  )
}
