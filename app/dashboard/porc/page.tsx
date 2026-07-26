import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Module Porc - Smart Fields",
  description: "Découvrez notre accompagnement pour l'élevage porcin.",
}

export default function PorcModulePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header Héro avec image de fond */}
      <div className="relative h-[40vh] w-full">
        {/* Lien retour en haut à gauche */}
        <div className="absolute top-4 left-4 z-10 md:top-6 md:left-6">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-sm font-medium text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Retour au tableau de bord
          </Link>
        </div>

        <Image 
          src="/porc.jpg"
          alt="Élevage Porcin"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Module Porc
          </h1>
          <p className="max-w-[700px] text-lg text-white/90">
            Spécialisation et développement de vos infrastructures porcines.
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto p-6 md:p-12 lg:p-16 max-w-4xl">
        <div className="space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-4 text-foreground">Élevage et bien-être animal</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Construire de nouvelles porcheries répondant aux ultimes normes de bien-être animal demande des investissements vitaux. Le <strong>Module Porc</strong> finance vos bâtiments, la modernisation de vos maternités, les systèmes d'alimentation, ou encore vos traitements de lisier et méthaniseurs.
            </p>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-4 text-foreground">Pourquoi recourir au Module Porc ?</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 text-lg">
              <li>Appui aux normes de biosécurité renforcées.</li>
              <li>Agrandissement et mise au point de silos tours d'aliment automatiques.</li>
              <li>Soutien à l'installation de jeunes éleveurs et reprise de cheptel.</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-xl font-medium text-foreground mb-1">Besoin d'aide sur ce module ?</h4>
            <p className="text-muted-foreground">Contactez votre conseiller dédié.</p>
          </div>
          <Button asChild size="lg" className="rounded-xl px-8 w-full sm:w-auto">
            <Link href="/dashboard">
              Retour au Dashboard
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
