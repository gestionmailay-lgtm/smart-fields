import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ShoppingCart, Droplets, Fuel } from "lucide-react"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Module Serres - Smart Fields",
  description: "Découvrez notre accompagnement pour les exploitations sous serres.",
}

export default function SerresModulePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header Héro avec image de fond */}
      <div className="relative h-[40vh] w-full">
        {/* Lien retour en haut à gauche */}
        <div className="absolute top-4 left-4 z-10 md:top-6 md:left-6">
          <Link
            href="/modules"
            className="group flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-sm font-medium text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Retour aux modules
          </Link>
        </div>

        <Image
          src="/serres.jpg"
          alt="Serres agricoles"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Module Serres
          </h1>
          <p className="max-w-[800px] text-lg text-white/90">
            Maximisez la rentabilité de vos cultures sous serres grâce à notre expertise et notre connaissance des marchés qui gravitent autour de votre activité.
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto p-6 md:p-12 lg:p-16 max-w-5xl">

        <div className="space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-4 text-foreground">Une expertise dédiée à la culture sous serres</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              La rentabilité de vos serres dépend de multiples facteurs. Notre <strong>Module Serres</strong> vous accompagne dans toutes vos prises de décisions qui impactent vos charges opérationnelles majeures, la raison d'être de votre entreprise.
            </p>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-4 text-foreground">Un suivi de la mise en place de la culture au résultat financier généré</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 text-lg">
              <li>Analyse financière de vos coûts de production par segment.</li>
              <li>Déclinaison de votre exposition aux marchés d'approvisionnement.</li>
              <li>Mise en place de stratégie de couverture en lien avec vos coûts, votre exploitation et votre volonté de revenus personnels.</li>
            </ul>
          </section>

          <section className="mt-12">
            {/* Achats - Takes full width now since Ventes is removed */}
            <div className="bg-card text-card-foreground p-6 md:p-8 rounded-3xl shadow-lg border border-border/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-2xl text-red-600 dark:text-red-400">
                  <ShoppingCart className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-semibold">Gérer vos Achats</h3>
              </div>
              <p className="text-muted-foreground mb-6 text-lg">
                Suivons et anticipons les coûts de vos approvisionnements essentiels pour maîtriser vos marges tout au long de la saison.
              </p>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-1 bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl">
                    <Fuel className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <strong className="block text-foreground text-lg mb-1">Gaz et Énergie</strong>
                    <span className="text-muted-foreground text-lg">Suivons la volatilité des prix de l'énergie et lissons vos dépenses liées au chauffage de vos serres.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                    <Droplets className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <strong className="block text-foreground text-lg mb-1">Engrais de spécialité</strong>
                    <span className="text-muted-foreground text-lg">Optimisons vos commandes d'intrants au meilleur prix pour maximiser le rendement de vos cultures.</span>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-xl font-medium text-foreground mb-1">Prêt à développer votre exploitation ?</h4>
            <p className="text-muted-foreground">Ouvrez votre espace et constituez un dossier.</p>
          </div>
          <Button asChild size="lg" className="rounded-xl px-8 w-full sm:w-auto">
            <Link href="/signup">
              Débuter avec ce module
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
