"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, TrendingDown, AlertCircle, Info, BrainCircuit, Sparkles } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface HedgingInfo {
  percentage: number
  price: number
}

interface HedgingTableProps {
  hedgingData: Record<string, HedgingInfo>
  marketPrices: Record<string, number>
  onUpdate: (period: string, info: HedgingInfo) => void
}

interface HedgingCellProps {
  period: string
  isPast: boolean
  percentage: number
  onCommit: (val: number) => void
  dialogOpen: boolean
  selectedPeriod: string | null
}

const HedgingCell = ({ period, isPast, percentage: initialPercentage, onCommit, dialogOpen, selectedPeriod }: HedgingCellProps) => {
  const [val, setVal] = React.useState(initialPercentage)

  React.useEffect(() => {
    setVal(initialPercentage)
  }, [initialPercentage])

  // Reset visual state if dialog is cancelled
  React.useEffect(() => {
    if (!dialogOpen && selectedPeriod === period && val !== initialPercentage) {
      setVal(initialPercentage)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, selectedPeriod, period, initialPercentage])

  return (
    <div className="flex flex-col gap-2 px-1">
      <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
        <span>0%</span>
        <span className={val > 0 ? "text-primary" : ""}>{val}%</span>
        <span>100%</span>
      </div>
      <Slider
        value={[val]}
        max={100}
        step={10}
        disabled={isPast}
        onValueChange={([newVal]) => setVal(newVal)}
        onValueCommit={([newVal]) => {
          if (newVal !== initialPercentage) {
            onCommit(newVal)
          }
        }}
        className="py-1 cursor-pointer"
      />
    </div>
  )
}

const isPastPeriod = (period: string) => {
  const [y, q] = period.split(' ')
  const year = parseInt(y)
  // Aujourd'hui est le 05/05/2026 (Q2 2026)
  return year < 2026 || (year === 2026 && (q === "Q1" || q === "Q2"))
}

const getAiAdvice = (period: string, percentage: number = 0, marketPrices: Record<string, number>) => {
  const price = marketPrices[period] || 30.00
  
  if (isPastPeriod(period)) {
    return { label: "Historique", color: "bg-slate-400", icon: <Info className="h-3 w-3" />, text: "Position clôturée. Analyse SPOT uniquement." }
  }

  // Si déjà couvert à 100%
  if (percentage === 100) {
    return { 
      label: "Sécurisé", 
      color: "bg-indigo-600", 
      icon: <ShieldCheck className="h-3 w-3" />, 
      text: "Votre exposition est totalement couverte sur ce trimestre. Aucune action supplémentaire n'est requise sur le marché PEG." 
    }
  }

  const residual = 100 - percentage
  const contextText = percentage > 0 ? `(${percentage}% déjà sécurisé, analyse sur les ${residual}% résiduels) : ` : ""

  if (price > 42) {
    return { 
      label: "Prix Élevés", 
      color: "bg-red-600", 
      icon: <AlertCircle className="h-3 w-3" />, 
      text: `${contextText}Le marché est actuellement trop cher (${price}€). Smart Fields anticipe une correction à la baisse. Il est préférable de patienter et de limiter votre couverture globale pour le moment.` 
    }
  }

  if (price > 34) {
    return { 
      label: "Vigilance", 
      color: "bg-orange-500", 
      icon: <TrendingDown className="h-3 w-3" />, 
      text: `${contextText}Des incertitudes pèsent sur les prix. Smart Fields suggère de cibler une couverture globale de 20% pour limiter les risques en cas de hausse soudaine.` 
    }
  }

  if (price < 23) {
    return { 
      label: "Prix Très Bas", 
      color: "bg-indigo-700", 
      icon: <ShieldCheck className="h-3 w-3" />, 
      text: `${contextText}Opportunité historique détectée. Smart Fields recommande de viser une couverture totale (100%) pour verrouiller ces prix très avantageux.` 
    }
  }

  if (price < 27) {
    return { 
      label: "Bonne Fenêtre", 
      color: "bg-green-600", 
      icon: <Sparkles className="h-3 w-3" />, 
      text: `${contextText}Les prix sont attractifs (${price}€). Smart Fields conseille d'atteindre un niveau de couverture global situé entre 60% et 80% pour sécuriser vos coûts de production.` 
    }
  }

  return { 
    label: "Marché Stable", 
    color: "bg-slate-500", 
    icon: <TrendingDown className="h-3 w-3" />, 
    text: `${contextText}Les prix stagnent. Smart Fields surveille l'offre mondiale. Maintenez un niveau de couverture stratégique en attendant une opportunité plus claire.` 
  }
}

export function HedgingTable({ hedgingData, marketPrices, onUpdate }: HedgingTableProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedPeriod, setSelectedPeriod] = React.useState<string | null>(null)
  const [tempPercentage, setTempPercentage] = React.useState(0)
  const [priceInput, setPriceInput] = React.useState("")

  const periods = Object.keys(hedgingData).sort()
  const years = Array.from(new Set(periods.map(p => p.split(' ')[0])))

  const handleSliderChange = (period: string, val: number) => {
    setSelectedPeriod(period)
    setTempPercentage(val)
    setPriceInput(hedgingData[period].price > 0 ? hedgingData[period].price.toString() : "")
    setDialogOpen(true)
  }

  const handlePriceSubmit = () => {
    if (selectedPeriod) {
      const parsedPrice = parseFloat(priceInput.replace(',', '.')) || 0
      onUpdate(selectedPeriod, { 
        percentage: tempPercentage, 
        price: parsedPrice 
      })
      setDialogOpen(false)
    }
  }

  // Logique de regroupement pour l'Analyse IA
  const getAnalysisGroups = (year: string) => {
    const yearPeriods = periods.filter(p => p.startsWith(year) && !isPastPeriod(p))
    const groups: { start: number, count: number, advice: ReturnType<typeof getAiAdvice>, startPeriod: string, endPeriod?: string }[] = []
    
    let currentGroup: { start: number, count: number, advice: ReturnType<typeof getAiAdvice>, startPeriod: string, endPeriod?: string } | null = null
    yearPeriods.forEach((period, index) => {
      const percentage = hedgingData[period]?.percentage || 0
      const advice = getAiAdvice(period, percentage, marketPrices)
      // On regroupe si le label ET le texte sont identiques (pour tenir compte du texte résiduel dynamique)
      if (!currentGroup || currentGroup.advice.label !== advice.label || currentGroup.advice.text !== advice.text) {
        currentGroup = { start: index, count: 1, advice, startPeriod: period.split(' ')[1] }
        groups.push(currentGroup)
      } else {
        currentGroup.count++
        currentGroup.endPeriod = period.split(' ')[1]
      }
    })
    return groups
  }

  return (
    <TooltipProvider>
      <Card className="w-full shadow-2xl border-border/50 bg-card/30 backdrop-blur-md overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black flex items-center gap-2 tracking-tight">
                <BrainCircuit className="h-6 w-6 text-primary animate-pulse" />
                Tableau de Bord Stratégique
              </CardTitle>
              <CardDescription className="text-base">
                Analyse hybride : Hedging (Prix Fixe) vs. Marché (PEG).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="w-[100px] font-bold py-4">Période</TableHead>
                  <TableHead className="w-[180px] font-bold">Couverture %</TableHead>
                  <TableHead className="w-[140px] font-bold">Prix de couverture</TableHead>
                  <TableHead className="w-[120px] font-bold">Prix marché spot</TableHead>
                  <TableHead className="w-[120px] font-bold bg-primary/5">Coût moyen spot/couverture</TableHead>
                  <TableHead className="font-bold min-w-[200px]">Analyse Raw&apos;win</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {years.map(year => {
                  const yearPeriods = periods.filter(p => p.startsWith(year) && !isPastPeriod(p))

                  if (yearPeriods.length === 0) return null

                  const analysisGroups = getAnalysisGroups(year)

                  let groupIndex = 0
                  let rowsInCurrentGroup = 0

                  return (
                    <React.Fragment key={year}>
                      <TableRow className="bg-primary/5 hover:bg-primary/10 border-border/40">
                        <TableCell colSpan={6} className="font-black text-primary py-2 px-4 uppercase tracking-widest text-xs">
                          Exercice {year}
                        </TableCell>
                      </TableRow>
                      {yearPeriods.map((period) => {
                        const [y, q] = period.split(' ')
                        const isPast = parseInt(y) < 2026 || (parseInt(y) === 2026 && (q === "Q1" || q === "Q2"))
                        const marketPrice = isPast ? 0 : (marketPrices[period] || marketPrices[year] || 30.25)
                        const { percentage, price } = hedgingData[period]
                        
                        // Calcul du Coût moyen spot/couverture
                        const wac = (percentage / 100 * price) + ((1 - percentage / 100) * marketPrice)

                        // Gestion du regroupement
                        let analysisCell = null
                        if (rowsInCurrentGroup === 0) {
                          const group = analysisGroups[groupIndex]
                          analysisCell = (
                            <TableCell rowSpan={group.count} className="border-l border-border/30 align-top py-6">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col gap-2 cursor-help">
                                    <Badge className={`${group.advice.color} text-white border-none self-start flex items-center gap-1.5 px-2 py-1 shadow-sm`}>
                                      {group.advice.icon}
                                      {group.advice.label}
                                    </Badge>
                                    <p className="text-xs font-semibold text-foreground uppercase tracking-tight">
                                      {group.count > 1 ? `${group.startPeriod} à ${group.endPeriod}` : group.startPeriod}
                                    </p>
                                    <span className="text-[13px] leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors whitespace-normal">
                                      {group.advice.text}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs p-4 bg-card border-border shadow-xl z-50">
                                  <div className="space-y-2">
                                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Conseil Stratégique Raw&apos;win</p>
                                    <p className="text-sm font-medium leading-relaxed">{group.advice.text}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          )
                          rowsInCurrentGroup = group.count
                          groupIndex++
                        }
                        rowsInCurrentGroup--

                        return (
                          <TableRow key={period} className={`group transition-colors ${isPast ? "opacity-60 grayscale-[0.5]" : ""} ${percentage > 0 ? "bg-green-500/5" : "hover:bg-muted/50"}`}>
                            <TableCell className="font-bold">{q}</TableCell>
                            <TableCell>
                              <HedgingCell 
                                period={period} 
                                isPast={isPast} 
                                percentage={percentage} 
                                onCommit={(val: number) => handleSliderChange(period, val)}
                                dialogOpen={dialogOpen}
                                selectedPeriod={selectedPeriod}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Input 
                                  type="number"
                                  placeholder="--"
                                  value={price || ""}
                                  onChange={(e) => onUpdate(period, { ...hedgingData[period], price: parseFloat(e.target.value) || 0 })}
                                  disabled={percentage === 0 || isPast}
                                  className={`h-8 w-20 px-2 font-mono text-xs font-bold transition-all ${percentage > 0 ? "border-green-500 bg-green-500/5" : ""}`}
                                />
                                <span className="text-[10px] font-bold text-muted-foreground">€</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-xs font-bold text-muted-foreground">
                                {isPast ? "---" : `${marketPrice.toFixed(2)} €`}
                              </span>
                            </TableCell>
                            <TableCell className="bg-primary/5">
                              <div className="flex flex-col">
                                <span className={`font-mono text-sm font-black ${percentage > 0 ? "text-green-600" : "text-foreground"}`}>
                                  {isPast ? "---" : `${wac.toFixed(2)} €`}
                                </span>
                                <span className="text-[9px] text-muted-foreground uppercase font-bold">Coût moyen</span>
                              </div>
                            </TableCell>
                            {analysisCell}
                          </TableRow>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Mise à jour de la Couverture
            </DialogTitle>
            <DialogDescription className="font-medium flex flex-col gap-2">
              <span>
                Veuillez indiquer le prix d&apos;achat pour la couverture de <strong>{tempPercentage}%</strong> sur le trimestre <strong>{selectedPeriod}</strong>.
              </span>
              {selectedPeriod && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold">
                    Cours Marché Actuel : {marketPrices[selectedPeriod]} €/MWh
                  </Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right font-bold text-xs uppercase tracking-tighter">
                Prix (€/MWh)
              </Label>
              <Input
                id="price"
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="col-span-3 font-mono font-bold"
                placeholder="Ex: 42.50"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handlePriceSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-bold uppercase tracking-widest text-[10px]">
              Annuler
            </Button>
            <Button onClick={handlePriceSubmit} className="font-bold uppercase tracking-widest text-[10px] bg-primary shadow-lg shadow-primary/20">
              Valider la Position
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
