// Run with: npm run ingest:agro-literature
//
// Scans agro-literature-docs/ for PDFs and ingests any not already in agro_literature_docs
// (dedup by file name) into the agronomic agent's bibliographic knowledge base: upload to the
// private "agro-literature" Storage bucket, extract text (Gemini, same inlineData technique
// used elsewhere in this app), split into chunks, embed each chunk, store in
// agro_literature_chunks. This replaces the earlier dashboard upload panel - the literature
// corpus is a local folder the operator fills directly, not a web upload flow.

import { readFileSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const docsDir = path.join(projectRoot, "agro-literature-docs");

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

function loadEnvLocal() {
  const envPath = path.join(projectRoot, ".env.local");
  let raw;
  try {
    raw = readFileSync(envPath, "utf-8");
  } catch {
    return;
  }
  raw.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  });
}

function chunkText(text) {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > CHUNK_SIZE && current.length > 0) {
      chunks.push(current);
      current = current.slice(Math.max(0, current.length - CHUNK_OVERLAP)) + "\n\n" + para;
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

async function main() {
  loadEnvLocal();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const googleApiKey = process.env.GOOGLE_AI_API_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }
  if (!googleApiKey) {
    console.error("Missing GOOGLE_AI_API_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const genAI = new GoogleGenerativeAI(googleApiKey);
  const extractionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

  let files;
  try {
    files = readdirSync(docsDir).filter(f => f.toLowerCase().endsWith(".pdf"));
  } catch {
    console.error(`Dossier introuvable : ${docsDir}`);
    process.exit(1);
  }
  if (files.length === 0) {
    console.log("Aucun PDF trouvé dans agro-literature-docs/.");
    return;
  }

  const { data: existingDocs, error: existingError } = await supabase
    .from("agro_literature_docs")
    .select("file_name")
    .in("file_name", files);
  if (existingError) {
    console.error("Erreur lors de la vérification des documents existants:", existingError.message);
    process.exit(1);
  }
  const alreadyIngested = new Set((existingDocs || []).map(d => d.file_name));

  const toIngest = files.filter(f => !alreadyIngested.has(f));
  if (toIngest.length === 0) {
    console.log(`Les ${files.length} PDF présents sont déjà ingérés. Rien à faire.`);
    return;
  }

  console.log(`${toIngest.length} nouveau(x) document(s) à ingérer sur ${files.length} trouvé(s).`);

  for (const fileName of toIngest) {
    console.log(`\n→ ${fileName}`);
    const filePath = path.join(docsDir, fileName);
    const buffer = readFileSync(filePath);
    const storagePath = `${Date.now()}-${fileName}`;
    let docId = null;

    try {
      const { error: uploadError } = await supabase.storage
        .from("agro-literature")
        .upload(storagePath, buffer, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      const { data: docRow, error: insertError } = await supabase
        .from("agro_literature_docs")
        .insert({ file_name: fileName, storage_path: storagePath, status: "pending" })
        .select("id")
        .single();
      if (insertError) throw insertError;
      docId = docRow.id;

      console.log("  extraction du texte...");
      const extraction = await extractionModel.generateContent([
        "Extrais l'intégralité du texte de ce document scientifique/technique, tel quel, sans résumer ni commenter. Conserve les titres et paragraphes.",
        { inlineData: { mimeType: "application/pdf", data: buffer.toString("base64") } }
      ]);
      const text = (await extraction.response).text();
      if (!text || text.trim().length === 0) throw new Error("Aucun texte extrait du document.");

      const chunks = chunkText(text);
      console.log(`  ${chunks.length} chunk(s), embedding...`);
      const chunkRows = [];
      for (let i = 0; i < chunks.length; i++) {
        const embedResult = await embeddingModel.embedContent({
          content: { role: "user", parts: [{ text: chunks[i] }] },
          outputDimensionality: 768
        });
        chunkRows.push({ doc_id: docId, chunk_index: i, content: chunks[i], embedding: embedResult.embedding.values });
      }

      if (chunkRows.length > 0) {
        const { error: chunksError } = await supabase.from("agro_literature_chunks").insert(chunkRows);
        if (chunksError) throw chunksError;
      }

      await supabase
        .from("agro_literature_docs")
        .update({ status: "processed", processed_at: new Date().toISOString() })
        .eq("id", docId);

      console.log(`  OK - ${chunkRows.length} chunk(s) ingéré(s).`);
    } catch (error) {
      console.error(`  ERREUR : ${error.message}`);
      if (docId !== null) {
        await supabase
          .from("agro_literature_docs")
          .update({ status: "error", error_message: error.message })
          .eq("id", docId);
      }
    }
  }
}

main();
