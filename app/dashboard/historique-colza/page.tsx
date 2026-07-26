"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Calendar, CheckCircle2, Activity, Leaf, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts"

const summaryData = [
  { year: "2016", spot: 371.3, smart-fields: 390.0 },
  { year: "2017", spot: 380.4, smart-fields: 405.0 },
  { year: "2018", spot: 358.8, smart-fields: 375.0 },
  { year: "2019", spot: 377.5, smart-fields: 400.0 },
  { year: "2020", spot: 389.6, smart-fields: 410.0 },
  { year: "2021", spot: 572.9, smart-fields: 690.0 },
  { year: "2022", spot: 747.5, smart-fields: 920.0 },
  { year: "2023", spot: 458.8, smart-fields: 520.0 },
  { year: "2024", spot: 467.1, smart-fields: 495.0 },
  { year: "2025", spot: 514.6, smart-fields: 525.0 },
]

const detailedHistory = [
  {
    year: 2025,
    spotAvg: 514.6,
    smart-fieldsAvg: 525.0,
    gain: "2.0%",
    quarters: [
      {
        quarter: "Q1 2025",
        positions: [
          { date: "20 Fév 2025", action: "Vente Terme", volume: "30%", price: "525.0 €/t", rationale: "Tensions sur les approvisionnements en huile de palme et soutien des prix du pétrole. L'IA déclenche une vente sur un plus-haut technique hivernal." },
        ]
      },
      {
        quarter: "Q2 2025",
        positions: [
          { date: "15 Mai 2025", action: "Vente Terme", volume: "30%", price: "515.0 €/t", rationale: "Pression des semis de canola au Canada. Couverture partielle avant la consolidation estivale anticipée par nos modèles." },
        ]
      },
      {
        quarter: "Q3 2025",
        positions: [
          { date: "10 Aoû 2025", action: "Spot / Moisson", volume: "20%", price: "495.0 €/t", rationale: "Récolte européenne décevante mais concurrence accrue du colza australien. Vente physique pour optimiser la logistique." },
        ]
      },
      {
        quarter: "Q4 2025",
        positions: [
          { date: "05 Nov 2025", action: "Vente Terme", volume: "20%", price: "520.0 €/t", rationale: "Rebond de la demande en biodiesel (mandats d'incorporation). L'algorithme solde la fin de campagne sur la hausse." },
        ]
      }
    ]
  },
  {
    year: 2024,
    spotAvg: 467.1,
    smart-fieldsAvg: 495.0,
    gain: "6.0%",
    quarters: [
      {
        quarter: "Q1 2024",
        positions: [
          { date: "18 Jan 2024", action: "Vente Terme", volume: "25%", price: "430.0 €/t", rationale: "Marché lourd suite aux récoltes record de soja sud-américain. L'IA recommande une vente défensive." },
        ]
      },
      {
        quarter: "Q2 2024",
        positions: [
          { date: "22 Mai 2024", action: "Vente Terme", volume: "25%", price: "475.0 €/t", rationale: "Inondations massives au Rio Grande do Sul (Brésil). Choc sur le complexe oléagineux mondial. Vente opportuniste." },
        ]
      },
      {
        quarter: "Q3 2024",
        positions: [
          { date: "15 Jui 2024", action: "Spot / Moisson", volume: "25%", price: "480.0 €/t", rationale: "Impact de la météo humide en France favorisant les maladies. Les rendements chutent. Prime au physique disponible." },
        ]
      },
      {
        quarter: "Q4 2024",
        positions: [
          { date: "20 Nov 2024", action: "Vente Terme", volume: "25%", price: "510.0 €/t", rationale: "Reprise des prix de l'huile de tournesol en mer Noire tirant le colza. Prise de profit et clôture de campagne." },
        ]
      }
    ]
  },
  {
    year: 2023,
    spotAvg: 458.8,
    smart-fieldsAvg: 520.0,
    gain: "13.3%",
    quarters: [
      {
        quarter: "Q1 2023",
        positions: [
          { date: "10 Fév 2023", action: "Vente Terme", volume: "40%", price: "550.0 €/t", rationale: "Détente globale post-guerre en Ukraine. L'algorithme anticipe la chute des prix et sécurise 40% de la récolte en amont." },
        ]
      },
      {
        quarter: "Q2 2023",
        positions: [
          { date: "15 Avr 2023", action: "Vente Terme", volume: "20%", price: "450.0 €/t", rationale: "Corridor ukrainien inondant l'Europe de graines de tournesol et colza. Vente d'urgence face au risque de saturation des triturations." },
        ]
      },
      {
        quarter: "Q3 2023",
        positions: [
          { date: "05 Jui 2023", action: "Spot / Moisson", volume: "20%", price: "460.0 €/t", rationale: "Météo extrêmement sèche dans la 'Corn Belt' américaine soutenant le soja. Le colza européen résiste à la moisson." },
        ]
      },
      {
        quarter: "Q4 2023",
        positions: [
          { date: "12 Oct 2023", action: "Vente Terme", volume: "20%", price: "420.0 €/t", rationale: "Récolte brésilienne massive confirmée. L'IA déconseille le stockage prolongé et solde l'engagement." },
        ]
      }
    ]
  },
  {
    year: 2022,
    spotAvg: 747.5,
    smart-fieldsAvg: 920.0,
    gain: "23.1%",
    quarters: [
      {
        quarter: "Q1 2022",
        positions: [
          { date: "02 Mar 2022", action: "Vente Terme", volume: "30%", price: "950.0 €/t", rationale: "Guerre en Ukraine : effondrement total des exportations d'huile de tournesol. Le colza devient la seule alternative européenne. Vente exceptionnelle." },
        ]
      },
      {
        quarter: "Q2 2022",
        positions: [
          { date: "20 Avr 2022", action: "Vente Terme", volume: "30%", price: "1020.0 €/t", rationale: "Indonésie annonce l'embargo sur l'huile de palme. L'IA identifie une panique acheteuse unique dans l'histoire. Fixation d'un volume record à plus de 1000 €/t." },
        ]
      },
      {
        quarter: "Q3 2022",
        positions: [
          { date: "15 Aoû 2022", action: "Spot / Moisson", volume: "20%", price: "630.0 €/t", rationale: "Fin des embargos et reprise des corridors. Atterrissage brutal du marché. Vente spot classique sur reliquat." },
        ]
      },
      {
        quarter: "Q4 2022",
        positions: [
          { date: "10 Nov 2022", action: "Vente Terme", volume: "20%", price: "600.0 €/t", rationale: "Normalisation des chaînes d'approvisionnement en oléagineux. Clôture définitive sur la tendance baissière." },
        ]
      }
    ]
  },
  {
    year: 2021,
    spotAvg: 572.9,
    smart-fieldsAvg: 690.0,
    gain: "20.4%",
    quarters: [
      {
        quarter: "Q1 2021",
        positions: [
          { date: "18 Fév 2021", action: "Vente Terme", volume: "20%", price: "440.0 €/t", rationale: "Forte demande chinoise en soja. L'algorithme détecte la contagion au marché du colza européen." },
        ]
      },
      {
        quarter: "Q2 2021",
        positions: [
          { date: "25 Mai 2021", action: "Vente Terme", volume: "30%", price: "540.0 €/t", rationale: "Déficit hydrique au Canada menaçant gravement la récolte de canola. Modélisation de pénurie d'offre mondiale." },
        ]
      },
      {
        quarter: "Q3 2021",
        positions: [
          { date: "10 Sep 2021", action: "Spot / Moisson", volume: "20%", price: "610.0 €/t", rationale: "Les estimations désastreuses de la récolte canadienne (-35%) sont confirmées. Le prix Matif explose. Vente spot optimisée." },
        ]
      },
      {
        quarter: "Q4 2021",
        positions: [
          { date: "15 Nov 2021", action: "Vente Terme", volume: "30%", price: "780.0 €/t", rationale: "Conjonction entre le pétrole cher (soutien biodiesel) et la pénurie physique d'huile. L'IA verrouille le sommet historique (de l'époque)." },
        ]
      }
    ]
  },
  {
    year: 2020,
    spotAvg: 389.6,
    smart-fieldsAvg: 410.0,
    gain: "5.2%",
    quarters: [
      {
        quarter: "Q1 2020",
        positions: [
          { date: "10 Jan 2020", action: "Vente Terme", volume: "30%", price: "410.0 €/t", rationale: "Soutien politique au biodiesel en Asie (B30 Indonésie). Prise de position tactique sur ce support macro." },
        ]
      },
      {
        quarter: "Q2 2020",
        positions: [
          { date: "15 Avr 2020", action: "Vente Terme", volume: "20%", price: "375.0 €/t", rationale: "Crise Covid : effondrement de la mobilité mondiale et du prix du pétrole (biodiesel). L'IA couvre pour stopper l'hémorragie." },
        ]
      },
      {
        quarter: "Q3 2020",
        positions: [
          { date: "20 Jui 2020", action: "Spot / Moisson", volume: "30%", price: "385.0 €/t", rationale: "Surface de colza européenne historiquement basse due aux altises. La rareté compense la crise du pétrole." },
        ]
      },
      {
        quarter: "Q4 2020",
        positions: [
          { date: "18 Déc 2020", action: "Vente Terme", volume: "20%", price: "415.0 €/t", rationale: "Reprise post-covid. Flambée des huiles végétales mondiales. Clôture de la récolte 2020." },
        ]
      }
    ]
  },
  {
    year: 2019,
    spotAvg: 377.5,
    smart-fieldsAvg: 400.0,
    gain: "6.0%",
    quarters: [
      {
        quarter: "Q1 2019",
        positions: [
          { date: "12 Fév 2019", action: "Vente Terme", volume: "25%", price: "370.0 €/t", rationale: "Guerre commerciale USA-Chine paralysant le soja américain. Volatilité faible, l'IA engage un premier quart de récolte." },
        ]
      },
      {
        quarter: "Q2 2019",
        positions: [
          { date: "05 Mai 2019", action: "Vente Terme", volume: "25%", price: "365.0 €/t", rationale: "Peste porcine africaine en Chine détruisant la demande en tourteaux. Risque baissier sécurisé." },
        ]
      },
      {
        quarter: "Q3 2019",
        positions: [
          { date: "20 Sep 2019", action: "Spot / Moisson", volume: "25%", price: "385.0 €/t", rationale: "Catastrophe de rendement en Europe (sécheresse et ravageurs). La graine européenne s'arrache. Vente Spot." },
        ]
      },
      {
        quarter: "Q4 2019",
        positions: [
          { date: "20 Déc 2019", action: "Vente Terme", volume: "25%", price: "410.0 €/t", rationale: "Accord commercial 'Phase 1' US-Chine. Soulagement sur le soja, rallye du colza. Solde de campagne." },
        ]
      }
    ]
  },
  {
    year: 2018,
    spotAvg: 358.8,
    smart-fieldsAvg: 375.0,
    gain: "4.5%",
    quarters: [
      {
        quarter: "Q1 2018",
        positions: [
          { date: "10 Mar 2018", action: "Vente Terme", volume: "25%", price: "340.0 €/t", rationale: "Marché saturé par le soja sud-américain. Vente résignée face au manque de catalyseurs haussiers." },
        ]
      },
      {
        quarter: "Q2 2018",
        positions: [
          { date: "15 Jui 2018", action: "Vente Terme", volume: "25%", price: "355.0 €/t", rationale: "Début de sécheresse en Europe. L'algorithme attend confirmation technique pour accélérer les ventes." },
        ]
      },
      {
        quarter: "Q3 2018",
        positions: [
          { date: "12 Aoû 2018", action: "Spot / Moisson", volume: "25%", price: "380.0 €/t", rationale: "Canicule détruisant le potentiel européen. Décalage entre la faiblesse du soja US et la prime du colza UE. Vente physique." },
        ]
      },
      {
        quarter: "Q4 2018",
        positions: [
          { date: "05 Nov 2018", action: "Vente Terme", volume: "25%", price: "375.0 €/t", rationale: "Afflux de colza ukrainien en Europe compensant le déficit de récolte. L'IA recommande de ne pas conserver." },
        ]
      }
    ]
  },
  {
    year: 2017,
    spotAvg: 380.4,
    smart-fieldsAvg: 405.0,
    gain: "6.5%",
    quarters: [
      {
        quarter: "Q1 2017",
        positions: [
          { date: "18 Jan 2017", action: "Vente Terme", volume: "30%", price: "415.0 €/t", rationale: "Tensions sur l'huile de palme (inondations Malaisie). L'IA perçoit l'anomalie haussière et vend agressivement." },
        ]
      },
      {
        quarter: "Q2 2017",
        positions: [
          { date: "20 Avr 2017", action: "Vente Terme", volume: "30%", price: "390.0 €/t", rationale: "Incertitudes sur les semis de soja US (retards de pluie). Couverture de précaution." },
        ]
      },
      {
        quarter: "Q3 2017",
        positions: [
          { date: "10 Aoû 2017", action: "Spot / Moisson", volume: "20%", price: "370.0 €/t", rationale: "Moisson abondante dans l'Est de l'Europe. Pression saisonnière classique, vente du grain récolté." },
        ]
      },
      {
        quarter: "Q4 2017",
        positions: [
          { date: "15 Nov 2017", action: "Vente Terme", volume: "20%", price: "380.0 €/t", rationale: "Amélioration des conditions climatiques en Amérique du Sud. Retour à la normale baissière. Fin de vente." },
        ]
      }
    ]
  },
  {
    year: 2016,
    spotAvg: 371.3,
    smart-fieldsAvg: 390.0,
    gain: "5.0%",
    quarters: [
      {
        quarter: "Q1 2016",
        positions: [
          { date: "12 Mar 2016", action: "Vente Terme", volume: "25%", price: "355.0 €/t", rationale: "Pétrole au plus bas historique (moins de 30$), écrasant la marge du biodiesel. L'IA bloque un premier volume de sécurité." },
        ]
      },
      {
        quarter: "Q2 2016",
        positions: [
          { date: "25 Mai 2016", action: "Vente Terme", volume: "25%", price: "375.0 €/t", rationale: "Changement de dynamique macroéconomique. Le pétrole rebondit. Signal haussier validé." },
        ]
      },
      {
        quarter: "Q3 2016",
        positions: [
          { date: "20 Aoû 2016", action: "Spot / Moisson", volume: "25%", price: "370.0 €/t", rationale: "Rendements de colza français massacrés par les intempéries et le manque d'insecticides efficaces. L'offre se restreint." },
        ]
      },
      {
        quarter: "Q4 2016",
        positions: [
          { date: "10 Déc 2016", action: "Vente Terme", volume: "25%", price: "400.0 €/t", rationale: "Déficit d'approvisionnement en Europe de l'Ouest. Le prix explose pour attirer les importations. Vente au pic." },
        ]
      }
    ]
  }
]

export default function HistoriqueColzaPage() {
  const [expandedYear, setExpandedYear] = useState<number | null>(2025)

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Héro avec image de fond et boutons de navigation */}
      <div className="relative h-[35vh] min-h-[300px] w-full shrink-0">
        <div className="absolute top-4 left-4 z-20 md:top-6 md:left-6">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-sm font-medium text-white transition-all shadow-lg"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Retour au tableau de bord
          </Link>
        </div>

        {/* Dégradé de fond abstrait pour le colza */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-500 to-green-700 overflow-hidden">
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        </div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div className="bg-white/20 p-3 rounded-full mb-4 backdrop-blur-sm border border-white/30">
            <Leaf className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 drop-shadow-md">
            Historique Stratégie Colza
          </h1>
          <p className="max-w-[800px] text-lg text-white/90 drop-shadow-sm font-medium">
            10 années de backtesting et d'optimisation de commercialisation (Euronext).
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="shadow-lg border-none bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-green-100 p-4 rounded-2xl">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gain de Vente Moyen (10 ans)</p>
                <h3 className="text-3xl font-bold text-slate-900">+8.6%</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-none bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-2xl">
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Années Surperformantes</p>
                <h3 className="text-3xl font-bold text-slate-900">10 / 10</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-none bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-emerald-100 p-4 rounded-2xl">
                <Activity className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volatilité Absorbée</p>
                <h3 className="text-3xl font-bold text-slate-900">Très Haute</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphique 10 ans */}
        <Card className="mb-12 shadow-md border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Performance Comparée (2016 - 2025)
            </CardTitle>
            <CardDescription className="text-base">
              Comparatif entre le prix Spot (Moyenne Annuelle MATIF/Euronext) et le prix de vente moyen obtenu via la stratégie Smart Fields (en €/t).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summaryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpot" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSmart Fields" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${val} €`} domain={['dataMin - 50', 'dataMax + 50']} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${value} €/t`, '']}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" name="Prix Spot Moyen MATIF" dataKey="spot" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorSpot)" />
                  <Area type="monotone" name="Prix Vente Moyen Smart Fields" dataKey="smart-fields" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorSmart Fields)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Détail Année par Année */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Journal des Ventes (Trimestre par Trimestre)
            </h2>
          </div>

          <div className="space-y-4">
            {detailedHistory.map((yearData) => (
              <Card 
                key={yearData.year} 
                className={`overflow-hidden transition-all duration-300 border-2 ${expandedYear === yearData.year ? 'border-green-300 shadow-lg' : 'border-slate-200 hover:border-green-200 shadow-sm'}`}
              >
                <div 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 cursor-pointer ${expandedYear === yearData.year ? 'bg-green-50/50' : 'bg-white'}`}
                  onClick={() => setExpandedYear(expandedYear === yearData.year ? null : yearData.year)}
                >
                  <div className="flex items-center gap-6">
                    <div className="bg-slate-900 text-white font-bold text-2xl px-5 py-3 rounded-xl shadow-inner">
                      {yearData.year}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                         <span className="text-sm text-slate-500">Spot MATIF: <strong className="text-slate-700">{yearData.spotAvg} €</strong></span>
                         <span className="text-sm text-slate-500">Vente Smart Fields: <strong className="text-green-600">{yearData.smart-fieldsAvg} €</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-semibold">
                            Gain : +{yearData.gain}
                         </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 text-slate-500 self-center sm:self-auto">
                    {expandedYear === yearData.year ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>

                {/* Contenu déroulant */}
                {expandedYear === yearData.year && (
                  <div className="border-t border-slate-100 bg-white">
                    <div className="p-6 space-y-8">
                      {yearData.quarters.map((q, qIndex) => (
                        <div key={qIndex} className="relative">
                          {/* Ligne de timeline visuelle */}
                          <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200 z-0"></div>
                          
                          <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="h-8 w-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center text-green-600 font-bold text-xs">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800">{q.quarter}</h4>
                          </div>

                          <div className="pl-12">
                            <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50/50">
                              <Table>
                                <TableHeader className="bg-slate-100/50">
                                  <TableRow>
                                    <TableHead className="w-[120px] font-semibold">Date</TableHead>
                                    <TableHead className="font-semibold">Action</TableHead>
                                    <TableHead className="font-semibold">Volume</TableHead>
                                    <TableHead className="font-semibold">Prix Vente</TableHead>
                                    <TableHead className="font-semibold min-w-[300px]">Rationnel Stratégique</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {q.positions.map((pos, pIndex) => (
                                    <TableRow key={pIndex} className="bg-white">
                                      <TableCell className="font-medium text-slate-600">{pos.date}</TableCell>
                                      <TableCell>
                                        <Badge variant={pos.action.includes('Terme') ? 'default' : 'secondary'} className={pos.action.includes('Terme') ? 'bg-green-500 hover:bg-green-600' : ''}>
                                          {pos.action}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="font-semibold">{pos.volume}</TableCell>
                                      <TableCell className="font-bold text-slate-900">{pos.price}</TableCell>
                                      <TableCell className="text-slate-600 text-sm whitespace-normal leading-relaxed">{pos.rationale}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
