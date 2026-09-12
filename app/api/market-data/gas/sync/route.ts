import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Helper pour convertir un mois (Jan, Feb, Mar...) en trimestre
function getQuarterFromMonth(monthStr: string) {
    const q1 = ['Jan', 'Feb', 'Mar'];
    const q2 = ['Apr', 'May', 'Jun'];
    const q3 = ['Jul', 'Aug', 'Sep'];
    const q4 = ['Oct', 'Nov', 'Dec'];
    
    if (q1.includes(monthStr)) return "Q1";
    if (q2.includes(monthStr)) return "Q2";
    if (q3.includes(monthStr)) return "Q3";
    if (q4.includes(monthStr)) return "Q4";
    return null;
}

export async function GET(req: NextRequest) {
    // Vercel Cron sends this header automatically; also allow a manual Bearer token for testing.
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) throw new Error("Clé API manquante");

        // 1. Contournement Barchart pour récupérer le Token CSRF
        const r1 = await fetch('https://www.barchart.com/futures/quotes/XG*1/futures-prices', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const cookies = r1.headers.get('set-cookie');
        const tokenMatch = cookies ? cookies.match(/XSRF-TOKEN=([^;]+)/) : null;
        const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : '';

        // 2. Appel direct de l'API Barchart pour tous les contrats XG
        const r2 = await fetch('https://www.barchart.com/proxies/core-api/v1/quotes/get?list=futures.contractInRoot&root=XG&fields=symbol,contractSymbol,lastPrice&limit=100', {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': token,
                'Cookie': cookies || '',
                'Referer': 'https://www.barchart.com/futures/quotes/XG*1/futures-prices'
            }
        });

        const barchartResponse = await r2.json();
        if (!barchartResponse.data || barchartResponse.data.length === 0) {
            throw new Error("L'API Barchart n'a retourné aucune donnée.");
        }

        // 3. Traitement Mathématique (Calculs exacts par trimestre)
        const quarterlyData: Record<string, number[]> = {};
        
        barchartResponse.data.forEach((contract: any) => {
            // contractSymbol ex: "XGM26 (Jun '26)"
            const match = contract.contractSymbol.match(/\(([A-Za-z]{3}) '(\d{2})\)/);
            if (match && contract.lastPrice && contract.lastPrice !== "N/A") {
                const month = match[1];
                const year = "20" + match[2];
                const quarter = getQuarterFromMonth(month);
                
                if (quarter) {
                    const key = `${year} ${quarter}`;
                    const price = parseFloat(contract.lastPrice.replace(/[^0-9.]/g, ''));
                    if (!isNaN(price)) {
                        if (!quarterlyData[key]) quarterlyData[key] = [];
                        quarterlyData[key].push(price);
                    }
                }
            }
        });

        // Moyenne par trimestre
        const finalPrices: Record<string, number> = {};
        Object.keys(quarterlyData).forEach(key => {
            const prices = quarterlyData[key];
            const sum = prices.reduce((a, b) => a + b, 0);
            finalPrices[key] = parseFloat((sum / prices.length).toFixed(2));
        });

        // 4. Génération des Alertes Intelligentes via Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { temperature: 0.1 } });

        const prompt = `Tu es un conseiller financier spécialisé dans l'énergie.
Voici les prix EXACTS et vérifiés du gaz (PEG) par trimestre (en €/MWh) :
${JSON.stringify(finalPrices, null, 2)}

Ta SEULE mission est de générer 2 alertes stratégiques courtes (1 "URGENT" en rouge pour un risque de hausse ou prix élevé et 1 "OPPORTUNITÉ" en bleu pour une baisse ou prix bas).
Justifie chaque alerte avec les prix que je t'ai donnés ci-dessus.

Génère une réponse STRICTEMENT en JSON pur sans backticks ni markdown, avec la structure suivante :
[
  {
    "type": "URGENT",
    "period": "2026 Q4",
    "title": "Alerte Hausse",
    "description": "Le Q4 2026 monte à X €/MWh...",
    "color": "red"
  },
  {
    "type": "OPPORTUNITÉ",
    "period": "2027 Q2",
    "title": "Baisse Printanière",
    "description": "Le marché retombe à Y €/MWh...",
    "color": "blue"
  }
]`;

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedAlerts = JSON.parse(text);

        const parsedData = {
            prices: finalPrices,
            alerts: parsedAlerts,
            last_update: "A l'instant (Source Barchart Officielle)"
        };

        // 5. Sauvegarde Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from('global_market_data')
            .upsert({ 
                id: 'gas_peg', 
                data: parsedData,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;

        return NextResponse.json({ success: true, message: "Marché synchronisé avec succès", data: parsedData });

    } catch (error: any) {
        console.error("Gemini Market Data Sync Error:", error);
        return NextResponse.json({ error: "Erreur de synchronisation", details: error.message }, { status: 500 });
    }
}
