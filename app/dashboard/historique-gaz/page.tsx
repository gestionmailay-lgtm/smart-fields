"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingDown, TrendingUp, Calendar, CheckCircle2, Info, Activity, Flame, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts"

// Mock Data for 10 years
const summaryData = [
  { year: "2016", spot: 15.5, smartFields: 14.8 },
  { year: "2017", spot: 18.0, smartFields: 16.5 },
  { year: "2018", spot: 23.5, smartFields: 21.8 },
  { year: "2019", spot: 14.2, smartFields: 13.9 },
  { year: "2020", spot: 11.5, smartFields: 10.8 },
  { year: "2021", spot: 47.0, smartFields: 32.5 },
  { year: "2022", spot: 123.0, smartFields: 35.0 },
  { year: "2023", spot: 42.0, smartFields: 36.5 },
  { year: "2024", spot: 32.0, smartFields: 28.0 },
  { year: "2025", spot: 30.0, smartFields: 26.5 },
]

const detailedHistory = [
  {
    year: 2025,
    spotAvg: 30.0,
    smartFieldsAvg: 26.5,
    savings: "11.6%",
    quarters: [
      {
        quarter: "Q1 2025",
        positions: [
          { date: "15 Oct 2024", action: "Fixation Terme", volume: "50%", price: "27.0 €/MWh", rationale: "Analyse des capacités GNL US et baisse de la prime de risque géopolitique. Atteinte d'un support technique majeur justifiant la sécurisation hivernale." },
        ]
      },
      {
        quarter: "Q2 2025",
        positions: [
          { date: "12 Jan 2025", action: "Fixation Terme", volume: "100%", price: "26.5 €/MWh", rationale: "Modélisation météo confirmant un hiver clément. Les niveaux de stockage en sortie d'hiver projetés sont historiquement hauts. Achat sur faiblesse." },
        ]
      },
      {
        quarter: "Q3 2025",
        positions: [
          { date: "20 Avr 2025", action: "Spot / Indexé", volume: "100%", price: "25.8 €/MWh", rationale: "L'IA recommande l'exposition spot pour capter la pression baissière due à l'abondance record de production d'origine renouvelable sur le réseau électrique européen." },
        ]
      },
      {
        quarter: "Q4 2025",
        positions: [
          { date: "10 Jui 2025", action: "Fixation Terme", volume: "100%", price: "28.0 €/MWh", rationale: "Prise de couverture avant la réintroduction habituelle de la prime de risque hivernale par les marchés. Modélisation algorithmique d'un retour à la normale des températures." },
        ]
      }
    ]
  },
  {
    year: 2024,
    spotAvg: 32.0,
    smartFieldsAvg: 28.0,
    savings: "12.5%",
    quarters: [
      {
        quarter: "Q1 2024",
        positions: [
          { date: "22 Sep 2023", action: "Fixation Terme", volume: "100%", price: "31.5 €/MWh", rationale: "Mise en sécurité du portefeuille face aux incertitudes résiduelles concernant les menaces de grèves sur les terminaux GNL en Australie." },
        ]
      },
      {
        quarter: "Q2 2024",
        positions: [
          { date: "14 Déc 2023", action: "Fixation Terme", volume: "100%", price: "28.5 €/MWh", rationale: "Correction baissière anticipée par nos modèles suite au maintien de flux de GNL records vers l'Europe, compensant largement la demande structurelle." },
        ]
      },
      {
        quarter: "Q3 2024",
        positions: [
          { date: "05 Mar 2024", action: "Spot / Indexé", volume: "100%", price: "26.0 €/MWh", rationale: "Fin de la saison de chauffe validée. Signal algorithmique de désengagement des couvertures pour surfer la baisse des prix au comptant." },
        ]
      },
      {
        quarter: "Q4 2024",
        positions: [
          { date: "18 Jui 2024", action: "Fixation Terme", volume: "100%", price: "29.5 €/MWh", rationale: "L'intelligence artificielle préempte un léger rebond de la demande industrielle en fin d'année. Couverture exécutée lors d'un creux de volatilité estivale." },
        ]
      }
    ]
  },
  {
    year: 2023,
    spotAvg: 42.0,
    smartFieldsAvg: 36.5,
    savings: "13.1%",
    quarters: [
      {
        quarter: "Q1 2023",
        positions: [
          { date: "15 Oct 2022", action: "Fixation Terme", volume: "50%", price: "38.5 €/MWh", rationale: "Couverture partielle anticipant la destruction effective de la demande industrielle en Europe (mesurée par satellite sur les hubs industriels allemands)." },
          { date: "05 Nov 2022", action: "Fixation Terme", volume: "50%", price: "36.0 €/MWh", rationale: "Déclenchement d'achat sur un support technique majeur validant le scénario d'apaisement post-crise." },
        ]
      },
      {
        quarter: "Q2 2023",
        positions: [
          { date: "12 Fév 2023", action: "Fixation Terme", volume: "100%", price: "35.2 €/MWh", rationale: "Analyse confirmant que les niveaux de stockage européens sont suffisants pour exclure tout risque de pénurie à court terme." },
        ]
      },
      {
        quarter: "Q3 2023",
        positions: [
          { date: "20 Mai 2023", action: "Spot / Indexé", volume: "100%", price: "32.0 €/MWh", rationale: "Détection de surplus de livraisons GNL. Ordre de maintien en indexation Spot pour absorber les excès d'offre estivaux." },
        ]
      },
      {
        quarter: "Q4 2023",
        positions: [
          { date: "10 Aoû 2023", action: "Fixation Terme", volume: "100%", price: "38.0 €/MWh", rationale: "Les algorithmes détectent un risque asymétrique (hausse possible / baisse limitée) avant l'hiver. Clôture de l'exposition." },
        ]
      }
    ]
  },
  {
    year: 2022,
    spotAvg: 123.0,
    smartFieldsAvg: 35.0,
    savings: "71.5%",
    quarters: [
      {
        quarter: "Q1 2022",
        positions: [
          { date: "10 Avr 2021", action: "Fixation Terme", volume: "100%", price: "32.5 €/MWh", rationale: "Alerte Niveau 1 : L'IA détecte une vitesse de reconstitution des stockages européens anormalement lente (-20% vs moyenne 5 ans) suite à un hiver long. Le ratio risque/bénéfice impose une sécurisation immédiate." },
        ]
      },
      {
        quarter: "Q2 2022",
        positions: [
          { date: "15 Avr 2021", action: "Fixation Terme", volume: "100%", price: "33.0 €/MWh", rationale: "Détection de signaux anormaux sur les flux physiques : Baisse inexpliquée des injections de Gazprom sur le marché spot européen. L'algorithme anticipe un déficit structurel." },
        ]
      },
      {
        quarter: "Q3 2022",
        positions: [
          { date: "20 Mai 2021", action: "Fixation Terme", volume: "100%", price: "36.5 €/MWh", rationale: "Modélisation GNL globale : Aspiration majeure du GNL par le marché asiatique (reprise post-Covid). L'Europe ne pourra pas compenser le manque de gaz russe. Fermeture de l'exposition estivale." },
        ]
      },
      {
        quarter: "Q4 2022",
        positions: [
          { date: "12 Jui 2021", action: "Fixation Terme", volume: "100%", price: "38.0 €/MWh", rationale: "Alerte Critique : Les modèles prédictifs indiquent l'impossibilité mathématique d'atteindre l'objectif de remplissage des stocks sans destruction de la demande. Sécurisation totale avant l'emballement." },
        ]
      }
    ]
  },
  {
    year: 2021,
    spotAvg: 47.0,
    smartFieldsAvg: 32.5,
    savings: "30.8%",
    quarters: [
      {
        quarter: "Q1 2021",
        positions: [
          { date: "14 Oct 2020", action: "Fixation Terme", volume: "100%", price: "14.5 €/MWh", rationale: "Analyse contrariante de l'IA : La dépression des prix (post-Covid) crée une asymétrie de marché historique. Le ratio rendement/risque justifie un achat fort." },
        ]
      },
      {
        quarter: "Q2 2021",
        positions: [
          { date: "18 Fév 2021", action: "Fixation Terme", volume: "100%", price: "17.5 €/MWh", rationale: "Détection algorithmique d'une vague de froid tardive en Asie provoquant un détournement des méthaniers. Anticipation de tensions de rattrapage sur le hub européen." },
        ]
      },
      {
        quarter: "Q3 2021",
        positions: [
          { date: "05 Mai 2021", action: "Fixation Terme", volume: "100%", price: "22.0 €/MWh", rationale: "Croisement de moyennes mobiles critiques (MACD/RSI) combiné à un resserrement inattendu de l'offre norvégienne. Entrée validée dans un cycle haussier." },
        ]
      },
      {
        quarter: "Q4 2021",
        positions: [
          { date: "12 Aoû 2021", action: "Fixation Terme", volume: "100%", price: "45.0 €/MWh", rationale: "Les injections russes s'effondrent de 30% vs historique sans justification de maintenance. Alarme rouge de l'IA : Risque systémique imminent, sécurisation absolue." },
        ]
      }
    ]
  },
  {
    year: 2020,
    spotAvg: 11.5,
    smartFieldsAvg: 10.8,
    savings: "6.1%",
    quarters: [
      {
        quarter: "Q1 2020",
        positions: [
          { date: "05 Jan 2020", action: "Spot / Indexé", volume: "100%", price: "12.5 €/MWh", rationale: "Hiver particulièrement clément et surabondance mondiale de GNL. L'algorithme préconise une forte exposition au marché spot baissier." },
        ]
      },
      {
        quarter: "Q2 2020",
        positions: [
          { date: "15 Mar 2020", action: "Spot / Indexé", volume: "100%", price: "9.0 €/MWh", rationale: "Événement 'Black Swan' (Covid-19). Les algorithmes intègrent en temps réel l'effondrement mondial de l'activité économique. Recommandation : rester flottant face à la destruction de la demande." },
        ]
      },
      {
        quarter: "Q3 2020",
        positions: [
          { date: "20 Jui 2020", action: "Spot / Indexé", volume: "100%", price: "7.5 €/MWh", rationale: "Sur-stockage européen record empêchant tout rebond estival. Les modèles confirment l'absence de plancher technique avant l'automne." },
        ]
      },
      {
        quarter: "Q4 2020",
        positions: [
          { date: "05 Oct 2020", action: "Fixation Terme", volume: "100%", price: "13.5 €/MWh", rationale: "Premiers signaux de reprise industrielle en Asie captés par le réseau de données Smart Fields. Fixation immédiate avant contagion haussière." },
        ]
      }
    ]
  },
  {
    year: 2019,
    spotAvg: 14.2,
    smartFieldsAvg: 13.9,
    savings: "2.1%",
    quarters: [
      {
        quarter: "Q1 2019",
        positions: [
          { date: "10 Nov 2018", action: "Fixation Terme", volume: "100%", price: "18.5 €/MWh", rationale: "Couverture standard de prudence avant l'hiver sur base de modèles météorologiques indécis." },
        ]
      },
      {
        quarter: "Q2 2019",
        positions: [
          { date: "20 Fév 2019", action: "Spot / Indexé", volume: "100%", price: "14.0 €/MWh", rationale: "L'IA identifie une forte décote du Spot face au Terme due à une disponibilité excédentaire des terminaux méthaniers." },
        ]
      },
      {
        quarter: "Q3 2019",
        positions: [
          { date: "15 Mai 2019", action: "Spot / Indexé", volume: "100%", price: "11.5 €/MWh", rationale: "La guerre commerciale US-Chine ralentit la demande asiatique. L'Europe absorbe le GNL bradé. L'IA maintient l'exposition Spot." },
        ]
      },
      {
        quarter: "Q4 2019",
        positions: [
          { date: "05 Sep 2019", action: "Fixation Terme", volume: "100%", price: "15.0 €/MWh", rationale: "Anticipation des renégociations de transit gazier Russie-Ukraine. Prise de couverture pour éliminer ce risque asymétrique." },
        ]
      }
    ]
  },
  {
    year: 2018,
    spotAvg: 23.5,
    smartFieldsAvg: 21.8,
    savings: "7.2%",
    quarters: [
      {
        quarter: "Q1 2018",
        positions: [
          { date: "15 Sep 2017", action: "Fixation Terme", volume: "100%", price: "19.5 €/MWh", rationale: "Détection d'une corrélation forte entre la hausse du charbon (ARA) et le gaz. Décision algorithmique de verrouiller l'hiver." },
        ]
      },
      {
        quarter: "Q2 2018",
        positions: [
          { date: "12 Jan 2018", action: "Fixation Terme", volume: "100%", price: "21.0 €/MWh", rationale: "L'IA anticipe l'impact du froid tardif 'Beast from the East' réduisant massivement les stocks européens. Couverture forcée." },
        ]
      },
      {
        quarter: "Q3 2018",
        positions: [
          { date: "20 Avr 2018", action: "Fixation Terme", volume: "100%", price: "22.5 €/MWh", rationale: "Le besoin de réinjection record pour reconstituer les stocks épuisés par l'hiver soutiendra les prix estivaux. Achat anticipatif." },
        ]
      },
      {
        quarter: "Q4 2018",
        positions: [
          { date: "15 Jul 2018", action: "Fixation Terme", volume: "100%", price: "24.5 €/MWh", rationale: "Rallye du CO2 sur le marché ETS détecté. Les modèles prévoient une répercussion directe sur le prix marginal du gaz. Protection activée." },
        ]
      }
    ]
  },
  {
    year: 2017,
    spotAvg: 18.0,
    smartFieldsAvg: 16.5,
    savings: "8.3%",
    quarters: [
      {
        quarter: "Q1 2017",
        positions: [
          { date: "10 Oct 2016", action: "Fixation Terme", volume: "100%", price: "16.0 €/MWh", rationale: "Arrêts imprévus du parc nucléaire français générant une forte demande de substitution gazière. Mouvement anticipé par l'IA." },
        ]
      },
      {
        quarter: "Q2 2017",
        positions: [
          { date: "05 Mar 2017", action: "Spot / Indexé", volume: "100%", price: "15.5 €/MWh", rationale: "Redémarrage confirmé des réacteurs nucléaires, détendant l'équilibre électrique. Désengagement de l'algorithme vers le marché Spot." },
        ]
      },
      {
        quarter: "Q3 2017",
        positions: [
          { date: "15 Mai 2017", action: "Spot / Indexé", volume: "100%", price: "14.5 €/MWh", rationale: "Fondamentaux solides, forte disponibilité des infrastructures norvégiennes. Maintien en Spot préconisé." },
        ]
      },
      {
        quarter: "Q4 2017",
        positions: [
          { date: "20 Aou 2017", action: "Fixation Terme", volume: "100%", price: "18.0 €/MWh", rationale: "L'IA détecte une augmentation anormale de la demande asiatique d'anticipation hivernale. Couverture pour éviter la concurrence sur le GNL." },
        ]
      }
    ]
  },
  {
    year: 2016,
    spotAvg: 15.5,
    smartFieldsAvg: 14.8,
    savings: "4.5%",
    quarters: [
      {
        quarter: "Q1 2016",
        positions: [
          { date: "15 Sep 2015", action: "Fixation Terme", volume: "100%", price: "17.0 €/MWh", rationale: "Sécurisation budgétaire pré-hivernale standard basée sur la volatilité historique." },
        ]
      },
      {
        quarter: "Q2 2016",
        positions: [
          { date: "10 Fév 2016", action: "Spot / Indexé", volume: "100%", price: "13.5 €/MWh", rationale: "Les algorithmes identifient l'impact de l'effondrement des prix mondiaux du pétrole brut sur la formule tarifaire du gaz. Maintien Spot." },
        ]
      },
      {
        quarter: "Q3 2016",
        positions: [
          { date: "20 Mai 2016", action: "Spot / Indexé", volume: "100%", price: "12.5 €/MWh", rationale: "Marché lourd et surabondance d'offre. Les signaux techniques valident une poursuite de la dynamique baissière intra-journalière." },
        ]
      },
      {
        quarter: "Q4 2016",
        positions: [
          { date: "05 Sep 2016", action: "Fixation Terme", volume: "100%", price: "15.5 €/MWh", rationale: "Formation d'un double creux technique et premières tensions sur les stockages (retards d'injection détectés). Fixation de couverture." },
        ]
      }
    ]
  }
]

export default function HistoriqueGazPage() {
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

        {/* Dégradé de fond abstrait pour le gaz */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 overflow-hidden">
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        </div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div className="bg-white/20 p-3 rounded-full mb-4 backdrop-blur-sm border border-white/30">
            <Flame className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 drop-shadow-md">
            Historique Stratégie Gaz
          </h1>
          <p className="max-w-[800px] text-lg text-white/90 drop-shadow-sm font-medium">
            10 années de backtesting et d'optimisation de couvertures.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="shadow-lg border-none bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-green-100 p-4 rounded-2xl">
                <TrendingDown className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Économie Moyenne (10 ans)</p>
                <h3 className="text-3xl font-bold text-slate-900">-18.5%</h3>
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
              <div className="bg-orange-100 p-4 rounded-2xl">
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volatilité Absorbée</p>
                <h3 className="text-3xl font-bold text-slate-900">Haute</h3>
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
              Comparatif entre le prix Spot moyen annuel et le prix obtenu via la stratégie Smart Fields (en €/MWh).
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
                    <linearGradient id="colorSmartFields" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `€${val}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${value} €/MWh`, '']}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" name="Prix Spot Moyen" dataKey="spot" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorSpot)" />
                  <Area type="monotone" name="Stratégie Smart Fields" dataKey="smartFields" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSmartFields)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Détail Année par Année */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Journal des Positions (Trimestre par Trimestre)
            </h2>
          </div>

          <div className="space-y-4">
            {detailedHistory.map((yearData) => (
              <Card 
                key={yearData.year} 
                className={`overflow-hidden transition-all duration-300 border-2 ${expandedYear === yearData.year ? 'border-orange-300 shadow-lg' : 'border-slate-200 hover:border-orange-200 shadow-sm'}`}
              >
                <div 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 cursor-pointer ${expandedYear === yearData.year ? 'bg-orange-50/50' : 'bg-white'}`}
                  onClick={() => setExpandedYear(expandedYear === yearData.year ? null : yearData.year)}
                >
                  <div className="flex items-center gap-6">
                    <div className="bg-slate-900 text-white font-bold text-2xl px-5 py-3 rounded-xl shadow-inner">
                      {yearData.year}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                         <span className="text-sm text-slate-500">Spot: <strong className="text-slate-700">{yearData.spotAvg} €</strong></span>
                         <span className="text-sm text-slate-500">Smart Fields: <strong className="text-orange-600">{yearData.smartFieldsAvg} €</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-semibold">
                            Économie : {yearData.savings}
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
                            <div className="h-8 w-8 rounded-full bg-orange-100 border-2 border-orange-500 flex items-center justify-center text-orange-600 font-bold text-xs">
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
                                    <TableHead className="font-semibold">Prix Obj.</TableHead>
                                    <TableHead className="font-semibold min-w-[300px]">Rationnel Stratégique</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {q.positions.map((pos, pIndex) => (
                                    <TableRow key={pIndex} className="bg-white">
                                      <TableCell className="font-medium text-slate-600">{pos.date}</TableCell>
                                      <TableCell>
                                        <Badge variant={pos.action.includes('Terme') ? 'default' : 'secondary'} className={pos.action.includes('Terme') ? 'bg-orange-500 hover:bg-orange-600' : ''}>
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
