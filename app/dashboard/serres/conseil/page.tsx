"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingDown, TrendingUp, ShieldCheck, AlertCircle, Zap, Calendar, Sparkles, Info } from "lucide-react"
import { GasConsumptionChart } from "@/components/modules/serres/gas-consumption-chart"
import { HedgingTable } from "@/components/modules/serres/hedging-table"

interface HedgingInfo {
  percentage: number // 0, 10, 20... 100
  price: number
}

const initialHedgingData = (): Record<string, HedgingInfo> => {
  const data: Record<string, HedgingInfo> = {}
  const years = [2025, 2026, 2027, 2028, 2029, 2030]
  const quarters = ["Q1", "Q2", "Q3", "Q4"]

  years.forEach(year => {
    quarters.forEach(q => {
      data[`${year} ${q}`] = { percentage: 0, price: 0 }
    })
  })
  return data
}

export default function ConseilSerresPage() {
  const [hedgingData, setHedgingData] = useState<Record<string, HedgingInfo>>(initialHedgingData())
  const [isLoading, setIsLoading] = useState(true)
  const [marketData, setMarketData] = useState<{ prices: Record<string, number>, alerts: any[], last_update: string } | null>(null)
  const supabase = useMemo(() => createClient(), [])

  // Fonction pour charger les prix du marché via Gemini
  const fetchMarketData = async () => {
    try {
      const res = await fetch('/api/market-data/gas')
      if (res.ok) {
        const data = await res.json()
        setMarketData(data)
      }
    } catch (e) {
      console.error("Erreur de fetch market data", e)
    }
  }

  // Charger les données initiales et démarrer le polling
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        await fetchMarketData()
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('greenhouse_settings')
        .select('gas_hedging')
        .eq('user_id', user.id)
        .single()

      if (data?.gas_hedging && Object.keys(data.gas_hedging).length > 0) {
        setHedgingData(data.gas_hedging)
      }
      
      await fetchMarketData()
      setIsLoading(false)
    }
    loadData()

    // Polling toutes les 5 minutes (300000 ms)
    const intervalId = setInterval(fetchMarketData, 300000)
    return () => clearInterval(intervalId)
  }, [supabase])

  // Sauvegarde automatique avec debounce
  useEffect(() => {
    if (isLoading) return

    const timer = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('greenhouse_settings')
        .upsert({ 
          user_id: user.id, 
          gas_hedging: hedgingData,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error("Erreur sauvegarde auto:", error)
        toast.error("Échec de la synchronisation Smart Fields")
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [hedgingData, isLoading, supabase])

  const handleHedgingUpdate = useCallback((period: string, info: HedgingInfo) => {
    setHedgingData(prev => ({
      ...prev,
      [period]: info
    }))
  }, [])

  if (isLoading || !marketData) {
    return (
      <div className="container mx-auto p-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground animate-pulse font-medium">Interrogation de Gemini & Scan des Marchés PEG en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 md:p-12 max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Conseil Smart Fields : Pilotage Financier 5 ans</h2>
          <p className="text-muted-foreground mt-2 text-lg">
            Focus sur la cotation <strong>Gaz Légumes</strong> : Analyse trimestrielle et stratégie de couverture.
          </p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20 flex items-center gap-2 w-fit">
          <Calendar className="h-4 w-4" />
          Mise à jour : Aujourd'hui à {marketData.last_update}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-4 space-y-6">
          {/* Section Notifications IA Stylée Générée par Gemini */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketData.alerts.map((alert, idx) => (
              <Card key={idx} className={`bg-${alert.color}-500/10 border-${alert.color}-500/20 shadow-lg group hover:bg-${alert.color}-500/15 transition-all cursor-pointer`}>
                <CardContent className="p-4 flex gap-4">
                  <div className={`bg-${alert.color}-500 p-3 rounded-xl h-fit shadow-lg shadow-${alert.color}-500/20 group-hover:scale-110 transition-transform`}>
                    {alert.type === "URGENT" ? <AlertCircle className="h-6 w-6 text-white" /> : <Sparkles className="h-6 w-6 text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={alert.type === "URGENT" ? "destructive" : "default"} className={alert.type === "URGENT" ? "animate-pulse" : `bg-blue-500 hover:bg-blue-600`}>
                        {alert.type}
                      </Badge>
                      <span className={`text-xs font-bold text-${alert.color}-500 uppercase tracking-tighter`}>{alert.period}</span>
                    </div>
                    <h4 className="font-bold text-foreground">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground leading-snug mt-1">
                      {alert.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <GasConsumptionChart hedgingData={hedgingData} />
        </div>
      </div>

      {/* Tableau des couvertures */}
      <div className="mt-8">
        <HedgingTable hedgingData={hedgingData} marketPrices={marketData.prices} onUpdate={handleHedgingUpdate} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
        <Card className="border-l-4 border-l-blue-500 shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Saisonnalité & Flux</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              L'analyse des historiques montre une corrélation de 0.92 entre la température extérieure et la volatilité des prix PEG en Q1. Anticipez vos couvertures dès l'été.
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-600 shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Structure de Courbe</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Le marché est actuellement en contango léger sur 2028-2029. C'est une opportunité de 'lock-in' pour les volumes de base avant une remontée des primes de stockage.
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Gestion des Delta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Smart Fields conseille de conserver une flexibilité de 20% en spot. Cela permet d'absorber les baisses de consommation sans payer de pénalités de débouclage.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
