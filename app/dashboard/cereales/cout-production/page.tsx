"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, ArrowRight, Save, TrendingDown, Wheat, Fuel, Droplets, Tractor, CircleDollarSign, Sprout } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { createClient } from "@/lib/client"

const supabase = createClient()

export default function CoutProductionCerealesPage() {
  const router = useRouter()
  const [cultures, setCultures] = useState<any[]>([])
  const [expenses, setExpenses] = useState({ 
    c60_semences: 0, 
    c60_phyto: 0,
    c61_mecanisation: 0, 
    c61_fermages: 0,
    c64_personnel: 0,
    c68_amort: 0,
    audit_meta: "" 
  })
  const [prices, setPrices] = useState({
      gnr_price: 1.0, // €/L
      fertilizer_price: 350 // €/T
  })

  const [saving, setSaving] = useState(false)
  const [totalSurface, setTotalSurface] = useState(0)

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
        setExpenses(settingsData.expenses || expenses)
        setPrices({
            gnr_price: settingsData.gnr_price || 1.0,
            fertilizer_price: settingsData.fertilizer_price || 350
        })

        const surface = (settingsData.cultures || []).reduce((acc: number, c: any) => acc + (c.surfaceCible || 0), 0)
        setTotalSurface(surface)
      }
    }
    fetchData()
  }, [])

  const handleExpenseChange = (field: string, value: string) => {
    setExpenses(prev => ({ ...prev, [field]: parseFloat(value) || 0 }))
  }

  const handlePriceChange = (field: keyof typeof prices, value: string) => {
      setPrices(prev => ({ ...prev, [field]: parseFloat(value) || 0 }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('cereales_settings').upsert({
        user_id: user.id,
        expenses: expenses,
        gnr_price: prices.gnr_price,
        fertilizer_price: prices.fertilizer_price,
        updated_at: new Date().toISOString()
      })
      router.push("/dashboard/cereales/conseil")
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Fonctions de calcul des coûts
  const getTotalGnrHa = (cult: any) => (cult.gnrQuarterly || [0,0,0,0]).reduce((a: number,b: number)=>a+b, 0)
  const getTotalFertilizerHa = (cult: any) => (cult.fertilizerMonthly || []).reduce((a: number,b: number)=>a+b, 0)

  // Données pour le graphique GNR
  const getGnrChartData = () => {
      return ["T1", "T2", "T3", "T4"].map((qName, qIndex) => {
          const dataPoint: any = { name: qName }
          cultures.forEach(cult => {
              const vol = (cult.gnrQuarterly?.[qIndex] || 0) * (cult.surfaceCible || 0)
              dataPoint[cult.name] = Math.round(vol)
          })
          return dataPoint
      })
  }
  const chartColors = ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#ef4444', '#14b8a6']

  // Pour les charges globales, on les répartit à l'hectare de façon uniforme.
  // Exception: GNR et Engrais sont spécifiques à chaque culture.
  const getStructuralCostPerHa = () => {
      if (totalSurface === 0) return 0
      const totalStructure = expenses.c61_mecanisation + expenses.c61_fermages + expenses.c64_personnel + expenses.c68_amort
      return totalStructure / totalSurface
  }

  // Semences et phyto sont mis en charges globales, mais idéalement ils devraient être par culture.
  // Pour simplifier l'UI comme demandé, on fait une répartition moyenne.
  const getOpCostPerHa = () => {
      if (totalSurface === 0) return 0
      const totalOp = expenses.c60_semences + expenses.c60_phyto
      return totalOp / totalSurface
  }

  return (
    <div className="container mx-auto p-6 md:p-12 max-w-7xl animate-in fade-in duration-500">
      
      <div className="mb-12 flex justify-between items-center border-b border-slate-100 pb-8">
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
                Construction des <span className="text-amber-600 italic">Coûts de Production</span>
            </h2>
            <p className="text-slate-500 font-medium text-lg mt-2">
                Répartition des charges variables et structurelles par hectare.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard/cereales/parametrage")} className="rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour Paramétrage
          </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* CHARGES OPÉRATIONNELLES GLOBALES */}
          <Card className="border-none shadow-xl rounded-[2rem] bg-white">
              <CardHeader className="bg-amber-50 rounded-t-[2rem] pb-4">
                  <CardTitle className="text-amber-900 flex items-center gap-2 uppercase tracking-widest text-sm font-black">
                      <Sprout className="h-5 w-5 text-amber-600" /> Charges Opérationnelles
                  </CardTitle>
                  <CardDescription>Semences, Phyto (Global pour l'exploitation)</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Semences (€/an global)</Label>
                      <Input type="number" value={expenses.c60_semences} onChange={(e) => handleExpenseChange('c60_semences', e.target.value)} className="font-bold text-lg border-2" />
                  </div>
                  <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Phytosanitaires (€/an global)</Label>
                      <Input type="number" value={expenses.c60_phyto} onChange={(e) => handleExpenseChange('c60_phyto', e.target.value)} className="font-bold text-lg border-2" />
                  </div>
              </CardContent>
          </Card>

          {/* COURS INTRANTS */}
          <Card className="border-none shadow-xl rounded-[2rem] bg-white">
              <CardHeader className="bg-orange-50 rounded-t-[2rem] pb-4">
                  <CardTitle className="text-orange-900 flex items-center gap-2 uppercase tracking-widest text-sm font-black">
                      <Fuel className="h-5 w-5 text-orange-600" /> Marchés Intrants
                  </CardTitle>
                  <CardDescription>Coût unitaire spot estimé</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Prix du GNR (€/Litre)</Label>
                      <Input type="number" step="0.01" value={prices.gnr_price} onChange={(e) => handlePriceChange('gnr_price', e.target.value)} className="font-bold text-lg border-2 focus:border-orange-500" />
                  </div>
                  <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Prix Moyen Engrais (€/Tonne)</Label>
                      <Input type="number" value={prices.fertilizer_price} onChange={(e) => handlePriceChange('fertilizer_price', e.target.value)} className="font-bold text-lg border-2 focus:border-orange-500" />
                  </div>
              </CardContent>
          </Card>

          {/* CHARGES DE STRUCTURE */}
          <Card className="border-none shadow-xl rounded-[2rem] bg-white">
              <CardHeader className="bg-slate-50 rounded-t-[2rem] pb-4">
                  <CardTitle className="text-slate-900 flex items-center gap-2 uppercase tracking-widest text-sm font-black">
                      <Tractor className="h-5 w-5 text-slate-600" /> Charges de Structure
                  </CardTitle>
                  <CardDescription>Frais fixes annuels globaux</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                      <Label className="font-bold text-slate-700 text-xs uppercase">Mécanisation (€)</Label>
                      <Input type="number" value={expenses.c61_mecanisation} onChange={(e) => handleExpenseChange('c61_mecanisation', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                      <Label className="font-bold text-slate-700 text-xs uppercase">Fermages (€)</Label>
                      <Input type="number" value={expenses.c61_fermages} onChange={(e) => handleExpenseChange('c61_fermages', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                      <Label className="font-bold text-slate-700 text-xs uppercase">Personnel (€)</Label>
                      <Input type="number" value={expenses.c64_personnel} onChange={(e) => handleExpenseChange('c64_personnel', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                      <Label className="font-bold text-slate-700 text-xs uppercase">Amortissements (€)</Label>
                      <Input type="number" value={expenses.c68_amort} onChange={(e) => handleExpenseChange('c68_amort', e.target.value)} />
                  </div>
              </CardContent>
          </Card>
      </div>

      <div className="mb-8">
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Planification <span className="text-orange-600 italic">Énergétique</span> GNR</h3>
      </div>

      <Card className="border-none shadow-xl rounded-[2rem] bg-white mb-12">
          <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-[2rem] pb-6">
              <CardTitle className="text-slate-900 flex items-center gap-2 uppercase tracking-widest text-sm font-black">
                  <Fuel className="h-5 w-5 text-orange-600" /> Volumes de Carburant par Trimestre (Litres)
              </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
              <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getGnrChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 'bold'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                          <Tooltip 
                              cursor={{fill: '#f8fafc'}}
                              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          {cultures.map((cult, idx) => (
                              <Bar 
                                  key={cult.id} 
                                  dataKey={cult.name} 
                                  stackId="a" 
                                  fill={chartColors[idx % chartColors.length]} 
                                  radius={[4, 4, 4, 4]}
                              />
                          ))}
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </CardContent>
      </Card>

      <div className="mb-8">
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Synthèse <span className="text-amber-600 italic">Technico-Économique</span> par Hectare</h3>
      </div>

      <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white">
          <CardContent className="p-0">
              <Table>
                  <TableHeader className="bg-slate-50">
                      <TableRow>
                          <TableHead className="font-black text-slate-500 px-6 py-4">Culture</TableHead>
                          <TableHead className="font-black text-slate-500 text-right">Rendement</TableHead>
                          <TableHead className="font-black text-slate-500 text-right">GNR (€/ha)</TableHead>
                          <TableHead className="font-black text-slate-500 text-right">Engrais (€/ha)</TableHead>
                          <TableHead className="font-black text-slate-500 text-right">Autres OP (€/ha)</TableHead>
                          <TableHead className="font-black text-slate-500 text-right">Structure (€/ha)</TableHead>
                          <TableHead className="font-black text-amber-600 text-right px-6">Prix d'Équilibre (€/T)</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {cultures.map((cult) => {
                          const gnrCost = getTotalGnrHa(cult) * prices.gnr_price
                          const fertCost = getTotalFertilizerHa(cult) * (prices.fertilizer_price / 1000) // prix est en T, conso en kg
                          const opCost = getOpCostPerHa()
                          const structCost = getStructuralCostPerHa()
                          
                          const totalCostHa = gnrCost + fertCost + opCost + structCost
                          const costPerTonne = cult.rendement > 0 ? totalCostHa / cult.rendement : 0

                          return (
                              <TableRow key={cult.id} className="hover:bg-slate-50/50">
                                  <TableCell className="px-6 py-4 font-bold">{cult.name}</TableCell>
                                  <TableCell className="text-right text-slate-500">{cult.rendement} T/ha</TableCell>
                                  <TableCell className="text-right font-medium text-orange-600">{gnrCost.toLocaleString('fr-FR', {maximumFractionDigits:0})} €</TableCell>
                                  <TableCell className="text-right font-medium text-blue-600">{fertCost.toLocaleString('fr-FR', {maximumFractionDigits:0})} €</TableCell>
                                  <TableCell className="text-right text-slate-500">{opCost.toLocaleString('fr-FR', {maximumFractionDigits:0})} €</TableCell>
                                  <TableCell className="text-right text-slate-500">{structCost.toLocaleString('fr-FR', {maximumFractionDigits:0})} €</TableCell>
                                  <TableCell className="text-right px-6">
                                      <span className="text-xl font-black text-amber-600">
                                          {costPerTonne.toLocaleString('fr-FR', {maximumFractionDigits:0})} €/T
                                      </span>
                                  </TableCell>
                              </TableRow>
                          )
                      })}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>

      <div className="mt-16 flex justify-end">
          <Button 
              size="lg" 
              onClick={handleSave}
              disabled={saving}
              className="rounded-full h-16 px-12 text-lg font-black uppercase tracking-widest bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/30"
          >
              {saving ? "Sauvegarde..." : "Valider & Consulter la Stratégie Smart Fields"} <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
      </div>

    </div>
  )
}
