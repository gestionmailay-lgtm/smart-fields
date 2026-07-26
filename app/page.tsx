import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ArrowRight, ChevronRight, LayoutDashboard } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* En-tête (Header) avec logo, texte au centre, et bouton */}
      <header className="w-full py-4 px-4 md:px-10 flex items-center justify-between bg-card shadow-sm border-b">

        {/* Logo à gauche et bouton Modules */}
        <div className="flex items-center gap-6">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Image
              src="/logo.png"
              alt="Smart Fields Logo"
              width={180}
              height={60}
              className="h-12 w-auto object-contain rounded-xl overflow-hidden"
              priority
            />
          </Link>
          <Button asChild variant="outline" className="rounded-xl px-4 md:px-6 font-medium">
            <Link href="/modules">
              Nos modules
            </Link>
          </Button>
        </div>

        {/* Titre au centre (disparait sur très petits écrans pour éviter les bugs) */}
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Financez l'avenir de votre exploitation
          </h1>
        </div>

        {/* Bouton de connexion à droite */}
        <div className="flex items-center">
          <Button asChild className="rounded-xl px-4 md:px-6 font-medium gap-2">
            <Link href="/login">
              Accéder à mon espace <LayoutDashboard className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Contenu principal de la page */}
      <main className="flex-1 flex flex-col items-center">
        {/* Bandeau de texte Hero */}
        <section className="w-full bg-card py-12 md:py-20 px-6 border-b text-center space-y-6">
          <div className="mx-auto max-w-4xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary animate-in fade-in slide-in-from-bottom-3 duration-500">
              Bienvenue sur Raw Win
            </h2>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
              Financez l'avenir de votre exploitation
            </h3>
            <p className="text-muted-foreground md:text-xl leading-relaxed max-w-2xl mx-auto">
              La plateforme complète d'accompagnement financier agricole.
              Découvrez nos modules d'expertise adaptés à votre filière équipés de solutions d'investissement dédiées.
            </p>
          </div>
        </section>

        {/* Image Infographie Pleine Largeur */}
        <section className="w-full relative aspect-[21/9] md:aspect-[3/1] max-h-[600px] overflow-hidden shadow-inner">
          <Image
            src="/landing-infographic.png"
            alt="Dashboard Infographie Smart Fields"
            fill
            className="object-cover md:object-contain bg-muted/30"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Section Action après l'image */}
        <section className="py-16 md:py-24 text-center">
          <Button asChild size="lg" className="rounded-xl px-10 py-8 text-xl shadow-lg hover:shadow-primary/20 transition-all gap-3 group">
            <Link href="/modules">
              Explorer les modules <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
