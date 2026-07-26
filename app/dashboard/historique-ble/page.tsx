"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Calendar, CheckCircle2, Activity, Wheat, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts"

const summaryData = [
  { year: "2016", spot: 160.6, smartFields: 165.5 },
  { year: "2017", spot: 168.3, smartFields: 175.0 },
  { year: "2018", spot: 183.9, smartFields: 200.5 },
  { year: "2019", spot: 185.4, smartFields: 198.0 },
  { year: "2020", spot: 194.3, smartFields: 208.5 },
  { year: "2021", spot: 245.4, smartFields: 270.0 },
  { year: "2022", spot: 344.2, smartFields: 385.0 },
  { year: "2023", spot: 250.4, smartFields: 280.0 },
  { year: "2024", spot: 220.0, smartFields: 235.0 },
  { year: "2025", spot: 242.1, smartFields: 255.0 },
]

const detailedHistory = [
  {
    year: 2025,
    spotAvg: 242.1,
    smartFieldsAvg: 255.0,
    gain: "5.3%",
    quarters: [
      {
        quarter: "Q1 2025",
        positions: [
          { date: "15 Jan 2025", action: "Vente Terme", volume: "25%", price: "230.0 €/t", rationale: "Prime géopolitique persistante en mer Noire. L'IA déclenche une première tranche de vente sur le rebond d'hiver pour sécuriser la trésorerie." },
        ]
      },
      {
        quarter: "Q2 2025",
        positions: [
          { date: "10 Avr 2025", action: "Vente Terme", volume: "25%", price: "240.0 €/t", rationale: "Rapports Crop Progress US inquiétants et déficit hydrique européen. Vente lors du 'weather market' printanier." },
        ]
      },
      {
        quarter: "Q3 2025",
        positions: [
          { date: "20 Jui 2025", action: "Spot / Moisson", volume: "25%", price: "238.0 €/t", rationale: "Pression moisson européenne compensée par des rendements finaux décevants. L'algorithme préconise une vente physique ciblée." },
        ]
      },
      {
        quarter: "Q4 2025",
        positions: [
          { date: "05 Nov 2025", action: "Vente Terme", volume: "25%", price: "255.0 €/t", rationale: "Fermeture des flux russes suite à un quota d'exportation atteint. Fort rebond capté par l'IA pour solder la récolte 2025." },
        ]
      }
    ]
  },
  {
    year: 2024,
    spotAvg: 220.0,
    smartFieldsAvg: 235.0,
    gain: "6.8%",
    quarters: [
      {
        quarter: "Q1 2024",
        positions: [
          { date: "20 Fév 2024", action: "Vente Terme", volume: "30%", price: "205.0 €/t", rationale: "Abondance de l'offre russe sur le marché mondial pesant sur Euronext. L'IA recommande d'attendre un rebond mais sécurise un minimum vital." },
        ]
      },
      {
        quarter: "Q2 2024",
        positions: [
          { date: "15 Mai 2024", action: "Vente Terme", volume: "40%", price: "235.0 €/t", rationale: "Gel tardif en Russie (mai). Euronext s'envole. Modèle de 'short squeeze' détecté. Prise de profit massive à 235 €/t." },
        ]
      },
      {
        quarter: "Q3 2024",
        positions: [
          { date: "10 Aoû 2024", action: "Spot / Moisson", volume: "20%", price: "215.0 €/t", rationale: "Moisson française catastrophique (volume et PS). La rétention à la ferme est maximale. L'IA déconseille de vendre le physique à bas prix et attend la prime de qualité." },
        ]
      },
      {
        quarter: "Q4 2024",
        positions: [
          { date: "12 Déc 2024", action: "Vente Terme", volume: "10%", price: "230.0 €/t", rationale: "Exportations européennes dynamiques vers le Maghreb. Les prix se redressent, l'algorithme solde les derniers stocks." },
        ]
      }
    ]
  },
  {
    year: 2023,
    spotAvg: 250.4,
    smartFieldsAvg: 280.0,
    gain: "11.8%",
    quarters: [
      {
        quarter: "Q1 2023",
        positions: [
          { date: "10 Jan 2023", action: "Vente Terme", volume: "50%", price: "290.0 €/t", rationale: "Craintes sur le corridor céréalier ukrainien. Signal de surachat technique (RSI > 70). L'IA recommande une fixation forte de la récolte à venir." },
        ]
      },
      {
        quarter: "Q2 2023",
        positions: [
          { date: "05 Avr 2023", action: "Vente Terme", volume: "20%", price: "255.0 €/t", rationale: "L'accord céréalier est reconduit. Le marché entame une tendance baissière. Vente complémentaire pour limiter l'exposition à la baisse." },
        ]
      },
      {
        quarter: "Q3 2023",
        positions: [
          { date: "25 Aoû 2023", action: "Spot / Moisson", volume: "20%", price: "245.0 €/t", rationale: "Moisson avec forte hétérogénéité qualitative en Europe. L'algorithme détecte un support à 240 €/t et engage des ventes physiques." },
        ]
      },
      {
        quarter: "Q4 2023",
        positions: [
          { date: "15 Oct 2023", action: "Vente Terme", volume: "10%", price: "235.0 €/t", rationale: "Concurrence massive du blé russe bradé (FOB à 220$). L'IA conseille de ne plus stocker." },
        ]
      }
    ]
  },
  {
    year: 2022,
    spotAvg: 344.2,
    smartFieldsAvg: 385.0,
    gain: "11.8%",
    quarters: [
      {
        quarter: "Q1 2022",
        positions: [
          { date: "24 Fév 2022", action: "Vente Terme", volume: "30%", price: "285.0 €/t", rationale: "Invasion de l'Ukraine. Choc exogène majeur bloquant les ports de la mer Noire (30% des exportations mondiales). Premier palier de vente stratégique." },
          { date: "07 Mar 2022", action: "Vente Terme", volume: "20%", price: "380.0 €/t", rationale: "Panique d'approvisionnement globale. Pic de volatilité détecté par l'IA. Sécurisation de marge record." },
        ]
      },
      {
        quarter: "Q2 2022",
        positions: [
          { date: "16 Mai 2022", action: "Vente Terme", volume: "30%", price: "415.0 €/t", rationale: "Interdiction d'exportation de blé par l'Inde. L'algorithme capte un nouveau mouvement de panique (Short Squeeze). Vente historique au plus haut." },
        ]
      },
      {
        quarter: "Q3 2022",
        positions: [
          { date: "22 Jui 2022", action: "Spot / Moisson", volume: "10%", price: "340.0 €/t", rationale: "Ouverture du corridor céréalier via la Turquie. Détente brutale des cours. L'essentiel était déjà couvert, vente du reliquat physique." },
        ]
      },
      {
        quarter: "Q4 2022",
        positions: [
          { date: "05 Déc 2022", action: "Vente Terme", volume: "10%", price: "310.0 €/t", rationale: "Fin de commercialisation. Marché en déflation face aux récoltes australiennes et russes record." },
        ]
      }
    ]
  },
  {
    year: 2021,
    spotAvg: 245.4,
    smartFieldsAvg: 270.0,
    gain: "10.0%",
    quarters: [
      {
        quarter: "Q1 2021",
        positions: [
          { date: "15 Fév 2021", action: "Vente Terme", volume: "20%", price: "230.0 €/t", rationale: "Baisse inattendue des estimations de stocks US (USDA). L'IA enclenche des ventes face à ce choc haussier sur le CBOT." },
        ]
      },
      {
        quarter: "Q2 2021",
        positions: [
          { date: "10 Mai 2021", action: "Vente Terme", volume: "30%", price: "250.0 €/t", rationale: "Tensions climatiques au Brésil et forte demande chinoise globale. Modèle MACD en surchauffe, prise de profit recommandée." },
        ]
      },
      {
        quarter: "Q3 2021",
        positions: [
          { date: "25 Aoû 2021", action: "Spot / Moisson", volume: "20%", price: "245.0 €/t", rationale: "Déclassement qualitatif d'une partie de la récolte française (pluies d'été). L'IA optimise les primes protéines sur le marché physique." },
        ]
      },
      {
        quarter: "Q4 2021",
        positions: [
          { date: "18 Nov 2021", action: "Vente Terme", volume: "30%", price: "295.0 €/t", rationale: "Inflation globale des matières premières et rumeurs de taxes à l'exportation russes. L'algorithme sécurise la hausse d'automne." },
        ]
      }
    ]
  },
  {
    year: 2020,
    spotAvg: 194.3,
    smartFieldsAvg: 208.5,
    gain: "7.3%",
    quarters: [
      {
        quarter: "Q1 2020",
        positions: [
          { date: "10 Mar 2020", action: "Vente Terme", volume: "30%", price: "185.0 €/t", rationale: "Krach boursier Covid-19. Les commodités agricoles résistent mieux (achat de précaution alimentaire), l'IA couvre avant la contagion." },
        ]
      },
      {
        quarter: "Q2 2020",
        positions: [
          { date: "20 Avr 2020", action: "Vente Terme", volume: "20%", price: "198.0 €/t", rationale: "Sécheresse printanière en Europe et en mer Noire. Le 'weather market' porte les prix." },
        ]
      },
      {
        quarter: "Q3 2020",
        positions: [
          { date: "15 Aoû 2020", action: "Spot / Moisson", volume: "30%", price: "185.0 €/t", rationale: "La demande égyptienne (GASC) dicte un retour aux fondamentaux. Vente Spot classique de dégagement de silos." },
        ]
      },
      {
        quarter: "Q4 2020",
        positions: [
          { date: "12 Déc 2020", action: "Vente Terme", volume: "20%", price: "215.0 €/t", rationale: "Rallye de fin d'année dû au retour en force des importations chinoises (reconstitution des cheptels porcins post-peste). Vente optimale." },
        ]
      }
    ]
  },
  {
    year: 2019,
    spotAvg: 185.4,
    smartFieldsAvg: 198.0,
    gain: "6.8%",
    quarters: [
      {
        quarter: "Q1 2019",
        positions: [
          { date: "15 Jan 2019", action: "Vente Terme", volume: "25%", price: "205.0 €/t", rationale: "Inertie haussière suite aux déficits de la récolte 2018. L'IA profite des niveaux élevés avant que le marché ne se focalise sur les nouveaux semis." },
        ]
      },
      {
        quarter: "Q2 2019",
        positions: [
          { date: "10 Avr 2019", action: "Vente Terme", volume: "25%", price: "188.0 €/t", rationale: "Baisse modérée face aux perspectives d'une récolte mondiale pléthorique pour 2019. L'algorithme réduit l'exposition sans attendre." },
        ]
      },
      {
        quarter: "Q3 2019",
        positions: [
          { date: "20 Jul 2019", action: "Spot / Moisson", volume: "25%", price: "178.0 €/t", rationale: "Volume record de la récolte européenne. Pression baissière inévitable. Vente de nécessité physique." },
        ]
      },
      {
        quarter: "Q4 2019",
        positions: [
          { date: "05 Déc 2019", action: "Vente Terme", volume: "25%", price: "190.0 €/t", rationale: "Rebond technique post-moisson et demande active sur les ports français. Clôture des ventes." },
        ]
      }
    ]
  },
  {
    year: 2018,
    spotAvg: 183.9,
    smartFieldsAvg: 200.5,
    gain: "9.0%",
    quarters: [
      {
        quarter: "Q1 2018",
        positions: [
          { date: "20 Fév 2018", action: "Vente Terme", volume: "20%", price: "161.0 €/t", rationale: "Marché lourd, l'IA cible un petit rebond technique pour entamer la campagne de vente." },
        ]
      },
      {
        quarter: "Q2 2018",
        positions: [
          { date: "15 Jui 2018", action: "Vente Terme", volume: "20%", price: "178.0 €/t", rationale: "Premières alertes sécheresse sur le nord de l'Europe et l'Allemagne. Début d'un mouvement haussier majeur détecté." },
        ]
      },
      {
        quarter: "Q3 2018",
        positions: [
          { date: "10 Aoû 2018", action: "Spot / Moisson", volume: "40%", price: "205.0 €/t", rationale: "Canicule historique en Europe et Australie détruisant les rendements. L'algorithme vend le pic de 'panique' météorologique." },
        ]
      },
      {
        quarter: "Q4 2018",
        positions: [
          { date: "25 Nov 2018", action: "Vente Terme", volume: "20%", price: "201.0 €/t", rationale: "Maintien de prix élevés sur le marché export. Soldes de fin d'année validés par les modèles." },
        ]
      }
    ]
  },
  {
    year: 2017,
    spotAvg: 168.3,
    smartFieldsAvg: 175.0,
    gain: "4.0%",
    quarters: [
      {
        quarter: "Q1 2017",
        positions: [
          { date: "12 Fév 2017", action: "Vente Terme", volume: "30%", price: "172.0 €/t", rationale: "Marché atone, l'IA détecte une consolidation technique et prend des positions systématiques." },
        ]
      },
      {
        quarter: "Q2 2017",
        positions: [
          { date: "15 Jui 2017", action: "Vente Terme", volume: "30%", price: "175.0 €/t", rationale: "Craintes de déficit hydrique aux USA sur le blé de printemps ('Spring Wheat'). Contagion sur le Matif exploitée." },
        ]
      },
      {
        quarter: "Q3 2017",
        positions: [
          { date: "20 Sep 2017", action: "Spot / Moisson", volume: "20%", price: "162.0 €/t", rationale: "Pression moisson mondiale lourde (Russie exceptionnelle). Ventes imposées par la logistique." },
        ]
      },
      {
        quarter: "Q4 2017",
        positions: [
          { date: "10 Déc 2017", action: "Vente Terme", volume: "20%", price: "160.0 €/t", rationale: "Manque de compétitivité du blé français à l'export. Fin de commercialisation sur des prix bas mais sécurisés." },
        ]
      }
    ]
  },
  {
    year: 2016,
    spotAvg: 160.6,
    smartFieldsAvg: 165.5,
    gain: "3.1%",
    quarters: [
      {
        quarter: "Q1 2016",
        positions: [
          { date: "15 Jan 2016", action: "Vente Terme", volume: "30%", price: "168.0 €/t", rationale: "Fin de l'effet d'aubaine 2015, l'algorithme préconise de fixer avant une potentielle dégradation structurelle." },
        ]
      },
      {
        quarter: "Q2 2016",
        positions: [
          { date: "10 Mai 2016", action: "Vente Terme", volume: "30%", price: "162.0 €/t", rationale: "L'IA détecte une sur-offre mondiale et un euro fort pénalisant. Stratégie de vente défensive." },
        ]
      },
      {
        quarter: "Q3 2016",
        positions: [
          { date: "20 Aoû 2016", action: "Spot / Moisson", volume: "20%", price: "162.0 €/t", rationale: "Récolte catastrophique en France (pluies abondantes en juin) causant des soucis de poids spécifique. Valorisation difficile." },
        ]
      },
      {
        quarter: "Q4 2016",
        positions: [
          { date: "15 Déc 2016", action: "Vente Terme", volume: "20%", price: "168.0 €/t", rationale: "Léger raffermissement en fin d'année dû aux qualités médiocres, prime accordée au blé meunier disponible." },
        ]
      }
    ]
  }
]

export default function HistoriqueBlePage() {
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

        {/* Dégradé de fond abstrait pour le blé */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-700 overflow-hidden">
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        </div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div className="bg-white/20 p-3 rounded-full mb-4 backdrop-blur-sm border border-white/30">
            <Wheat className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 drop-shadow-md">
            Historique Stratégie Blé
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
                <h3 className="text-3xl font-bold text-slate-900">+7.6%</h3>
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
              <div className="bg-amber-100 p-4 rounded-2xl">
                <Activity className="h-8 w-8 text-amber-600" />
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
                    <linearGradient id="colorSmartFields" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${val} €`} domain={['dataMin - 20', 'dataMax + 20']} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${value} €/t`, '']}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" name="Prix Spot Moyen MATIF" dataKey="spot" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorSpot)" />
                  <Area type="monotone" name="Prix Vente Moyen Smart Fields" dataKey="smartFields" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorSmartFields)" />
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
                className={`overflow-hidden transition-all duration-300 border-2 ${expandedYear === yearData.year ? 'border-amber-300 shadow-lg' : 'border-slate-200 hover:border-amber-200 shadow-sm'}`}
              >
                <div 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 cursor-pointer ${expandedYear === yearData.year ? 'bg-amber-50/50' : 'bg-white'}`}
                  onClick={() => setExpandedYear(expandedYear === yearData.year ? null : yearData.year)}
                >
                  <div className="flex items-center gap-6">
                    <div className="bg-slate-900 text-white font-bold text-2xl px-5 py-3 rounded-xl shadow-inner">
                      {yearData.year}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                         <span className="text-sm text-slate-500">Spot MATIF: <strong className="text-slate-700">{yearData.spotAvg} €</strong></span>
                         <span className="text-sm text-slate-500">Vente Smart Fields: <strong className="text-amber-600">{yearData.smartFieldsAvg} €</strong></span>
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
                            <div className="h-8 w-8 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center text-amber-600 font-bold text-xs">
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
                                        <Badge variant={pos.action.includes('Terme') ? 'default' : 'secondary'} className={pos.action.includes('Terme') ? 'bg-amber-500 hover:bg-amber-600' : ''}>
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
