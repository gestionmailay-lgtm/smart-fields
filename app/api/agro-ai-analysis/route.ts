import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/utils/supabase/admin";
import { formatAgroFactorLabel } from "@/lib/agroFactorLabels";

// Black-box agronomic explanation: takes one day's climate/growth summary (already computed
// client-side from the Aranet/Priva data - averages, cumulative gain, radiation sum, light-use
// efficiency vs. the best day in the displayed range, detected weight drops, rule-based findings)
// and asks the model to explain the growth outcome and give concrete crop-steering advice,
// reasoning like a horticultural scientist grounded in established greenhouse tomato physiology
// (light/temperature balance, VPD, DLI, source-sink relationships) rather than generic filler.
//
// This is also the persistent agent's grounding point: before asking the model, we pull in (1)
// the statistical correlations this greenhouse's own history has actually shown between climate
// factors and biomass gain (/api/agro-correlations' output table), and (2) the most relevant
// excerpts from the uploaded agronomic literature corpus (RAG via match_agro_literature), so the
// explanation is anchored in measured evidence and cited sources rather than only the model's
// general training knowledge.
const TOP_CORRELATIONS_LIMIT = 6;
const TOP_LITERATURE_CHUNKS = 6;

async function fetchTopCorrelations(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase
    .from("agro_correlations")
    .select("factor_key, coefficient, sample_size")
    .order("coefficient", { ascending: false });
  if (!data || data.length === 0) return [];
  return data
    .slice()
    .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
    .slice(0, TOP_CORRELATIONS_LIMIT);
}

async function fetchRelevantLiterature(
  supabase: ReturnType<typeof createAdminClient>,
  genAI: GoogleGenerativeAI,
  queryText: string
) {
  try {
    // Same model/dimension as app/api/agro-literature/upload/route.ts - must match for the
    // vector(768) comparison in match_agro_literature to be meaningful.
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embedResult = await embeddingModel.embedContent({
      content: { role: "user", parts: [{ text: queryText }] },
      outputDimensionality: 768
    } as any);
    const { data, error } = await supabase.rpc("match_agro_literature", {
      query_embedding: embedResult.embedding.values,
      match_count: TOP_LITERATURE_CHUNKS
    });
    if (error) {
      console.error("match_agro_literature RPC error:", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("Literature retrieval failed:", e);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Clé API manquante." }, { status: 400 });
    }

    const {
      dateStr,
      climate,
      actualGain,
      radiationSumJcm2,
      growthEfficiency,
      bestEfficiencyInRange,
      lostGainVsBestDay,
      lostPercentVsBestDay,
      drops,
      ruleBasedFindings,
      limitingFactorsBySlot
    } = body || {};

    if (!dateStr) {
      return NextResponse.json({ error: "Données de journée manquantes." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const supabase = createAdminClient();

    const [correlations, literatureChunks] = await Promise.all([
      fetchTopCorrelations(supabase),
      fetchRelevantLiterature(
        supabase,
        genAI,
        `Facteurs climatiques et de substrat limitant le gain de croissance de la tomate en serre chauffée ce jour-là : ${JSON.stringify(climate)}. Écarts détectés : ${JSON.stringify(ruleBasedFindings)}.`
      )
    ]);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    });

    const correlationsBlock = correlations.length > 0
      ? correlations.map((c: any) => {
          const label = formatAgroFactorLabel(c.factor_key);
          return `- ${label} : r=${Number(c.coefficient).toFixed(2)} (n=${c.sample_size} jours)`;
        }).join("\n")
      : "Aucune corrélation encore disponible (historique insuffisant - moins de 10 jours de résumés enregistrés pour cette serre à ce stade).";

    const literatureBlock = literatureChunks.length > 0
      ? literatureChunks.map((c: any, i: number) =>
          `[Source ${i + 1} - ${c.file_name}${c.page_ref ? `, p.${c.page_ref}` : ""}] ${c.content.slice(0, 800)}`
        ).join("\n\n")
      : "Aucun document bibliographique n'a encore été ingéré dans la base documentaire de cette serre.";

    const prompt = `Tu es un expert en physiologie végétale, conduite climatique et pilotage de l'irrigation/fertigation en serre (tomate sous serre chauffée/éclairée), raisonnant à partir des principes établis de la littérature scientifique horticole (bilan lumière/température, VPD, DLI, relations source-puits, respiration nocturne, pression racinaire, dry-back et gestion EC/VWC du substrat). Tu n'inventes jamais de référence ou de chiffre précis d'étude que tu ne peux pas garantir exact.

Tu disposes de trois niveaux de connaissance, à ne JAMAIS mélanger sans le distinguer explicitement dans ta réponse :
1. Des CORRÉLATIONS MESURÉES sur l'historique réel de CETTE serre (calculées statistiquement, pas une opinion du modèle) - à privilégier chaque fois qu'elles couvrent le facteur en question.
2. Des EXTRAITS DE LITTÉRATURE fournis par l'exploitant (sources citées) - à privilégier pour expliquer le MÉCANISME physiologique derrière une observation.
3. Tes PRINCIPES GÉNÉRAUX reconnus du métier, seulement en dernier recours si les deux niveaux ci-dessus ne couvrent pas le point.

CORRÉLATIONS MESURÉES SUR L'HISTORIQUE DE CETTE SERRE (coefficient de Pearson entre chaque facteur et le gain de biomasse du jour ; "jour précédent" = effet différé) :
${correlationsBlock}

EXTRAITS DE LITTÉRATURE SCIENTIFIQUE PERTINENTS POUR CETTE JOURNÉE (base documentaire fournie par l'exploitant) :
${literatureBlock}

Voici les données mesurées et déjà calculées pour la journée du ${dateStr} dans cette serre :

- Gain cumulé de biomasse (corrigé des chutes de poids validées) : ${actualGain} g/m²
- Somme de rayonnement reçu ce jour : ${radiationSumJcm2 !== null ? radiationSumJcm2 + " J/cm²" : "non disponible"}
- Efficience lumière->croissance ce jour : ${growthEfficiency !== null ? (growthEfficiency * 100).toFixed(2) + " g / 100 J/cm²" : "non calculable"}
- Meilleure efficience observée sur la période affichée (référence) : ${bestEfficiencyInRange !== null ? (bestEfficiencyInRange * 100).toFixed(2) + " g / 100 J/cm²" : "non disponible"}
- Perte de gain estimée vs. cette meilleure journée : ${lostGainVsBestDay !== null ? lostGainVsBestDay + " g/m² (soit " + lostPercentVsBestDay + "% sous le potentiel prouvé de cette serre)" : "non calculable"}
- Moyennes climatiques et d'irrigation/substrat du jour (dont wcAvg = VWC substrat en %, ecAvg = EC du pore en mS/cm, co2Avg = CO2 en ppm sur 24h, rainAvg = pluie si disponibles). Ne te limite pas aux moyennes 24h : co2DayAvg/co2NightAvg/co2DayTrend, chassisExposeDayAvg/Max et windDayAvg/Max te donnent le comportement réel en journée (8h-18h, quand ventilation et injection CO2 opèrent vraiment) et sa tendance - une moyenne 24h peut masquer un pic ou une dérive qui explique la journée. IMPORTANT : si co2ExplainedByVentilation est true, un CO2 diurne bas est expliqué par l'ouverture des ouvrants (>15% en moyenne diurne) qui dilue le CO2 vers l'extérieur - dans ce cas, ne cite JAMAIS le CO2 comme facteur limitant du gain de biomasse, même s'il est mesuré bas : ${JSON.stringify(climate)}
- Chutes de poids détectées ce jour (bascule) : ${JSON.stringify(drops)}
- Écarts déjà détectés par le moteur de règles : ${JSON.stringify(ruleBasedFindings)}
- Facteur limitant par créneau horaire (Nuit/Matin/Midi/Après-midi/Soir), déjà comparé à la plage cible PROPRE À CE CRÉNEAU (pas une moyenne journalière unique - la cible de temp/VPD/EC etc. diffère légitimement entre la nuit et le milieu de journée) : ${JSON.stringify(limitingFactorsBySlot)}. "limitingFactor: null" signifie que ce créneau était dans sa plage cible (optimal), pas qu'aucune donnée n'est disponible.

TÂCHE : explique la perte de croissance de cette journée (ou confirme une journée optimale s'il n'y a pas de perte significative), identifie à quel(s) créneau(x) horaire(s) et pour quelle raison physiologique la perte a eu lieu en t'appuyant sur le facteur limitant par créneau ci-dessus (chaque créneau a sa propre cible, ne compare jamais la valeur d'un créneau à la cible d'un autre créneau), puis propose des conseils de conduite climatique concrets et actionnables, datés par créneau si pertinent (ex: "réduire la consigne de chauffage entre 10h et 14h"), pour la ou les prochaines journées similaires. Dans "explanation", indique explicitement quand une affirmation s'appuie sur une corrélation mesurée (cite le r et n), sur un extrait de littérature (cite la source), ou sur un principe général.

RÉPONDS UNIQUEMENT AVEC CE JSON :
{
  "explanation": "explication physiologique concise (3-5 phrases) de la perte ou de la performance du jour, en citant le ou les moments clés de la journée si pertinent",
  "keyLimitingFactor": "le facteur limitant principal en 3-6 mots (ex: Déséquilibre Lumière/Température, Chute de poids non compensée, VPD nocturne excessif, Aucun facteur limitant)",
  "actionPlan": ["conseil actionnable 1", "conseil actionnable 2", "conseil actionnable 3"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return NextResponse.json(JSON.parse(text.substring(start, end + 1)));
      }
      throw new Error("Réponse IA non parsable.");
    }
  } catch (error: any) {
    console.error("Agro AI Analysis Error:", error);
    return NextResponse.json({
      error: "Erreur d'analyse IA.",
      message: error.message
    }, { status: 500 });
  }
}
