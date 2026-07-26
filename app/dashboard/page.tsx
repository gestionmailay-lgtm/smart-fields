import { Metadata } from "next"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Wheat, Leaf, Activity, LogOut, LayoutDashboard, Settings, User, Flame, Droplets, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  title: "Tableau de bord - Smart Fields",
  description: "Vos marchés financiers et stratégies de couverture",
}

const marketConfigs = [
  {
    id: "gaz",
    title: "Gaz Naturel",
    icon: Flame,
    description: "Marché PEG / TTF. Stratégies de fixation et options pour réduire vos factures énergétiques.",
    actionText: "Simuler & Couvrir (Module Serres)",
    href: "/dashboard/serres",
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
  {
    id: "ble",
    title: "Blé Tendre",
    icon: Wheat,
    description: "Marché MATIF. Protégez votre marge en fixant vos prix de vente sur les futures récoltes.",
    actionText: "Simuler & Couvrir (Module Céréales)",
    href: "/dashboard/cereales",
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
  {
    id: "colza",
    title: "Colza",
    icon: Leaf,
    description: "Marché MATIF. Couverture des risques de baisse des prix sur vos oléagineux.",
    actionText: "Simuler & Couvrir (Module Céréales)",
    href: "/dashboard/cereales",
    color: "text-green-600",
    bg: "bg-green-100",
  },
  {
    id: "gnr",
    title: "Gazole Non Routier (GNR)",
    icon: Droplets,
    description: "Couverture sur le marché du pétrole (ICE Brent / Gasoil) pour sécuriser vos coûts de traction.",
    actionText: "Simuler & Couvrir (Module Céréales)",
    href: "/dashboard/cereales",
    color: "text-blue-600",
    bg: "bg-blue-100",
  }
]

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/20">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Image
              src="/logo.png"
              alt="Smart Fields"
              width={160}
              height={90}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-medium">Marchés & Stratégies</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-semibold">{profile?.company_name || user.email}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="icon" title="Se déconnecter">
              <LogOut className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Couverture des Marchés
            </h2>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Sélectionnez le marché que vous souhaitez sécuriser. Nous utilisons l'Intelligence Artificielle Smart Fields pour simuler vos coûts de production et vous proposer des stratégies de couverture optimisées.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {marketConfigs.map((market) => {
              const Icon = market.icon
              return (
                <Card key={market.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 flex flex-col h-full">
                  <CardHeader className="flex flex-row items-center gap-4 pb-4">
                    <div className={`${market.bg} ${market.color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                      <Icon className="h-8 w-8" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-grow justify-between gap-6 pt-2">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl">{market.title}</CardTitle>
                      <p className="text-muted-foreground leading-relaxed">
                        {market.description}
                      </p>
                    </div>
                    <div className="w-full mt-auto flex flex-col gap-2">
                      {(market.id === "gaz" || market.id === "ble" || market.id === "colza") && (
                        <Link href={`/dashboard/historique-${market.id}`} className="w-full">
                          <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors flex items-center justify-center gap-2 py-4 h-auto whitespace-normal text-sm font-medium text-center">
                            <Activity className="h-4 w-4 shrink-0" />
                            <span>Historique des Performances (10 ans)</span>
                          </Button>
                        </Link>
                      )}
                      <Link href={market.href} className="w-full">
                        <Button className="w-full group-hover:bg-primary transition-colors flex items-center justify-center gap-2 py-5 h-auto whitespace-normal text-md font-medium shadow-md text-center" variant="default">
                          <TrendingUp className="h-4 w-4 shrink-0" />
                          <span>{market.actionText}</span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Section Capteurs IoT */}
          <div className="flex flex-col gap-2 mt-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Objets Connectés & IoT
            </h2>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Suivez l'activité physiologique de vos plantes, le microclimat et l'état hydrique de vos sols grâce aux capteurs Aranet.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 flex flex-col md:flex-row items-center p-6 gap-6 bg-gradient-to-br from-green-50/50 to-emerald-50/10 dark:from-green-950/10 dark:to-emerald-950/5">
              <div className="bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400 p-6 rounded-2xl group-hover:scale-110 transition-transform shrink-0">
                <Activity className="h-12 w-12" />
              </div>
              <div className="flex-grow space-y-2">
                <CardTitle className="text-2xl flex items-center gap-2">
                  Capteurs Aranet (Serres)
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-none">19 Actifs</Badge>
                </CardTitle>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Visualisez en temps réel le climat (VPD, humidité, température), l'état du substrat (VWC, conductivité électrique poreuse, poids des pains) et la physiologie de vos plantes (flux de sève, diamètre des tiges).
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <Link href="/dashboard/aranet">
                    <Button className="font-semibold" variant="default">
                      Accéder au Tableau de Bord
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* Section d'information sur la performance IA */}
          <Card className="mt-12 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Activity className="w-64 h-64" />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                Pourquoi utiliser l'Agent IA Smart Fields ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <p className="text-lg">
                Notre intelligence artificielle analyse les cycles de marché sur les <strong>10 dernières années</strong> pour identifier les meilleures opportunités de couverture.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Méthode Déclarative :</strong> Saisissez vos consommations ou productions mois par mois.</li>
                <li><strong className="text-foreground">Simulation des coûts :</strong> Visualisez l'impact exact d'une couverture sur vos marges réelles.</li>
                <li><strong className="text-foreground">Backtesting 10 ans :</strong> Nos algorithmes s'appuient sur l'historique des marchés à terme pour valider l'efficacité de vos décisions de couverture.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
