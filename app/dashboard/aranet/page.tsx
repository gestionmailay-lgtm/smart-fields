"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatAgroFactorLabel } from "@/lib/agroFactorLabels";
import { AGRO_TIME_SLOTS } from "@/lib/agroRoleMapping";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  RefreshCw, 
  Activity, 
  LineChart as ChartIcon, 
  Sliders, 
  CheckSquare, 
  Square,
  Sparkles,
  Menu,
  TrendingUp,
  AlertTriangle,
  Info,
  Gauge,
  Lightbulb,
  Droplets,
  Tag,
  Leaf
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Brush,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from "recharts";

// Definition of all 20 plottable metrics with their available units
// "Paramètres Techniques de la Serre" card (Sélection des données) - typologies depend on the
// selected culture. Only Tomate has a known list so far; Concombre's dropdown stays empty until
// one is provided.
const CULTURE_OPTIONS = ["Tomate", "Concombre"];
const CULTURE_TYPOLOGIES: { [culture: string]: string[] } = {
  Tomate: [
    "Tomate cerise ronde",
    "Tomate cerise allongée",
    "Tomate ancienne",
    "Tomate allongée",
    "Tomate ronde en grappe/vrac",
    "Tomate beef"
  ],
  Concombre: []
};

const PLOTTABLE_METRICS = [
  { key: "temp_rh_top_1", name: "T/RH top - Temp", category: "Climat", metricId: "1", color: "#e11d48", sensorId: "1071787", units: [{ id: "1", name: "°C" }, { id: "101", name: "°F" }, { id: "102", name: "K" }, { id: "119", name: "Cel" }] },
  { key: "temp_rh_top_2", name: "T/RH top - Humidity", category: "Climat", metricId: "2", color: "#06b6d4", sensorId: "1071787", units: [{ id: "2", name: "%" }, { id: "120", name: "%RH" }] },
  { key: "temp_rh_bottom_1", name: "T/RH bottom - Temp", category: "Climat", metricId: "1", color: "#f43f5e", sensorId: "1074088", units: [{ id: "1", name: "°C" }, { id: "101", name: "°F" }, { id: "102", name: "K" }, { id: "119", name: "Cel" }] },
  { key: "temp_rh_bottom_2", name: "T/RH bottom - Humidity", category: "Climat", metricId: "2", color: "#22d3ee", sensorId: "1074088", units: [{ id: "2", name: "%" }, { id: "120", name: "%RH" }] },
  { key: "vpd_top_28", name: "VPD Top", category: "Climat", metricId: "28", color: "#8b5cf6", sensorId: "135267713", units: [{ id: "134", name: "kPa" }, { id: "21", name: "Pa" }, { id: "135", name: "hPa" }, { id: "136", name: "bar" }, { id: "137", name: "psi" }] },
  { key: "vpd_bottom_28", name: "VPD Bottom", category: "Climat", metricId: "28", color: "#a78bfa", sensorId: "135267714", units: [{ id: "134", name: "kPa" }, { id: "21", name: "Pa" }, { id: "135", name: "hPa" }, { id: "136", name: "bar" }, { id: "137", name: "psi" }] },
  { key: "vpd_avg_28", name: "VPD 1 - Average", category: "Climat", metricId: "28", color: "#c084fc", sensorId: "134220332", units: [{ id: "134", name: "kPa" }, { id: "21", name: "Pa" }, { id: "135", name: "hPa" }, { id: "136", name: "bar" }, { id: "137", name: "psi" }] },
  { key: "par_12", name: "PAR", category: "Lumière", metricId: "12", color: "#eab308", sensorId: "6303173", units: [{ id: "9", name: "µmol/m²/s" }, { id: "124", name: "mol/m2/s" }] },
  { key: "dli_29", name: "DLI", category: "Lumière", metricId: "29", color: "#ca8a04", sensorId: "136315172", units: [{ id: "140", name: "mol/m²/d" }, { id: "142", name: "mol/m2/d" }, { id: "22", name: "µmol/m²/d" }] },
  { key: "slab_ec_wc_8", name: "Slab EC/WC (VWC)", category: "Sol & Irrigation", metricId: "8", color: "#10b981", sensorId: "6303701", units: [{ id: "115", name: "%" }, { id: "123", name: "/" }] },
  { key: "slab_ec_wc_11", name: "Slab EC/WC (Pore EC)", category: "Sol & Irrigation", metricId: "11", color: "#ca8a04", sensorId: "6303701", units: [{ id: "108", name: "mS/cm" }, { id: "8", name: "S/m" }] },
  { key: "slab_ec_wc_10", name: "Slab EC/WC (Bulk EC)", category: "Sol & Irrigation", metricId: "10", color: "#854d0e", sensorId: "6303701", units: [{ id: "108", name: "mS/cm" }, { id: "8", name: "S/m" }] },
  { key: "slab_ec_wc_1", name: "Slab EC/WC (Temp)", category: "Sol & Irrigation", metricId: "1", color: "#2563eb", sensorId: "6303701", units: [{ id: "1", name: "°C" }, { id: "101", name: "°F" }, { id: "102", name: "K" }] },
  { key: "slab_weight_7", name: "Slab weight", category: "Sol & Irrigation", metricId: "7", color: "#16a34a", sensorId: "134219975", units: [{ id: "7", name: "kg" }, { id: "107", name: "lb" }] },
  { key: "plant_weight_7", name: "Plant weight", category: "Sol & Irrigation", metricId: "7", color: "#84cc16", sensorId: "134219976", units: [{ id: "7", name: "kg" }, { id: "107", name: "lb" }] },
  { key: "plant_weight_gain", name: "Cumulative Gain", category: "Physiologie", metricId: "7", color: "#22c55e", sensorId: "134219976", units: [{ id: "7", name: "kg/m²" }, { id: "107", name: "lb/m²" }] },
  { key: "stem_top_114", name: "STEM top", category: "Physiologie", metricId: "114", color: "#db2777", sensorId: "5247476", units: [{ id: "314", name: "µm" }] },
  { key: "stem_bottom_114", name: "STEM - Bottom", category: "Physiologie", metricId: "114", color: "#ec4899", sensorId: "5249180", units: [{ id: "314", name: "µm" }] },
  { key: "sap_top_114", name: "SAP Flow - top", category: "Physiologie", metricId: "114", color: "#0d9488", sensorId: "5250254", units: [{ id: "314", name: "µm" }] },
  { key: "sap_bottom_114", name: "SAP Flow - bottom", category: "Physiologie", metricId: "114", color: "#14b8a6", sensorId: "5250268", units: [{ id: "314", name: "µm" }] },
  { key: "sap_ratio_24", name: "Sap Flow ration Top/bottom", category: "Physiologie", metricId: "24", color: "#4f46e5", sensorId: "135267405", units: [{ id: "18", name: "Ratio" }, { id: "123", name: "/" }] },
  
  // Priva - Météo
  { key: "priva_temp_out", name: "Priva - Météo Temp Extérieure", category: "Priva - Météo", isPriva: true, variableId: "00000214-0001-0000-0000-0000000042a9", deviceId: "VP9508", deviceGroupId: "none", color: "#f59e0b", units: [{ id: "celsius", name: "°C" }] },
  { key: "priva_hum_out", name: "Priva - Météo Hum Extérieure", category: "Priva - Météo", isPriva: true, variableId: "00000214-0001-0000-0000-00000000427e", deviceId: "VP9508", deviceGroupId: "none", color: "#3b82f6", units: [{ id: "procent", name: "%" }] },
  { key: "priva_irr_out", name: "Priva - Météo Rayonnement Solaire", category: "Priva - Météo", isPriva: true, variableId: "00000214-0001-0000-0000-0000000042fd", deviceId: "VP9508", deviceGroupId: "none", color: "#eab308", units: [{ id: "watt_m2", name: "W/m²" }] },
  { key: "priva_wind_out", name: "Priva - Météo Vitesse Vent", category: "Priva - Météo", isPriva: true, variableId: "00000214-0001-0000-0000-0000000042ad", deviceId: "VP9508", deviceGroupId: "none", color: "#0d9488", units: [{ id: "mtr_sec", name: "m/s" }] },

  // Priva - Compartiment 1
  { key: "priva_c1_temp", name: "Priva - C1 Temp Chauffage", category: "Priva - Compartiment 1", isPriva: true, variableId: "0000002c-0001-0001-0000-0000000006f6", deviceId: "VP9508", deviceGroupId: "none", color: "#ef4444", units: [{ id: "celsius", name: "°C" }] },
  { key: "priva_c1_temp_target", name: "Priva - C1 Consigne Chauffage", category: "Priva - Compartiment 1", isPriva: true, variableId: "0000002c-0001-0001-0000-0000000006e5", deviceId: "VP9508", deviceGroupId: "none", color: "#f87171", units: [{ id: "celsius", name: "°C" }] },
  { key: "priva_c1_hum", name: "Priva - C1 Humidité Mesurée", category: "Priva - Compartiment 1", isPriva: true, variableId: "000002bb-0001-0000-0000-0000000050f2", deviceId: "VP9508", deviceGroupId: "none", color: "#06b6d4", units: [{ id: "procent", name: "%" }] },

  // Priva - Compartiment 2
  { key: "priva_c2_temp", name: "Priva - C2 Temp Chauffage", category: "Priva - Compartiment 2", isPriva: true, variableId: "0000002c-0001-0002-0000-0000000006f6", deviceId: "VP9508", deviceGroupId: "none", color: "#f97316", units: [{ id: "celsius", name: "°C" }] },
  { key: "priva_c2_temp_target", name: "Priva - C2 Consigne Chauffage", category: "Priva - Compartiment 2", isPriva: true, variableId: "0000002c-0001-0002-0000-0000000006e5", deviceId: "VP9508", deviceGroupId: "none", color: "#fb923c", units: [{ id: "celsius", name: "°C" }] },
  { key: "priva_c2_hum", name: "Priva - C2 Humidité Mesurée", category: "Priva - Compartiment 2", isPriva: true, variableId: "000002bb-0002-0000-0000-0000000050f2", deviceId: "VP9508", deviceGroupId: "none", color: "#0891b2", units: [{ id: "procent", name: "%" }] },

  // Priva - Compartiment 3
  { key: "priva_c3_temp", name: "Priva - C3 Temp Chauffage", category: "Priva - Compartiment 3", isPriva: true, variableId: "0000002c-0001-0003-0000-0000000006f6", deviceId: "VP9508", deviceGroupId: "none", color: "#ec4899", units: [{ id: "celsius", name: "°C" }] },
  { key: "priva_c3_temp_target", name: "Priva - C3 Consigne Chauffage", category: "Priva - Compartiment 3", isPriva: true, variableId: "0000002c-0001-0003-0000-0000000006e5", deviceId: "VP9508", deviceGroupId: "none", color: "#f472b6", units: [{ id: "celsius", name: "°C" }] },
  { key: "priva_c3_hum", name: "Priva - C3 Humidité Mesurée", category: "Priva - Compartiment 3", isPriva: true, variableId: "000002bb-0003-0000-0000-0000000050f2", deviceId: "VP9508", deviceGroupId: "none", color: "#6366f1", units: [{ id: "procent", name: "%" }] },

  // Priva - Compartiment 4
  { key: "priva_c4_temp", name: "Priva - C4 Temp Chauffage", category: "Priva - Compartiment 4", isPriva: true, variableId: "0000002c-0001-0004-0000-0000000006f6", deviceId: "VP9508", deviceGroupId: "none", color: "#8b5cf6", units: [{ id: "celsius", name: "°C" }] },
  { key: "priva_c4_temp_target", name: "Priva - C4 Consigne Chauffage", category: "Priva - Compartiment 4", isPriva: true, variableId: "0000002c-0001-0004-0000-0000000006e5", deviceId: "VP9508", deviceGroupId: "none", color: "#a78bfa", units: [{ id: "celsius", name: "°C" }] },
  { key: "priva_c4_hum", name: "Priva - C4 Humidité Mesurée", category: "Priva - Compartiment 4", isPriva: true, variableId: "000002bb-0004-0000-0000-0000000050f2", deviceId: "VP9508", deviceGroupId: "none", color: "#4f46e5", units: [{ id: "procent", name: "%" }] },

  // Priva - Compartiment 5
  { key: "priva_c5_temp", name: "Priva - C5 Temp Chauffage", category: "Priva - Compartiment 5", isPriva: true, variableId: "0000002c-0001-0005-0000-0000000006f6", deviceId: "VP9508", deviceGroupId: "none", color: "#10b981", units: [{ id: "celsius", name: "°C" }] },
  { key: "priva_c5_temp_target", name: "Priva - C5 Consigne Chauffage", category: "Priva - Compartiment 5", isPriva: true, variableId: "0000002c-0001-0005-0000-0000000006e5", deviceId: "VP9508", deviceGroupId: "none", color: "#34d399", units: [{ id: "celsius", name: "°C" }] },
  { key: "priva_c5_hum", name: "Priva - C5 Humidité Mesurée", category: "Priva - Compartiment 5", isPriva: true, variableId: "000002bb-0005-0000-0000-0000000050f2", deviceId: "VP9508", deviceGroupId: "none", color: "#06b6d4", units: [{ id: "procent", name: "%" }] },

  // Priva - Compartiment 6
  { key: "priva_c6_temp", name: "Priva - C6 Temp Chauffage", category: "Priva - Compartiment 6", isPriva: true, variableId: "0000002c-0001-0006-0000-0000000006f6", deviceId: "VP9508", deviceGroupId: "none", color: "#6b7280", units: [{ id: "celsius", name: "°C" }] },
  { key: "priva_c6_temp_target", name: "Priva - C6 Consigne Chauffage", category: "Priva - Compartiment 6", isPriva: true, variableId: "0000002c-0001-0006-0000-0000000006e5", deviceId: "VP9508", deviceGroupId: "none", color: "#9ca3af", units: [{ id: "celsius", name: "°C" }] },
  { key: "priva_c6_hum", name: "Priva - C6 Humidité Mesurée", category: "Priva - Compartiment 6", isPriva: true, variableId: "000002bb-0006-0000-0000-0000000050f2", deviceId: "VP9508", deviceGroupId: "none", color: "#4b5563", units: [{ id: "procent", name: "%" }] }
];

// Abbreviation mapping for the bottom indicator badges
const METRIC_BADGES: { [key: string]: string } = {
  temp_rh_top_1: "T1",
  temp_rh_top_2: "H1",
  temp_rh_bottom_1: "T2",
  temp_rh_bottom_2: "H2",
  vpd_top_28: "VPD1",
  vpd_bottom_28: "VPD2",
  vpd_avg_28: "VPDm",
  par_12: "PAR",
  dli_29: "DLI",
  slab_ec_wc_8: "Sub%",
  slab_ec_wc_11: "ECp",
  slab_ec_wc_10: "ECg",
  slab_ec_wc_1: "Ts",
  slab_weight_7: "Wt",
  plant_weight_7: "Gr",
  plant_weight_gain: "GainC",
  stem_top_114: "Dt1",
  stem_bottom_114: "Dt2",
  sap_top_114: "St1",
  sap_bottom_114: "St2",
  sap_ratio_24: "Ratio",
  
  priva_temp_out: "P.Tout",
  priva_hum_out: "P.Hout",
  priva_irr_out: "P.Irr",
  priva_wind_out: "P.Vent",
  priva_c1_temp: "C1.T",
  priva_c1_temp_target: "C1.Tc",
  priva_c1_hum: "C1.H",
  priva_c2_temp: "C2.T",
  priva_c2_temp_target: "C2.Tc",
  priva_c2_hum: "C2.H",
  priva_c3_temp: "C3.T",
  priva_c3_temp_target: "C3.Tc",
  priva_c3_hum: "C3.H",
  priva_c4_temp: "C4.T",
  priva_c4_temp_target: "C4.Tc",
  priva_c4_hum: "C4.H",
  priva_c5_temp: "C5.T",
  priva_c5_temp_target: "C5.Tc",
  priva_c5_hum: "C5.H",
  priva_c6_temp: "C6.T",
  priva_c6_temp_target: "C6.Tc",
  priva_c6_hum: "C6.H"
};

// Default sensor set for the "Ferti Irrigation" tab on first load - kept independent from the
// main Climat/Croissance sensor selection so it never crowds/conflicts with that chart. Any
// other Aranet or Priva sensor can be added on top of this from the tab's own picker.
const FERTI_METRIC_KEYS = ["slab_ec_wc_8", "slab_ec_wc_11", "slab_ec_wc_10", "slab_ec_wc_1", "slab_weight_7"];

function safeSetSessionStorage(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014) {
      console.warn("Storage quota exceeded, clearing cached queries...");
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k && (k.startsWith("aranet_query_cache_") || k.startsWith("priva_query_cache_"))) {
            sessionStorage.removeItem(k);
          }
        }
        sessionStorage.setItem(key, value);
      } catch (retryErr) {
        console.warn("Failed to set item in sessionStorage even after clearing caches:", retryErr);
      }
    } else {
      console.warn("Failed to write to sessionStorage:", e);
    }
  }
}

function getStableDateStr(d: Date) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function normalizeDateKey(key: string): string {
  if (!key || typeof key !== "string") return key;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(key)) {
    return key;
  }
  const ymd = key.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/);
  if (ymd) {
    return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;
  }
  const dmyDots = key.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dmyDots) {
    return `${dmyDots[1]}/${dmyDots[2]}/${dmyDots[3]}`;
  }
  const matchSlash = key.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchSlash) {
    const p1 = Number(matchSlash[1]);
    const p2 = Number(matchSlash[2]);
    const year = matchSlash[3];
    if (p2 > 12 && p1 <= 12) {
      return `${String(p2).padStart(2, '0')}/${String(p1).padStart(2, '0')}/${year}`;
    } else {
      return `${String(p1).padStart(2, '0')}/${String(p2).padStart(2, '0')}/${year}`;
    }
  }
  return key;
}

// A single drop is identified by the day it falls on plus its HH:MM, so several
// independent drops on the same day never collide or overwrite one another.
function getDropId(dateStr: string, timeStr: string): string {
  return `${dateStr}__${timeStr}`;
}

function parseDropId(dropId: string): { dateStr: string; timeStr: string } {
  const idx = dropId.indexOf("__");
  if (idx === -1) return { dateStr: dropId, timeStr: "" };
  return { dateStr: dropId.slice(0, idx), timeStr: dropId.slice(idx + 2) };
}

type WeightDropCandidate = {
  id: string;
  dateStr: string;
  timeStr: string;
  time: number;
  direction: "drop" | "rise"; // brutal decrease or brutal increase of raw scale weight
  suddenDropVal: number; // grams/m², positive magnitude regardless of direction
  suggestedCorrectionGrams: number; // positive magnitude; sign to apply depends on direction
  autoEventType: "harvest" | "thinning" | "descent" | "recalibration" | "watering"; // best-guess characterization, always computed, purely informative
};

// Best-effort, purely informative characterization of a detected weight movement. Never gates
// whether the correction is applied (every detected movement is auto-smoothed) - it only picks
// a sensible default label the user can see/override in the UI.
function guessMovementEventType(direction: "drop" | "rise", magnitudeGramsPerM2: number): "harvest" | "thinning" | "descent" | "recalibration" | "watering" {
  if (direction === "drop") {
    if (magnitudeGramsPerM2 > 300) return "harvest";
    if (magnitudeGramsPerM2 > 80) return "thinning";
    return "descent";
  }
  if (magnitudeGramsPerM2 > 150) return "recalibration";
  return "watering";
}

// Detects every unexplained brutal weight movement (drop OR rise) across the whole (continuous,
// cross-midnight-safe) series, rather than a single per-day maximum. Uses a sliding-window
// comparison instead of adjacent-point deltas (so movements spread over a few minutes aren't
// missed), and an adaptive threshold derived from the scale's own recent noise level (median
// absolute deviation) so a noisier scale doesn't trigger false positives while a very clean one
// still catches small, real movements instead of requiring a fixed 15g cut-off.
function detectWeightMovements(
  rows: any[],
  key: string,
  divisor: number,
  multiplier: number
): WeightDropCandidate[] {
  const rawKey = `${key}_raw`;
  const readings = rows
    .filter(r => r.rawScaleWeight !== undefined && r.rawScaleWeight !== null && !isNaN(Number(r.rawScaleWeight)))
    .map(r => ({ time: r.time, rawScaleWeight: Number(r.rawScaleWeight), correctedVal: Number(r[rawKey]) }))
    .sort((a, b) => a.time - b.time);

  if (readings.length < 6) return [];

  // Robust noise estimate (MAD) from consecutive-point deltas.
  const deltas = readings.slice(1).map((r, i) => Math.abs(r.rawScaleWeight - readings[i].rawScaleWeight));
  const sortedDeltas = [...deltas].sort((a, b) => a - b);
  const median = sortedDeltas.length > 0 ? sortedDeltas[Math.floor(sortedDeltas.length / 2)] : 0;
  const mad = deltas.length > 0
    ? [...deltas].map(d => Math.abs(d - median)).sort((a, b) => a - b)[Math.floor(deltas.length / 2)]
    : 0;
  const noiseSigma = 1.4826 * mad;
  const thresholdKg = Math.max(0.015, noiseSigma * 6); // floor of 15g, adapts upward if the scale is noisy

  const windowSize = 5; // minutes, since data is normalized to 1 point/minute
  const candidates: { idx: number; deltaKg: number; direction: "drop" | "rise" }[] = [];

  for (let i = windowSize; i < readings.length - windowSize; i++) {
    const before = readings.slice(i - windowSize, i);
    const after = readings.slice(i, i + windowSize);
    const avgBefore = before.reduce((s, r) => s + r.rawScaleWeight, 0) / before.length;
    const avgAfter = after.reduce((s, r) => s + r.rawScaleWeight, 0) / after.length;
    const signedDeltaKg = avgAfter - avgBefore; // negative = drop, positive = rise
    if (Math.abs(signedDeltaKg) > thresholdKg) {
      candidates.push({ idx: i, deltaKg: Math.abs(signedDeltaKg), direction: signedDeltaKg < 0 ? "drop" : "rise" });
    }
  }

  // Cluster adjacent candidates (same physical event) and keep the strongest point of each cluster.
  const clusters: { idx: number; deltaKg: number; direction: "drop" | "rise" }[][] = [];
  candidates.forEach(c => {
    const lastCluster = clusters[clusters.length - 1];
    if (lastCluster && c.idx - lastCluster[lastCluster.length - 1].idx <= windowSize * 2) {
      lastCluster.push(c);
    } else {
      clusters.push([c]);
    }
  });

  // Scans outward from a transition boundary (backward for "before", forward for "after") until
  // it finds a window of readings settled enough (std dev under the scale's own noise level) to
  // be trusted as the true steady-state weight - instead of blindly averaging a fixed handful of
  // points that may still be mid-transition (scale settling can take well over 15 minutes after
  // a big real event like a harvest, which previously made the correction undershoot the actual
  // jump and left a visible residual step in the corrected curve).
  const stabilizationWinSize = 8;
  const noiseThreshold = Math.max(0.01, noiseSigma * 2.5);
  const maxSearchSteps = 60; // minutes
  function findStableAvg(fromIdx: number, dir: 1 | -1): number {
    for (let step = 0; step <= maxSearchSteps; step++) {
      const idx = fromIdx + dir * step;
      const winStart = dir === 1 ? idx : idx - stabilizationWinSize + 1;
      const winEnd = dir === 1 ? idx + stabilizationWinSize : idx + 1;
      if (winStart < 0 || winEnd > readings.length) continue;
      const win = readings.slice(winStart, winEnd);
      const avg = win.reduce((s, r) => s + r.rawScaleWeight, 0) / win.length;
      const variance = win.reduce((s, r) => s + (r.rawScaleWeight - avg) ** 2, 0) / win.length;
      if (Math.sqrt(variance) <= noiseThreshold) return avg;
    }
    // Nothing settled within the search range (rare) - fall back to the nearest available window.
    const winStart = dir === 1 ? Math.max(0, fromIdx) : Math.max(0, fromIdx - stabilizationWinSize + 1);
    const winEnd = dir === 1 ? Math.min(readings.length, fromIdx + stabilizationWinSize) : Math.min(readings.length, fromIdx + 1);
    const win = readings.slice(winStart, winEnd);
    return win.length > 0
      ? win.reduce((s, r) => s + r.rawScaleWeight, 0) / win.length
      : readings[Math.min(Math.max(fromIdx, 0), readings.length - 1)].rawScaleWeight;
  }

  const movements: WeightDropCandidate[] = [];
  clusters.forEach(cluster => {
    const strongest = cluster.reduce((best, c) => (c.deltaKg > best.deltaKg ? c : best), cluster[0]);
    const eventTime = readings[strongest.idx].time;
    const prevScale = readings[strongest.idx - 1]?.rawScaleWeight ?? readings[strongest.idx].rawScaleWeight;

    // Skip if the weight recovers close to its prior level (temporary fluctuation, not a real,
    // lasting movement). A drop (harvest, thinning) is a permanent removal of biomass - the scale
    // never climbs back on its own, so 30 minutes is enough to rule out a transient blip. A rise
    // is different: routine irrigation/fertigation adds water weight to the slab in a sharp pulse,
    // then that water drains and evaporates via substrate dry-back over several HOURS, not minutes
    // - so a 30-minute window never sees it recover and every watering pulse was being misread as
    // a permanent step, each one dragging the rest of that day's corrected curve down. Give "rise"
    // a window wide enough to cover normal dry-back before deciding it's a genuine lasting movement
    // (e.g. a scale recalibration).
    const compensationWindowMs = (strongest.direction === "drop" ? 30 : 240) * 60 * 1000;
    const compensationDeadline = eventTime + compensationWindowMs;
    const postReadings = readings.filter(r => r.time > eventTime && r.time <= compensationDeadline);
    const isCompensated = strongest.direction === "drop"
      ? postReadings.some(r => r.rawScaleWeight >= prevScale - 0.005)
      : postReadings.some(r => r.rawScaleWeight <= prevScale + 0.005);
    if (isCompensated) return;

    const firstIdx = readings.findIndex(r => r.time === readings[cluster[0].idx].time);
    const lastIdx = readings.findIndex(r => r.time === readings[cluster[cluster.length - 1].idx].time);
    const avgBeforeStable = findStableAvg(firstIdx - 1, -1);
    const avgAfterStable = findStableAvg(lastIdx + 1, 1);
    const adaptiveDeltaKg = Math.abs(avgAfterStable - avgBeforeStable);
    // The adaptive, settled delta is the source of truth for both the displayed magnitude and the
    // correction actually applied, so they always match exactly and fully cancel the real jump.
    const movementGramsPerM2 = (adaptiveDeltaKg / divisor) * multiplier * 1000;

    const d = new Date(eventTime);
    const dateStr = getStableDateStr(d);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const suddenVal = Math.round(movementGramsPerM2);

    movements.push({
      id: getDropId(dateStr, timeStr),
      dateStr,
      timeStr,
      time: eventTime,
      direction: strongest.direction,
      suddenDropVal: suddenVal,
      suggestedCorrectionGrams: Math.max(0, suddenVal),
      autoEventType: guessMovementEventType(strongest.direction, suddenVal)
    });
  });

  return movements;
}

// Bins raw per-metric readings into one row per minute (unless overridden by timeStep), applies
// smoothing, and applies every validated weight-drop correction. Pulled out as a pure function so
// both the Climat/Croissance chart and the Analyseur Agronomique tab (which keeps its own,
// independent date range/rawDataMap) can share the exact same processing logic.
function buildChartRows(
  rawDataMap: { [key: string]: any[] },
  selectedKeys: string[],
  metricConfigs: any,
  plantsOnScale: number,
  densityPerM2: number,
  dailyEvents: { [id: string]: string },
  dailyAdjustedWeights: { [id: string]: number },
  manualDrops: { [id: string]: { suddenDropTime: string; suddenDropVal: number; suggestedCorrectionGrams: number; direction?: "drop" | "rise" } },
  timeStep: string,
  // Optional out-param: when passed, gets filled with the detected/merged movements so callers
  // that also need the list (e.g. dynamicAgronomicData) don't have to re-run detectWeightMovements
  // a second time over the same data - that detection pass isn't free (MAD + sliding window +
  // per-cluster stabilization search), so duplicating it on every keystroke was a real source of lag.
  outMovements?: WeightDropCandidate[]
): any[] {
  if (Object.keys(rawDataMap).length === 0) return [];

  // Normalize every API data point to one value per minute per metric, unless the user
  // explicitly overrides the step via the time step selector.
  let step = 1;
  if (timeStep !== "auto") {
    step = Number(timeStep);
  }

  // Apply smoothing if enabled for each sensor
  const smoothedDataMap: { [key: string]: { readings: any[], rawValues: number[] } } = {};
  selectedKeys.forEach((key) => {
    let readings = rawDataMap[key] || [];
    // Clean up values: filter out null, undefined or non-numeric values (NaN)
    readings = readings.filter((r: any) => r && r.value !== null && r.value !== undefined && !isNaN(Number(r.value)));

    const config = metricConfigs[key];
    const isSmooth = config?.smooth === true || config?.smooth === "true";
    let windowSize = Number(config?.sgWindow || 9);

    // Savitzky-Golay requires an odd window size
    if (windowSize % 2 === 0) {
      windowSize += 1;
    }

    const rawValues = readings.map((r: any) => {
      if (key === "plant_weight_gain") {
        const divisor = (plantsOnScale && plantsOnScale > 0) ? plantsOnScale : 6;
        const multiplier = (densityPerM2 && densityPerM2 > 0) ? densityPerM2 : 2.5;
        return (r.value / divisor) * multiplier;
      }
      return r.value;
    });

    if (isSmooth && readings.length > 0) {
      const smoothedValues = applySavitzkyGolay(rawValues, windowSize, 2);
      smoothedDataMap[key] = {
        readings: readings.map((r: any, idx: number) => ({
          ...r,
          value: smoothedValues[idx]
        })),
        rawValues
      };
    } else {
      smoothedDataMap[key] = {
        readings: readings.map((r: any, idx: number) => ({
          ...r,
          value: rawValues[idx]
        })),
        rawValues
      };
    }
  });

  const bins: { [key: number]: any } = {};

  selectedKeys.forEach((key) => {
    const entry = smoothedDataMap[key];
    const readings = entry?.readings || [];
    readings.forEach((r, idx) => {
      const date = new Date(r.time);
      if (isNaN(date.getTime())) return;

      // Align minutes to the nearest step to group all sensors into matching intervals
      const mins = date.getMinutes();
      const binnedMins = Math.round(mins / step) * step;
      date.setMinutes(binnedMins, 0, 0);
      const timeMs = date.getTime();

      if (!bins[timeMs]) {
        bins[timeMs] = {
          time: timeMs,
          formattedTime: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          formattedDate: date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      bins[timeMs][key] = r.value;
      bins[timeMs][`${key}_raw`] = entry.rawValues[idx];
      if (key === "plant_weight_gain" && r.rawScaleWeight !== undefined) {
        bins[timeMs]["rawScaleWeight"] = r.rawScaleWeight;
      }
    });
  });

  const sortedRows = Object.values(bins).sort((a: any, b: any) => a.time - b.time);

  // Detect every unexplained weight movement (drop or rise) across the whole continuous range
  // (not per isolated calendar day, so movements right around midnight are never missed), then
  // merge in manually-declared ones. Every detected movement gets its own correction applied
  // automatically and cumulatively from its own timestamp onward - no manual validation gate -
  // so several movements the same day each get compensated independently instead of only the
  // largest one being handled. The event type (dailyEvents) is purely an informative label at
  // this point; it never decides whether the correction is applied.
  if (selectedKeys.includes("plant_weight_gain")) {
    const divisor = (plantsOnScale && plantsOnScale > 0) ? plantsOnScale : 6;
    const multiplier = (densityPerM2 && densityPerM2 > 0) ? densityPerM2 : 2.5;
    const autoMovements = detectWeightMovements(sortedRows, "plant_weight_gain", divisor, multiplier);

    const movementsById: { [id: string]: WeightDropCandidate } = {};
    autoMovements.forEach(d => { movementsById[d.id] = d; });
    Object.keys(manualDrops).forEach(id => {
      const { dateStr, timeStr } = parseDropId(id);
      const manual = manualDrops[id];
      const parts = dateStr.split("/");
      const dayP = Number(parts[0]);
      const monthP = Number(parts[1]) - 1;
      const yearP = Number(parts[2]);
      const timeParts = (manual.suddenDropTime || timeStr).split(":");
      const hourP = Number(timeParts[0] || 12);
      const minP = Number(timeParts[1] || 0);
      const dropDate = new Date(yearP, monthP, dayP, hourP, minP);
      const direction = manual.direction || "drop";
      movementsById[id] = {
        id,
        dateStr,
        timeStr: manual.suddenDropTime || timeStr,
        time: dropDate.getTime(),
        direction,
        suddenDropVal: manual.suddenDropVal,
        suggestedCorrectionGrams: manual.suggestedCorrectionGrams,
        autoEventType: guessMovementEventType(direction, manual.suddenDropVal)
      };
    });

    const orderedMovements = Object.values(movementsById).sort((a, b) => a.time - b.time);
    if (outMovements) outMovements.push(...orderedMovements);

    orderedMovements.forEach(movement => {
      const savedAdj = dailyAdjustedWeights[movement.id];
      const savedAdjNum = Number(savedAdj);
      const adjMagnitudeKg = (savedAdj !== undefined && !isNaN(savedAdjNum))
        ? (savedAdjNum / 1000.0)
        : (movement.suggestedCorrectionGrams / 1000.0);
      // A drop is compensated upward (add back the lost biomass); a rise is compensated
      // downward (remove the artificial gain) so the corrected curve reflects real growth only.
      const adjKg = movement.direction === "drop" ? adjMagnitudeKg : -adjMagnitudeKg;

      // Cumulative gain resets to 0 every midnight, so a correction must never bleed into
      // the following day(s) - only rows from the movement's own moment until that same day's end.
      const dayEnd = new Date(movement.time);
      dayEnd.setHours(23, 59, 59, 999);
      const dayEndMs = dayEnd.getTime();

      for (let i = 0; i < sortedRows.length; i++) {
        if (sortedRows[i].time >= movement.time && sortedRows[i].time <= dayEndMs && sortedRows[i]["plant_weight_gain"] !== undefined) {
          sortedRows[i]["plant_weight_gain"] = Number(sortedRows[i]["plant_weight_gain"]) + adjKg;
        }
      }
    });
  }

  return sortedRows;
}

// Simple matrix inversion for small matrices
function invertMatrix(M: number[][]): number[][] | null {
  const n = M.length;
  const A: number[][] = M.map((row, i) => {
    const aug = [...row];
    for (let j = 0; j < n; j++) {
      aug.push(i === j ? 1 : 0);
    }
    return aug;
  });
  
  for (let i = 0; i < n; i++) {
    let maxEl = Math.abs(A[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) {
        maxEl = Math.abs(A[k][i]);
        maxRow = k;
      }
    }
    
    if (maxRow !== i) {
      const temp = A[i];
      A[i] = A[maxRow];
      A[maxRow] = temp;
    }
    
    if (Math.abs(A[i][i]) < 1e-10) {
      return null;
    }
    
    const pivot = A[i][i];
    for (let j = i; j < 2 * n; j++) {
      A[i][j] /= pivot;
    }
    
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = A[k][i];
        for (let j = i; j < 2 * n; j++) {
          A[k][j] -= factor * A[i][j];
        }
      }
    }
  }
  
  const inv: number[][] = [];
  for (let i = 0; i < n; i++) {
    inv.push(A[i].slice(n));
  }
  return inv;
}

// Generate dynamic Savitzky-Golay coefficients for smoothing (0-th derivative)
function getSavitzkyGolayCoefficients(windowSize: number, degree: number): number[] {
  const m = Math.floor(windowSize / 2);
  const N = windowSize;
  
  const J: number[][] = [];
  for (let i = 0; i < N; i++) {
    const x = i - m;
    const row: number[] = [];
    for (let deg = 0; deg <= degree; deg++) {
      row.push(Math.pow(x, deg));
    }
    J.push(row);
  }
  
  const JT: number[][] = [];
  for (let deg = 0; deg <= degree; deg++) {
    const row: number[] = [];
    for (let i = 0; i < N; i++) {
      row.push(J[i][deg]);
    }
    JT.push(row);
  }
  
  const JTJ: number[][] = [];
  const size = degree + 1;
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      let sum = 0;
      for (let k = 0; k < N; k++) {
        sum += JT[r][k] * J[k][c];
      }
      row.push(sum);
    }
    JTJ.push(row);
  }
  
  const invJTJ = invertMatrix(JTJ);
  if (!invJTJ) {
    return Array(N).fill(1 / N);
  }
  
  const coefficients: number[] = [];
  for (let j = 0; j < N; j++) {
    let sum = 0;
    for (let k = 0; k < size; k++) {
      sum += invJTJ[0][k] * JT[k][j];
    }
    coefficients.push(sum);
  }
  
  return coefficients;
}

// Apply Savitzky-Golay smoothing filter to sequence
function applySavitzkyGolay(data: number[], windowSize: number, degree: number): number[] {
  if (data.length < windowSize) {
    return data;
  }
  const coeffs = getSavitzkyGolayCoefficients(windowSize, degree);
  const m = Math.floor(windowSize / 2);
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    let val = 0;
    for (let j = 0; j < windowSize; j++) {
      const idx = i + j - m;
      const clampedIdx = Math.max(0, Math.min(data.length - 1, idx));
      val += coeffs[j] * data[clampedIdx];
    }
    result.push(val);
  }
  return result;
}

interface ParameterAudit {
  name: string
  applied: number
  targetMin: number
  targetMax: number
  unit: string
  status: "optimal" | "high" | "low"
  impact: string
}

interface AgronomicDay {
  day: number
  status: "Optimal" | "Ajustement requis" | "Alerte Climat"
  statusColor: "emerald" | "amber" | "rose"
  overallScore: number // out of 100
  potentialGain: number // €/m²
  audits: ParameterAudit[]
  physiologicalExplanation: string
  actionPlan: string[]
}

const AGRONOMIC_DATA: AgronomicDay[] = [
  {
    day: 1, status: "Ajustement requis", statusColor: "amber", overallScore: 78, potentialGain: 0.12,
    audits: [
      { name: "Température Jour", applied: 21.5, targetMin: 20.2, targetMax: 21.0, unit: "°C", status: "high", impact: "Surchauffage inutile sous faible rayonnement (+0.7°C de trop)." },
      { name: "Température Nuit", applied: 16.5, targetMin: 15.0, targetMax: 15.8, unit: "°C", status: "high", impact: "Perte par respiration foliaire nocturne accrue." },
      { name: "Niveau CO2", applied: 500, targetMin: 550, targetMax: 650, unit: "ppm", status: "low", impact: "Photosynthèse bridée par manque de carbone." },
      { name: "Irrigation (EC)", applied: 2.8, targetMin: 2.9, targetMax: 3.2, unit: "mS", status: "low", impact: "Conductivité faible, légère dilution des sucres." }
    ],
    physiologicalExplanation: "Le faible ensoleillement du Jour 1 n'autorisait pas une température de 21.5°C le jour. Les stomates de la tomate étaient peu ouverts, la photosynthèse était donc limitée par le rayonnement. Maintenir la serre chaude a forcé la plante à brûler de l'énergie en respiration sans créer de matière sèche additionnelle.",
    actionPlan: [
      "Ajuster la consigne de chauffage diurne à 20.5°C sous rayonnement global < 800 J/cm².",
      "Abaisser la température de nuit (cible : 15.2°C) pour limiter les pertes en sucres de réserve.",
      "Pousser l'injection CO2 à 600 ppm en début de matinée."
    ]
  },
  {
    day: 2, status: "Ajustement requis", statusColor: "amber", overallScore: 72, potentialGain: 0.18,
    audits: [
      { name: "Température Jour", applied: 22.0, targetMin: 20.5, targetMax: 21.2, unit: "°C", status: "high", impact: "Excès thermique par rapport au rayonnement solaire." },
      { name: "Température Nuit", applied: 17.0, targetMin: 15.2, targetMax: 16.0, unit: "°C", status: "high", impact: "Respiration foliaire excessive." },
      { name: "Niveau CO2", applied: 550, targetMin: 650, targetMax: 750, unit: "ppm", status: "low", impact: "Perte de CO2 par fuite due à des ouvrants trop ouverts." },
      { name: "Irrigation (EC)", applied: 2.8, targetMin: 2.9, targetMax: 3.2, unit: "mS", status: "low", impact: "Légère baisse de la pression osmotique racinaire." }
    ],
    physiologicalExplanation: "Les ouvrants de la serre étaient ouverts à 35% pour évacuer l'humidité, ce qui a provoqué un 'balayage' du CO2 injecté vers l'extérieur. Le niveau de CO2 est resté bloqué à 550 ppm. Il aurait fallu restreindre la consigne d'aération ou travailler sur une ventilation mécanique sélective.",
    actionPlan: [
      "Limiter l'ouverture des fenêtres de toit à 20-25% lors de l'injection CO2.",
      "Fixer la consigne de température diurne à 21.0°C maximum.",
      "Augmenter l'EC de la solution nutritive à 3.0 mS."
    ]
  },
  {
    day: 3, status: "Optimal", statusColor: "emerald", overallScore: 94, potentialGain: 0.02,
    audits: [
      { name: "Température Jour", applied: 21.0, targetMin: 20.8, targetMax: 21.5, unit: "°C", status: "optimal", impact: "Consigne parfaitement alignée avec le rayonnement actif." },
      { name: "Température Nuit", applied: 16.0, targetMin: 15.0, targetMax: 16.0, unit: "°C", status: "optimal", impact: "Balance nocturne équilibrée." },
      { name: "Niveau CO2", applied: 600, targetMin: 650, targetMax: 800, unit: "ppm", status: "low", impact: "Un apport plus riche de CO2 aurait été bénéfique sous ce soleil." },
      { name: "Irrigation (EC)", applied: 2.9, targetMin: 2.9, targetMax: 3.3, unit: "mS", status: "optimal", impact: "EC correct pour maintenir la force végétative." }
    ],
    physiologicalExplanation: "Une excellente journée. Les rayonnements importants ont été valorisés par des températures maîtrisées. Les stomates sont restés ouverts, optimisant la transpiration de la plante et l'absorption des nutriments (notamment le Calcium pour éviter le cul noir). Seul le CO2 aurait pu être poussé pour obtenir une photosynthèse maximale.",
    actionPlan: [
      "Maintenir cette stratégie thermique sous rayonnement fort.",
      "Augmenter la consigne d'injection CO2 à 750 ppm sous fort rayonnement global."
    ]
  },
  {
    day: 4, status: "Alerte Climat", statusColor: "rose", overallScore: 61, potentialGain: 0.26,
    audits: [
      { name: "Température Jour", applied: 22.5, targetMin: 21.0, targetMax: 21.8, unit: "°C", status: "high", impact: "Dessèchement de la tête de la plante." },
      { name: "Température Nuit", applied: 17.5, targetMin: 15.2, targetMax: 16.2, unit: "°C", status: "high", impact: "Perte majeure par respiration foliaire la nuit (+1.3°C)." },
      { name: "Niveau CO2", applied: 500, targetMin: 600, targetMax: 700, unit: "ppm", status: "low", impact: "Carbonication faible sous rayonnement moyen." },
      { name: "Irrigation (EC)", applied: 2.7, targetMin: 2.9, targetMax: 3.3, unit: "mS", status: "low", impact: "EC trop bas induisant des fruits mous." }
    ],
    physiologicalExplanation: "Journée très pénalisante. Le surchauffage nocturne à 17.5°C a stimulé un étirement inutile des tiges au détriment du grossissement des fruits. De plus, l'EC bas (2.7) couplé à une température excessive a ramolli le collet des tomates, nuisant à leur conservation future.",
    actionPlan: [
      "Corriger immédiatement la température nocturne à 15.5°C maximum.",
      "Relever la conductivité (EC) de la solution nutritive à 3.1 mS pour raffermir les tissus cellulaires.",
      "Vérifier le fonctionnement des écrans thermiques pour isoler la serre la nuit."
    ]
  },
  {
    day: 5, status: "Optimal", statusColor: "emerald", overallScore: 92, potentialGain: 0.03,
    audits: [
      { name: "Température Jour", applied: 20.5, targetMin: 20.2, targetMax: 21.0, unit: "°C", status: "optimal", impact: "Excellent équilibre thermique." },
      { name: "Température Nuit", applied: 15.5, targetMin: 14.8, targetMax: 15.6, unit: "°C", status: "optimal", impact: "Perte d'énergie minimale la nuit." },
      { name: "Niveau CO2", applied: 650, targetMin: 700, targetMax: 850, unit: "ppm", status: "low", impact: "CO2 légèrement sous-optimal mais acceptable." },
      { name: "Irrigation (EC)", applied: 3.0, targetMin: 3.0, targetMax: 3.4, unit: "mS", status: "optimal", impact: "EC idéal pour l'assimilation." }
    ],
    physiologicalExplanation: "Le climat de la serre a été géré de manière très professionnelle. Les fruits se développent harmonieusement et la consommation de gaz est restée minimale grâce aux consignes basses de nuit.",
    actionPlan: [
      "Reconduire les consignes de température et d'irrigation.",
      "Tester une augmentation ponctuelle du CO2 sous 750 ppm les après-midi."
    ]
  },
  {
    day: 6, status: "Ajustement requis", statusColor: "amber", overallScore: 81, potentialGain: 0.10,
    audits: [
      { name: "Température Jour", applied: 21.8, targetMin: 20.5, targetMax: 21.2, unit: "°C", status: "high", impact: "Chauffage diurne excessif par temps couvert." },
      { name: "Température Nuit", applied: 16.2, targetMin: 15.0, targetMax: 15.8, unit: "°C", status: "high", impact: "Perte de gaz par température nocturne haute." },
      { name: "Niveau CO2", applied: 600, targetMin: 650, targetMax: 750, unit: "ppm", status: "low", impact: "Carbonication insuffisante." },
      { name: "Irrigation (EC)", applied: 3.0, targetMin: 3.1, targetMax: 3.4, unit: "mS", status: "low", impact: "Dilution nutritionnelle modérée." }
    ],
    physiologicalExplanation: "Sous un ciel couvert et pluvieux, la consigne jour de 21.8°C a forcé les chaudières à gaz à tourner à plein régime pour un apport de lumière naturelle très faible. La plante est entrée dans un état légèrement végétatif (tiges molles, feuilles larges) par manque d'équilibre lumière/température.",
    actionPlan: [
      "Abaisser la température jour de 21.8°C à 20.8°C les jours de pluie.",
      "Relever l'EC d'irrigation à 3.3 mS pour freiner la vigueur végétative et forcer l'alimentation des fruits."
    ]
  },
  {
    day: 7, status: "Ajustement requis", statusColor: "amber", overallScore: 79, potentialGain: 0.14,
    audits: [
      { name: "Température Jour", applied: 22.0, targetMin: 20.8, targetMax: 21.4, unit: "°C", status: "high", impact: "Climat trop sec, transpiration excessive." },
      { name: "Température Nuit", applied: 17.0, targetMin: 15.0, targetMax: 15.8, unit: "°C", status: "high", impact: "Respiration cellulaire accélérée la nuit." },
      { name: "Niveau CO2", applied: 500, targetMin: 600, targetMax: 750, unit: "ppm", status: "low", impact: "Efficacité photosynthétique amoindrie." },
      { name: "Irrigation (EC)", applied: 2.9, targetMin: 3.0, targetMax: 3.3, unit: "mS", status: "low", impact: "Légère sous-alimentation minérale." }
    ],
    physiologicalExplanation: "Le déploiement précoce de l'écran d'ombrage à 10% a privé les plants de tomates de 15% de la lumière PAR (photosynthétiquement active). En conséquence, la température élevée de 22°C a entraîné une transpiration stérile. Il aurait fallu garder l'écran replié et ajuster la ventilation.",
    actionPlan: [
      "Garder l'écran d'ombrage replié tant que le rayonnement global ne dépasse pas 450 W/m².",
      "Ajuster la température jour à 21.0°C.",
      "Stabiliser la consigne nuit à 15.5°C."
    ]
  },
  {
    day: 8, status: "Ajustement requis", statusColor: "amber", overallScore: 83, potentialGain: 0.08,
    audits: [
      { name: "Température Jour", applied: 21.0, targetMin: 20.8, targetMax: 21.5, unit: "°C", status: "optimal", impact: "Bonne régulation thermique." },
      { name: "Température Nuit", applied: 16.0, targetMin: 14.8, targetMax: 15.5, unit: "°C", status: "high", impact: "Légère surconsommation de chauffage la nuit." },
      { name: "Niveau CO2", applied: 600, targetMin: 700, targetMax: 850, unit: "ppm", status: "low", impact: "Manque de CO2 sous climat stable." },
      { name: "Irrigation (EC)", applied: 3.0, targetMin: 3.2, targetMax: 3.5, unit: "mS", status: "low", impact: "Risque de ramollissement du fruit par EC bas." }
    ],
    physiologicalExplanation: "La plante a bénéficié d'une température jour de 21°C très satisfaisante. Néanmoins, sous ce climat stable, un EC à 3.0 limite l'accumulation des solides solubles (sucres) dans le fruit, risquant de donner des tomates moins savoureuses. Un EC de 3.3 est fortement conseillé.",
    actionPlan: [
      "Relever l'EC d'irrigation à 3.3 ou 3.4 mS pour solidifier la pulpe.",
      "Pousser le CO2 à 750 ppm sous aération fermée (ouvrants < 15%)."
    ]
  },
  {
    day: 9, status: "Optimal", statusColor: "emerald", overallScore: 95, potentialGain: 0.01,
    audits: [
      { name: "Température Jour", applied: 20.2, targetMin: 20.0, targetMax: 20.8, unit: "°C", status: "optimal", impact: "Consigne froide parfaitement valorisée." },
      { name: "Température Nuit", applied: 15.0, targetMin: 14.5, targetMax: 15.2, unit: "°C", status: "optimal", impact: "Respiration nocturne minimale." },
      { name: "Niveau CO2", applied: 700, targetMin: 750, targetMax: 900, unit: "ppm", status: "optimal", impact: "Très bonne carbonication." },
      { name: "Irrigation (EC)", applied: 3.2, targetMin: 3.1, targetMax: 3.5, unit: "mS", status: "optimal", impact: "EC idéal pour le développement." }
    ],
    physiologicalExplanation: "Une journée exemplaire. Le froid extérieur ensoleillé a été converti en opportunité agronomique : ouvrants serrés permettant de saturer la serre en CO2 à 700 ppm sans gaspillage, tandis que la température froide diurne a maintenu les plants trapus et génératifs.",
    actionPlan: [
      "Reconduire exactement ce modèle de gestion pour les journées froides ensoleillées."
    ]
  },
  {
    day: 10, status: "Alerte Climat", statusColor: "rose", overallScore: 58, potentialGain: 0.32,
    audits: [
      { name: "Température Jour", applied: 23.0, targetMin: 21.5, targetMax: 22.2, unit: "°C", status: "high", impact: "Stress hydrique par fermeture stomatique." },
      { name: "Température Nuit", applied: 18.0, targetMin: 15.8, targetMax: 16.8, unit: "°C", status: "high", impact: "Respiration nocturne critique la nuit (+2.0°C de trop)." },
      { name: "Niveau CO2", applied: 450, targetMin: 550, targetMax: 650, unit: "ppm", status: "low", impact: "Carbonication faible, dilution par l'aération." },
      { name: "Irrigation (EC)", applied: 2.7, targetMin: 2.9, targetMax: 3.2, unit: "mS", status: "low", impact: "Stress de salinité inversé, drainage excessif." }
    ],
    physiologicalExplanation: "Climat extrême non géré. L'ouverture brusque des fenêtres de toit à 50% sous l'effet de la chaleur a provoqué une baisse brutale de l'humidité sous 40% (VPD > 1.8 kPa). Pour se protéger, la tomate a totalement fermé ses stomates, stoppant net la photosynthèse dès midi. De plus, la température nocturne à 18°C a gaspillé les sucres assimilés la veille.",
    actionPlan: [
      "Activer d'urgence la brumisation (cooling) pour maintenir le VPD sous 1.2 kPa.",
      "Ne pas dépasser 30% d'ouverture des ouvrants de toits sous vent sec.",
      "Programmer un abaissement de température de nuit à 16.0°C."
    ]
  }
];

export default function AranetUnifiedDashboard() {
  const [customPrivaMetrics, setCustomPrivaMetrics] = useState<any[]>([]);
  // Declared here (not alongside the other "Sélection des données" draft state further below)
  // because allMetrics needs it immediately - see the draft-editing note near metricConfigsDraft.
  const [customPrivaMetricsDraft, setCustomPrivaMetricsDraft] = useState<any[]>([]);

  // Union of the validated custom Priva metrics and the draft ones, deduped by key. Must
  // include the validated set: every fetch/chart-rendering code path resolves a committed
  // key's variableId/deviceId/color etc. through allMetrics.find(...), and a validated
  // selectedKeys/fertiSelectedKeys entry that isn't in allMetrics crashes with "Cannot read
  // properties of undefined" (was broken briefly by reading only customPrivaMetricsDraft here).
  // Also includes the draft set so a custom Priva point just added in "Sélection des données"
  // shows up immediately there, before being saved.
  const allMetrics = useMemo(() => {
    const merged = [...PLOTTABLE_METRICS, ...customPrivaMetrics];
    customPrivaMetricsDraft.forEach(m => {
      if (!merged.some(existing => existing.key === m.key)) merged.push(m);
    });
    return merged;
  }, [customPrivaMetrics, customPrivaMetricsDraft]);

  const [activeTab, setActiveTab] = useState<"agronomic" | "selection" | "charts" | "chutes" | "fertigation">("charts");
  // Sub-tab within Climat/Croissance: the existing sensor chart, or the new photosynthesis
  // efficiency (Aréel/IVL) chart - see photosynthesisChartData below.
  const [climatSubTab, setClimatSubTab] = useState<"data" | "efficiency">("data");
  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([
    "temp_rh_top_1",
    "temp_rh_top_2",
    "slab_ec_wc_8",
    "slab_weight_7",
    "plant_weight_7",
    "plant_weight_gain"
  ]);
  // Every default-selected sensor is loaded (fetched) from first load, but only "Cumulative
  // Gain" and "Plant weight" are visible on the chart out of the box - the rest stay
  // loaded-but-hidden so the first impression isn't a cluttered chart; the operator can reveal
  // them from the colored legend below. Only applies to brand-new sessions (overwritten by the
  // saved localStorage selection below, same as selectedKeys itself).
  const [hiddenKeysOnChart, setHiddenKeysOnChart] = useState<string[]>([
    "temp_rh_top_1",
    "temp_rh_top_2",
    "slab_ec_wc_8",
    "slab_weight_7"
  ]);

  // Priva Climate Computer States
  const [privaCatalog, setPrivaCatalog] = useState<any[]>([]);
  const [privaValues, setPrivaValues] = useState<Record<string, { value: number; time: string; unit: string }>>({});
  const [privaLoading, setPrivaLoading] = useState(false);
  const [privaError, setPrivaError] = useState<string | null>(null);
  const [privaChartError, setPrivaChartError] = useState<string | null>(null);
  const [privaSearch, setPrivaSearch] = useState("");
  const [selectedCompartment, setSelectedCompartment] = useState<string>("1");

  // Persistent agronomic agent: statistical correlations this greenhouse's own history has
  // shown between climate/substrate factors and biomass gain - fetched into the Analyseur
  // Agronomique tab (not a separate module). The bibliographic literature corpus itself has no
  // dashboard UI - it's ingested from agro-literature-docs/ via `npm run ingest:agro-literature`.
  const [agroCorrelations, setAgroCorrelations] = useState<any[]>([]);
  const [agroCorrelationsInsufficient, setAgroCorrelationsInsufficient] = useState(false);
  const [agroCorrelationsSampleSize, setAgroCorrelationsSampleSize] = useState<number | null>(null);
  // Target ranges (IQR of each factor on this greenhouse's own best-efficiency days), nested by
  // agronomic time slot - a factor's target at Midi isn't its target at Nuit. Turns the
  // correlations above into an actionable value to aim for, and lets dynamicAgronomicData flag
  // which factor was outside its slot-specific range (and therefore likely limiting) per slot.
  const [agroTargetRanges, setAgroTargetRanges] = useState<{ [factorKey: string]: { [slotLabel: string]: { min: number; max: number; sampleSize: number } } }>({});

  // Admin-managed role catalog (agro_roles, see app/dashboard/aranet/roles/page.tsx) - source of
  // truth for the "Rôle Agronomique" dropdown options and for display labels everywhere the
  // agent shows a factor name (Corrélations apprises, facteur limitant par créneau). Replaces
  // the hardcoded <option> list that used to live directly in this file.
  const [agroRoles, setAgroRoles] = useState<{ role_key: string; label: string; category: string }[]>([]);
  const agroRolesByCategory = useMemo(() => {
    const grouped: { [category: string]: { role_key: string; label: string }[] } = {};
    agroRoles.forEach(r => {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push({ role_key: r.role_key, label: r.label });
    });
    return grouped;
  }, [agroRoles]);
  const agroRoleLabels = useMemo(() => {
    const map: { [roleKey: string]: string } = {};
    agroRoles.forEach(r => { map[r.role_key] = r.label; });
    return map;
  }, [agroRoles]);
  // role_key -> category, used to group "Sélection des données" by agronomic role category
  // instead of by sensor catalog category (Priva compartment, Aranet category, etc.) - see
  // renderGroupedMetrics below. Also used to exempt "Météo extérieure"-tagged sensors from the
  // Compartiment filter, since exterior weather is shared across every compartment.
  const agroRoleCategoryByKey = useMemo(() => {
    const map: { [roleKey: string]: string } = {};
    agroRoles.forEach(r => { map[r.role_key] = r.category; });
    return map;
  }, [agroRoles]);
  // Category label used by the admin role catalog (app/dashboard/aranet/roles) for exterior
  // weather roles (temp_ext, hr_ext, wind_speed/direction, rain, radiation_instant/sum) - these
  // describe conditions outside the greenhouse, identical for every compartiment, so a sensor
  // tagged with one of them should never be hidden by the Compartiment filter.
  const EXTERIOR_WEATHER_ROLE_CATEGORY = "Météo extérieure";

  const fetchAgroRoles = async () => {
    try {
      const res = await fetch("/api/agro-roles");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement des rôles.");
      setAgroRoles(data.roles || []);
    } catch (e) {
      console.error("Failed to fetch agro roles:", e);
    }
  };

  useEffect(() => {
    fetchAgroRoles();
  }, []);

  const fetchPrivaData = async () => {
    setPrivaLoading(true);
    setPrivaError(null);
    try {
      // 1. Fetch available datapoints catalog (fast, cached)
      const catRes = await fetch("/api/priva?action=datapoints");
      if (!catRes.ok) throw new Error("Impossible de charger le catalogue des capteurs Priva");
      const catData = await catRes.json();
      const list = catData.datapoints || [];
      setPrivaCatalog(list);

      // Define our key metrics we want to display on dashboard cards
      const keyMetrics = [
        { key: "temp_out", variableId: "00000214-0001-0000-0000-0000000042a9", deviceId: "VP9508", deviceGroupId: "none", name: "Température Extérieure", unit: "°C" },
        { key: "hum_out", variableId: "00000214-0001-0000-0000-00000000427e", deviceId: "VP9508", deviceGroupId: "none", name: "Humidité Extérieure", unit: "%" },
        { key: "irr_out", variableId: "00000214-0001-0000-0000-0000000042fd", deviceId: "VP9508", deviceGroupId: "none", name: "Rayonnement Solaire", unit: "W/m²" },
        { key: "wind_out", variableId: "00000214-0001-0000-0000-0000000042ad", deviceId: "VP9508", deviceGroupId: "none", name: "Vitesse du Vent", unit: "m/s" },
        { key: "heat_target", variableId: "0000002c-0001-0001-0000-0000000006e5", deviceId: "VP9508", deviceGroupId: "none", name: "Consigne Chauffage 1", unit: "°C" },
        { key: "heat_measured", variableId: "0000002c-0001-0001-0000-0000000006f6", deviceId: "VP9508", deviceGroupId: "none", name: "Chauffage 1 Mesuré", unit: "°C" },
        { key: "water_ret", variableId: "00000027-0001-0001-0000-000000000658", deviceId: "VP9508", deviceGroupId: "none", name: "Eau Retour Chauffage 1", unit: "°C" },
        { key: "water_calc", variableId: "00000027-0001-0001-0000-000000000651", deviceId: "VP9508", deviceGroupId: "none", name: "Eau Calculée Chauffage 1", unit: "°C" },
        { key: "hum_measured", variableId: "000002bb-0005-0000-0000-0000000050f2", deviceId: "VP9508", deviceGroupId: "none", name: "Humidité Mesurée 5", unit: "%" },
        { key: "hum_target", variableId: "000002bb-0005-0000-0000-00000000510d", deviceId: "VP9508", deviceGroupId: "none", name: "Consigne Limite Humidité 5", unit: "%" }
      ];

      // 2. Fetch the values for these key metrics (last 24 hours up to yesterday midnight)
      const yesterday = new Date();
      yesterday.setHours(0,0,0,0);
      const yesterdayStart = new Date(yesterday.getTime() - 24 * 3600 * 1000);

      const valRes = await fetch("/api/priva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: yesterdayStart.toISOString(),
          endTime: yesterday.toISOString(),
          datapoints: keyMetrics.map(m => ({
            variableId: m.variableId,
            deviceId: m.deviceId,
            deviceGroupId: m.deviceGroupId
          }))
        })
      });

      if (!valRes.ok) {
        const errJson = await valRes.json().catch(() => ({}));
        let errMsg = `Erreur Priva API (status ${valRes.status})`;
        if (errJson.details) {
          try {
            const nested = JSON.parse(errJson.details);
            if (nested.message) errMsg = nested.message;
            else if (nested.error) errMsg = nested.error;
          } catch {
            errMsg = errJson.details;
          }
        } else if (errJson.error) {
          errMsg = errJson.error;
        }
        throw new Error(errMsg);
      }

      const valData = await valRes.json();
      const series = valData.data || [];

      // Extract the last non-null value for each variable
      const valuesMap: Record<string, { value: number; time: string; unit: string }> = {};
      
      keyMetrics.forEach(m => {
        const matchSeries = series.find((s: any) => s.datapoint && s.datapoint.variableId === m.variableId);
        if (matchSeries && matchSeries.measurements && matchSeries.measurements.length > 0) {
          const nonNullValues = matchSeries.measurements.filter((v: any) => v.value !== null && v.value !== undefined);
          if (nonNullValues.length > 0) {
            const latest = nonNullValues[nonNullValues.length - 1];
            const parsedVal = parseFloat(latest.value);
            valuesMap[m.key] = {
              value: Number(parsedVal.toFixed(2)),
              time: new Date(latest.timestampUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unit: m.unit
            };
          }
        }
      });

      setPrivaValues(valuesMap);
    } catch (err: any) {
      const isQuotaError = err.message && (
        err.message.toLowerCase().includes("quota") ||
        err.message.toLowerCase().includes("volume") ||
        err.message.toLowerCase().includes("429") ||
        err.message.toLowerCase().includes("403") ||
        err.message.toLowerCase().includes("423")
      );
      if (isQuotaError) {
        console.warn("fetchPrivaData rate limit:", err.message);
      } else {
        console.error("fetchPrivaData error:", err);
      }
      setPrivaError(err.message || "Erreur de connexion");
    } finally {
      setPrivaLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "selection") {
      fetchPrivaData();
    }
  }, [activeTab]);

  const fetchAgroCorrelations = async () => {
    try {
      const res = await fetch("/api/agro-correlations");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement des corrélations.");
      setAgroCorrelations(data.correlations || []);
      setAgroCorrelationsInsufficient(!!data.insufficientData);
      setAgroCorrelationsSampleSize(data.sampleSize ?? null);
    } catch (e) {
      console.error("Failed to fetch agro correlations:", e);
    }
  };

  const fetchAgroTargetRanges = async () => {
    try {
      const res = await fetch("/api/agro-target-ranges");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement des plages cibles.");
      setAgroTargetRanges(data.ranges || {});
    } catch (e) {
      console.error("Failed to fetch agro target ranges:", e);
    }
  };

  useEffect(() => {
    if (activeTab === "agronomic") {
      fetchAgroCorrelations();
      fetchAgroTargetRanges();
    }
  }, [activeTab]);

  // Configurations for each metric: unit ID, X-axis range, and Y-axis side
  const [metricConfigs, setMetricConfigs] = useState<{
    [key: string]: { 
      unit: string; 
      range: string; 
      axis: "left" | "right"; 
      smooth?: boolean | string; 
      customName?: string; 
      color?: string; 
      sgWindow?: number;
      [customKey: string]: any;
    };
  }>({});

  // Draft copies of selectedKeys/fertiSelectedKeys/metricConfigs/customPrivaMetrics, edited
  // exclusively by the "Sélection des données" screen. Every other part of the app (charts,
  // agroAnalysisKeys, all fetch/sync effects) keeps reading the validated state above -
  // metricConfigs used to feed agroAnalysisKeys directly, so even an unrelated edit like typing
  // a custom name triggered a full Analyseur Agronomique refetch + heavy weight-drop-detection
  // recompute + several Supabase syncs on every keystroke. Draft state lets the screen update
  // instantly (pure client state, no recompute) while edits stay inert until explicitly saved -
  // see hasUnsavedSelectionChanges/handleSaveSelection below.
  const [selectedKeysDraft, setSelectedKeysDraft] = useState<string[]>([]);
  const [fertiSelectedKeysDraft, setFertiSelectedKeysDraft] = useState<string[]>([]);
  const [metricConfigsDraft, setMetricConfigsDraft] = useState<typeof metricConfigs>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawDataMap, setRawDataMap] = useState<{ [key: string]: any[] }>({});

  const alignMode = "absolute";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Manual left/right Y-axis override for the Ferti Irrigation chart specifically (its own
  // sensors/date range - Climat/Croissance no longer has this, replaced by "Paramètres
  // Techniques de la Serre" in Sélection des données).
  const [yLeftMinFerti, setYLeftMinFerti] = useState<string>("");
  const [yLeftMaxFerti, setYLeftMaxFerti] = useState<string>("");
  const [yRightMinFerti, setYRightMinFerti] = useState<string>("");
  const [yRightMaxFerti, setYRightMaxFerti] = useState<string>("");
  const [plantsOnScale, setPlantsOnScale] = useState<number>(6);
  const [densityPerM2, setDensityPerM2] = useState<number>(2.5);
  const [conversionRatio, setConversionRatio] = useState<number>(1.0);

  // These two feed directly into the weight-movement detection algorithm (MAD + sliding window +
  // per-cluster stabilization search) via buildChartRows, which isn't cheap to re-run - so typing
  // is kept snappy locally and the actual heavy recompute only fires once the user pauses.
  const [plantsOnScaleDraft, setPlantsOnScaleDraft] = useState<string>(String(6));
  const [densityPerM2Draft, setDensityPerM2Draft] = useState<string>(String(2.5));
  const plantsOnScaleCommitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const densityPerM2CommitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handlePlantsOnScaleDraftChange = (value: string) => {
    setPlantsOnScaleDraft(value);
    if (plantsOnScaleCommitTimeoutRef.current) clearTimeout(plantsOnScaleCommitTimeoutRef.current);
    plantsOnScaleCommitTimeoutRef.current = setTimeout(() => {
      setPlantsOnScale(Math.max(1, Number(value) || 1));
    }, 500);
  };
  const handleDensityPerM2DraftChange = (value: string) => {
    setDensityPerM2Draft(value);
    if (densityPerM2CommitTimeoutRef.current) clearTimeout(densityPerM2CommitTimeoutRef.current);
    densityPerM2CommitTimeoutRef.current = setTimeout(() => {
      setDensityPerM2(Math.max(0.1, Number(value) || 0.1));
    }, 500);
  };

  // Greenhouse-wide technical parameters ("Paramètres Techniques de la Serre" card in Sélection
  // des données) - unlike plantsOnScale/densityPerM2 above, these are also read by the
  // unattended nightly cron (app/api/aranet/archive-daily/route.ts), so greenhouse_settings in
  // Supabase is their source of truth, not localStorage; loaded once on mount and PATCHed
  // (debounced) on every change via /api/greenhouse-settings.
  const [greenhouseCulture, setGreenhouseCulture] = useState<string>("");
  const [greenhouseCultureTypology, setGreenhouseCultureTypology] = useState<string>("");
  const [glassTranslucidityPercent, setGlassTranslucidityPercent] = useState<string>("");
  const greenhouseSettingsCommitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const commitGreenhouseSettings = (update: { culture?: string; cultureTypology?: string; glassTranslucidityPercent?: string }) => {
    if (greenhouseSettingsCommitTimeoutRef.current) clearTimeout(greenhouseSettingsCommitTimeoutRef.current);
    greenhouseSettingsCommitTimeoutRef.current = setTimeout(() => {
      fetch("/api/greenhouse-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update)
      }).catch(e => console.error("Failed to save greenhouse settings:", e));
    }, 500);
  };
  useEffect(() => {
    fetch("/api/greenhouse-settings")
      .then(res => res.json())
      .then(data => {
        if (!data?.settings) return;
        setGreenhouseCulture(data.settings.culture || "");
        setGreenhouseCultureTypology(data.settings.culture_typology || "");
        setGlassTranslucidityPercent(data.settings.glass_translucidity_percent !== null && data.settings.glass_translucidity_percent !== undefined ? String(data.settings.glass_translucidity_percent) : "");
      })
      .catch(e => console.error("Failed to load greenhouse settings:", e));
  }, []);

  // AI black-box agronomic explanation, keyed per day so each analyzed day keeps its result
  // cached instead of re-calling the model every time the audit detail is revisited.
  const [aiAnalysisByDay, setAiAnalysisByDay] = useState<{ [dateStr: string]: { explanation: string; actionPlan: string[]; keyLimitingFactor: string } }>({});
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState<{ [dateStr: string]: boolean }>({});
  const [aiAnalysisError, setAiAnalysisError] = useState<{ [dateStr: string]: string }>({});
  const [dailyEvents, setDailyEvents] = useState<{ [dateStr: string]: "harvest" | "thinning" | "descent" | "recalibration" | "watering" }>({});
  const [dailyEventsDraft, setDailyEventsDraft] = useState<{ [dateStr: string]: "harvest" | "thinning" | "descent" | "recalibration" | "watering" }>({});
  const [dailyAdjustedWeights, setDailyAdjustedWeights] = useState<{ [dateStr: string]: number }>({});
  const [dailyAdjustedWeightsDraft, setDailyAdjustedWeightsDraft] = useState<{ [dateStr: string]: number }>({});
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [validatingDropId, setValidatingDropId] = useState<string | null>(null);
  const [timeStep, setTimeStep] = useState<string>("auto");
  const [fertiTimeStep, setFertiTimeStep] = useState<string>("auto");
  const [manualDrops, setManualDrops] = useState<{ [dateStr: string]: { suddenDropTime: string; suddenDropVal: number; suggestedCorrectionGrams: number; direction?: "drop" | "rise" } }>({});
  const [newManualDropDate, setNewManualDropDate] = useState("");
  const [newManualDropTime, setNewManualDropTime] = useState("12:00");
  const [newManualDropVal, setNewManualDropVal] = useState("100");
  const [newManualDropDirection, setNewManualDropDirection] = useState<"drop" | "rise">("drop");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const getPastDateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
  };

  const [startDate, setStartDate] = useState<string>(getPastDateStr(2));
  const [endDate, setEndDate] = useState<string>(getPastDateStr(1));
  const [zoomTimeRange, setZoomTimeRange] = useState<{ min: number; max: number } | null>(null);

  // Ferti Irrigation tab - deliberately independent of the main Climat/Croissance selection
  // (its own sensors, its own date range) so switching sensors there never disturbs the main chart.
  // Any sensor (Aranet or Priva) can be added here, not just the original fixed slab/weight set.
  const [fertiSelectedKeys, setFertiSelectedKeys] = useState<string[]>([
    ...FERTI_METRIC_KEYS,
    "plant_weight_7",
    "plant_weight_gain"
  ]);
  // Same "loaded but hidden by default" pattern as hiddenKeysOnChart for Climat/Croissance -
  // only Gain Cumulé and Plant weight are visible out of the box, the substrate sensors stay
  // loaded and revealable from the colored legend. Only applies to brand-new sessions (no saved
  // selection yet - see the localStorage load/save effects for fertiSelectedKeys below, which
  // now persist whatever the user actually checks/unchecks here across reloads).
  const [hiddenFertiKeysOnChart, setHiddenFertiKeysOnChart] = useState<string[]>(FERTI_METRIC_KEYS);
  const [fertiRawDataMap, setFertiRawDataMap] = useState<{ [key: string]: any[] }>({});
  const [fertiLoading, setFertiLoading] = useState(false);
  const [fertiError, setFertiError] = useState<string | null>(null);
  const [fertiPrivaError, setFertiPrivaError] = useState<string | null>(null);
  const [fertiStartDate, setFertiStartDate] = useState<string>(getPastDateStr(7));
  const [fertiEndDate, setFertiEndDate] = useState<string>(getPastDateStr(0));

  // Same draft/commit pattern as startDate/endDate below (via commitDateRange) - typing/picking
  // a date only updates the draft, the fetch only fires when "Charger" is clicked.
  const [fertiStartDateDraft, setFertiStartDateDraft] = useState<string>(fertiStartDate);
  const [fertiEndDateDraft, setFertiEndDateDraft] = useState<string>(fertiEndDate);
  const fertiStartDateDraftRef = useRef(fertiStartDate);
  const fertiEndDateDraftRef = useRef(fertiEndDate);

  useEffect(() => {
    setFertiStartDateDraft(fertiStartDate);
    fertiStartDateDraftRef.current = fertiStartDate;
  }, [fertiStartDate]);
  useEffect(() => {
    setFertiEndDateDraft(fertiEndDate);
    fertiEndDateDraftRef.current = fertiEndDate;
  }, [fertiEndDate]);

  const commitFertiDateRange = () => {
    const rawStart = fertiStartDateDraftRef.current;
    const rawEnd = fertiEndDateDraftRef.current;
    if (!rawStart || !rawEnd) return;

    let sd = new Date(rawStart);
    let ed = new Date(rawEnd);
    if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return;
    sd.setHours(0, 0, 0, 0);
    ed.setHours(23, 59, 59, 999);

    if (sd > ed) {
      const tmp = sd;
      sd = ed;
      ed = tmp;
    }

    const maxRangeMs = 30 * 24 * 3600 * 1000;
    if (ed.getTime() - sd.getTime() > maxRangeMs) {
      ed = new Date(sd.getTime() + maxRangeMs);
    }

    setFertiStartDate(sd.toISOString().split("T")[0]);
    setFertiEndDate(ed.toISOString().split("T")[0]);
  };

  const handleFertiStartDateDraftChange = (value: string) => {
    setFertiStartDateDraft(value);
    fertiStartDateDraftRef.current = value;
  };
  const handleFertiEndDateDraftChange = (value: string) => {
    setFertiEndDateDraft(value);
    fertiEndDateDraftRef.current = value;
  };

  // The date inputs are decoupled from the committed range: typing/picking a date only updates
  // the draft (instant, cheap) - the expensive fetch + chart/audit recompute only fires when the
  // user explicitly clicks "Charger" (commitDateRange), not on every keystroke/date pick. This is
  // shared by both the Climat/Croissance chart and the Mouvements de Poids mini-chart.
  const [startDateDraft, setStartDateDraft] = useState<string>(startDate);
  const [endDateDraft, setEndDateDraft] = useState<string>(endDate);
  const startDateDraftRef = useRef(startDate);
  const endDateDraftRef = useRef(endDate);

  useEffect(() => {
    setStartDateDraft(startDate);
    startDateDraftRef.current = startDate;
  }, [startDate]);
  useEffect(() => {
    setEndDateDraft(endDate);
    endDateDraftRef.current = endDate;
  }, [endDate]);

  const commitDateRange = () => {
    const rawStart = startDateDraftRef.current;
    const rawEnd = endDateDraftRef.current;
    if (!rawStart || !rawEnd) return;

    let sd = new Date(rawStart);
    let ed = new Date(rawEnd);
    if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return;
    sd.setHours(0, 0, 0, 0);
    ed.setHours(23, 59, 59, 999);

    // Swap instead of silently ignoring if the user picked them in reverse order.
    if (sd > ed) {
      const tmp = sd;
      sd = ed;
      ed = tmp;
    }

    const maxRangeMs = 30 * 24 * 3600 * 1000;
    if (ed.getTime() - sd.getTime() > maxRangeMs) {
      ed = new Date(sd.getTime() + maxRangeMs);
    }

    setStartDate(sd.toISOString().split("T")[0]);
    setEndDate(ed.toISOString().split("T")[0]);
  };

  const handleStartDateDraftChange = (value: string) => {
    setStartDateDraft(value);
    startDateDraftRef.current = value;
  };

  const handleEndDateDraftChange = (value: string) => {
    setEndDateDraft(value);
    endDateDraftRef.current = value;
  };

  const startDateTime = useMemo(() => {
    const d = new Date(startDate);
    if (isNaN(d.getTime())) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() - 7);
      fallback.setHours(0, 0, 0, 0);
      return fallback;
    }
    d.setHours(0, 0, 0, 0);
    return d;
  }, [startDate]);

  const endDateTime = useMemo(() => {
    const d = new Date(endDate);
    if (isNaN(d.getTime())) {
      const fallback = new Date();
      fallback.setHours(23, 59, 59, 999);
      return fallback;
    }
    d.setHours(23, 59, 59, 999);
    return d;
  }, [endDate]);

  const apiDaysRequested = useMemo(() => {
    const now = new Date();
    const startMs = startDateTime.getTime();
    const endMs = endDateTime.getTime();
    if (isNaN(startMs) || isNaN(endMs)) return 7;
    const diffTime = Math.abs(now.getTime() - startMs);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(30, Math.max(1, isNaN(diffDays) ? 7 : diffDays));
  }, [startDateTime, endDateTime]);

  // Analyseur Agronomique - independent date range from Climat/Croissance: its own committed
  // dates, its own draft/debounce (same anti-freeze pattern as the main range), own raw data
  // and its own fetch, so browsing a different period there never touches the main chart.
  const [agroStartDate, setAgroStartDate] = useState<string>(getPastDateStr(7));
  const [agroEndDate, setAgroEndDate] = useState<string>(getPastDateStr(1));
  const [agroStartDateDraft, setAgroStartDateDraft] = useState<string>(agroStartDate);
  const [agroEndDateDraft, setAgroEndDateDraft] = useState<string>(agroEndDate);
  const agroStartDateDraftRef = useRef(agroStartDate);
  const agroEndDateDraftRef = useRef(agroEndDate);
  const agroDateCommitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setAgroStartDateDraft(agroStartDate);
    agroStartDateDraftRef.current = agroStartDate;
  }, [agroStartDate]);
  useEffect(() => {
    setAgroEndDateDraft(agroEndDate);
    agroEndDateDraftRef.current = agroEndDate;
  }, [agroEndDate]);

  const commitAgroDateRange = () => {
    const rawStart = agroStartDateDraftRef.current;
    const rawEnd = agroEndDateDraftRef.current;
    if (!rawStart || !rawEnd) return;

    let sd = new Date(rawStart);
    let ed = new Date(rawEnd);
    if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return;
    sd.setHours(0, 0, 0, 0);
    ed.setHours(23, 59, 59, 999);

    if (sd > ed) {
      const tmp = sd;
      sd = ed;
      ed = tmp;
    }

    const maxRangeMs = 30 * 24 * 3600 * 1000;
    if (ed.getTime() - sd.getTime() > maxRangeMs) {
      ed = new Date(sd.getTime() + maxRangeMs);
    }

    setAgroStartDate(sd.toISOString().split("T")[0]);
    setAgroEndDate(ed.toISOString().split("T")[0]);
  };

  const scheduleAgroDateCommit = () => {
    if (agroDateCommitTimeoutRef.current) clearTimeout(agroDateCommitTimeoutRef.current);
    agroDateCommitTimeoutRef.current = setTimeout(() => {
      commitAgroDateRange();
    }, 700);
  };

  const handleAgroStartDateDraftChange = (value: string) => {
    setAgroStartDateDraft(value);
    agroStartDateDraftRef.current = value;
    scheduleAgroDateCommit();
  };

  const handleAgroEndDateDraftChange = (value: string) => {
    setAgroEndDateDraft(value);
    agroEndDateDraftRef.current = value;
    scheduleAgroDateCommit();
  };

  const agroStartDateTime = useMemo(() => {
    const d = new Date(agroStartDate);
    if (isNaN(d.getTime())) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() - 7);
      fallback.setHours(0, 0, 0, 0);
      return fallback;
    }
    d.setHours(0, 0, 0, 0);
    return d;
  }, [agroStartDate]);

  const agroEndDateTime = useMemo(() => {
    const d = new Date(agroEndDate);
    if (isNaN(d.getTime())) {
      const fallback = new Date();
      fallback.setHours(23, 59, 59, 999);
      return fallback;
    }
    d.setHours(23, 59, 59, 999);
    return d;
  }, [agroEndDate]);

  const agroApiDaysRequested = useMemo(() => {
    const now = new Date();
    const startMs = agroStartDateTime.getTime();
    const endMs = agroEndDateTime.getTime();
    if (isNaN(startMs) || isNaN(endMs)) return 7;
    const diffTime = Math.abs(now.getTime() - startMs);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(30, Math.max(1, isNaN(diffDays) ? 7 : diffDays));
  }, [agroStartDateTime, agroEndDateTime]);

  // Which sensors feed the Analyseur Agronomique tab's own data pool (agroRawDataMap /
  // agroFertiRawDataMap below) - deliberately a superset of, not equal to, the chart display
  // selection. selectedKeys/fertiSelectedKeys are a display concern (what's plotted); the
  // agronomic analysis should be driven by which sensors are tagged with a "Rôle Agronomique",
  // regardless of chart visibility - a radiation_sum sensor unchecked on the chart must still
  // feed the analysis. selectedKeys/fertiSelectedKeys are still unioned in (not dropped) so the
  // untagged name-heuristic fallback in keysByRole/keysByRoleAll below keeps working for anyone
  // who hasn't tagged everything yet. The weight/gain sensors are always included unconditionally
  // because the drop-detection/correction pipeline (buildChartRows) needs them to produce a
  // usable actualGain - without that correction the raw scale delta isn't exploitable.
  const agroAnalysisKeys = useMemo(() => {
    const tagged = Object.keys(metricConfigs).filter(k => {
      const role = metricConfigs[k]?.agroRole;
      return role && role !== "none";
    });
    return Array.from(new Set([...tagged, ...selectedKeys, ...fertiSelectedKeys, "plant_weight_gain", "plant_weight_7"]));
  }, [metricConfigs]);

  const [agroRawDataMap, setAgroRawDataMap] = useState<{ [key: string]: any[] }>({});
  const [agroLoading, setAgroLoading] = useState(false);
  const [agroError, setAgroError] = useState<string | null>(null);
  const [agroPrivaChartError, setAgroPrivaChartError] = useState<string | null>(null);

  const fetchAgroData = () => fetchDataForRange(
    agroAnalysisKeys, agroStartDateTime, agroEndDateTime, agroApiDaysRequested,
    setAgroRawDataMap, setAgroLoading, setAgroError, setAgroPrivaChartError
  );

  const agroFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (Object.keys(metricConfigs).length > 0) {
      if (agroFetchTimeoutRef.current) clearTimeout(agroFetchTimeoutRef.current);
      agroFetchTimeoutRef.current = setTimeout(() => {
        fetchAgroData();
      }, 300);
    }
    return () => {
      if (agroFetchTimeoutRef.current) clearTimeout(agroFetchTimeoutRef.current);
    };
  }, [agroAnalysisKeys, agroStartDate, agroEndDate]);

  // The advanced agronomic analysis also factors in Ferti Irrigation data (substrate VWC/EC,
  // slab/plant weight) over the Analyseur Agronomique tab's own date range, so its audits and
  // AI black-box context aren't climate-only - irrigation/substrate conditions explain plant
  // behavior just as much as temperature/light do.
  const [agroFertiRawDataMap, setAgroFertiRawDataMap] = useState<{ [key: string]: any[] }>({});
  const [agroFertiLoading, setAgroFertiLoading] = useState(false);
  const [agroFertiError, setAgroFertiError] = useState<string | null>(null);
  const [agroFertiPrivaError, setAgroFertiPrivaError] = useState<string | null>(null);

  // Same agroAnalysisKeys pool as the climate fetch above (not fertiSelectedKeys) - the merge in
  // dynamicAgronomicData concatenates both raw maps by date anyway, and every role-tagged sensor
  // (whichever chart, if any, it happens to be checked on) needs to be visible to the analysis.
  const fetchAgroFertiData = () => fetchDataForRange(
    agroAnalysisKeys, agroStartDateTime, agroEndDateTime, agroApiDaysRequested,
    setAgroFertiRawDataMap, setAgroFertiLoading, setAgroFertiError, setAgroFertiPrivaError
  );

  const agroFertiFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (Object.keys(metricConfigs).length > 0) {
      if (agroFertiFetchTimeoutRef.current) clearTimeout(agroFertiFetchTimeoutRef.current);
      agroFertiFetchTimeoutRef.current = setTimeout(() => {
        fetchAgroFertiData();
      }, 300);
    }
    return () => {
      if (agroFertiFetchTimeoutRef.current) clearTimeout(agroFertiFetchTimeoutRef.current);
    };
  }, [agroAnalysisKeys, agroStartDate, agroEndDate]);

  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount and initialize configurations
  useEffect(() => {
    let cancelled = false;
    let activeConfigs: any = {};
    let savedCustom: any[] = [];
    let hasLocalSelection = false;
    async function load() {
    try {
      const savedKeys = localStorage.getItem("aranet_selected_keys");
      if (savedKeys) {
        hasLocalSelection = true;
        setSelectedKeys(JSON.parse(savedKeys));
      }
      // fertiSelectedKeys/hiddenFertiKeysOnChart were never persisted before - every reload fell
      // back to the hardcoded default (FERTI_METRIC_KEYS, which includes "Bulk EC"), silently
      // undoing whatever the user had unchecked. Now behaves exactly like selectedKeys above.
      const savedFertiKeys = localStorage.getItem("aranet_ferti_selected_keys");
      if (savedFertiKeys) {
        setFertiSelectedKeys(JSON.parse(savedFertiKeys));
      }
      const savedHiddenFertiKeys = localStorage.getItem("aranet_hidden_ferti_keys");
      if (savedHiddenFertiKeys) {
        setHiddenFertiKeysOnChart(JSON.parse(savedHiddenFertiKeys));
      }
      const savedHiddenKeys = localStorage.getItem("aranet_hidden_keys");
      if (savedHiddenKeys) {
        setHiddenKeysOnChart(JSON.parse(savedHiddenKeys));
      }

      const savedConfigs = localStorage.getItem("aranet_metric_configs");
      if (savedConfigs) {
        activeConfigs = JSON.parse(savedConfigs);
      }
      const savedPlants = localStorage.getItem("aranet_plants_on_scale");
      if (savedPlants) {
        const val = Number(savedPlants);
        if (!isNaN(val) && val > 0) {
          setPlantsOnScale(val);
          setPlantsOnScaleDraft(savedPlants);
        }
      }
      const savedDensity = localStorage.getItem("aranet_density_per_m2");
      if (savedDensity) {
        const val = Number(savedDensity);
        if (!isNaN(val) && val > 0) {
          setDensityPerM2(val);
          setDensityPerM2Draft(savedDensity);
        }
      }
      const savedRatio = localStorage.getItem("aranet_conversion_ratio");
      if (savedRatio) {
        const val = Number(savedRatio);
        if (!isNaN(val) && val > 0) setConversionRatio(val);
      }
      const savedEvents = localStorage.getItem("aranet_daily_events");
      if (savedEvents) {
        const parsed = JSON.parse(savedEvents);
        const migrated: any = {};
        Object.keys(parsed).forEach(k => {
          migrated[normalizeDateKey(k)] = parsed[k];
        });
        setDailyEvents(migrated);
        setDailyEventsDraft(migrated);
      }
      const savedAdjusted = localStorage.getItem("aranet_daily_adjusted_weights");
      if (savedAdjusted) {
        const parsed = JSON.parse(savedAdjusted);
        const migrated: any = {};
        Object.keys(parsed).forEach(k => {
          migrated[normalizeDateKey(k)] = parsed[k];
        });
        setDailyAdjustedWeights(migrated);
        setDailyAdjustedWeightsDraft(migrated);
      }
      const savedShowAnn = localStorage.getItem("aranet_show_annotations");
      if (savedShowAnn) {
        setShowAnnotations(savedShowAnn === "true");
      }
      const savedTimeStep = localStorage.getItem("aranet_time_step");
      if (savedTimeStep) {
        setTimeStep(savedTimeStep);
      }
      const savedManualDrops = localStorage.getItem("aranet_manual_drops");
      if (savedManualDrops) {
        setManualDrops(JSON.parse(savedManualDrops));
      }
      const savedCustomPriva = localStorage.getItem("aranet_custom_priva_metrics");
      if (savedCustomPriva) {
        savedCustom = JSON.parse(savedCustomPriva);
        setCustomPrivaMetrics(savedCustom);
      }
    } catch (e) {
      console.error("Failed to load saved configurations", e);
    }

    // This browser has no local "Sélection des données" at all (fresh browser, cleared cache,
    // private window) - exactly the scenario where a configuration done on another browser
    // looked entirely lost even though nothing was actually deleted anywhere. Pull the last
    // automatically-saved server backup instead of falling back straight to factory defaults.
    if (!hasLocalSelection) {
      try {
        const res = await fetch("/api/aranet/dashboard-config");
        const data = await res.json();
        const backup = data?.config;
        if (backup && !cancelled) {
          if (Array.isArray(backup.selectedKeys) && backup.selectedKeys.length > 0) setSelectedKeys(backup.selectedKeys);
          if (Array.isArray(backup.fertiSelectedKeys)) setFertiSelectedKeys(backup.fertiSelectedKeys);
          if (Array.isArray(backup.hiddenKeysOnChart)) setHiddenKeysOnChart(backup.hiddenKeysOnChart);
          if (Array.isArray(backup.hiddenFertiKeysOnChart)) setHiddenFertiKeysOnChart(backup.hiddenFertiKeysOnChart);
          if (backup.metricConfigs && typeof backup.metricConfigs === "object") activeConfigs = backup.metricConfigs;
          if (Array.isArray(backup.customPrivaMetrics)) {
            savedCustom = backup.customPrivaMetrics;
            setCustomPrivaMetrics(savedCustom);
          }
          if (typeof backup.plantsOnScale === "number" && backup.plantsOnScale > 0) {
            setPlantsOnScale(backup.plantsOnScale);
            setPlantsOnScaleDraft(String(backup.plantsOnScale));
          }
          if (typeof backup.densityPerM2 === "number" && backup.densityPerM2 > 0) {
            setDensityPerM2(backup.densityPerM2);
            setDensityPerM2Draft(String(backup.densityPerM2));
          }
          if (typeof backup.conversionRatio === "number" && backup.conversionRatio > 0) setConversionRatio(backup.conversionRatio);
        }
      } catch (e) {
        console.error("Failed to load server backup of data selection:", e);
      }
    }

    // Merge/initialize missing configs for both built-in and saved custom metrics
    const combined = [...PLOTTABLE_METRICS, ...savedCustom];
    combined.forEach(m => {
      if (!activeConfigs[m.key]) {
        activeConfigs[m.key] = {
          unit: m.units[0]?.id || "custom",
          range: "24h",
          axis: "left"
        };
      }
    });

    if (!cancelled) {
      setMetricConfigs(activeConfigs);
      setIsLoaded(true);
    }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Seed the draft copies once loading (including any server-backup restore above) has
  // settled, so "Sélection des données" starts in sync with the validated state.
  useEffect(() => {
    if (!isLoaded) return;
    setSelectedKeysDraft(selectedKeys);
    setFertiSelectedKeysDraft(fertiSelectedKeys);
    setMetricConfigsDraft(metricConfigs);
    setCustomPrivaMetricsDraft(customPrivaMetrics);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // Save to localStorage when selectedKeys or metricConfigs change (only after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("aranet_selected_keys", JSON.stringify(selectedKeys));
      localStorage.setItem("aranet_hidden_keys", JSON.stringify(hiddenKeysOnChart));
      localStorage.setItem("aranet_ferti_selected_keys", JSON.stringify(fertiSelectedKeys));
      localStorage.setItem("aranet_hidden_ferti_keys", JSON.stringify(hiddenFertiKeysOnChart));
      localStorage.setItem("aranet_metric_configs", JSON.stringify(metricConfigs));
      localStorage.setItem("aranet_plants_on_scale", String(plantsOnScale));
      localStorage.setItem("aranet_density_per_m2", String(densityPerM2));
      localStorage.setItem("aranet_conversion_ratio", String(conversionRatio));
      localStorage.setItem("aranet_daily_events", JSON.stringify(dailyEvents));
      localStorage.setItem("aranet_daily_adjusted_weights", JSON.stringify(dailyAdjustedWeights));
      localStorage.setItem("aranet_show_annotations", String(showAnnotations));
      localStorage.setItem("aranet_custom_priva_metrics", JSON.stringify(customPrivaMetrics));
      localStorage.setItem("aranet_time_step", timeStep);
      localStorage.setItem("aranet_manual_drops", JSON.stringify(manualDrops));
    } catch (e) {
      console.error("Failed to save configurations", e);
    }
  }, [selectedKeys, hiddenKeysOnChart, fertiSelectedKeys, hiddenFertiKeysOnChart, metricConfigs, isLoaded, plantsOnScale, densityPerM2, conversionRatio, dailyEvents, dailyAdjustedWeights, showAnnotations, customPrivaMetrics, timeStep, manualDrops]);

  // Automatic full backup of "Sélection des données" to Supabase (debounced) - see
  // supabase_migrations/008_dashboard_config_backup.sql. Distinct from the narrower
  // metric-roles/priva-selected-points/selected-sensors mirrors below (which only cover what
  // the cron needs): this is the full picture - axis/color/smoothing/custom-name per sensor,
  // custom Priva points, physiological parameters - so a fresh browser can restore the whole
  // screen at once via the fetch in the load effect above, instead of the user having to
  // reconfigure everything from scratch just because they opened a different browser/session.
  const dashboardConfigBackupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (dashboardConfigBackupTimeoutRef.current) clearTimeout(dashboardConfigBackupTimeoutRef.current);
    dashboardConfigBackupTimeoutRef.current = setTimeout(() => {
      fetch("/api/aranet/dashboard-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            selectedKeys,
            fertiSelectedKeys,
            hiddenKeysOnChart,
            hiddenFertiKeysOnChart,
            metricConfigs,
            customPrivaMetrics,
            plantsOnScale,
            densityPerM2,
            conversionRatio
          }
        })
      }).catch(e => console.error("Failed to back up data selection:", e));
    }, 1500);
    return () => {
      if (dashboardConfigBackupTimeoutRef.current) clearTimeout(dashboardConfigBackupTimeoutRef.current);
    };
  }, [selectedKeys, fertiSelectedKeys, hiddenKeysOnChart, hiddenFertiKeysOnChart, metricConfigs, customPrivaMetrics, plantsOnScale, densityPerM2, conversionRatio, isLoaded]);

  // Mirror the current sensor selection into Supabase (debounced) so the daily archive cron
  // job - which runs server-side with no access to localStorage - knows which Aranet sensors
  // to fetch and save. Priva keys are filtered out: the archive job only covers Aranet for now.
  const selectionSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (selectionSyncTimeoutRef.current) clearTimeout(selectionSyncTimeoutRef.current);
    selectionSyncTimeoutRef.current = setTimeout(() => {
      const aranetOnlyKeys = selectedKeys.filter(k => !k.startsWith("priva_"));
      fetch("/api/aranet/selected-sensors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "climat_croissance", metricKeys: aranetOnlyKeys })
      }).catch(e => console.error("Failed to sync sensor selection:", e));
    }, 1000);
    return () => {
      if (selectionSyncTimeoutRef.current) clearTimeout(selectionSyncTimeoutRef.current);
    };
  }, [selectedKeys, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    // Priva keys are filtered out here too: the daily archive cron only covers Aranet for now.
    const aranetOnlyFertiKeys = fertiSelectedKeys.filter(k => !k.startsWith("priva_"));
    fetch("/api/aranet/selected-sensors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "ferti_irrigation", metricKeys: aranetOnlyFertiKeys })
    }).catch(e => console.error("Failed to sync ferti sensor selection:", e));
  }, [fertiSelectedKeys, isLoaded]);

  // Mirror every sensor's "Rôle Agronomique" tag into Supabase (debounced) so the daily archive
  // cron - which has no access to this React state - can resolve "which archived sensor is
  // temp_serre / radiation_sum / etc." and compute agro_daily_summary automatically every night,
  // not only when this tab is opened. Covers Priva-tagged sensors too (e.g. a Priva radiation-sum
  // point) now that the cron archives Priva readings as well - see the selected-points sync below.
  const metricRolesSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (metricRolesSyncTimeoutRef.current) clearTimeout(metricRolesSyncTimeoutRef.current);
    metricRolesSyncTimeoutRef.current = setTimeout(() => {
      const roles = Object.entries(metricConfigs)
        .filter(([, config]) => config?.agroRole && config.agroRole !== "none")
        .map(([key, config]) => ({ metricKey: key, agroRole: config.agroRole }));
      fetch("/api/aranet/metric-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles })
      }).catch(e => console.error("Failed to sync metric roles:", e));
    }, 1000);
    return () => {
      if (metricRolesSyncTimeoutRef.current) clearTimeout(metricRolesSyncTimeoutRef.current);
    };
  }, [metricConfigs, isLoaded]);

  // Mirror the currently-selected Priva sensors (fixed or custom catalog points) into Supabase
  // (debounced), the same way the Aranet selection is mirrored above - the daily archive cron
  // needs each point's variableId/deviceId/deviceGroupId to query Priva's API directly, and that
  // data only exists in allMetrics (fixed PLOTTABLE_METRICS entries + customPrivaMetrics, both
  // client-side state) - see app/api/priva/selected-points/route.ts.
  const privaSelectionSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (privaSelectionSyncTimeoutRef.current) clearTimeout(privaSelectionSyncTimeoutRef.current);
    privaSelectionSyncTimeoutRef.current = setTimeout(() => {
      const privaKeys = Array.from(new Set([...selectedKeys, ...fertiSelectedKeys])).filter(k => k.startsWith("priva_"));
      const points = privaKeys
        .map(key => {
          const m = allMetrics.find(item => item.key === key);
          if (!m || !m.variableId || !m.deviceId) return null;
          return { metricKey: key, variableId: m.variableId, deviceId: m.deviceId, deviceGroupId: m.deviceGroupId };
        })
        .filter((p): p is { metricKey: string; variableId: string; deviceId: string; deviceGroupId: string } => p !== null);
      fetch("/api/priva/selected-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points })
      }).catch(e => console.error("Failed to sync Priva selected points:", e));
    }, 1000);
    return () => {
      if (privaSelectionSyncTimeoutRef.current) clearTimeout(privaSelectionSyncTimeoutRef.current);
    };
  }, [selectedKeys, fertiSelectedKeys, allMetrics, isLoaded]);

  // Edits the draft only - see the draft-editing note near metricConfigsDraft. Applied to the
  // validated selectedKeys/fertiSelectedKeys only via handleSaveSelection.
  const toggleKey = (key: string) => {
    setSelectedKeysDraft(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleFertiKey = (key: string) => {
    setFertiSelectedKeysDraft(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(dailyEvents) !== JSON.stringify(dailyEventsDraft) ||
           JSON.stringify(dailyAdjustedWeights) !== JSON.stringify(dailyAdjustedWeightsDraft);
  }, [dailyEvents, dailyEventsDraft, dailyAdjustedWeights, dailyAdjustedWeightsDraft]);

  const handleSaveAdjustments = () => {
    setDailyEvents(dailyEventsDraft);
    setDailyAdjustedWeights(dailyAdjustedWeightsDraft);
    try {
      localStorage.setItem("aranet_daily_events", JSON.stringify(dailyEventsDraft));
      localStorage.setItem("aranet_daily_adjusted_weights", JSON.stringify(dailyAdjustedWeightsDraft));
    } catch (e) {
      console.error("Failed to save adjustments", e);
    }
  };

  // "Sélection des données" unsaved-changes detection + explicit save/discard - same pattern as
  // hasUnsavedChanges/handleSaveAdjustments above. Saving is the single point where the
  // validated selectedKeys/fertiSelectedKeys/metricConfigs/customPrivaMetrics actually change,
  // which is what (deliberately, once) kicks off the Analyseur Agronomique refetch, the
  // Climat/Croissance refetch if selectedKeys changed, and every Supabase sync effect below.
  const hasUnsavedSelectionChanges = useMemo(() => {
    return JSON.stringify(selectedKeysDraft) !== JSON.stringify(selectedKeys) ||
           JSON.stringify(fertiSelectedKeysDraft) !== JSON.stringify(fertiSelectedKeys) ||
           JSON.stringify(metricConfigsDraft) !== JSON.stringify(metricConfigs) ||
           JSON.stringify(customPrivaMetricsDraft) !== JSON.stringify(customPrivaMetrics);
  }, [selectedKeysDraft, selectedKeys, fertiSelectedKeysDraft, fertiSelectedKeys, metricConfigsDraft, metricConfigs, customPrivaMetricsDraft, customPrivaMetrics]);

  const handleSaveSelection = () => {
    setSelectedKeys(selectedKeysDraft);
    setFertiSelectedKeys(fertiSelectedKeysDraft);
    setMetricConfigs(metricConfigsDraft);
    setCustomPrivaMetrics(customPrivaMetricsDraft);
  };

  const handleDiscardSelection = () => {
    setSelectedKeysDraft(selectedKeys);
    setFertiSelectedKeysDraft(fertiSelectedKeys);
    setMetricConfigsDraft(metricConfigs);
    setCustomPrivaMetricsDraft(customPrivaMetrics);
  };

  // Native browser "leave site?" prompt when closing the tab/refreshing/navigating away with
  // unsaved "Sélection des données" changes - browsers don't allow custom text in this dialog,
  // only whether it appears at all (governed by calling preventDefault/setting returnValue).
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedSelectionChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedSelectionChanges]);

  // Switching tabs is an in-app state change, not a real page unload, so beforeunload never
  // fires for it - guarded separately with a confirmation modal (Enregistrer/Ignorer/Annuler)
  // whenever leaving "Sélection des données" with unsaved changes.
  const [pendingTabSwitch, setPendingTabSwitch] = useState<typeof activeTab | null>(null);
  const requestTabChange = (tab: typeof activeTab) => {
    if (activeTab === "selection" && tab !== "selection" && hasUnsavedSelectionChanges) {
      setPendingTabSwitch(tab);
      return;
    }
    setActiveTab(tab);
  };

  const handleAddManualDrop = () => {
    if (!newManualDropDate) return;
    const val = parseFloat(newManualDropVal) || 0;
    const normDate = normalizeDateKey(newManualDropDate);
    const dropId = getDropId(normDate, newManualDropTime);
    const guessedType = guessMovementEventType(newManualDropDirection, val);
    setManualDrops(prev => {
      const updated = {
        ...prev,
        [dropId]: {
          suddenDropTime: newManualDropTime,
          suddenDropVal: val,
          suggestedCorrectionGrams: val,
          direction: newManualDropDirection
        }
      };
      localStorage.setItem("aranet_manual_drops", JSON.stringify(updated));
      return updated;
    });
    setDailyEventsDraft(prev => ({
      ...prev,
      [dropId]: guessedType
    }));
    setDailyAdjustedWeightsDraft(prev => ({
      ...prev,
      [dropId]: val
    }));
    setDailyEvents(prev => ({
      ...prev,
      [dropId]: guessedType
    }));
    setDailyAdjustedWeights(prev => ({
      ...prev,
      [dropId]: val
    }));
    setNewManualDropDate("");
  };

  // Calls the AI black-box endpoint to explain a specific day's growth outcome, grounded in
  // that day's climate/growth summary rather than the static rule-based sentences.
  const handleAnalyzeDayWithAI = async (day: any) => {
    setAiAnalysisLoading(prev => ({ ...prev, [day.dateStr]: true }));
    setAiAnalysisError(prev => ({ ...prev, [day.dateStr]: "" }));
    try {
      const res = await fetch("/api/agro-ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateStr: day.dateStr,
          climate: day.aiContext,
          actualGain: day.actualGain,
          radiationSumJcm2: day.radiationSumJcm2,
          growthEfficiency: day.growthEfficiency,
          bestEfficiencyInRange: day.bestEfficiencyInRange,
          lostGainVsBestDay: day.lostGainVsBestDay,
          lostPercentVsBestDay: day.lostPercentVsBestDay,
          drops: (day.drops || []).map((d: WeightDropCandidate) => ({ time: d.timeStr, valGm2: d.suddenDropVal })),
          ruleBasedFindings: day.aiContext?.ruleBasedFindings || [],
          // Per-slot limiting factor (already computed against THAT slot's own target range, not
          // a single daily figure - see dynamicAgronomicData/limitingFactorsBySlot) so the model
          // reasons about when in the day something was off, not just a daily verdict.
          limitingFactorsBySlot: (day.limitingFactorsBySlot || []).map((s: any) => ({
            slot: s.label,
            limitingFactor: s.limitingFactor ? { field: s.limitingFactor.field, value: s.limitingFactor.value, targetMin: s.limitingFactor.range.min, targetMax: s.limitingFactor.range.max } : null
          }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Erreur d'analyse IA.");
      setAiAnalysisByDay(prev => ({ ...prev, [day.dateStr]: data }));
    } catch (err: any) {
      setAiAnalysisError(prev => ({ ...prev, [day.dateStr]: err.message || "Erreur d'analyse IA." }));
    } finally {
      setAiAnalysisLoading(prev => ({ ...prev, [day.dateStr]: false }));
    }
  };

  // Helper to toggle custom datapoint from full catalog. Edits the draft only - see the
  // draft-editing note near metricConfigsDraft.
  const toggleCatalogDatapoint = (dp: any) => {
    const builtIn = PLOTTABLE_METRICS.find(m => m.variableId === dp.variableId);
    const key = builtIn ? builtIn.key : `priva_custom_${dp.variableId}`;

    if (selectedKeysDraft.includes(key)) {
      setSelectedKeysDraft(prev => prev.filter(k => k !== key));
    } else {
      if (!builtIn) {
        const colors = ["#ec4899", "#f43f5e", "#a855f7", "#6366f1", "#06b6d4", "#14b8a6", "#10b981", "#84cc16", "#eab308"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newMetric = {
          key,
          name: `Priva - ${dp.name}`,
          category: `Priva - Personnalisés`,
          isPriva: true,
          variableId: dp.variableId,
          deviceId: dp.deviceId,
          deviceGroupId: dp.deviceGroupId || "none",
          color: randomColor,
          units: [{ id: dp.unit || "custom", name: dp.unit || "N/A" }]
        };

        if (!customPrivaMetricsDraft.some(m => m.key === key)) {
          setCustomPrivaMetricsDraft(prev => [...prev, newMetric]);
        }
      }
      setSelectedKeysDraft(prev => [...prev, key]);
    }
  };

  const isDatapointSelected = (dp: any) => {
    const builtIn = PLOTTABLE_METRICS.find(m => m.variableId === dp.variableId);
    const key = builtIn ? builtIn.key : `priva_custom_${dp.variableId}`;
    return selectedKeysDraft.includes(key);
  };

  // Edits the draft only. The immediate fetchActiveData() this used to fire on a unit change no
  // longer makes sense pre-save - the unit change is picked up by the normal fetch that
  // handleSaveSelection triggers once, like every other field.
  const updateMetricConfig = (key: string, field: string, value: any) => {
    setMetricConfigsDraft(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const applyGlobalSmoothing = (smooth: boolean) => {
    setMetricConfigsDraft(prev => {
      const next = { ...prev };
      allMetrics.forEach(m => {
        next[m.key] = {
          ...next[m.key],
          smooth: smooth
        };
      });
      return next;
    });
  };

  const applyGlobalWindowSize = (size: number) => {
    setMetricConfigsDraft(prev => {
      const next = { ...prev };
      allMetrics.forEach(m => {
        next[m.key] = {
          ...next[m.key],
          sgWindow: size
        };
      });
      return next;
    });
  };

  // Fetches Aranet + Priva data for an explicit date range and sensor list, and reports the
  // result via the passed setters instead of closing over one fixed range/state slot - this
  // lets Climat/Croissance and Analyseur Agronomique keep their own independent date ranges
  // (and their own rawDataMap/chartData) while still sharing the same request caches.
  const fetchDataForRange = async (
    keys: string[],
    rangeStart: Date,
    rangeEnd: Date,
    rangeApiDays: number,
    onDataMap: (dataMap: { [key: string]: any[] }) => void,
    onLoadingChange: (loading: boolean) => void,
    onError: (msg: string | null) => void,
    onPrivaError: (msg: string | null) => void
  ) => {
    if (keys.length === 0) {
      onDataMap({});
      return;
    }
    onLoadingChange(true);
    onError(null);
    onPrivaError(null);
    try {
      const aranetKeys = keys.filter(k => !k.startsWith("priva_"));
      const privaKeys = keys.filter(k => k.startsWith("priva_"));

      // 1. Fetch Aranet data in parallel
      const aranetPromises = aranetKeys.map(async (key) => {
        const m = allMetrics.find(item => item.key === key)!;
        const config = metricConfigs[key] || { unit: m.units[0].id, range: "24h", axis: "left" };

        // Scoped per metric (not just per sensor): the Aranet Cloud API caps each history
        // request at 10000 readings shared across every metric of a sensor. A multi-metric
        // sensor like the slab EC/WC probe (temp, VWC, bulk EC, pore EC) would silently drop
        // its later metrics - pore EC in particular - once temp+VWC alone filled the cap over
        // a long enough range. Passing "metric" scopes each request (and its cache) to a
        // single channel so every metric gets its own 10000-reading budget.
        const cacheKey = `aranet_${m.sensorId}_${m.metricId}_${rangeApiDays}_${config.unit}`;
        let readingsData = aranetCacheRef.current[cacheKey];
        if (!readingsData) {
          try {
            const sessionData = sessionStorage.getItem("aranet_query_cache_" + cacheKey);
            if (sessionData) {
              readingsData = JSON.parse(sessionData);
              aranetCacheRef.current[cacheKey] = readingsData;
            }
          } catch (e) {
            console.error("Failed to read sessionStorage for Aranet:", e);
          }
        }

        if (!readingsData) {
          const res = await fetch(
            `/api/aranet?action=history&sensor=${m.sensorId}&metric=${m.metricId}&days=${rangeApiDays}&unit=${config.unit}`
          );
          if (!res.ok) throw new Error(`Erreur pour ${m.name}`);
          const resData = await res.json();
          if (!resData.success) throw new Error(resData.error || `Erreur pour ${m.name}`);
          readingsData = resData.readings || [];

          aranetCacheRef.current[cacheKey] = readingsData;
          safeSetSessionStorage("aranet_query_cache_" + cacheKey, JSON.stringify(readingsData));
        }

        let readings = readingsData.filter((r: any) => r.metric === m.metricId).map((r: any) => ({ ...r }));

        // Filter readings client-side based on the selected date range
        const startMs = rangeStart.getTime();
        const endMs = rangeEnd.getTime();
        readings = readings.filter((r: any) => {
          const t = new Date(r.time).getTime();
          return t >= startMs && t <= endMs;
        });

        if (key === "plant_weight_gain") {
          // Group readings by local day to calculate daily gain relative to midnight
          const readingsByDay: { [dateStr: string]: any[] } = {};
          
          readings.forEach((r: any) => {
            const d = new Date(r.time);
            const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!readingsByDay[localDateStr]) {
              readingsByDay[localDateStr] = [];
            }
            readingsByDay[localDateStr].push(r);
          });

          const computedReadings: any[] = [];
          
          Object.keys(readingsByDay).forEach((dateStr) => {
            const dayReadings = readingsByDay[dateStr];
            dayReadings.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
            
            const baselineObj = dayReadings[0];
            const baseline = baselineObj ? baselineObj.value : 0;

            dayReadings.forEach((r) => {
              computedReadings.push({
                ...r,
                rawScaleWeight: r.value,
                value: r.value - baseline // cumulative weight gain relative to midnight
              });
            });
          });

          computedReadings.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
          readings = computedReadings;
        }

        return {
          key,
          readings
        };
      });

      // 2. Fetch Priva data in a single batch
      let privaResults: { key: string; readings: any[] }[] = [];
      if (privaKeys.length > 0) {
        const privaMetricsToQuery = privaKeys.map(k => {
          const m = allMetrics.find(item => item.key === k)!;
          return {
            variableId: m.variableId,
            deviceId: m.deviceId,
            deviceGroupId: m.deviceGroupId
          };
        });

        // Ensure we cap the end date to avoid today midnight 403 restriction
        let adjustedStart = rangeStart;
        let adjustedEnd = rangeEnd;

        const todayMidnight = new Date();
        todayMidnight.setUTCHours(0, 0, 0, 0);
        const maxEndAllowed = new Date(todayMidnight.getTime() - 60000); // 1 minute before today midnight UTC

        if (adjustedEnd.getTime() > maxEndAllowed.getTime()) {
          adjustedEnd = maxEndAllowed;
        }

        // Ensure we cap the start date to avoid rolling history 403 restriction (max 5 days ago)
        const fiveDaysAgo = new Date(todayMidnight.getTime() - 5 * 24 * 3600 * 1000);
        if (adjustedStart.getTime() < fiveDaysAgo.getTime()) {
          adjustedStart = fiveDaysAgo;
        }

        if (adjustedStart.getTime() >= adjustedEnd.getTime()) {
          adjustedStart = new Date(adjustedEnd.getTime() - 24 * 3600 * 1000);
        }

        const cacheKey = `${adjustedStart.toISOString()}_${adjustedEnd.toISOString()}_${privaKeys.sort().join(",")}`;
        let series = [];
        let hasCache = false;

        let cachedData = privaCacheRef.current[cacheKey];
        if (!cachedData) {
          try {
            const sessionData = sessionStorage.getItem("priva_query_cache_" + cacheKey);
            if (sessionData) {
              cachedData = JSON.parse(sessionData);
              privaCacheRef.current[cacheKey] = cachedData;
            }
          } catch (e) {
            console.error("Failed to read sessionStorage query cache:", e);
          }
        }

        if (cachedData) {
          series = cachedData;
          hasCache = true;
          console.log("Serving Priva historical data from client-side cache for key:", cacheKey);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (rangeEnd.getTime() >= today.getTime()) {
            onPrivaError("Info : L'API Priva n'autorise pas l'accès aux données de la journée en cours en temps réel. Les courbes s'arrêtent à hier 23h59.");
          }
        } else if (Date.now() < privaLockoutExpiryRef.current) {
          hasCache = true;
          const remainingSecs = Math.ceil((privaLockoutExpiryRef.current - Date.now()) / 1000);
          onPrivaError(`Info : Limite d'appels API atteinte. Actualisation automatique en pause (cooldown actif de ${remainingSecs}s pour laisser recharger le quota).`);
        }

        if (!hasCache) {
          const valRes = await fetch("/api/priva", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              startTime: adjustedStart.toISOString(),
              endTime: adjustedEnd.toISOString(),
              datapoints: privaMetricsToQuery
            })
          });

          if (!valRes.ok) {
            const errDetail = await valRes.json().catch(() => ({}));
            
            if (valRes.status === 429 || valRes.status === 403 || valRes.status === 423) {
              // 423 = Locked - Priva returns this (alongside 429/403) when the same query is hit
              // too frequently/concurrently, not a real client error - same cooldown treatment.
              privaLockoutExpiryRef.current = Date.now() + 60000; // Lock out for 60 seconds
              console.warn("Priva API Quota Exceeded (429/403/423). Cooldown active.");
            } else {
              console.error("Priva API Error in fetchActiveData:", valRes.status, errDetail);
            }

            let errMsg = errDetail.error || "Erreur de connexion";
            if (errDetail.details) {
              try {
                const nested = JSON.parse(errDetail.details);
                if (nested.message) errMsg = nested.message;
                else if (nested.error) errMsg = nested.error;
              } catch {
                errMsg = errDetail.details;
              }
            }
            onPrivaError(`Données Priva indisponibles (Status ${valRes.status}) : ${errMsg}`);
          } else {
            const valData = await valRes.json();
            series = valData.data || [];
            privaCacheRef.current[cacheKey] = series;
            safeSetSessionStorage("priva_query_cache_" + cacheKey, JSON.stringify(series));

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (rangeEnd.getTime() >= today.getTime()) {
              onPrivaError("Info : L'API Priva n'autorise pas l'accès aux données de la journée en cours en temps réel. Les courbes s'arrêtent à hier 23h59.");
            }
          }
        }

        privaResults = privaKeys.map(key => {
          const m = allMetrics.find(item => item.key === key)!;
          const matchSeries = series.find((s: any) => s.datapoint && s.datapoint.variableId === m.variableId);
          const readings = matchSeries && matchSeries.measurements ? matchSeries.measurements
            .map((v: any) => ({
              time: v.timestampUtc,
              value: parseFloat(v.value)
            }))
            .filter((v: any) => !isNaN(v.value)) : [];

          return {
            key,
            readings
          };
        });
      }

      const aranetResults = await Promise.all(aranetPromises);
      const results = [...aranetResults, ...privaResults];

      const dataMap: { [key: string]: any[] } = {};
      results.forEach(res => {
        dataMap[res.key] = res.readings;
      });
      
      onDataMap(dataMap);
    } catch (err: any) {
      console.error(err);
      onError("Échec du chargement des données.");
    } finally {
      onLoadingChange(false);
    }
  };

  const fetchActiveData = () => fetchDataForRange(
    selectedKeys, startDateTime, endDateTime, apiDaysRequested,
    setRawDataMap, setLoading, setError, setPrivaChartError
  );

  // Debounce ref to deduplicate rapid multiple fetches on state change
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const privaCacheRef = useRef<Record<string, any>>({});
  const aranetCacheRef = useRef<Record<string, any>>({});
  const privaLockoutExpiryRef = useRef<number>(0);

  // Re-fetch when selections, configurations, or date range changes (debounced by 300ms)
  useEffect(() => {
    if (Object.keys(metricConfigs).length > 0) {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      fetchTimeoutRef.current = setTimeout(() => {
        fetchActiveData();
      }, 300);
    }
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [selectedKeys, startDate, endDate]);

  // Ferti Irrigation tab data fetch - independent of the main fetchActiveData/selectedKeys, but
  // shares fetchDataForRange (Aranet + Priva) so any sensor from either source can be plotted here.
  const fetchFertiData = () => {
    const start = new Date(fertiStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(fertiEndDate);
    end.setHours(23, 59, 59, 999);
    const daysRequested = Math.min(30, Math.max(1, Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))));
    return fetchDataForRange(
      fertiSelectedKeys, start, end, daysRequested,
      setFertiRawDataMap, setFertiLoading, setFertiError, setFertiPrivaError
    );
  };

  const fertiFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (fertiFetchTimeoutRef.current) clearTimeout(fertiFetchTimeoutRef.current);
    fertiFetchTimeoutRef.current = setTimeout(() => {
      fetchFertiData();
    }, 300);
    return () => {
      if (fertiFetchTimeoutRef.current) clearTimeout(fertiFetchTimeoutRef.current);
    };
  }, [fertiSelectedKeys, fertiStartDate, fertiEndDate]);

  // Delegate to buildChartRows (same pipeline as the Climat/Croissance chart) rather than a plain
  // per-key binning, so "plant_weight_gain" here goes through the exact same weight-movement
  // detection/correction as everywhere else - a raw bin of the scale sensor would plot the
  // uncorrected absolute weight instead of the corrected cumulative gain.
  const fertiChartData = useMemo(
    () => buildChartRows(fertiRawDataMap, fertiSelectedKeys, metricConfigs, plantsOnScale, densityPerM2, dailyEvents, dailyAdjustedWeights, manualDrops, fertiTimeStep),
    [fertiRawDataMap, fertiSelectedKeys, fertiTimeStep, metricConfigs, plantsOnScale, densityPerM2, dailyEvents, dailyAdjustedWeights, manualDrops]
  );

  // Same per-minute binning, but over the Analyseur Agronomique tab's own date range, so the
  // advanced analysis can factor in irrigation/substrate conditions (VWC, EC, slab/plant weight)
  // day by day alongside the climate data.
  const agroFertiChartData = useMemo(() => {
    if (Object.keys(agroFertiRawDataMap).length === 0) return [];
    const bins: { [timeMs: number]: any } = {};
    // agroAnalysisKeys, not fertiSelectedKeys - agroFertiRawDataMap is fetched with the same
    // broader pool as agroRawDataMap (see agroAnalysisKeys above), so a role-tagged sensor not
    // ticked FERTI must still be binned here or it's fetched for nothing.
    agroAnalysisKeys.forEach(key => {
      const readings = (agroFertiRawDataMap[key] || []).filter((r: any) => r && r.value !== null && r.value !== undefined && !isNaN(Number(r.value)));
      readings.forEach((r: any) => {
        const date = new Date(r.time);
        if (isNaN(date.getTime())) return;
        date.setSeconds(0, 0);
        const timeMs = date.getTime();
        if (!bins[timeMs]) {
          bins[timeMs] = { time: timeMs };
        }
        bins[timeMs][key] = Number(r.value);
      });
    });
    return Object.values(bins).sort((a: any, b: any) => a.time - b.time);
  }, [agroFertiRawDataMap, agroAnalysisKeys]);

  // Per-day averages of every Ferti Irrigation sensor, keyed by the same dateStr used to group
  // agroChartData - the join key between the two datasets in dynamicAgronomicData below.
  const agroFertiDailyAverages = useMemo(() => {
    const result: { [dateStr: string]: { [key: string]: number } } = {};
    if (agroFertiChartData.length === 0) return result;
    const byDay: { [dateStr: string]: any[] } = {};
    agroFertiChartData.forEach((row: any) => {
      const dateStr = getStableDateStr(new Date(row.time));
      if (!byDay[dateStr]) byDay[dateStr] = [];
      byDay[dateStr].push(row);
    });
    Object.keys(byDay).forEach(dateStr => {
      const rows = byDay[dateStr];
      const dayAvgs: { [key: string]: number } = {};
      agroAnalysisKeys.forEach(key => {
        const valid = rows.filter(r => r[key] !== undefined && r[key] !== null && !isNaN(Number(r[key])));
        if (valid.length > 0) {
          dayAvgs[key] = valid.reduce((s, r) => s + Number(r[key]), 0) / valid.length;
        }
      });
      result[dateStr] = dayAvgs;
    });
    return result;
  }, [agroFertiChartData, agroAnalysisKeys]);

  // Debounced state update to make Brush dragging butter-smooth
  const updateZoomTimeRangeDebounced = useMemo(() => {
    let timer: NodeJS.Timeout;
    return (range: { min: number; max: number } | null) => {
      clearTimeout(timer);
      if (range === null) {
        setZoomTimeRange(null);
        return;
      }
      timer = setTimeout(() => {
        setZoomTimeRange(range);
      }, 200); // 200ms debounce
    };
  }, []);

  // Reset zoom time range when dates change
  useEffect(() => {
    updateZoomTimeRangeDebounced(null);
  }, [startDate, endDate]);

  // Merge datasets into a single chart structure based on absolute timestamp alignment
  const chartData = useMemo(
    () => buildChartRows(rawDataMap, selectedKeys, metricConfigs, plantsOnScale, densityPerM2, dailyEvents, dailyAdjustedWeights, manualDrops, timeStep),
    [rawDataMap, selectedKeys, metricConfigs, plantsOnScale, densityPerM2, dailyEvents, dailyAdjustedWeights, timeStep, manualDrops]
  );

  // Resolves a role-tagged (or, failing that, name-matched) sensor key from the validated
  // Climat/Croissance selection - same "tag first, name fallback" pattern as keysByRole inside
  // dynamicAgronomicData, but scoped to selectedKeys/metricConfigs (this chart's own selection)
  // rather than agroAnalysisKeys (the Analyseur Agronomique tab's independent one).
  const resolveClimateKey = (roles: string[], fallbackTest: (k: string) => boolean): string | null => {
    const tagged = selectedKeys.find(k => roles.includes(metricConfigs[k]?.agroRole));
    if (tagged) return tagged;
    const fallback = selectedKeys.find(k => {
      const role = metricConfigs[k]?.agroRole;
      return (!role || role === "none") && fallbackTest(k);
    });
    return fallback || null;
  };

  // "Efficience photosynthétique" sub-tab (Aréel / IVL) - formulas as given: PAR_int = R_ext ×
  // translucidité × 2.2 ; A25 = 44 × (1 - e^(-0.0022 × PAR_int)) × ((CO2-90)/(CO2+320)), 0 si
  // CO2 ≤ 90 ; F_T = 1 + (T-25) × (0.00014×CO2 - 0.092) ; Aréel = A25 × F_T (axe gauche,
  // μmol CO2·m⁻²·s⁻¹) ; IVL(%) = 126.9 × ((CO2-90)/(CO2+320)) × F_T, borné [0,100] (axe droit).
  // R_ext = radiation instantanée EXTÉRIEURE (W/m², même capteur que radKeys ailleurs dans ce
  // fichier - repli vers "irr_out"/Priva météo) ; T = température serre (pas extérieure).
  const co2Key = resolveClimateKey(["co2"], k => k.toLowerCase().includes("co2"));
  const radKey = resolveClimateKey(["radiation_instant"], k => k.toLowerCase().includes("irr_out") || k.toLowerCase().includes("radiation") || k.toLowerCase().includes("solar") || k.toLowerCase().includes("rayonnement"));
  const tempKey = resolveClimateKey(["temp_serre"], k => k.toLowerCase().includes("temp") && !k.toLowerCase().includes("out") && !k.toLowerCase().includes("target") && !k.toLowerCase().includes("water"));

  // "Croissance en direct" - a rolling 15-minute gain rate expressed as a % deviation from that
  // calendar day's own average rate, so the curve reads growth speed right now rather than an
  // absolute, hard-to-interpret g/m² figure. 0% = exactly the day's average pace (e.g. 96 g/m²
  // over a day = 1 g/15min average, so any 15-minute window gaining exactly 1g sits at 0%);
  // +100% = growing at twice the day's average pace; -100% = no growth at all over that window
  // (clamped, since growth can't meaningfully go "more negative" than flat for this reading).
  // Keyed by row.time so it can be merged into photosynthesisChartData below without a second
  // pass over chartData.
  const growthRateByTime = useMemo(() => {
    const result = new Map<number, number | null>();
    const gainRows = chartData
      .filter((r: any) => r.plant_weight_gain !== undefined && r.plant_weight_gain !== null && !isNaN(Number(r.plant_weight_gain)))
      .map((r: any) => ({ time: r.time, value: Number(r.plant_weight_gain) }))
      .sort((a, b) => a.time - b.time);
    if (gainRows.length === 0) return result;

    const byDay = new Map<string, { time: number; value: number }[]>();
    gainRows.forEach(r => {
      const dateStr = getStableDateStr(new Date(r.time));
      if (!byDay.has(dateStr)) byDay.set(dateStr, []);
      byDay.get(dateStr)!.push(r);
    });
    // 96 = number of 15-minute slices in 24h - the day's average rate is its own total gain
    // (last reading minus first, in g/m²) spread evenly over those slices.
    const dailyAvgRateByDay = new Map<string, number | null>();
    byDay.forEach((rows, dateStr) => {
      if (rows.length < 2) { dailyAvgRateByDay.set(dateStr, null); return; }
      const totalGainG = (rows[rows.length - 1].value - rows[0].value) * 1000;
      dailyAvgRateByDay.set(dateStr, totalGainG / 96);
    });

    const FIFTEEN_MIN_MS = 15 * 60 * 1000;
    let lookbackIdx = 0;
    gainRows.forEach((r, idx) => {
      const dailyAvg = dailyAvgRateByDay.get(getStableDateStr(new Date(r.time)));
      if (!dailyAvg) { result.set(r.time, null); return; }

      const targetTime = r.time - FIFTEEN_MIN_MS;
      if (lookbackIdx > idx) lookbackIdx = 0;
      while (lookbackIdx < idx && gainRows[lookbackIdx + 1].time <= targetTime) lookbackIdx++;
      if (gainRows[lookbackIdx].time > targetTime) { result.set(r.time, null); return; }

      const rollingGainG = (r.value - gainRows[lookbackIdx].value) * 1000;
      const pct = Math.min(100, Math.max(-100, ((rollingGainG - dailyAvg) / dailyAvg) * 100));
      result.set(r.time, Number(pct.toFixed(1)));
    });
    return result;
  }, [chartData]);

  const photosynthesisChartData = useMemo(() => {
    if (!co2Key || !radKey || !tempKey) return [];
    const translucidity = glassTranslucidityPercent !== "" && !isNaN(Number(glassTranslucidityPercent))
      ? Number(glassTranslucidityPercent) / 100
      : 0.70;

    return chartData
      .map((row: any) => {
        const co2 = Number(row[co2Key]);
        const rExt = Number(row[radKey]);
        const temp = Number(row[tempKey]);
        const growthRatePercent = growthRateByTime.get(row.time) ?? null;

        if (isNaN(co2) || isNaN(rExt) || isNaN(temp)) {
          return { time: row.time, formattedTime: row.formattedTime, formattedDate: row.formattedDate, aReel: null, ivl: null, growthRatePercent };
        }

        if (co2 <= 90) {
          return { time: row.time, formattedTime: row.formattedTime, formattedDate: row.formattedDate, aReel: 0, ivl: 0, growthRatePercent };
        }

        const parInt = rExt * translucidity * 2.2;
        const co2Ratio = (co2 - 90) / (co2 + 320);
        const a25 = 44 * (1 - Math.exp(-0.0022 * parInt)) * co2Ratio;
        const fT = 1 + (temp - 25) * (0.00014 * co2 - 0.092);
        const aReel = Math.max(0, a25 * fT);
        const ivl = Math.min(100, Math.max(0, 126.9 * co2Ratio * fT));

        return {
          time: row.time,
          formattedTime: row.formattedTime,
          formattedDate: row.formattedDate,
          aReel: Number(aReel.toFixed(2)),
          ivl: Number(ivl.toFixed(1)),
          growthRatePercent
        };
      })
      .sort((a, b) => a.time - b.time);
  }, [chartData, co2Key, radKey, tempKey, glassTranslucidityPercent, growthRateByTime]);

  // Optional Savitzky-Golay smoothing on "Croissance en direct" specifically - the raw rolling
  // rate is already 15-minute-windowed but still jumpy point to point, and unlike a real sensor
  // this synthetic series has no metricConfigs entry of its own, so its own small
  // enable/window-size state lives here rather than piggybacking on updateMetricConfig.
  const [growthRateSmooth, setGrowthRateSmooth] = useState(false);
  const [growthRateSgWindow, setGrowthRateSgWindow] = useState(9);
  const smoothedPhotosynthesisChartData = useMemo(() => {
    if (!growthRateSmooth) return photosynthesisChartData;
    // Same "filter nulls, smooth the contiguous run, map back by time" pattern used for real
    // sensors in buildChartRows - a Savitzky-Golay window can't cross over a gap meaningfully.
    const withValue = photosynthesisChartData.filter((r: any) => r.growthRatePercent !== null && r.growthRatePercent !== undefined);
    if (withValue.length === 0) return photosynthesisChartData;
    let windowSize = growthRateSgWindow;
    if (windowSize % 2 === 0) windowSize += 1;
    const smoothedValues = applySavitzkyGolay(withValue.map((r: any) => r.growthRatePercent), windowSize, 2);
    const smoothedByTime = new Map<number, number>();
    withValue.forEach((r: any, idx: number) => smoothedByTime.set(r.time, Number(smoothedValues[idx].toFixed(1))));
    return photosynthesisChartData.map((r: any) => ({
      ...r,
      growthRatePercent: smoothedByTime.has(r.time) ? smoothedByTime.get(r.time) : r.growthRatePercent
    }));
  }, [photosynthesisChartData, growthRateSmooth, growthRateSgWindow]);

  // Analyseur Agronomique keeps its own date range (agroRawDataMap, fetched separately below)
  // so browsing a different period there never changes what the Climat/Croissance chart shows.
  // The detected movements are captured into a ref here (via buildChartRows' out-param) so
  // dynamicAgronomicData below can reuse them instead of re-running the whole detection pass
  // (MAD + sliding window + per-cluster stabilization search) a second time on every recompute.
  const agroMovementsRef = useRef<WeightDropCandidate[]>([]);
  const agroChartData = useMemo(() => {
    const movementsOut: WeightDropCandidate[] = [];
    // Must process agroAnalysisKeys here, not selectedKeys - agroRawDataMap is now fetched using
    // agroAnalysisKeys (every role-tagged sensor + the weight/gain sensors, independent of chart
    // display selection - see agroAnalysisKeys above). Processing only selectedKeys would silently
    // drop the plant_weight_gain column (and its drop-detection/correction) whenever "Cumulative
    // Gain" isn't ticked for Climat/Croissance display, breaking the correction for the analysis
    // even though the data was actually fetched.
    const rows = buildChartRows(agroRawDataMap, agroAnalysisKeys, metricConfigs, plantsOnScale, densityPerM2, dailyEvents, dailyAdjustedWeights, manualDrops, timeStep, movementsOut);
    agroMovementsRef.current = movementsOut;
    return rows;
  }, [agroRawDataMap, agroAnalysisKeys, metricConfigs, plantsOnScale, densityPerM2, dailyEvents, dailyAdjustedWeights, timeStep, manualDrops]);

  // Dynamic Advanced Agronomic analysis based on the Analyseur Agronomique tab's own,
  // independent date range (agroChartData) - not the Climat/Croissance chart's range.
  const dynamicAgronomicData = useMemo(() => {
    if (agroChartData.length === 0) return [];

    // Group agroChartData by date string
    const daysMap: { [dateStr: string]: any[] } = {};
    agroChartData.forEach(row => {
      const d = new Date(row.time);
      const dateStr = getStableDateStr(d);
      if (!daysMap[dateStr]) daysMap[dateStr] = [];
      daysMap[dateStr].push(row);
    });

    // Ferti Irrigation rows (substrate VWC/EC, slab/plant weight), grouped by the same dateStr
    // join key, so every audit/average helper below sees both datasets as one continuous "rows"
    // list per day - the advanced analysis isn't climate-only.
    const daysMapFerti: { [dateStr: string]: any[] } = {};
    agroFertiChartData.forEach((row: any) => {
      const dateStr = getStableDateStr(new Date(row.time));
      if (!daysMapFerti[dateStr]) daysMapFerti[dateStr] = [];
      daysMapFerti[dateStr].push(row);
    });

    // Every drop/rise across the whole continuous chart range was already detected once while
    // building agroChartData above (agroMovementsRef) - reused here instead of re-running
    // detectWeightMovements a second time on the same data. Manually-declared drops are merged
    // in below, keyed per-drop so several the same day are each tracked instead of only the max.
    const dropsByIdAllDays: { [id: string]: WeightDropCandidate } = {};
    agroMovementsRef.current.forEach(d => { dropsByIdAllDays[d.id] = d; });
    const allDropsSorted = Object.values(dropsByIdAllDays).sort((a, b) => a.time - b.time);

    return Object.keys(daysMap).map((dateStr, index) => {
      // Merge by timestamp rather than concatenating: agroFertiChartData bins its own raw data
      // map directly (no buildChartRows pass, so no divisor/multiplier conversion and no weight-
      // drop correction), and since plant_weight_gain is unconditionally part of agroAnalysisKeys
      // it gets fetched into BOTH maps - concatenating produced two unit-inconsistent versions of
      // plant_weight_gain per day (corrected kg/m² from daysMap, raw uncorrected from
      // daysMapFerti), and the first/last-reading gain calc below could pick either one depending
      // on sort order, producing wildly wrong cumulative gain. Applying daysMap last so its
      // corrected values win over any raw duplicate for the same key/timestamp.
      const rowsByTime: { [t: number]: any } = {};
      (daysMapFerti[dateStr] || []).forEach(r => { rowsByTime[r.time] = { ...rowsByTime[r.time], ...r }; });
      (daysMap[dateStr] || []).forEach(r => { rowsByTime[r.time] = { ...rowsByTime[r.time], ...r }; });
      const rows = Object.values(rowsByTime);
      const audits: any[] = [];
      let lostPercent = 0;
      let score = 100;
      const physiologicalReasons: string[] = [];
      const actionPlans: string[] = [];

      // Averages and stats helpers
      const getAverage = (key: string) => {
        const valid = rows.filter(r => r[key] !== undefined && r[key] !== null && !isNaN(r[key]));
        if (valid.length === 0) return null;
        return valid.reduce((sum, r) => sum + r[key], 0) / valid.length;
      };

      const getMax = (key: string) => {
        const valid = rows.filter(r => r[key] !== undefined && r[key] !== null && !isNaN(r[key])).map(r => r[key]);
        if (valid.length === 0) return null;
        return Math.max(...valid);
      };

      const getLast = (key: string) => {
        const valid = rows.filter(r => r[key] !== undefined && r[key] !== null && !isNaN(r[key]));
        if (valid.length === 0) return null;
        const sorted = [...valid].sort((a, b) => a.time - b.time);
        return sorted[sorted.length - 1][key];
      };

      // Night windows are commonly expressed as e.g. 21h->6h, which wraps past midnight - a plain
      // "hr >= start && hr < end" can never be true for such a range (no hour is both >=21 and <6),
      // so every "night" stat silently returned null before this handled the wraparound case.
      const isHourInRange = (hr: number, startHour: number, endHour: number) =>
        startHour <= endHour ? (hr >= startHour && hr < endHour) : (hr >= startHour || hr < endHour);

      const getStatsForTimeRange = (key: string, startHour: number, endHour: number) => {
        const valid = rows.filter(r => {
          if (r[key] === undefined || r[key] === null || isNaN(r[key])) return false;
          const hr = new Date(r.time).getHours();
          return isHourInRange(hr, startHour, endHour);
        });
        if (valid.length === 0) return null;
        const avg = valid.reduce((sum, r) => sum + r[key], 0) / valid.length;
        const values = valid.map(r => r[key]);
        return { avg, max: Math.max(...values), min: Math.min(...values) };
      };

      // A flat 24h (or even flat day/night) average can hide the actual shape of the curve -
      // e.g. a chassis opened wide for 2h at midday and shut the rest of the day averages out
      // to a small, meaningless number. This looks at the actual trend across the window
      // (optionally restricted to an hour range) by comparing the first third of readings to
      // the last third, so audits can reason about "rising/falling/stable during the day"
      // instead of a single blended number.
      const getTrend = (key: string, startHour?: number, endHour?: number) => {
        const valid = rows
          .filter(r => {
            if (r[key] === undefined || r[key] === null || isNaN(r[key])) return false;
            if (startHour === undefined || endHour === undefined) return true;
            return isHourInRange(new Date(r.time).getHours(), startHour, endHour);
          })
          .sort((a, b) => a.time - b.time);
        if (valid.length < 6) return null;

        const third = Math.max(1, Math.floor(valid.length / 3));
        const firstSlice = valid.slice(0, third);
        const lastSlice = valid.slice(-third);
        const firstAvg = firstSlice.reduce((s, r) => s + r[key], 0) / firstSlice.length;
        const lastAvg = lastSlice.reduce((s, r) => s + r[key], 0) / lastSlice.length;
        const allValues = valid.map(r => r[key]);
        const overallAvg = allValues.reduce((s, v) => s + v, 0) / allValues.length;
        const overallMax = Math.max(...allValues);
        const overallMin = Math.min(...allValues);

        const delta = lastAvg - firstAvg;
        // Relative to the window's own amplitude, not an arbitrary fixed unit, so this behaves
        // consistently whether the metric is ppm, %, °C or m/s.
        const amplitude = Math.max(overallMax - overallMin, 0.001);
        const relativeChange = delta / amplitude;

        let trend: "hausse" | "baisse" | "stable" = "stable";
        if (relativeChange > 0.2) trend = "hausse";
        else if (relativeChange < -0.2) trend = "baisse";

        return { trend, firstAvg, lastAvg, overallAvg, overallMax, overallMin };
      };

      // Sensor category detection: the standardized "Rôle Agronomique" tag (set in Sélection des
      // données) is authoritative when present - a custom Priva point named "priva_custom_xxxx"
      // has no readable substring, so relying on key-name matching alone made the audit claim
      // data was "missing" even when the sensor was selected and tagged. Untagged/legacy sensors
      // still fall back to name-based matching so nothing regresses for users who haven't tagged yet.
      const keysByRole = (roles: string[], fallbackTest: (k: string) => boolean) => {
        const tagged = agroAnalysisKeys.filter(k => roles.includes(metricConfigs[k]?.agroRole));
        const untaggedFallback = agroAnalysisKeys.filter(k => {
          const role = metricConfigs[k]?.agroRole;
          return (!role || role === "none") && fallbackTest(k);
        });
        return [...tagged, ...untaggedFallback];
      };

      // Extract basic averages
      const tempKeys = keysByRole(["temp_serre"], k => k.toLowerCase().includes("temp") && !k.toLowerCase().includes("out") && !k.toLowerCase().includes("target") && !k.toLowerCase().includes("water"));
      const tempOutKeys = keysByRole(["temp_exterieure"], k => k.toLowerCase().includes("temp") && (k.toLowerCase().includes("out") || k.toLowerCase().includes("ext")));
      const vpdKeys = keysByRole(["vpd_haut"], k => k.toLowerCase().includes("vpd"));
      const rainKeys = keysByRole(["pluie"], k => k.toLowerCase().includes("rain") || k.toLowerCase().includes("pluie"));
      const rhKeys = keysByRole(["hr_serre"], k => (k.toLowerCase().includes("rh") || k.toLowerCase().includes("humidity") || k.toLowerCase().includes("hum_measured")) && !k.toLowerCase().includes("out"));
      const rhOutKeys = keysByRole(["hr_exterieure"], k => k.toLowerCase().includes("hum_out") || (k.toLowerCase().includes("rh") && k.toLowerCase().includes("out")));
      // Substrate VWC/EC sensors are very often only checked FERTI (not CLIMAT) in "Sélection
      // des données" now that visibility is per-chart - so this audit must look at both
      // selections, not selectedKeys alone, or it silently goes "Inactif" for anyone using the
      // Ferti Irrigation tab as intended instead of duplicating the sensor onto Climat/Croissance.
      // Same tag-first-then-name-fallback logic as keysByRole, but scoped to agroAnalysisKeys
      // regardless of which chart (if any) a sensor happens to be checked on - the Ferti
      // Irrigation "Rôle Agronomique" subcategory (EC pain, Poids du pain, Consommation d'eau,
      // T°C pain) is set on sensors that are very often FERTI-only or not displayed at all.
      const keysByRoleAll = (roles: string[], fallbackTest: (k: string) => boolean) => {
        const tagged = agroAnalysisKeys.filter(k => roles.includes(metricConfigs[k]?.agroRole));
        const untaggedFallback = agroAnalysisKeys.filter(k => {
          const role = metricConfigs[k]?.agroRole;
          return (!role || role === "none") && fallbackTest(k);
        });
        return [...tagged, ...untaggedFallback];
      };
      const wcKeys = keysByRoleAll(["humidite_pain"], k => k.toLowerCase().includes("wc") || k.toLowerCase().includes("vwc"));
      const ecKeys = keysByRoleAll(["ec_pain"], k => k.toLowerCase().includes("ec_wc_11") || k.toLowerCase().includes("pore_ec"));
      const slabWeightKeys = keysByRoleAll(["poids_pain"], k => k.toLowerCase().includes("slab_weight"));
      const substrateTempKeys = keysByRoleAll(["temp_pain"], k => k.toLowerCase().includes("ec_wc_1") && !k.toLowerCase().includes("ec_wc_10") && !k.toLowerCase().includes("ec_wc_11"));
      const waterConsumptionKeys = keysByRoleAll(["consommation_eau"], () => false);
      const radKeys = keysByRole(["radiation_instant"], k => k.toLowerCase().includes("irr_out") || k.toLowerCase().includes("radiation") || k.toLowerCase().includes("solar") || k.toLowerCase().includes("rayonnement"));
      const windKeys = keysByRole(["vitesse_vent"], k => k.toLowerCase().includes("wind"));
      const co2Keys = keysByRole(["co2"], k => k.toLowerCase().includes("co2"));
      const grosTuyauKeys = keysByRole(["gros_tuyau"], () => false);
      const chassisAbriteKeys = keysByRole(["position_chassis_abrite"], () => false);
      const chassisExposeKeys = keysByRole(["position_chassis_expose"], () => false);

      const tempAvg = tempKeys.length > 0 ? getAverage(tempKeys[0]) : null;
      const tempOutAvg = tempOutKeys.length > 0 ? getAverage(tempOutKeys[0]) : null;
      const vpdAvg = vpdKeys.length > 0 ? getAverage(vpdKeys[0]) : null;
      const rhAvg = rhKeys.length > 0 ? getAverage(rhKeys[0]) : null;
      const rhOutAvg = rhOutKeys.length > 0 ? getAverage(rhOutKeys[0]) : null;
      const wcAvg = wcKeys.length > 0 ? getAverage(wcKeys[0]) : null;
      const ecAvg = ecKeys.length > 0 ? getAverage(ecKeys[0]) : null;
      const slabWeightAvg = slabWeightKeys.length > 0 ? getAverage(slabWeightKeys[0]) : null;
      const substrateTempAvg = substrateTempKeys.length > 0 ? getAverage(substrateTempKeys[0]) : null;
      const waterConsumptionAvg = waterConsumptionKeys.length > 0 ? getAverage(waterConsumptionKeys[0]) : null;
      const radAvg = radKeys.length > 0 ? getAverage(radKeys[0]) : null;
      const windAvg = windKeys.length > 0 ? getAverage(windKeys[0]) : null;
      const co2Avg = co2Keys.length > 0 ? getAverage(co2Keys[0]) : null;
      const rainAvg = rainKeys.length > 0 ? getAverage(rainKeys[0]) : null;
      const grosTuyauAvg = grosTuyauKeys.length > 0 ? getAverage(grosTuyauKeys[0]) : null;
      const chassisAbriteAvg = chassisAbriteKeys.length > 0 ? getAverage(chassisAbriteKeys[0]) : null;
      const chassisExposeAvg = chassisExposeKeys.length > 0 ? getAverage(chassisExposeKeys[0]) : null;

      // 1. ADVANCED INDICATOR: Light/Temperature Ratio (Rapport Lumière / Température 24h)
      if (tempAvg !== null && radAvg !== null) {
        const expectedTemp = 18.0 + (radAvg / 100.0) * 1.5;
        if (radAvg < 100 && tempAvg > 21.0) {
          lostPercent += 15;
          score -= 15;
          audits.push({
            name: "Rapport Lumière / Température",
            applied: Number(tempAvg.toFixed(1)),
            targetMin: 18.0,
            targetMax: 19.8,
            unit: "°C (24h)",
            status: "high",
            impact: `Température trop élevée (${tempAvg.toFixed(1)}°C) pour le faible rayonnement disponible (${Math.round(radAvg)} W/m²).`,
            origin: "Technique (Chauffage excessif sous ciel voilé)"
          });
          physiologicalReasons.push("Déséquilibre Lumière/Température : Le faible rayonnement limite la photosynthèse. Maintenir une température moyenne élevée (>21°C) provoque une respiration excessive de la plante, épuisant ses réserves de sucres et affaiblissant l'apex (tête fine, baisse de vigueur).");
          actionPlans.push("Ajuster la consigne de chauffage moyenne 24h à la baisse sous faible ensoleillement (viser 18.5 - 19.5°C).");
        } else if (radAvg > 180 && tempAvg < 19.5) {
          lostPercent += 10;
          score -= 10;
          audits.push({
            name: "Rapport Lumière / Température",
            applied: Number(tempAvg.toFixed(1)),
            targetMin: 21.0,
            targetMax: 22.8,
            unit: "°C (24h)",
            status: "low",
            impact: `Température trop basse (${tempAvg.toFixed(1)}°C) pour valoriser le fort rayonnement (${Math.round(radAvg)} W/m²).`,
            origin: "Technique (Consignes thermiques trop froides par grand soleil)"
          });
          physiologicalReasons.push("Déséquilibre Lumière/Température : Le fort ensoleillement offre un potentiel de croissance élevé. Une température trop basse bloque la plante dans un état excessivement végétatif et ralentit inutilement la maturation des fruits.");
          actionPlans.push("Laisser monter la consigne thermique de jour sous forte luminosité pour accélérer le développement des grappes.");
        } else {
          audits.push({
            name: "Rapport Lumière / Température",
            applied: Number(tempAvg.toFixed(1)),
            targetMin: Number((expectedTemp - 1.2).toFixed(1)),
            targetMax: Number((expectedTemp + 1.2).toFixed(1)),
            unit: "°C (24h)",
            status: "optimal",
            impact: "Rapport Lumière/Température optimal. Excellent équilibre végétatif/génératif.",
            origin: "Optimal"
          });
        }
      } else {
        audits.push({ name: "Équilibre Lumière/Temp (Inactif)", applied: null, status: "missing", impact: "Sélectionnez un capteur de rayonnement extérieur (Rayonnement Solaire) et de température intérieure pour auditer ce rapport.", origin: "-" });
      }

      // 2. ADVANCED INDICATOR: Day/Night DIF (Balance Générative / Végétative)
      if (tempKeys.length > 0) {
        const dayStats = getStatsForTimeRange(tempKeys[0], 8, 18);
        const nightStats = getStatsForTimeRange(tempKeys[0], 21, 6);
        if (dayStats && nightStats) {
          const dif = dayStats.avg - nightStats.avg;
          if (dif > 8.0) {
            lostPercent += 12;
            score -= 12;
            audits.push({
              name: "Écart Jour/Nuit (DIF)",
              applied: Number(dif.toFixed(1)),
              targetMin: 4.0,
              targetMax: 6.5,
              unit: "°C",
              status: "high",
              impact: `DIF excessif (+${dif.toFixed(1)}°C). Étirement excessif des entrenœuds.`,
              origin: "Technique (Nuit trop froide combinée à des pointes de chaleur diurnes)"
            });
            physiologicalReasons.push("DIF excessif : Un écart jour/nuit supérieur à 8°C étire anormalement les entrenœuds de la tige et affine la tête. Les fleurs s'affaiblissent, ce qui augmente le risque de coulure.");
            actionPlans.push("Rehausser légèrement la température minimale nocturne ou abaisser la consigne de ventilation de jour.");
          } else if (dif < 2.0) {
            lostPercent += 8;
            score -= 8;
            audits.push({
              name: "Écart Jour/Nuit (DIF)",
              applied: Number(dif.toFixed(1)),
              targetMin: 4.0,
              targetMax: 6.5,
              unit: "°C",
              status: "low",
              impact: `DIF insuffisant (+${dif.toFixed(1)}°C). Plante trop végétative.`,
              origin: "Technique (Températures nocturnes trop élevées)"
            });
            physiologicalReasons.push("DIF faible : Un climat trop homogène jour/nuit rend la plante excessivement végétative (grosses feuilles sombres, retard de floraison, manque d'énergie dirigée vers les fruits).");
            actionPlans.push("Programmer une baisse thermique (pré-nuit) plus rapide en fin d'après-midi pour stimuler la générativité.");
          } else {
            audits.push({
              name: "Écart Jour/Nuit (DIF)",
              applied: Number(dif.toFixed(1)),
              targetMin: 4.0,
              targetMax: 6.5,
              unit: "°C",
              status: "optimal",
              impact: "DIF équilibré. Port de plante et vigueur idéaux.",
              origin: "Optimal"
            });
          }
        }
      } else {
        audits.push({ name: "Écart DIF Jour/Nuit (Inactif)", applied: null, status: "missing", impact: "Sélectionnez la température intérieure pour surveiller l'équilibre DIF.", origin: "-" });
      }

      // 3. ADVANCED INDICATOR: Night VPD (Root Pressure Audit)
      if (vpdKeys.length > 0) {
        const nightVPD = getStatsForTimeRange(vpdKeys[0], 22, 5);
        if (nightVPD) {
          if (nightVPD.avg < 0.35) {
            lostPercent += 15;
            score -= 15;
            audits.push({
              name: "VPD Nocturne (Pression Racinaire)",
              applied: Number(nightVPD.avg.toFixed(2)),
              targetMin: 0.45,
              targetMax: 0.75,
              unit: "kPa",
              status: "low",
              impact: `VPD de nuit critique (${nightVPD.avg.toFixed(2)} kPa). Risque d'éclatement des fruits.`,
              origin: "Technique (Ventilation fermée et absence de chauffage nocturne minimum)"
            });
            physiologicalReasons.push("VPD nocturne bas : Lorsque l'air de nuit est saturé en humidité, la transpiration foliaire s'arrête alors que l'absorption racinaire se poursuit. Cette surpression hydraulique fait éclater la cuticule des fruits (fendillement) et induit des nécroses apicales (carence en calcium aux apex).");
            actionPlans.push("Activer une température minimale de tuyau de chauffage nocturne avec une légère ouverture des ouvrants pour évacuer l'humidité.");
          } else {
            audits.push({
              name: "VPD Nocturne (Pression Racinaire)",
              applied: Number(nightVPD.avg.toFixed(2)),
              targetMin: 0.45,
              targetMax: 0.75,
              unit: "kPa",
              status: "optimal",
              impact: "Pression racinaire nocturne saine et équilibrée.",
              origin: "Optimal"
            });
          }
        }
      } else {
        audits.push({ name: "VPD Nocturne (Inactif)", applied: null, status: "missing", impact: "Sélectionnez le VPD pour diagnostiquer le risque d'éclatement des fruits.", origin: "-" });
      }

      // 4. ADVANCED INDICATOR: Substrate Dry-Back (Dessèchement nocturne du pain)
      if (wcKeys.length > 0) {
        const eveStats = getStatsForTimeRange(wcKeys[0], 17, 19);
        const morStats = getStatsForTimeRange(wcKeys[0], 5, 7);
        if (eveStats && morStats) {
          const dryBack = eveStats.avg - morStats.avg;
          if (dryBack < 6.0) {
            lostPercent += 18;
            score -= 18;
            audits.push({
              name: "Ressuyage Nocturne (Dry-Back)",
              applied: Number(dryBack.toFixed(1)),
              targetMin: 8.0,
              targetMax: 12.0,
              unit: "%",
              status: "low",
              impact: `Dry-back insuffisant (${dryBack.toFixed(1)}%). Risque d'asphyxie des racines.`,
              origin: "Technique (Irrigations terminées trop tard en fin de journée)"
            });
            physiologicalReasons.push("Dry-back faible : Le substrat reste trop saturé en eau pendant la nuit. Les racines s'asphyxient temporairement par manque d'oxygène, favorisant le Pythium et affaiblissant la capacité d'absorption le lendemain matin.");
            actionPlans.push("Avancer l'heure d'arrêt de la dernière irrigation (viser 2h à 3h avant le coucher du soleil).");
          } else if (dryBack > 14.0) {
            lostPercent += 15;
            score -= 15;
            audits.push({
              name: "Ressuyage Nocturne (Dry-Back)",
              applied: Number(dryBack.toFixed(1)),
              targetMin: 8.0,
              targetMax: 12.0,
              unit: "%",
              status: "high",
              impact: `Dry-back excessif (${dryBack.toFixed(1)}%). Stress hydrique et accumulation d'EC.`,
              origin: "Technique (Irrigations arrêtées trop tôt)"
            });
            physiologicalReasons.push("Dry-back fort : Un égouttage nocturne supérieur à 14% indique un stress hydrique de fin de nuit. Les poils racinaires sèchent et la concentration en sels (EC) augmente trop vite dans le pain.");
            actionPlans.push("Retarder l'heure du dernier arrosage ou augmenter l'apport hydrique nocturne si nécessaire.");
          } else {
            audits.push({
              name: "Ressuyage Nocturne (Dry-Back)",
              applied: Number(dryBack.toFixed(1)),
              targetMin: 8.0,
              targetMax: 12.0,
              unit: "%",
              status: "optimal",
              impact: "Dry-back nocturne optimal (bon équilibre air/eau dans le substrat).",
              origin: "Optimal"
            });
          }
        }
      } else {
        audits.push({ name: "Ressuyage Pain Dry-Back (Inactif)", applied: null, status: "missing", impact: "Sélectionnez le Slab WC pour mesurer le ressuyage nocturne (dry-back).", origin: "-" });
      }

      // 5. External Environment safety checks (Ventilation vs outside wind drafts)
      if (tempAvg !== null && tempOutAvg !== null) {
        if (tempAvg > 22.0) {
          const isOutsideHotter = tempOutAvg > tempAvg;
          if (isOutsideHotter) {
            physiologicalReasons.push(`Alerte Canicule : La température intérieure moyenne est élevée (${tempAvg.toFixed(1)}°C), mais l'air extérieur l'est encore plus (${tempOutAvg.toFixed(1)}°C). Ouvrir les ouvrants amènerait un flux thermique externe massif qui surchaufferait le dôme de culture.`);
            actionPlans.push("Fermer ou restreindre fortement les ouvrants pour bloquer l'air extérieur chaud.");
            actionPlans.push("Activer la brumisation (cooling) pour générer un abaissement de température par évaporation d'eau.");
            actionPlans.push("Déployer les écrans d'ombrage pour réduire le rayonnement solaire incident.");
          } else if (windAvg !== null && windAvg > 4.5) {
            physiologicalReasons.push(`Alerte Vent Fort : La serre surchauffe (${tempAvg.toFixed(1)}°C) sous vent fort (${windAvg.toFixed(1)} m/s). Ouvrir les ouvrants du côté exposé au vent (côté au-vent) créerait des courants d'air froid violents et stresserait les feuilles.`);
            actionPlans.push("Ouvrir uniquement les ouvrants du côté opposé au vent (côté sous-vent) pour aspirer l'air chaud par dépression sans créer de courant d'air direct.");
          }
        }
      }

      // 6. CO2 enrichment vs available light (carbon limitation of photosynthesis). A flat 24h
      // CO2 average is meaningless here: CO2 injection only runs (and only matters) during
      // daylight photosynthesis, while nighttime CO2 naturally drifts up from plant/soil
      // respiration with no injection running - blending the two masks the real daytime level.
      // Compared against the day-window radiation average for the same reason (a 24h radiation
      // average diluted by nighttime zeros understates how much light was actually available).
      const co2DayStats = co2Keys.length > 0 ? getStatsForTimeRange(co2Keys[0], 8, 18) : null;
      const co2NightStats = co2Keys.length > 0 ? getStatsForTimeRange(co2Keys[0], 21, 6) : null;
      const co2DayTrend = co2Keys.length > 0 ? getTrend(co2Keys[0], 8, 18) : null;
      const radDayStats = radKeys.length > 0 ? getStatsForTimeRange(radKeys[0], 8, 18) : null;

      // Chassis opening computed here (day-window, 8h-18h) so the CO2 audit below can already use
      // it - once either side of the roof vents is open beyond ~15%, CO2 escapes to the outside
      // faster than injection can compensate, so a low reading is explained by ventilation, not by
      // an injection failure, and must stop being flagged as a limiting factor.
      const chassisAbriteDayStats = chassisAbriteKeys.length > 0 ? getStatsForTimeRange(chassisAbriteKeys[0], 8, 18) : null;
      const chassisExposeDayStats = chassisExposeKeys.length > 0 ? getStatsForTimeRange(chassisExposeKeys[0], 8, 18) : null;
      const ventOpenDayAvg = Math.max(chassisAbriteDayStats?.avg ?? 0, chassisExposeDayStats?.avg ?? 0);
      const isVentedOpenForCo2 = (chassisAbriteDayStats !== null || chassisExposeDayStats !== null) && ventOpenDayAvg > 15;

      if (co2DayStats !== null && radDayStats !== null) {
        const co2Day = co2DayStats.avg;
        const radDay = radDayStats.avg;
        const expectedCo2 = radDay > 150 ? 750 : radDay > 60 ? 650 : 550;
        const trendNote = co2DayTrend?.trend === "baisse"
          ? ` En baisse au fil de la journée (${Math.round(co2DayTrend.firstAvg)} → ${Math.round(co2DayTrend.lastAvg)} ppm) : l'injection n'a probablement pas suivi la consommation par la photosynthèse.`
          : co2DayTrend?.trend === "hausse"
            ? ` En hausse au fil de la journée (${Math.round(co2DayTrend.firstAvg)} → ${Math.round(co2DayTrend.lastAvg)} ppm).`
            : "";
        if (co2Day < expectedCo2 - 80 && isVentedOpenForCo2) {
          // Ouvrants ouverts au-delà de 15% en journée : le CO2 mesuré bas est une conséquence
          // normale de la ventilation (balayage vers l'extérieur), pas un facteur limitant en soi -
          // ne pas pénaliser le score ni le pointer comme cause du gain manqué.
          audits.push({
            name: "Enrichissement CO2 (Jour 8h-18h)",
            applied: Math.round(co2Day),
            targetMin: expectedCo2 - 50,
            targetMax: expectedCo2 + 100,
            unit: "ppm",
            status: "optimal",
            impact: `CO2 diurne bas (${Math.round(co2Day)} ppm) mais expliqué par l'ouverture des ouvrants (${Math.round(ventOpenDayAvg)}% en moyenne diurne, >15%) : dilution normale par aération, pas un facteur limitant.${trendNote}`,
            origin: "Ventilation (non pénalisé)"
          });
        } else if (co2Day < expectedCo2 - 80) {
          lostPercent += 10;
          score -= 10;
          audits.push({
            name: "Enrichissement CO2 (Jour 8h-18h)",
            applied: Math.round(co2Day),
            targetMin: expectedCo2 - 50,
            targetMax: expectedCo2 + 100,
            unit: "ppm",
            status: "low",
            impact: `CO2 diurne mesuré (${Math.round(co2Day)} ppm, moyenne 8h-18h) sous la cible attendue pour ce niveau de rayonnement diurne (${Math.round(radDay)} W/m²).${trendNote}`,
            origin: "Technique (Injection CO2 insuffisante ou fuite par aération)"
          });
          physiologicalReasons.push("Carbonication insuffisante : à ce niveau de lumière, la photosynthèse est bridée par le manque de CO2 disponible plutôt que par la lumière elle-même, ce qui plafonne artificiellement le gain de biomasse malgré un climat par ailleurs favorable.");
          actionPlans.push(`Augmenter la consigne d'injection CO2 vers ${expectedCo2} ppm en journée, en vérifiant que l'ouverture des ouvrants ne dilue pas l'apport.`);
        } else {
          audits.push({
            name: "Enrichissement CO2 (Jour 8h-18h)",
            applied: Math.round(co2Day),
            targetMin: expectedCo2 - 50,
            targetMax: expectedCo2 + 100,
            unit: "ppm",
            status: "optimal",
            impact: `Niveau de CO2 diurne cohérent avec le rayonnement disponible.${trendNote}`,
            origin: "Optimal"
          });
        }
      } else {
        audits.push({ name: "Enrichissement CO2 (Inactif)", applied: null, status: "missing", impact: "Sélectionnez et taguez (Rôle Agronomique : CO2) un capteur de CO2 pour auditer la carbonication.", origin: "-" });
      }

      // 7. Ventilation management: chassis opening (abrité/exposé) vs wind speed - open chassis on the
      // wind-exposed side during strong wind risks cold-draft leaf stress even if the greenhouse is hot.
      // Chassis are normally shut at night regardless of wind, so a flat 24h average opening
      // (e.g. "31% open on average over the day") is meaningless - it says nothing about whether
      // the chassis was dangerously wide open during an actual daytime wind event. Restricted to
      // the daylight window (8h-18h, when ventilation actually operates) instead.
      const windDayStats = windKeys.length > 0 ? getStatsForTimeRange(windKeys[0], 8, 18) : null;

      if (chassisExposeDayStats !== null && windDayStats !== null) {
        const chassisExposeDay = chassisExposeDayStats.avg;
        const chassisExposeMax = chassisExposeDayStats.max;
        const windDay = windDayStats.avg;
        const windMax = windDayStats.max;
        if (windMax > 4.5 && chassisExposeMax > 30) {
          lostPercent += 8;
          score -= 8;
          audits.push({
            name: "Ventilation / Vent (Jour 8h-18h)",
            applied: Math.round(chassisExposeMax),
            targetMin: 0,
            targetMax: 20,
            unit: "% (côté exposé, pic diurne)",
            status: "high",
            impact: `Chassis exposé ouvert jusqu'à ${Math.round(chassisExposeMax)}% en journée (moyenne diurne ${Math.round(chassisExposeDay)}%) sous un pic de vent à ${windMax.toFixed(1)} m/s (moyenne diurne ${windDay.toFixed(1)} m/s) : risque de stress par courant d'air froid direct sur le feuillage.`,
            origin: "Technique (Ouverture du mauvais côté sous vent fort)"
          });
          physiologicalReasons.push("Stress par courant d'air : l'ouverture du chassis côté exposé au vent par vent fort refroidit brutalement le feuillage localement, perturbant la transpiration et la régulation stomatique sans bénéfice thermique global.");
          actionPlans.push("Privilégier l'ouverture du chassis abrité (côté sous le vent) et restreindre le chassis exposé tant que le vent reste fort.");
        } else {
          audits.push({
            name: "Ventilation / Vent (Jour 8h-18h)",
            applied: Math.round(chassisExposeDay),
            targetMin: 0,
            targetMax: 30,
            unit: "% (côté exposé, moyenne diurne)",
            status: "optimal",
            impact: "Gestion de l'ouverture du chassis en journée cohérente avec le vent mesuré.",
            origin: "Optimal"
          });
        }
      } else {
        audits.push({ name: "Ventilation / Vent (Inactif)", applied: null, status: "missing", impact: "Sélectionnez et taguez la position du chassis exposé et la vitesse du vent pour auditer la ventilation.", origin: "-" });
      }

      // 8. Heating pipe rail (Gros Tuyau) vs outdoor temperature - underheating on cold days
      // slows fruit development even when the average indoor temperature looks acceptable.
      if (grosTuyauAvg !== null && tempOutAvg !== null) {
        if (tempOutAvg < 10 && grosTuyauAvg < 35) {
          lostPercent += 8;
          score -= 8;
          audits.push({
            name: "Chauffage Gros Tuyau",
            applied: Math.round(grosTuyauAvg),
            targetMin: 35,
            targetMax: 55,
            unit: "°C",
            status: "low",
            impact: `Température du gros tuyau basse (${Math.round(grosTuyauAvg)}°C) alors qu'il fait froid dehors (${tempOutAvg.toFixed(1)}°C).`,
            origin: "Technique (Consigne de chauffage insuffisante)"
          });
          actionPlans.push("Augmenter la consigne de chauffage du gros tuyau par temps froid pour soutenir le développement des fruits.");
        } else {
          audits.push({
            name: "Chauffage Gros Tuyau",
            applied: Math.round(grosTuyauAvg),
            targetMin: 30,
            targetMax: 55,
            unit: "°C",
            status: "optimal",
            impact: "Chauffage cohérent avec la température extérieure.",
            origin: "Optimal"
          });
        }
      } else {
        audits.push({ name: "Chauffage Gros Tuyau (Inactif)", applied: null, status: "missing", impact: "Sélectionnez et taguez le gros tuyau et la température extérieure pour auditer le chauffage.", origin: "-" });
      }

      // Look up selected radiation sum key dynamically (in J/cm²)
      const radSumKey = selectedKeys.find(key => {
        const config = metricConfigs[key];
        if (config?.agroRole === "radiation_sum") return true;

        const unit = config?.unit || "";
        const m = allMetrics.find(item => item.key === key);
        return (
          unit.toLowerCase().includes("j/cm") || 
          (m && (
            (m.unit && m.unit.toLowerCase().includes("j/cm")) || 
            (m.name && (m.name.toLowerCase().includes("somme de rayonnement") || m.name.toLowerCase().includes("somme de radiation")))
          ))
        );
      });

      const lastVal = radSumKey ? getLast(radSumKey) : null;
      // Daily radiation sum value directly from the chart (last value of the accumulation)
      const radiationSumJcm2 = lastVal !== null ? Math.round(lastVal) : null;

      // Yield potential under optimal conditions (g/m²)
      const yieldPotentialGrams = radiationSumJcm2 !== null ? Number((radiationSumJcm2 * (conversionRatio / 100.0)).toFixed(1)) : null;

      // Lost potential in g/m² due to poor crop steering
      const lostGainGrams = yieldPotentialGrams !== null ? Number((yieldPotentialGrams * (lostPercent / 100)).toFixed(1)) : 0;

      // Every drop attributed to this calendar day (already detected + merged with manual
      // entries above, across the whole continuous range so none are missed at day boundaries).
      const dayDrops = allDropsSorted.filter(d => d.dateStr === dateStr);
      let actualGain = 0;

      // Kept for backward-compatible display: the day's single largest drop.
      const worstDrop = dayDrops.length > 0
        ? dayDrops.reduce((worst, d) => (d.suddenDropVal > worst.suddenDropVal ? d : worst), dayDrops[0])
        : null;
      const suddenDropTime: string | null = worstDrop ? worstDrop.timeStr : null;
      const suddenDropTs: number | null = worstDrop ? worstDrop.time : null;
      const suddenDropVal = worstDrop ? worstDrop.suddenDropVal : 0;
      const suggestedCorrectionGrams = worstDrop ? worstDrop.suggestedCorrectionGrams : 0;

      if (selectedKeys.includes("plant_weight_gain")) {
        const key = "plant_weight_gain";
        // Calculate actual daily gain using the corrected/smoothed curve values
        const dayReadings = rows.filter(r => r[key] !== undefined && r[key] !== null && !isNaN(Number(r[key])));
        if (dayReadings.length > 0) {
          dayReadings.sort((a, b) => a.time - b.time);
          const firstVal = Number(dayReadings[0][key]);
          const lastVal = Number(dayReadings[dayReadings.length - 1][key]);
          if (!isNaN(firstVal) && !isNaN(lastVal)) {
            actualGain = (lastVal - firstVal) * 1000;
          }
        }
      }

      if (physiologicalReasons.length === 0) {
        physiologicalReasons.push("L'équilibre thermique, le rapport lumière/température et la pression racinaire nocturne sont optimaux. La tomate exprime son plein potentiel végétatif et génératif.");
      }
      if (actionPlans.length === 0) {
        actionPlans.push("Maintenir la stratégie d'irrigation et de régulation climatique en cours.");
      }

      const overallStatus = score >= 90 ? "Optimal" : score >= 75 ? "Ajustement requis" : "Alerte Climat";
      const statusColor = score >= 90 ? "emerald" : score >= 75 ? "amber" : "rose";

      // Growth-per-light efficiency for this day (g/m² of cumulative gain per J/cm² of radiation).
      // The best day in the displayed range becomes the benchmark (computed in a second pass below)
      // to size the potential gain each other day left on the table under the light it actually received.
      const growthEfficiency = (radiationSumJcm2 !== null && radiationSumJcm2 > 0 && actualGain > 0)
        ? actualGain / radiationSumJcm2
        : null;

      // Day-window (8h-18h) stats for the composite "Indice de Performance Agronomique" below -
      // exposed temperature and light are only meaningful during the hours the plant is actually
      // photosynthesizing, and substrate dry-back (evening minus morning VWC%) is the best proxy
      // for real water consumption available from existing sensors (no dosing/flow sensor).
      const radDayForIndex = radKeys.length > 0 ? getStatsForTimeRange(radKeys[0], 8, 18) : null;
      const tempDayForIndex = tempKeys.length > 0 ? getStatsForTimeRange(tempKeys[0], 8, 18) : null;
      const wcEveForIndex = wcKeys.length > 0 ? getStatsForTimeRange(wcKeys[0], 17, 19) : null;
      const wcMorForIndex = wcKeys.length > 0 ? getStatsForTimeRange(wcKeys[0], 5, 7) : null;
      const dryBackForIndex = (wcEveForIndex && wcMorForIndex) ? wcEveForIndex.avg - wcMorForIndex.avg : null;

      // Per-time-slot limiting factor: for each of the 5 agronomic windows, which tracked factor
      // was furthest outside its target range (the IQR of this greenhouse's own best-efficiency
      // days, from /api/agro-target-ranges) - a concrete "what capped the gain and when" instead
      // of only a daily-average verdict. Not a claim that the hour itself caused a measurable
      // amount of lost gain (cumulative gain has no hourly ground truth from a scale reading
      // alone) - it flags where conditions deviated from the proven-good range.
      const slotFactorKeys: { field: string; key: string | undefined }[] = [
        { field: "temp_serre", key: tempKeys[0] },
        { field: "temp_exterieure", key: tempOutKeys[0] },
        { field: "vpd_haut", key: vpdKeys[0] },
        { field: "hr_serre", key: rhKeys[0] },
        { field: "humidite_pain", key: wcKeys[0] },
        { field: "ec_pain", key: ecKeys[0] },
        { field: "radiation_instant", key: radKeys[0] },
        { field: "vitesse_vent", key: windKeys[0] },
        { field: "co2", key: co2Keys[0] },
        { field: "pluie", key: rainKeys[0] }
      ];
      const limitingFactorsBySlot = AGRO_TIME_SLOTS.map(slot => {
        let worst: { field: string; value: number; range: { min: number; max: number }; deviation: number } | null = null;
        slotFactorKeys.forEach(({ field, key }) => {
          if (!key) return;
          // The range is specific to THIS slot, not a single daily figure - a factor's target
          // at Midi genuinely differs from its target at Nuit (light/temperature/substrate
          // demand vary across the day), so each slot is compared against its own range.
          const range = agroTargetRanges[field]?.[slot.label];
          if (!range) return;
          const stats = getStatsForTimeRange(key, slot.start, slot.end);
          if (!stats) return;
          const width = Math.max(range.max - range.min, 0.0001);
          const outBy = stats.avg < range.min ? range.min - stats.avg : stats.avg > range.max ? stats.avg - range.max : 0;
          if (outBy <= 0) return;
          const deviation = outBy / width;
          if (!worst || deviation > worst.deviation) {
            worst = { field, value: Number(stats.avg.toFixed(2)), range, deviation };
          }
        });
        return { ...slot, limitingFactor: worst };
      });

      return {
        dateStr,
        day: index + 1,
        status: overallStatus,
        statusColor,
        overallScore: Math.max(10, score),
        potentialGain: lostGainGrams,
        actualGain: Number(actualGain.toFixed(1)),
        suddenDropTime,
        suddenDropTs,
        suddenDropVal: isNaN(suddenDropVal) ? 0 : Number(suddenDropVal.toFixed(1)),
        suggestedCorrectionGrams: isNaN(suggestedCorrectionGrams) ? 0 : Math.round(suggestedCorrectionGrams),
        drops: dayDrops,
        radiationSumJcm2,
        growthEfficiency,
        yieldPotentialGrams,
        lostPercent,
        radDayAvg: radDayForIndex?.avg ?? null,
        tempDayAvg: tempDayForIndex?.avg ?? null,
        dryBack: dryBackForIndex,
        limitingFactorsBySlot,
        audits,
        physiologicalExplanation: physiologicalReasons.join(" "),
        actionPlan: actionPlans,
        // Climate stats + drops bundled up for the AI black-box call, so the request payload
        // doesn't need to be re-derived from chartData/rawDataMap on every "Analyser avec l'IA" click.
        // Keyed by agro role slug, not an ad-hoc English name - the same vocabulary as the
        // "Rôle Agronomique" dropdown, aranet_daily_archive.agro_role and computeAndUpsertAgroSummary
        // (app/api/aranet/archive-daily/route.ts), so the browser-sync path and the cron path
        // write the identical vocabulary into agro_daily_summary.climate.
        aiContext: {
          temp_serre: tempAvg,
          temp_exterieure: tempOutAvg,
          vpd_haut: vpdAvg,
          hr_serre: rhAvg,
          humidite_pain: wcAvg,
          ec_pain: ecAvg,
          radiation_instant: radAvg,
          vitesse_vent: windAvg,
          co2: co2Avg,
          pluie: rainAvg,
          poids_pain: slabWeightAvg,
          temp_pain: substrateTempAvg,
          consommation_eau: waterConsumptionAvg,
          // Day/night split and intra-day trend, not just the flat 24h figures above - a 24h
          // average hides exactly the kind of thing that actually explains growth outcomes
          // (CO2 depleting over the day, a chassis briefly wide open at midday, etc.).
          co2DayAvg: co2DayStats?.avg ?? null,
          co2NightAvg: co2NightStats?.avg ?? null,
          co2DayTrend: co2DayTrend?.trend ?? null,
          // Once vents are open beyond ~15% during the day, CO2 dilutes to the outside faster than
          // injection can compensate - a low CO2 reading is then explained by ventilation, not a
          // limiting factor in itself, and should not be blamed for a lost gain.
          co2ExplainedByVentilation: isVentedOpenForCo2,
          chassisExposeDayAvg: chassisExposeDayStats?.avg ?? null,
          chassisExposeDayMax: chassisExposeDayStats?.max ?? null,
          windDayAvg: windDayStats?.avg ?? null,
          windDayMax: windDayStats?.max ?? null,
          ruleBasedFindings: audits.map((a: any) => a.impact).filter(Boolean)
        }
      };
    });
  }, [agroChartData, agroFertiChartData, selectedKeys, fertiSelectedKeys, metricConfigs, plantsOnScale, densityPerM2, conversionRatio, dailyEvents, manualDrops, agroTargetRanges]);

  // Second pass: benchmark every day against the best light-use-efficiency day observed in the
  // currently displayed range, so "potential gain" reflects what THIS greenhouse actually proved
  // capable of recently rather than a fixed, manually-configured ratio.
  const agronomicDataWithBenchmark = useMemo(() => {
    if (dynamicAgronomicData.length === 0) return [];
    const bestEfficiency = dynamicAgronomicData.reduce((best: number, d: any) => {
      return d.growthEfficiency !== null && d.growthEfficiency > best ? d.growthEfficiency : best;
    }, 0);

    // Best day-window light sum observed in the displayed range - the reference for "did we get
    // good light today", proven by this greenhouse rather than a fixed, arbitrary ceiling.
    const bestRadDayInRange = dynamicAgronomicData.reduce((best: number, d: any) => {
      return d.radDayAvg !== null && d.radDayAvg > best ? d.radDayAvg : best;
    }, 0);

    return dynamicAgronomicData.map((d: any) => {
      const potentialGainBestDay = (bestEfficiency > 0 && d.radiationSumJcm2 !== null)
        ? Number((bestEfficiency * d.radiationSumJcm2).toFixed(1))
        : null;
      const lostGainVsBestDay = potentialGainBestDay !== null
        ? Math.max(0, Number((potentialGainBestDay - d.actualGain).toFixed(1)))
        : null;
      const lostPercentVsBestDay = (potentialGainBestDay !== null && potentialGainBestDay > 0)
        ? Math.round((lostGainVsBestDay! / potentialGainBestDay) * 100)
        : null;

      // Every detected weight movement is auto-smoothed now (see buildChartRows), so all of them
      // are a handled consequence of past growth/logistics rather than a growth problem to
      // explain - none should surface as a "loss" in this analysis.
      const validatedDrops: WeightDropCandidate[] = d.drops || [];

      // The agro score must be coherent with the day's actual biomass outcome: the loss of
      // potential gain vs. the best-efficiency day observed in the range is the primary signal
      // (when computable), with the rule-based climate score as a fallback/explanatory detail
      // when radiation data isn't available to compute a biomass-potential-based score.
      const overallScore = lostPercentVsBestDay !== null
        ? Math.max(10, Math.round(100 - lostPercentVsBestDay))
        : d.overallScore;
      const status = overallScore >= 90 ? "Optimal" : overallScore >= 75 ? "Ajustement requis" : "Alerte Climat";
      const statusColor = overallScore >= 90 ? "emerald" : overallScore >= 75 ? "amber" : "rose";

      // ULTIMATE DAILY AGRONOMIC PERFORMANCE INDEX: one 0-100 number per day combining light
      // received, temperature exposure, water/irrigation management (substrate dry-back) and the
      // resulting biomass gain - so the grower can track it day by day on a single curve and,
      // when it dips, immediately see which of the four levers was the bottleneck that day
      // rather than having to cross-reference several separate charts.
      const lightScore = (d.radDayAvg !== null && bestRadDayInRange > 0)
        ? Math.min(100, Math.round((d.radDayAvg / bestRadDayInRange) * 100))
        : null;

      const expectedTempForIndex = d.radDayAvg !== null ? 18.0 + (d.radDayAvg / 100.0) * 1.5 : null;
      const tempScore = (d.tempDayAvg !== null && expectedTempForIndex !== null)
        ? Math.max(0, Math.round(100 - Math.abs(d.tempDayAvg - expectedTempForIndex) * 20))
        : null;

      // Optimal dry-back band is 8-12% (see the Ressuyage Nocturne logic) - a score of 100 at the
      // center, falling off the further outside the band (over- or under-irrigation both cost points).
      const waterScore = d.dryBack !== null
        ? Math.max(0, Math.round(100 - (d.dryBack < 8 ? (8 - d.dryBack) : d.dryBack > 12 ? (d.dryBack - 12) : 0) * 12))
        : null;

      // The resulting output: how the actual gain compares to what this greenhouse proved
      // achievable under the same light (already computed above as lostPercentVsBestDay).
      const biomassScore = lostPercentVsBestDay !== null ? Math.max(0, Math.round(100 - lostPercentVsBestDay)) : null;

      const indexComponents: { label: string; score: number }[] = [];
      if (lightScore !== null) indexComponents.push({ label: "Lumière reçue", score: lightScore });
      if (tempScore !== null) indexComponents.push({ label: "Température exposée", score: tempScore });
      if (waterScore !== null) indexComponents.push({ label: "Irrigation / Eau (dry-back)", score: waterScore });
      if (biomassScore !== null) indexComponents.push({ label: "Gain de biomasse", score: biomassScore });

      const weights: Record<string, number> = { "Lumière reçue": 0.25, "Température exposée": 0.25, "Irrigation / Eau (dry-back)": 0.2, "Gain de biomasse": 0.3 };
      const totalWeight = indexComponents.reduce((s, c) => s + weights[c.label], 0);
      const agroPerformanceIndex = totalWeight > 0
        ? Math.round(indexComponents.reduce((s, c) => s + c.score * weights[c.label], 0) / totalWeight)
        : null;

      // The lowest-scoring component is what "bridait" (capped) the gain that day.
      const limitingComponent = indexComponents.length > 0
        ? indexComponents.reduce((worst, c) => (c.score < worst.score ? c : worst), indexComponents[0])
        : null;

      return {
        ...d,
        drops: validatedDrops,
        suddenDropVal: validatedDrops.length > 0
          ? Math.max(...validatedDrops.map(dr => dr.suddenDropVal))
          : 0,
        lightScore,
        tempScore,
        waterScore,
        biomassScore,
        agroPerformanceIndex,
        limitingFactorLabel: limitingComponent?.label ?? null,
        limitingFactorScore: limitingComponent?.score ?? null,
        bestEfficiencyInRange: bestEfficiency > 0 ? bestEfficiency : null,
        potentialGainBestDay,
        lostGainVsBestDay,
        lostPercentVsBestDay,
        overallScore,
        status,
        statusColor,
        // Efficiency re-expressed as grams per 100 J/cm² of radiation received, rather than the
        // raw g/m² per J/cm² decimal (e.g. 0.0234) - matches the "g / 100 J/cm²" unit already
        // used by the conversion-ratio calibration input above, and reads at a human scale.
        potentialEfficiencyPer100J: bestEfficiency > 0 ? Number((bestEfficiency * 100).toFixed(2)) : null,
        realizedEfficiencyPer100J: d.growthEfficiency !== null ? Number((d.growthEfficiency * 100).toFixed(2)) : null
      };
    });
  }, [dynamicAgronomicData, dailyEvents]);

  // Mirror each computed day's summary into Supabase (debounced) so the persistent agronomic
  // agent's correlation history grows every time this tab is opened with data loaded, instead
  // of every visit starting from zero. Browser is still the only place that can derive these
  // from raw sensor data (see plan note on agroRole/calibration state) - this just persists the
  // result of that computation, it doesn't move the computation itself server-side.
  const agroSummarySyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isLoaded || agronomicDataWithBenchmark.length === 0) return;
    if (agroSummarySyncTimeoutRef.current) clearTimeout(agroSummarySyncTimeoutRef.current);
    agroSummarySyncTimeoutRef.current = setTimeout(() => {
      const days = agronomicDataWithBenchmark
        .filter((d: any) => d.dateStr && d.actualGain !== undefined)
        .map((d: any) => ({
          dateStr: d.dateStr,
          actualGain: d.actualGain,
          radiationSumJcm2: d.radiationSumJcm2,
          growthEfficiency: d.growthEfficiency,
          climate: d.aiContext,
          drops: (d.drops || []).map((drop: WeightDropCandidate) => ({ time: drop.timeStr, valGm2: drop.suddenDropVal })),
          ruleBasedFindings: d.aiContext?.ruleBasedFindings || [],
          culture: greenhouseCulture || null,
          cultureTypology: greenhouseCultureTypology || null,
          glassTranslucidityPercent: glassTranslucidityPercent !== "" ? Number(glassTranslucidityPercent) : null
        }));
      if (days.length === 0) return;
      fetch("/api/agro-daily-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days })
      }).catch(e => console.error("Failed to sync agro daily summaries:", e));
    }, 1500);
    return () => {
      if (agroSummarySyncTimeoutRef.current) clearTimeout(agroSummarySyncTimeoutRef.current);
    };
  }, [agronomicDataWithBenchmark, isLoaded, greenhouseCulture, greenhouseCultureTypology, glassTranslucidityPercent]);

  const brushIndices = useMemo(() => {
    if (!zoomTimeRange || chartData.length === 0) {
      return { start: 0, end: chartData.length - 1 };
    }
    
    // Find closest index for min time
    let startIdx = 0;
    let minDiff = Infinity;
    chartData.forEach((d: any, idx: number) => {
      const diff = Math.abs(d.time - zoomTimeRange.min);
      if (diff < minDiff) {
        minDiff = diff;
        startIdx = idx;
      }
    });

    // Find closest index for max time
    let endIdx = chartData.length - 1;
    let maxDiff = Infinity;
    chartData.forEach((d: any, idx: number) => {
      const diff = Math.abs(d.time - zoomTimeRange.max);
      if (diff < maxDiff) {
        maxDiff = diff;
        endIdx = idx;
      }
    });

    return { start: startIdx, end: endIdx };
  }, [chartData, zoomTimeRange]);

  const midnightTimestamps = useMemo(() => {
    if (chartData.length === 0) return [];

    const times = chartData.map((d: any) => d.time).filter(Boolean);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const midnights: number[] = [];
    
    // Start from the day of minTime at 00:00 local time
    const start = new Date(minTime);
    start.setHours(0, 0, 0, 0);
    
    // Increment day by day until we pass maxTime
    const current = new Date(start);
    while (current.getTime() <= maxTime) {
      if (current.getTime() >= minTime) {
        midnights.push(current.getTime());
      }
      current.setDate(current.getDate() + 1);
    }
    
    return midnights;
  }, [chartData]);

  const visibleChartKeys = useMemo(() => {
    return selectedKeys.filter((k) => {
      if (hiddenKeysOnChart.includes(k)) return false;
      const m = allMetrics.find(item => item.key === k);
      if (m && m.isPriva && m.category.includes("Compartiment")) {
        if (selectedCompartment !== "all" && m.category !== `Priva - Compartiment ${selectedCompartment}`) {
          return false;
        }
      }
      return true;
    });
  }, [selectedKeys, hiddenKeysOnChart, selectedCompartment]);

  const normalizeUnitName = (name: string) => {
    if (!name) return "";
    const u = name.trim().toLowerCase();
    if (u === "celsius" || u === "°c") return "°C";
    if (u === "procent" || u === "percent" || u === "%") return "%";
    if (u === "w_m2" || u === "w/m²" || u === "w/m2") return "W/m²";
    if (u === "joule_cm2" || u === "j/cm²" || u === "j/cm2" || u === "j_cm2" || u === "joules/cm²") return "J/cm²";
    if (u === "ppm" || u === "pt_ppm") return "ppm";
    if (u === "ms_cm" || u === "ms/cm") return "mS/cm";
    return name;
  };

  // Group active sensors into shared axes by unit & side
  const activeYAxes = useMemo(() => {
    const axesMap: {
      [id: string]: {
        axisId: string;
        axis: "left" | "right";
        unitName: string;
        keys: string[];
        color: string;
      };
    } = {};

    visibleChartKeys.forEach((key) => {
      const m = allMetrics.find(item => item.key === key);
      if (!m) return;
      const config = metricConfigs[key] || {};
      const axis = config.axis || "left";
      const unitObj = m.units.find((u: any) => u.id === config.unit) || m.units[0];
      const unitName = normalizeUnitName(unitObj.name);
      const axisId = `${axis}-${unitName}`;
      const color = config.color || m.color;

      if (!axesMap[axisId]) {
        axesMap[axisId] = {
          axisId,
          axis,
          unitName,
          keys: [],
          color
        };
      }
      axesMap[axisId].keys.push(key);
    });

    return Object.values(axesMap);
  }, [visibleChartKeys, metricConfigs]);

  // Same visibility-toggle pattern as visibleChartKeys for Climat/Croissance - fertiSelectedKeys
  // is what's loaded/fetched, visibleFertiChartKeys is what's actually plotted.
  const visibleFertiChartKeys = useMemo(() => {
    return fertiSelectedKeys.filter(k => !hiddenFertiKeysOnChart.includes(k));
  }, [fertiSelectedKeys, hiddenFertiKeysOnChart]);

  // Same dynamic "group active sensors into shared axes by unit & side" system as Climat/Croissance,
  // applied to the Ferti Irrigation tab's own (visible) sensor selection.
  const fertiActiveYAxes = useMemo(() => {
    const axesMap: {
      [id: string]: {
        axisId: string;
        axis: "left" | "right";
        unitName: string;
        keys: string[];
        color: string;
      };
    } = {};

    visibleFertiChartKeys.forEach((key) => {
      const m = allMetrics.find(item => item.key === key);
      if (!m) return;
      const config = metricConfigs[key] || {};
      const axis = config.axis || "left";
      const unitObj = m.units.find((u: any) => u.id === config.unit) || m.units[0];
      const unitName = normalizeUnitName(unitObj.name);
      const axisId = `${axis}-${unitName}`;
      const color = config.color || m.color;

      if (!axesMap[axisId]) {
        axesMap[axisId] = { axisId, axis, unitName, keys: [], color };
      }
      axesMap[axisId].keys.push(key);
    });

    return Object.values(axesMap);
  }, [visibleFertiChartKeys, metricConfigs]);

  const fertiLeftActiveKeys = visibleFertiChartKeys.filter(k => (metricConfigs[k]?.axis || "left") === "left");
  const fertiRightActiveKeys = visibleFertiChartKeys.filter(k => (metricConfigs[k]?.axis || "left") === "right");

  const firstYAxisId = useMemo(() => {
    if (selectedKeys.length === 0) return undefined;
    const key = selectedKeys[0];
    const m = allMetrics.find(item => item.key === key);
    if (!m) return undefined;
    const config = metricConfigs[key] || {};
    const axis = config.axis || "left";
    const unitObj = m.units.find((u: any) => u.id === config.unit) || m.units[0];
    const unitName = normalizeUnitName(unitObj ? unitObj.name : "");
    return `${axis}-${unitName}`;
  }, [selectedKeys, metricConfigs]);

  // Tooltip content helper
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-muted-foreground/20 p-2.5 rounded-xl shadow-lg space-y-1.5 text-[11px] z-30">
          <p className="font-bold text-foreground">
            Instant : {payload[0].payload.formattedDate}
          </p>
          <div className="space-y-1">
            {payload.map((item: any) => {
              const metric = allMetrics.find(m => m.key === item.dataKey);
              if (!metric) return null;
              const config = metricConfigs[item.dataKey];
              const unitName = metric.units.find((u: any) => u.id === config?.unit)?.name || "";

              return (
                <div key={item.dataKey} className="flex flex-col border-t pt-1 border-muted/50 first:border-t-0 first:pt-0">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground truncate max-w-[100px]">{config?.customName || metric.name} :</span>
                    <span className="text-foreground font-bold">{item.value !== undefined ? item.value.toFixed(2) : "N/A"}</span>
                    <span className="text-muted-foreground text-[9px]">{unitName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Group metrics by visibility (filtered by active compartment). "Visible" now means selected
  // for EITHER graph (Climat/Croissance or Ferti Irrigation) - a sensor only ticked FERTI must
  // still show up on the left, not get stranded on the right as if nothing had been chosen.
  // A sensor tagged with a "Météo extérieure" role (temp_ext, hr_ext, wind_speed/direction,
  // rain, radiation_instant/sum) describes conditions outside the greenhouse - identical for
  // every compartiment - so it must never be hidden by the Compartiment filter below.
  const isExteriorWeatherSensor = (m: any) => {
    const role = metricConfigsDraft[m.key]?.agroRole;
    return !!role && role !== "none" && agroRoleCategoryByKey[role] === EXTERIOR_WEATHER_ROLE_CATEGORY;
  };

  const visibleMetrics = allMetrics.filter(m => {
    if (!selectedKeysDraft.includes(m.key) && !fertiSelectedKeysDraft.includes(m.key)) return false;
    if (isExteriorWeatherSensor(m)) return true;
    // Aranet only exists in Compartment 1
    if (!m.isPriva && selectedCompartment !== "1" && selectedCompartment !== "all") return false;
    // Priva compartment metrics must match selectedCompartment
    if (m.isPriva && m.category.includes("Compartiment")) {
      if (selectedCompartment !== "all" && m.category !== `Priva - Compartiment ${selectedCompartment}`) {
        return false;
      }
    }
    return true;
  });

  const hiddenMetrics = allMetrics.filter(m => {
    if (selectedKeysDraft.includes(m.key) || fertiSelectedKeysDraft.includes(m.key)) return false;
    if (isExteriorWeatherSensor(m)) return true;
    // Aranet only exists in Compartment 1
    if (!m.isPriva && selectedCompartment !== "1" && selectedCompartment !== "all") return false;
    // Priva compartment metrics must match selectedCompartment
    if (m.isPriva && m.category.includes("Compartiment")) {
      if (selectedCompartment !== "all" && m.category !== `Priva - Compartiment ${selectedCompartment}`) {
        return false;
      }
    }
    return true;
  });

  // Search across the merged "Non sélectionnés" listing (Aranet + built-in Priva sensors,
  // plus the full raw Priva/Ordinateur Climatique catalog) now that the separate
  // "Ordinateur Climatique" tab has been folded into "Sélection des données".
  const selectionSearchQuery = privaSearch.toLowerCase().trim();
  const hiddenMetricsFiltered = selectionSearchQuery
    ? hiddenMetrics.filter(m => m.name.toLowerCase().includes(selectionSearchQuery))
    : hiddenMetrics;
  const unselectedCatalogFiltered = privaCatalog.filter(dp => {
    if (isDatapointSelected(dp)) return false;
    if (!selectionSearchQuery) return true;
    return dp.name.toLowerCase().includes(selectionSearchQuery) || dp.variableId.toLowerCase().includes(selectionSearchQuery);
  });

  // Helper function to render a sensor configuration item in the sidebar. Visibility in each
  // chart is an independent checkbox (Climat/Croissance vs Ferti Irrigation) so the same sensor
  // can be shown in one, both, or neither - instead of the two charts each keeping their own
  // separate sensor picker, which made it easy to end up with the same sensor duplicated or
  // missing across the two without noticing.
  const renderSensorItem = (m: any) => {
    const isSelected = selectedKeysDraft.includes(m.key);
    const isFertiSelected = fertiSelectedKeysDraft.includes(m.key);
    const config = metricConfigsDraft[m.key] || { unit: m.units[0].id, range: "24h", axis: "left", color: m.color, smooth: false, sgWindow: 9 };
    const sensorColor = config.color || m.color;

    return (
      <div key={m.key} className="border-b pb-2 last:border-0 border-muted/30">
        <div className="flex items-center justify-between gap-2 py-1">
          <div className="flex items-center gap-2.5 shrink-0">
            <label className="flex flex-col items-center gap-0.5 cursor-pointer" title="Visible dans Climat/Croissance">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleKey(m.key)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <span className="text-[7px] font-black text-muted-foreground leading-none">CLIMAT</span>
            </label>
            <label className="flex flex-col items-center gap-0.5 cursor-pointer" title="Visible dans Ferti Irrigation">
              <input
                type="checkbox"
                checked={isFertiSelected}
                onChange={() => toggleFertiKey(m.key)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
              />
              <span className="text-[7px] font-black text-muted-foreground leading-none">FERTI</span>
            </label>
          </div>

          <div className={`flex-1 flex items-center gap-2 text-left text-[11px] transition-colors min-w-0 ${isSelected || isFertiSelected ? "text-foreground font-bold" : "text-muted-foreground"}`}>
            {isSelected ? (
              <input
                type="text"
                value={config.customName || ""}
                onChange={(e) => updateMetricConfig(m.key, "customName", e.target.value)}
                placeholder={m.name}
                className="text-[11px] font-bold bg-transparent border-b border-muted/30 focus:border-primary focus:outline-none w-full max-w-[280px] placeholder:text-muted-foreground/45 placeholder:font-normal text-foreground py-0.5"
              />
            ) : (
              <span className="truncate flex-1">{m.name}</span>
            )}
          </div>

          {/* Custom Color Selector */}
          <div className="relative w-3.5 h-3.5 shrink-0 rounded-full overflow-hidden border border-muted/30 cursor-pointer shadow-sm hover:scale-110 transition-transform">
            <input
              type="color"
              value={sensorColor}
              onChange={(e) => updateMetricConfig(m.key, "color", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              title="Changer la couleur"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-full h-full rounded-full" style={{ backgroundColor: sensorColor }} />
          </div>
        </div>

        {(isSelected || isFertiSelected) && (
          <div className="pl-5 mt-1 space-y-2">
            <div className="grid grid-cols-3 gap-1">
              {/* Unit Select */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-muted-foreground uppercase font-bold">Unité</span>
                <select
                  value={config.unit}
                  onChange={(e) => updateMetricConfig(m.key, "unit", e.target.value)}
                  className="text-[9px] border rounded bg-background p-0.5 focus:outline-none focus:ring-1 focus:ring-primary h-5"
                >
                  {m.units.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* Range Select */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-muted-foreground uppercase font-bold">Plage X</span>
                <select
                  value={config.range}
                  onChange={(e) => updateMetricConfig(m.key, "range", e.target.value)}
                  className="text-[9px] border rounded bg-background p-0.5 focus:outline-none focus:ring-1 focus:ring-primary font-medium h-5"
                >
                  <option value="1h">1H</option>
                  <option value="3h">3H</option>
                  <option value="6h">6H</option>
                  <option value="12h">12H</option>
                  <option value="24h">24H</option>
                  <option value="72h">3J</option>
                  <option value="7d">7J</option>
                </select>
              </div>

              {/* Y-Axis Assignment */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-muted-foreground uppercase font-bold">Axe Y</span>
                <div className="flex border rounded overflow-hidden h-5">
                  <button
                    onClick={() => updateMetricConfig(m.key, "axis", "left")}
                    className={`flex-1 text-[8px] font-bold ${config.axis === "left" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  >
                    G
                  </button>
                  <button
                    onClick={() => updateMetricConfig(m.key, "axis", "right")}
                    className={`flex-1 text-[8px] font-bold ${config.axis === "right" ? "bg-green-600 text-white" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  >
                    D
                  </button>
                </div>
              </div>
            </div>

            {/* Savitzky-Golay Smoothing Selector */}
            <div className="flex items-center justify-between border-t pt-1.5 border-muted/20">
              <label className="flex items-center gap-1 cursor-pointer text-[9px] font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  checked={config.smooth === true || config.smooth === "true"}
                  onChange={(e) => updateMetricConfig(m.key, "smooth", e.target.checked)}
                  className="rounded border-muted text-primary focus:ring-primary h-3 w-3 cursor-pointer"
                />
                Lissage SG
              </label>

              {(config.smooth === true || config.smooth === "true") && (
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-muted-foreground uppercase font-bold">Fenêtre</span>
                  <select
                    value={config.sgWindow || 9}
                    onChange={(e) => updateMetricConfig(m.key, "sgWindow", Number(e.target.value))}
                    className="text-[9px] border rounded bg-background px-1 focus:outline-none focus:ring-1 focus:ring-primary h-4.5"
                  >
                    <option value="5">5 pts</option>
                    <option value="10">10 pts</option>
                    <option value="15">15 pts</option>
                    <option value="20">20 pts</option>
                    <option value="25">25 pts</option>
                  </select>
                </div>
              )}
            </div>

            {/* Agronomic Mapping Role Selector */}
            <div className="flex items-center justify-between border-t pt-1.5 border-muted/20 gap-2">
              <span className="text-[8px] text-muted-foreground uppercase font-black">Rôle Agronomique</span>
              <select
                value={config.agroRole || "none"}
                onChange={(e) => updateMetricConfig(m.key, "agroRole", e.target.value)}
                className="text-[9px] border rounded bg-background p-0.5 focus:outline-none focus:ring-1 focus:ring-primary h-5 cursor-pointer max-w-[130px] font-bold text-foreground"
              >
                <option value="none">Aucun (Auto)</option>
                {Object.entries(agroRolesByCategory).map(([category, roles]) => (
                  <optgroup key={category} label={category}>
                    {roles.map(role => (
                      <option key={role.role_key} value={role.role_key}>{role.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper to render grouped metrics in categories. Grouped by agronomic ROLE category
  // (agro_roles.category, e.g. "Météo extérieure", "Climat / Croissance", "Ferti Irrigation")
  // when the sensor is tagged, so the list reflects what each sensor actually means agronomically
  // rather than which physical Priva compartment/Aranet catalog section it happens to come from.
  // Untagged sensors fall back to their sensor catalog category, same as before.
  const renderGroupedMetrics = (metricsList: any[]) => {
    const grouped: Record<string, any[]> = {};
    metricsList.forEach(m => {
      const role = metricConfigsDraft[m.key]?.agroRole;
      const roleCategory = role && role !== "none" ? agroRoleCategoryByKey[role] : null;
      const cat = roleCategory || m.category || "Autres";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(m);
    });

    return Object.entries(grouped).map(([category, items]) => (
      <div key={category} className="space-y-2 mt-3 border border-muted/20 p-3 rounded-2xl bg-muted/5">
        <h4 className="text-[10px] font-black uppercase text-primary tracking-wider border-b pb-1 flex items-center justify-between">
          <span>{category}</span>
          <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{items.length}</span>
        </h4>
        <div className="space-y-2 pl-0.5 pt-1">
          {items.map(renderSensorItem)}
        </div>
      </div>
    ));
  };

  const leftActiveKeys = visibleChartKeys.filter(k => (metricConfigs[k]?.axis || "left") === "left");
  const rightActiveKeys = visibleChartKeys.filter(k => (metricConfigs[k]?.axis || "left") === "right");

  const chartMargin = useMemo(() => {
    const leftCount = activeYAxes.filter(a => a.axis === "left").length;
    const rightCount = activeYAxes.filter(a => a.axis === "right").length;
    return {
      top: 20,
      left: Math.max(10, leftCount * 28),
      right: Math.max(10, rightCount * 28),
      bottom: 0
    };
  }, [activeYAxes]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/10">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/10">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <ArrowLeft className="h-4.5 w-4.5 text-primary" />
            </div>
            <Image
              src="/logo.png"
              alt="Smart Fields"
              width={140}
              height={80}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          
          {/* Main Navigation tabs grouped in separate boxes (encadrés) */}
          <div className="flex items-center gap-3">
            {/* Box 1: Analyseur Agronomique */}
            <div className="flex items-center bg-muted p-0.5 rounded-xl border">
              <button
                onClick={() => requestTabChange("agronomic")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "agronomic"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Analyseur Agronomique
              </button>
            </div>

            {/* Box 2: Climat/Croissance & Ferti Irrigation side by side (own sensors, own
                selection each, but grouped together as the two "graph" tabs) */}
            <div className="flex items-center bg-muted p-0.5 rounded-xl border">
              <button
                onClick={() => {
                  if (activeTab === "selection" && hasUnsavedSelectionChanges) {
                    setPendingTabSwitch("charts");
                    return;
                  }
                  setActiveTab("charts");
                  setStartDate(getPastDateStr(2));
                  setEndDate(getPastDateStr(1));
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "charts"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground animate-in duration-200"
                }`}
              >
                Climat/Croissance
              </button>
              <button
                onClick={() => requestTabChange("fertigation")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "fertigation"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ferti Irrigation
              </button>
            </div>

            {/* Box: Mouvements de Poids (isolated so it never crowds the main chart) */}
            <div className="flex items-center bg-muted p-0.5 rounded-xl border">
              <button
                onClick={() => requestTabChange("chutes")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "chutes"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mouvements de Poids
              </button>
            </div>

            {/* Box 3: Sélection des données */}
            <div className="flex items-center bg-muted p-0.5 rounded-xl border">
              <button
                onClick={() => setActiveTab("selection")}
                className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "selection"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sélection des données
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Compartment selector: deliberately NOT a tab (rounded pill on a plain
              background, not the shared "bg-muted p-0.5 rounded-xl border" tab-box
              styling above) and pushed to the far right of the header by justify-between,
              so it never reads as another screen/tab - it's a filter, not a destination. */}
          <div className="flex items-center gap-1.5 bg-muted/40 border border-muted/20 px-3 py-0.5 rounded-full h-8">
            <span className="text-[9px] font-black uppercase text-muted-foreground">Compartiment :</span>
            <select
              value={selectedCompartment}
              onChange={(e) => setSelectedCompartment(e.target.value)}
              className="text-[10px] font-bold bg-transparent focus:outline-none cursor-pointer h-full"
            >
              <option value="all">Tous les compartiments (Aranet + Priva)</option>
              <option value="1">Compartiment 1 (Aranet + Priva)</option>
              <option value="2">Compartiment 2 (Priva)</option>
              <option value="3">Compartiment 3 (Priva)</option>
              <option value="4">Compartiment 4 (Priva)</option>
              <option value="5">Compartiment 5 (Priva)</option>
              <option value="6">Compartiment 6 (Priva)</option>
            </select>
          </div>

          {/* Link to the role catalog admin screen (app/dashboard/aranet/roles) - an icon, not a
              tab, same "not a destination like the others" treatment as the Compartiment filter. */}
          <Link
            href="/dashboard/aranet/roles"
            title="Rôles Agronomiques"
            className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/40 border border-muted/20 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
          >
            <Tag className="h-3.5 w-3.5" />
          </Link>

          {activeTab === "charts" && (
            <Button variant="ghost" size="icon" onClick={fetchActiveData} disabled={loading} className="h-8 w-8">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
          {activeTab === "selection" && (
            <Button variant="ghost" size="icon" onClick={fetchPrivaData} disabled={privaLoading} className="h-8 w-8">
              <RefreshCw className={`h-3.5 w-3.5 ${privaLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
      </header>

      {/* Helper to format days J1-J10 into real dates ending on the selected endDate */}
      {(() => {
        const getFormattedDateForDay = (dayNum: number) => {
          try {
            const baseDate = new Date(endDate);
            if (isNaN(baseDate.getTime())) {
              return `Jour ${dayNum}`;
            }
            const offset = 10 - dayNum;
            baseDate.setDate(baseDate.getDate() - offset);
            return baseDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
          } catch {
            return `Jour ${dayNum}`;
          }
        };

        return (
          <>
            {activeTab === "charts" ? (
              <div className="flex flex-1 flex-col overflow-hidden lg:h-[calc(100vh-3.5rem)]">
                {/* Right Side: Charts Display Area (takes full width) */}
                <main className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4 min-h-0 bg-muted/10">
                  {/* Climat/Croissance sub-tabs: the existing sensor chart, or the new
                      photosynthesis efficiency (Aréel/IVL) chart - both share the date range
                      controls below. */}
                  <div className="flex items-center bg-muted p-0.5 rounded-xl border shrink-0 w-fit">
                    <button
                      onClick={() => setClimatSubTab("data")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        climatSubTab === "data"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Graphique des données climatiques
                    </button>
                    <button
                      onClick={() => setClimatSubTab("efficiency")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        climatSubTab === "efficiency"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Efficience photosynthétique
                    </button>
                  </div>

                  {/* Calendar & Title Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-background p-4 rounded-2xl border border-muted/20 shadow-sm shrink-0">
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                        <ChartIcon className="h-4.5 w-4.5 text-primary" /> Période d&apos;Analyse (Max. 30 jours)
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={startDateDraft}
                          onChange={(e) => handleStartDateDraftChange(e.target.value)}
                          className="border rounded-xl px-2.5 py-1 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-8"
                        />
                        <span className="text-xs text-muted-foreground font-bold">à</span>
                        <input
                          type="date"
                          value={endDateDraft}
                          onChange={(e) => handleEndDateDraftChange(e.target.value)}
                          className="border rounded-xl px-2.5 py-1 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-8"
                        />
                        <Button
                          size="sm"
                          onClick={commitDateRange}
                          className="bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase h-8 px-3 rounded-xl shadow-sm"
                        >
                          Charger
                        </Button>
                      </div>
                      <div className="flex items-center gap-1.5 border-l pl-3 border-muted/50">
                        <span className="text-[10px] text-slate-500 uppercase font-black">Intervalle :</span>
                        <select
                          value={timeStep}
                          onChange={(e) => setTimeStep(e.target.value)}
                          className="border rounded-xl px-2 py-1 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-8 cursor-pointer"
                        >
                          <option value="auto">Auto (Dynamique)</option>
                          <option value="1">1 minute</option>
                          <option value="2">2 minutes</option>
                          <option value="5">5 minutes</option>
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 heure</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {climatSubTab === "data" && (
                  <>
                  {/* Sensor Visibility Toggles */}
                  {selectedKeys.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 bg-background p-3 rounded-2xl border border-muted/20 shadow-sm shrink-0 animate-in fade-in duration-300">
                      <span className="text-[10px] font-black text-muted-foreground uppercase mr-1">Afficher / Masquer :</span>
                      <div className="flex items-center gap-1.5 mr-2 shrink-0">
                        <button
                          onClick={() => setHiddenKeysOnChart([])}
                          className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors"
                        >
                          Tout afficher
                        </button>
                        <button
                          onClick={() => setHiddenKeysOnChart(selectedKeys)}
                          className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors"
                        >
                          Tout masquer
                        </button>
                      </div>
                      {selectedKeys.map(key => {
                        const m = allMetrics.find(item => item.key === key);
                        if (!m) return null;
                        const isVisible = !hiddenKeysOnChart.includes(key);
                        const config = metricConfigs[key] || {};
                        const sensorColor = config.color || m.color;
                        return (
                          <button
                            key={`toggle-chart-${key}`}
                            onClick={() => {
                              if (isVisible) {
                                setHiddenKeysOnChart([...hiddenKeysOnChart, key]);
                              } else {
                                setHiddenKeysOnChart(hiddenKeysOnChart.filter(k => k !== key));
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                              isVisible 
                                ? "text-white shadow-sm" 
                                : "bg-muted/10 text-muted-foreground border-muted-foreground/15 opacity-60 hover:opacity-85"
                            }`}
                            style={{
                              backgroundColor: isVisible ? sensorColor : undefined,
                              borderColor: isVisible ? sensorColor : undefined
                            }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            {config.customName || m.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Combined/Aligned Chart Card */}
                  {selectedKeys.length === 0 ? (
                    <Card className="flex-1 flex flex-col items-center justify-center p-8 bg-background border border-muted/20 shadow-sm min-h-[300px]">
                      <Activity className="h-8 w-8 text-muted-foreground animate-pulse mb-2" />
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider text-center">Aucun capteur sélectionné</p>
                      <p className="text-[10px] text-muted-foreground text-center mt-1">Allez dans l&apos;onglet &quot;Sélection des données&quot; pour cocher les capteurs à afficher.</p>
                    </Card>
                  ) : (
                    <>
                      <Card className="flex-1 flex flex-col bg-background border border-muted/20 shadow-sm overflow-hidden min-h-[400px]">
                      <CardHeader className="p-4 border-b bg-muted/5 flex flex-row items-center justify-between shrink-0">
                        <div>
                          <CardTitle className="text-xs font-black uppercase tracking-tight">Graphique Agronomique Comparatif</CardTitle>
                          <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Chaque capteur possède sa propre échelle Y automatique (de la couleur de sa courbe) alignée sur le côté gauche ou droit.</p>
                        </div>
                        {loading && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                            <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                            Synchronisation...
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                        {/* Movement banner/modal and per-movement annotations now live in the
                            dedicated "Mouvements de Poids" tab so this comparative chart stays uncluttered. */}
                        {privaChartError && (
                          <div className={`border p-2.5 rounded-xl text-[10px] font-bold flex items-center gap-2 mb-2 shrink-0 ${
                            privaChartError.startsWith("Info")
                              ? "bg-blue-500/10 border-blue-500/25 text-blue-700"
                              : "bg-amber-500/10 border-amber-500/25 text-amber-700"
                          }`}>
                            {privaChartError.startsWith("Info") ? (
                              <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            )}
                            <span>{privaChartError}</span>
                          </div>
                        )}
                        {error ? (
                          <div className="h-full w-full flex items-center justify-center text-xs text-red-500 font-medium">
                            {error}
                          </div>
                        ) : chartData.length === 0 ? (
                          <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                            En attente de relevés pour cette période...
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-0">
                            {/* The Chart Container */}
                            <div className="w-full h-[400px] sm:h-[450px] md:h-[500px] lg:h-[550px] xl:h-[600px] min-h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={chartMargin}>
                                  <CartesianGrid yAxisId={firstYAxisId} strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                                  
                                  {/* Midnight vertical reference lines */}
                                  {midnightTimestamps.map((ts) => (
                                    <ReferenceLine
                                      key={`midnight-${ts}`}
                                      x={ts}
                                      yAxisId={firstYAxisId}
                                      stroke="#cbd5e1"
                                      strokeDasharray="3 3"
                                      strokeWidth={1}
                                      label={{ 
                                        value: "Minuit", 
                                        position: "top", 
                                        fill: "#94a3b8", 
                                        fontSize: 8, 
                                        fontWeight: "bold" 
                                      }}
                                    />
                                  ))}

                                  <XAxis
                                    dataKey="time"
                                    type="number"
                                    scale="time"
                                    domain={['auto', 'auto']}
                                    tickFormatter={(ts) => {
                                      const d = new Date(ts);
                                      return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    }}
                                    tick={{ fontSize: 8, fill: "#64748b", fontWeight: "600" }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={5}
                                  />

                                  {/* DYNAMIC GROUPED Y-AXES BY UNIT & SIDE */}
                                  {activeYAxes.map((yAxis) => {
                                    const isShared = yAxis.keys.length > 1;
                                    const axisColor = isShared ? "#64748b" : yAxis.color;

                                    return (
                                      <YAxis
                                        key={`yAxis-${yAxis.axisId}`}
                                        yAxisId={yAxis.axisId}
                                        orientation={yAxis.axis}
                                        stroke={axisColor}
                                        tick={{ fontSize: 8, fill: axisColor }}
                                        domain={["auto", "auto"]}
                                        width={24}
                                        label={{
                                          value: yAxis.unitName,
                                          angle: yAxis.axis === "left" ? -90 : 90,
                                          position: yAxis.axis === "left" ? "insideLeft" : "insideRight",
                                          style: { textAnchor: "middle", fill: axisColor, fontSize: 8, fontWeight: "bold" }
                                        }}
                                      />
                                    );
                                  })}

                                  <Tooltip content={<CustomTooltip />} />
                                  <Legend 
                                    verticalAlign="bottom" 
                                    iconType="plainline" 
                                    iconSize={12}
                                    wrapperStyle={{ 
                                      paddingTop: 10,
                                      fontSize: '10px', 
                                      fontWeight: '600' 
                                    }} 
                                  />

                                  {/* lines mapping */}
                                  {visibleChartKeys.flatMap(key => {
                                    const m = allMetrics.find((item: any) => item.key === key)!;
                                    const config = metricConfigs[key] || {};
                                    const unitObj = m.units.find((u: any) => u.id === config.unit) || m.units[0];
                                    const unitName = normalizeUnitName(unitObj ? unitObj.name : "");
                                    const sensorColor = config.color || m.color;
                                    const isSmooth = config.smooth === true || config.smooth === "true";

                                    const lines = [
                                      <Line
                                        key={`${key}-smoothed`}
                                        yAxisId={`${config.axis || "left"}-${unitName}`}
                                        type="monotone"
                                        dataKey={key}
                                        name={`${config.customName || m.name} (${unitName})`}
                                        stroke={sensorColor}
                                        strokeWidth={1.4}
                                        dot={false}
                                        connectNulls={true}
                                        isAnimationActive={false}
                                      />
                                    ];

                                    if (isSmooth) {
                                      lines.unshift(
                                        <Line
                                          key={`${key}-raw`}
                                          yAxisId={`${config.axis || "left"}-${unitName}`}
                                          type="monotone"
                                          dataKey={`${key}_raw`}
                                          name={`${config.customName || m.name} (Brut)`}
                                          stroke={sensorColor}
                                          strokeWidth={0.8}
                                          opacity={0.25}
                                          dot={false}
                                          connectNulls={true}
                                          legendType="none"
                                          isAnimationActive={false}
                                        />
                                      );
                                    }

                                    return lines;
                                  })}

                                  {/* RECHARTS BRUSH SELECTOR */}
                                  <Brush 
                                    dataKey="time" 
                                    height={45} 
                                    stroke="#cbd5e1" 
                                    fill="#f8fafc"
                                    startIndex={brushIndices.start}
                                    endIndex={brushIndices.end}
                                    tickFormatter={(timeMs) => {
                                      if (!timeMs || isNaN(Number(timeMs))) return "";
                                      const date = new Date(Number(timeMs));
                                      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    }}
                                    onChange={(brushState) => {
                                      if (brushState && brushState.startIndex !== undefined && brushState.endIndex !== undefined) {
                                        const startItem = chartData[brushState.startIndex];
                                        const endItem = chartData[Math.min(chartData.length - 1, brushState.endIndex)];
                                        if (startItem && endItem) {
                                          updateZoomTimeRangeDebounced({ min: startItem.time, max: endItem.time });
                                        }
                                      }
                                    }}
                                  >
                                    <LineChart data={chartData}>
                                      {visibleChartKeys.map(key => {
                                        const m = allMetrics.find(item => item.key === key)!;
                                        const config = metricConfigs[key] || {};
                                        const sensorColor = config.color || m.color;
                                        return (
                                          <Line
                                            key={`brush-line-${key}`}
                                            type="monotone"
                                            dataKey={key}
                                            stroke={sensorColor}
                                            strokeWidth={0.6}
                                            dot={false}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                          />
                                        );
                                      })}
                                    </LineChart>
                                  </Brush>
                                </LineChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Colored Bottom Indicator Badges */}
                            <div className="flex items-center justify-between border-t pt-2 mt-0.5 px-1 text-[10px] font-bold shrink-0">
                              {/* Left Side Badges */}
                              <div className="flex flex-wrap gap-1.5">
                                {leftActiveKeys.map(key => {
                                  const m = allMetrics.find(item => item.key === key)!;
                                  const config = metricConfigs[key] || {};
                                  const label = config.customName || METRIC_BADGES[key] || key.substring(0, 3);
                                  const sensorColor = config.color || m.color;
                                  return (
                                    <div 
                                      key={`badge-${key}`}
                                      className="px-1.5 py-0.5 border rounded shadow-sm text-[9px]"
                                      style={{ borderColor: sensorColor, color: sensorColor, backgroundColor: `${sensorColor}05` }}
                                    >
                                      {label}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Right Side Badges */}
                              <div className="flex flex-wrap gap-1.5">
                                {rightActiveKeys.map(key => {
                                  const m = allMetrics.find(item => item.key === key)!;
                                  const config = metricConfigs[key] || {};
                                  const label = config.customName || METRIC_BADGES[key] || key.substring(0, 3);
                                  const sensorColor = config.color || m.color;
                                  return (
                                    <div 
                                      key={`badge-${key}`}
                                      className="px-1.5 py-0.5 border rounded shadow-sm text-[9px]"
                                      style={{ borderColor: sensorColor, color: sensorColor, backgroundColor: `${sensorColor}05` }}
                                    >
                                      {label}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                  </>
                  )}
                  </>
                  )}

                  {climatSubTab === "efficiency" && (
                    <>
                      {(!co2Key || !radKey || !tempKey) ? (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-3 shadow-sm">
                          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                          <div>
                            Sélection requise : ce graphique a besoin de{" "}
                            {[!co2Key && "CO2", !radKey && "Radiation instantanée (extérieure)", !tempKey && "Température serre"].filter(Boolean).join(", ")}{" "}
                            coché(s) dans l&apos;onglet <i>Sélection des données</i> (rôle agronomique correspondant recommandé, ou nom de capteur reconnaissable).
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="bg-background border border-border p-4 rounded-2xl shadow-sm shrink-0">
                            <h4 className="text-xs font-black uppercase text-foreground flex items-center gap-2">
                              <Gauge className="h-4 w-4 text-primary" /> Efficience photosynthétique (Aréel / IVL)
                            </h4>
                            <p className="text-[10px] text-muted-foreground font-semibold mt-1 leading-relaxed">
                              <b>Aréel</b> (axe gauche, μmol CO2·m⁻²·s⁻¹) est la vitesse de photosynthèse instantanée réelle, calculée à partir du CO2, de la radiation extérieure et de la température serre.{" "}
                              <b>IVL</b> (axe droit, %) mesure la qualité du pilotage climatique (température + CO2) indépendamment de la lumière disponible à l&apos;instant T - un IVL bas signale un potentiel lumineux gaspillé par un climat mal réglé.{" "}
                              <b>Croissance en direct</b> (axe droit extérieur, -100% à +100%) lisse le gain cumulé sur une fenêtre glissante de 15 minutes et l&apos;exprime en écart par rapport au rythme moyen de la journée (0% = rythme moyen du jour, +100% = deux fois plus vite que la moyenne, -100% = croissance à l&apos;arrêt sur cette fenêtre). Translucidité du verre utilisée : {glassTranslucidityPercent !== "" ? `${glassTranslucidityPercent}%` : "70% (valeur par défaut)"}.
                            </p>
                          </div>

                          <Card className="flex-1 flex flex-col bg-background border border-muted/20 shadow-sm overflow-hidden min-h-[400px]">
                            <CardHeader className="p-4 border-b bg-muted/5 flex flex-row items-start justify-between gap-3 flex-wrap">
                              <div>
                                <CardTitle className="text-xs font-black uppercase tracking-tight">Aréel, IVL et Croissance en direct dans le temps</CardTitle>
                                <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Bandes de fond sur l&apos;axe IVL : rouge (&lt;70%, gaspillage lumineux), jaune (70-90%, frein modéré), vert (90-100%, valorisation excellente). Ligne pointillée à 0% : rythme de croissance moyen de la journée.</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-bold text-muted-foreground">
                                  <input
                                    type="checkbox"
                                    checked={growthRateSmooth}
                                    onChange={(e) => setGrowthRateSmooth(e.target.checked)}
                                    className="rounded border-muted text-primary focus:ring-primary h-3 w-3 cursor-pointer"
                                  />
                                  Lissage SG (Croissance en direct)
                                </label>
                                {growthRateSmooth && (
                                  <select
                                    value={growthRateSgWindow}
                                    onChange={(e) => setGrowthRateSgWindow(Number(e.target.value))}
                                    className="text-[9px] border rounded bg-background px-1 focus:outline-none focus:ring-1 focus:ring-primary h-5 cursor-pointer"
                                  >
                                    <option value="5">5 pts</option>
                                    <option value="9">9 pts</option>
                                    <option value="15">15 pts</option>
                                    <option value="25">25 pts</option>
                                    <option value="45">45 pts</option>
                                  </select>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 flex-1 flex flex-col min-h-0">
                              <div className="w-full h-[420px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={smoothedPhotosynthesisChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid yAxisId="left" strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                                    <ReferenceArea yAxisId="right" y1={0} y2={70} fill="#ef4444" fillOpacity={0.08} strokeOpacity={0} />
                                    <ReferenceArea yAxisId="right" y1={70} y2={90} fill="#f59e0b" fillOpacity={0.08} strokeOpacity={0} />
                                    <ReferenceArea yAxisId="right" y1={90} y2={100} fill="#22c55e" fillOpacity={0.1} strokeOpacity={0} />
                                    <XAxis
                                      dataKey="time"
                                      type="number"
                                      scale="time"
                                      domain={['auto', 'auto']}
                                      tickFormatter={(ts) => {
                                        const d = new Date(ts);
                                        return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                      }}
                                      tick={{ fontSize: 8, fill: "#64748b", fontWeight: "600" }}
                                      axisLine={false}
                                      tickLine={false}
                                      dy={5}
                                    />
                                    <YAxis
                                      yAxisId="left"
                                      orientation="left"
                                      stroke="#0ea5e9"
                                      tick={{ fontSize: 8, fill: "#0ea5e9" }}
                                      width={36}
                                      label={{ value: "Aréel (μmol CO2/m²/s)", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "#0ea5e9", fontSize: 8, fontWeight: "bold" } }}
                                    />
                                    <YAxis
                                      yAxisId="right"
                                      orientation="right"
                                      domain={[0, 100]}
                                      stroke="#7c3aed"
                                      tick={{ fontSize: 8, fill: "#7c3aed" }}
                                      width={32}
                                      unit="%"
                                      label={{ value: "IVL (%)", angle: 90, position: "insideRight", style: { textAnchor: "middle", fill: "#7c3aed", fontSize: 8, fontWeight: "bold" } }}
                                    />
                                    <YAxis
                                      yAxisId="growth"
                                      orientation="right"
                                      domain={[-100, 100]}
                                      stroke="#16a34a"
                                      tick={{ fontSize: 8, fill: "#16a34a" }}
                                      width={40}
                                      unit="%"
                                      label={{ value: "Croissance en direct (%)", angle: 90, position: "insideRight", style: { textAnchor: "middle", fill: "#16a34a", fontSize: 8, fontWeight: "bold" } }}
                                    />
                                    <ReferenceLine yAxisId="growth" y={0} stroke="#16a34a" strokeDasharray="4 3" strokeOpacity={0.6} />
                                    <Tooltip content={({ active, payload, label }: any) => {
                                      if (!active || !payload || !payload.length) return null;
                                      const ivlPoint = payload.find((p: any) => p.dataKey === "ivl");
                                      const ivlVal = ivlPoint?.value;
                                      const diagnostic = ivlVal === null || ivlVal === undefined ? null
                                        : ivlVal >= 90 ? { text: "Valorisation excellente", color: "text-emerald-500" }
                                        : ivlVal >= 70 ? { text: "Frein modéré (CO2 à envisager)", color: "text-amber-500" }
                                        : { text: "Gaspillage lumineux", color: "text-rose-500" };
                                      const d = new Date(label);
                                      return (
                                        <div className="bg-background border border-muted-foreground/20 p-2.5 rounded-xl shadow-lg space-y-1 text-[11px] z-30">
                                          <p className="font-bold text-foreground">{d.toLocaleDateString([], { day: '2-digit', month: '2-digit' })} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                          {payload.map((item: any) => (
                                            <p key={item.dataKey} style={{ color: item.color }} className="font-semibold">
                                              {item.name} : {item.value !== null && item.value !== undefined ? item.value : "N/A"}{item.dataKey === "ivl" || item.dataKey === "growthRatePercent" ? "%" : ""}
                                            </p>
                                          ))}
                                          {diagnostic && (
                                            <p className={`font-bold pt-1 border-t border-border/30 mt-1 ${diagnostic.color}`}>
                                              {diagnostic.text}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    }} />
                                    <Legend verticalAlign="bottom" iconType="plainline" iconSize={12} wrapperStyle={{ paddingTop: 10, fontSize: '10px', fontWeight: '600' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="aReel" name="Aréel" stroke="#0ea5e9" strokeWidth={1.6} dot={false} connectNulls={true} isAnimationActive={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="ivl" name="IVL" stroke="#7c3aed" strokeWidth={1.6} dot={false} connectNulls={true} isAnimationActive={false} />
                                    <Line yAxisId="growth" type="monotone" dataKey="growthRatePercent" name="Croissance en direct" stroke="#16a34a" strokeWidth={1.6} dot={false} connectNulls={true} isAnimationActive={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </>
                  )}
                </main>
              </div>
            ) : activeTab === "chutes" ? (
              /* Dedicated tab for configuring/characterizing raw weight drops, isolated from
                 the main comparative chart (which was getting crowded with banners, modals and
                 reference lines every time a drop needed validating). This mini chart only ever
                 shows the two series relevant to that job: cumulative gain and raw scale weight. */
              <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4 min-h-0 bg-muted/10">
                {/* Same banner layout/style as Climat/Croissance (icon+title left, date range +
                    Charger + Intervalle right, single row, max 30 jours) - this tab plots the
                    same chartData/timeStep as the main chart, just isolated to two series. */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-background p-4 rounded-2xl border border-muted/20 shadow-sm shrink-0">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                      <Activity className="h-4.5 w-4.5 text-primary" /> Mouvements de Poids (Max. 30 jours)
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={startDateDraft}
                        onChange={(e) => handleStartDateDraftChange(e.target.value)}
                        className="border rounded-xl px-2.5 py-1 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-8"
                      />
                      <span className="text-xs text-muted-foreground font-bold">à</span>
                      <input
                        type="date"
                        value={endDateDraft}
                        onChange={(e) => handleEndDateDraftChange(e.target.value)}
                        className="border rounded-xl px-2.5 py-1 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-8"
                      />
                      <Button
                        size="sm"
                        onClick={commitDateRange}
                        className="bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase h-8 px-3 rounded-xl shadow-sm"
                      >
                        Charger
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5 border-l pl-3 border-muted/50">
                      <span className="text-[10px] text-slate-500 uppercase font-black">Intervalle :</span>
                      <select
                        value={timeStep}
                        onChange={(e) => setTimeStep(e.target.value)}
                        className="border rounded-xl px-2 py-1 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-8 cursor-pointer"
                      >
                        <option value="auto">Auto (Dynamique)</option>
                        <option value="1">1 minute</option>
                        <option value="2">2 minutes</option>
                        <option value="5">5 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 heure</option>
                      </select>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium -mt-2">
                  Graphique isolé (Gain Cumulé + Poids Brut Bascule). Chaque chute ou hausse brutale est détectée et lissée automatiquement ; il ne reste qu&apos;à caractériser sa nature si besoin.
                </p>

                {!selectedKeys.includes("plant_weight_gain") ? (
                  <Card className="flex-1 flex flex-col items-center justify-center p-8 bg-background border border-muted/20 shadow-sm min-h-[300px]">
                    <Activity className="h-8 w-8 text-muted-foreground animate-pulse mb-2" />
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider text-center">Capteur &quot;Cumulative Gain&quot; non sélectionné</p>
                    <p className="text-[10px] text-muted-foreground text-center mt-1">Allez dans l&apos;onglet &quot;Sélection des données&quot; et cochez &quot;Cumulative Gain&quot; pour suivre les mouvements de poids.</p>
                  </Card>
                ) : (
                  <>
                    <Card className="bg-background border border-muted/20 shadow-sm overflow-hidden">
                      <CardHeader className="p-4 border-b bg-muted/5">
                        <CardTitle className="text-xs font-black uppercase tracking-tight">Gain Cumulé & Poids Brut Bascule</CardTitle>
                        <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Gain Cumulé (kg/m², axe gauche, corrigé automatiquement des mouvements de poids détectés) — Poids Brut Bascule (kg, axe droit, non corrigé).</p>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="w-full h-[380px] sm:h-[420px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />

                              {midnightTimestamps.map((ts) => (
                                <ReferenceLine
                                  key={`chutes-midnight-${ts}`}
                                  x={ts}
                                  yAxisId="left"
                                  stroke="#cbd5e1"
                                  strokeDasharray="3 3"
                                  strokeWidth={1}
                                  label={{ value: "Minuit", position: "top", fill: "#94a3b8", fontSize: 8, fontWeight: "bold" }}
                                />
                              ))}

                              {/* Every individual movement gets its own marker; correction is always applied,
                                  the label is only the (auto or user-set) characterization of its nature. */}
                              {showAnnotations && dynamicAgronomicData.flatMap(d =>
                                (d.drops || []).map((drop: WeightDropCandidate) => {
                                  const eventType = dailyEvents[drop.id] || drop.autoEventType;
                                  const compensationVal = dailyAdjustedWeights[drop.id] !== undefined
                                     ? dailyAdjustedWeights[drop.id]
                                     : drop.suggestedCorrectionGrams;
                                  const eventLabel = eventType === "harvest" ? "Récolte"
                                     : eventType === "thinning" ? "Effeuillage"
                                     : eventType === "descent" ? "Descente"
                                     : eventType === "recalibration" ? "Recalibrage"
                                     : eventType === "watering" ? "Arrosage/Remontée"
                                     : "Mouvement";
                                  const arrow = drop.direction === "drop" ? "↓" : "↑";
                                  const sign = drop.direction === "drop" ? "+" : "-";
                                  const labelText = `${arrow} ${eventLabel} : ${sign}${compensationVal} g/m²`;
                                  const strokeColor = drop.direction === "drop" ? "#10b981" : "#f59e0b";

                                  return (
                                    <ReferenceLine
                                      key={`chutes-drop-ann-${drop.id}`}
                                      x={drop.time}
                                      yAxisId="left"
                                      stroke={strokeColor}
                                      strokeDasharray="4 4"
                                      strokeWidth={1.5}
                                      label={{
                                        value: labelText,
                                        position: "insideTopLeft",
                                        fill: strokeColor,
                                        fontSize: 9,
                                        fontWeight: "bold"
                                      }}
                                    />
                                  );
                                })
                              )}

                              <XAxis
                                dataKey="time"
                                type="number"
                                scale="time"
                                domain={['auto', 'auto']}
                                tickFormatter={(ts) => {
                                  const d = new Date(ts);
                                  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                }}
                                tick={{ fontSize: 8, fill: "#64748b", fontWeight: "600" }}
                                axisLine={false}
                                tickLine={false}
                                dy={5}
                              />
                              <YAxis
                                yAxisId="left"
                                orientation="left"
                                stroke="#22c55e"
                                tick={{ fontSize: 8, fill: "#22c55e" }}
                                width={40}
                                label={{ value: "kg/m²", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "#22c55e", fontSize: 8, fontWeight: "bold" } }}
                              />
                              <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#84cc16"
                                tick={{ fontSize: 8, fill: "#84cc16" }}
                                width={40}
                                label={{ value: "kg", angle: 90, position: "insideRight", style: { textAnchor: "middle", fill: "#84cc16", fontSize: 8, fontWeight: "bold" } }}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend verticalAlign="bottom" iconType="plainline" iconSize={12} wrapperStyle={{ paddingTop: 10, fontSize: '10px', fontWeight: '600' }} />

                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="plant_weight_gain"
                                name="Gain Cumulé (kg/m²)"
                                stroke="#22c55e"
                                strokeWidth={1.6}
                                dot={false}
                                connectNulls={true}
                                isAnimationActive={false}
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="rawScaleWeight"
                                name="Poids Brut Bascule (kg)"
                                stroke="#84cc16"
                                strokeWidth={1}
                                opacity={0.6}
                                dot={false}
                                connectNulls={true}
                                isAnimationActive={false}
                              />

                              <Brush
                                dataKey="time"
                                height={35}
                                stroke="#cbd5e1"
                                fill="#f8fafc"
                                tickFormatter={(timeMs) => {
                                  if (!timeMs || isNaN(Number(timeMs))) return "";
                                  const date = new Date(Number(timeMs));
                                  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Informative summary - every detected movement is already auto-smoothed; this only
                        surfaces the ones whose nature hasn't been characterized by the user yet
                        (still using the automatic best-guess label until then). */}
                    {(() => {
                      const uncharacterized = dynamicAgronomicData.flatMap((d: any) =>
                        (d.drops || []).filter((drop: WeightDropCandidate) => !dailyEvents[drop.id])
                      );
                      if (uncharacterized.length === 0) return null;
                      return (
                        <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm shrink-0">
                          <div className="flex items-center gap-2.5 text-xs text-sky-700 dark:text-sky-400 font-bold">
                            <Activity className="h-4.5 w-4.5 text-sky-500 shrink-0" />
                            <div>
                              <span>{uncharacterized.length} mouvement(s) de poids détecté(s) et déjà lissé(s) automatiquement.</span>
                              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Nature devinée automatiquement ; ajuste-la si tu connais la vraie cause.</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                            {uncharacterized.map((drop: WeightDropCandidate) => (
                              <button
                                key={`btn-val-${drop.id}`}
                                onClick={() => setValidatingDropId(drop.id)}
                                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-black uppercase shadow-sm transition-colors cursor-pointer"
                              >
                                Caractériser {drop.dateStr} {drop.timeStr}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Interactive Validation Modal (Petite fenêtre) */}
                    {validatingDropId && (() => {
                      const { dateStr: dropDateStr } = parseDropId(validatingDropId);
                      const day = dynamicAgronomicData.find((item: any) => item.dateStr === dropDateStr);
                      const drop = day?.drops?.find((dd: WeightDropCandidate) => dd.id === validatingDropId);
                      if (!drop) return null;
                      const currentType = dailyEventsDraft[validatingDropId] || drop.autoEventType;
                      const currentVal = dailyAdjustedWeightsDraft[validatingDropId] !== undefined
                        ? dailyAdjustedWeightsDraft[validatingDropId]
                        : drop.suggestedCorrectionGrams;

                      const handleSave = () => {
                        setDailyEvents(prev => {
                          const updated = { ...prev, [validatingDropId]: currentType as any };
                          localStorage.setItem("aranet_daily_events", JSON.stringify(updated));
                          return updated;
                        });
                        setDailyEventsDraft(prev => ({
                          ...prev,
                          [validatingDropId]: currentType as any
                        }));
                        setDailyAdjustedWeights(prev => {
                          const updated = { ...prev, [validatingDropId]: currentVal };
                          localStorage.setItem("aranet_daily_adjusted_weights", JSON.stringify(updated));
                          return updated;
                        });
                        setDailyAdjustedWeightsDraft(prev => ({
                          ...prev,
                          [validatingDropId]: currentVal
                        }));
                        setValidatingDropId(null);
                      };

                      return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                          <Card className="w-full max-w-sm border shadow-2xl bg-background rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <CardHeader className="p-5 border-b bg-muted/20">
                              <CardTitle className="text-xs font-black uppercase tracking-wider text-sky-600 flex items-center gap-2">
                                <Sliders className="h-4.5 w-4.5" /> Mouvement de Poids - {drop.dateStr}
                              </CardTitle>
                              <CardDescription className="text-[10px] font-bold">
                                {drop.direction === "drop" ? "Chute" : "Hausse"} de {drop.suddenDropVal} g/m² détectée à {drop.timeStr} - déjà lissée automatiquement.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-muted-foreground uppercase font-black">Nature du mouvement</label>
                                <select
                                  value={currentType}
                                  onChange={(e) => setDailyEventsDraft(prev => ({ ...prev, [validatingDropId]: e.target.value as any }))}
                                  className="w-full border rounded-xl p-2 bg-background text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer h-9"
                                >
                                  {drop.direction === "drop" ? (
                                    <>
                                      <option value="harvest">Récolte</option>
                                      <option value="thinning">Effeuillage</option>
                                      <option value="descent">Descente</option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="recalibration">Recalibrage bascule</option>
                                      <option value="watering">Arrosage/Remontée</option>
                                    </>
                                  )}
                                </select>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] text-muted-foreground uppercase font-black">Delta compensé (Lissage)</label>
                                  <span className="text-[9px] text-emerald-600 font-bold">Suggéré : {drop.suggestedCorrectionGrams} g/m²</span>
                                </div>
                                <div className="flex items-center gap-1.5 border rounded-xl px-3 bg-background h-9 shadow-sm">
                                  <input
                                    type="number"
                                    value={currentVal}
                                    onChange={(e) => setDailyAdjustedWeightsDraft(prev => ({
                                      ...prev,
                                      [validatingDropId]: Math.max(0, parseFloat(e.target.value) || 0)
                                    }))}
                                    className="w-full bg-transparent text-left font-mono font-black text-xs focus:outline-none"
                                  />
                                  <span className="text-[10px] font-black text-muted-foreground uppercase shrink-0">g/m²</span>
                                </div>
                                <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug">
                                  Calculé par la moyenne des 15 points avant moins la moyenne des 15 points après le mouvement. Déjà appliqué automatiquement ; modifie-le seulement si tu veux affiner le lissage.
                                </p>
                              </div>
                            </CardContent>
                            <CardFooter className="p-5 border-t bg-muted/5 flex items-center justify-end gap-2.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setValidatingDropId(null)}
                                className="font-bold text-xs uppercase h-9 rounded-xl"
                              >
                                Fermer
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSave}
                                className="font-black text-xs uppercase h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm px-4"
                              >
                                Enregistrer
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      );
                    })()}

                    {/* Annotations & Events Settings Panel */}
                    <div className="bg-background border border-border/80 p-4 rounded-2xl space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="toggle-annotations"
                            checked={showAnnotations}
                            onChange={(e) => setShowAnnotations(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          />
                          <label htmlFor="toggle-annotations" className="text-xs font-black uppercase text-foreground cursor-pointer select-none">
                            Afficher les repères de mouvements de poids sur le graphique
                          </label>
                        </div>
                      </div>

                      <div className="border-t pt-3 space-y-3 bg-muted/5 p-3 rounded-xl border border-muted/20">
                        <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5" /> Déclarer manuellement un mouvement de poids
                        </h4>
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Date</span>
                            <select
                              value={newManualDropDate}
                              onChange={(e) => setNewManualDropDate(e.target.value)}
                              className="bg-background border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary h-8 cursor-pointer min-w-[130px]"
                            >
                              <option value="">Sélectionner...</option>
                              {dynamicAgronomicData.map(d => (
                                <option key={d.dateStr} value={d.dateStr}>{d.dateStr}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Heure</span>
                            <input
                              type="text"
                              value={newManualDropTime}
                              onChange={(e) => setNewManualDropTime(e.target.value)}
                              placeholder="12:00"
                              className="bg-background border rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary h-8 w-20 text-center"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Direction</span>
                            <select
                              value={newManualDropDirection}
                              onChange={(e) => setNewManualDropDirection(e.target.value as "drop" | "rise")}
                              className="bg-background border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary h-8 cursor-pointer"
                            >
                              <option value="drop">Chute</option>
                              <option value="rise">Hausse</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Taille (g/m²)</span>
                            <input
                              type="number"
                              value={newManualDropVal}
                              onChange={(e) => setNewManualDropVal(e.target.value)}
                              placeholder="100"
                              className="bg-background border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary h-8 w-24 text-center font-mono"
                            />
                          </div>
                          <Button
                            size="sm"
                            disabled={!newManualDropDate}
                            onClick={handleAddManualDrop}
                            className="bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase px-4 h-8 rounded-lg shadow-sm shrink-0"
                          >
                            Ajouter
                          </Button>
                        </div>
                      </div>

                      {showAnnotations && (() => {
                        const drops: WeightDropCandidate[] = dynamicAgronomicData.flatMap(d => d.drops || []);
                        if (drops.length === 0) {
                          return (
                            <div className="text-[10px] text-muted-foreground font-semibold border-t pt-2">
                              Aucun mouvement de poids brutal de biomasse n&apos;a été détecté.
                            </div>
                          );
                        }

                        return (
                          <div className="border-t pt-3 space-y-2.5">
                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                              Mouvements de Poids Détectés et Lissés Automatiquement ({drops.length}) :
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {drops.map(d => {
                                const eventVal = dailyEventsDraft[d.id] || d.autoEventType;
                                const adjVal = dailyAdjustedWeightsDraft[d.id] !== undefined
                                  ? dailyAdjustedWeightsDraft[d.id]
                                  : d.suggestedCorrectionGrams;
                                const arrow = d.direction === "drop" ? "↓" : "↑";

                                return (
                                  <div key={d.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/20 border border-border/50">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-black text-foreground">{arrow} {d.dateStr} à {d.timeStr}</span>
                                      <span className="text-[9px] text-muted-foreground font-semibold">Brut : {d.suddenDropVal} g/m² (Delta lissé : {d.suggestedCorrectionGrams} g/m²)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {/* Dropdown Nature - auto-caractérisé, modifiable */}
                                      <select
                                        value={eventVal}
                                        onChange={(e) => setDailyEventsDraft(prev => ({ ...prev, [d.id]: e.target.value as any }))}
                                        className="bg-background border rounded-lg px-2 py-1 text-[10px] font-black uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                      >
                                        {d.direction === "drop" ? (
                                          <>
                                            <option value="harvest">Récolte</option>
                                            <option value="thinning">Effeuillage</option>
                                            <option value="descent">Descente</option>
                                          </>
                                        ) : (
                                          <>
                                            <option value="recalibration">Recalibrage</option>
                                            <option value="watering">Arrosage/Remontée</option>
                                          </>
                                        )}
                                      </select>

                                      {/* Adjusted Loss Input */}
                                      <div className="flex items-center gap-1 bg-background border rounded-lg px-2 py-0.5 shadow-sm w-24">
                                        <input
                                          type="number"
                                          value={adjVal}
                                          onChange={(e) => setDailyAdjustedWeightsDraft(prev => ({
                                            ...prev,
                                            [d.id]: Math.max(0, parseFloat(e.target.value) || 0)
                                          }))}
                                          className="w-12 bg-transparent text-center font-mono font-bold text-[10px] focus:outline-none"
                                        />
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">g/m²</span>
                                      </div>

                                      {manualDrops[d.id] && (
                                        <button
                                          onClick={() => {
                                            setManualDrops(prev => {
                                              const copy = { ...prev };
                                              delete copy[d.id];
                                              localStorage.setItem("aranet_manual_drops", JSON.stringify(copy));
                                              return copy;
                                            });
                                            setDailyEventsDraft(prev => {
                                              const copy = { ...prev };
                                              delete copy[d.id];
                                              return copy;
                                            });
                                            setDailyAdjustedWeightsDraft(prev => {
                                              const copy = { ...prev };
                                              delete copy[d.id];
                                              return copy;
                                            });
                                            setDailyEvents(prev => {
                                              const copy = { ...prev };
                                              delete copy[d.id];
                                              return copy;
                                            });
                                            setDailyAdjustedWeights(prev => {
                                              const copy = { ...prev };
                                              delete copy[d.id];
                                              return copy;
                                            });
                                          }}
                                          className="p-1 hover:text-rose-500 text-muted-foreground transition-colors cursor-pointer text-xs"
                                          title="Supprimer la chute manuelle"
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Save modifications button */}
                            <div className="flex items-center justify-end border-t pt-3 mt-1.5 gap-2">
                              {hasUnsavedChanges && (
                                <span className="text-[10px] font-bold text-amber-500 flex items-center animate-pulse mr-2">
                                  ⚠️ Modifications non enregistrées
                                </span>
                              )}
                              <Button
                                size="sm"
                                disabled={!hasUnsavedChanges}
                                onClick={handleSaveAdjustments}
                                className={`font-black text-xs uppercase px-4 py-1.5 rounded-xl transition-all shadow-sm ${
                                  hasUnsavedChanges
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-muted-foreground border cursor-not-allowed"
                                }`}
                              >
                                💾 Sauvegarder les modifications
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            ) : activeTab === "fertigation" ? (
              /* Ferti Irrigation tab - own sensor selection (slab EC/WC + slab weight) and own
                 date range, deliberately kept out of the main Climat/Croissance chart/selection. */
              <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4 min-h-0 bg-muted/10">
                {/* Same banner layout/style as Climat/Croissance and Mouvements de Poids -
                    icon+title left, date range + Charger + Intervalle right, single row. */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-background p-4 rounded-2xl border border-muted/20 shadow-sm shrink-0">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                      <Droplets className="h-4.5 w-4.5 text-primary" /> Ferti Irrigation (Max. 30 jours)
                      {fertiLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary ml-1" />}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={fertiStartDateDraft}
                        onChange={(e) => handleFertiStartDateDraftChange(e.target.value)}
                        className="border rounded-xl px-2.5 py-1 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-8"
                      />
                      <span className="text-xs text-muted-foreground font-bold">à</span>
                      <input
                        type="date"
                        value={fertiEndDateDraft}
                        onChange={(e) => handleFertiEndDateDraftChange(e.target.value)}
                        className="border rounded-xl px-2.5 py-1 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-8"
                      />
                      <Button
                        size="sm"
                        onClick={commitFertiDateRange}
                        className="bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase h-8 px-3 rounded-xl shadow-sm"
                      >
                        Charger
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5 border-l pl-3 border-muted/50">
                      <span className="text-[10px] text-slate-500 uppercase font-black">Intervalle :</span>
                      <select
                        value={fertiTimeStep}
                        onChange={(e) => setFertiTimeStep(e.target.value)}
                        className="border rounded-xl px-2 py-1 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-8 cursor-pointer"
                      >
                        <option value="auto">Auto (Dynamique)</option>
                        <option value="1">1 minute</option>
                        <option value="2">2 minutes</option>
                        <option value="5">5 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 heure</option>
                      </select>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium -mt-2">
                  Capteurs gérés depuis l&apos;onglet &quot;Sélection des données&quot; (case FERTI de chaque capteur).
                </p>

                {fertiError && (
                  <div className="bg-amber-500/10 border border-amber-500/25 text-amber-700 p-2.5 rounded-xl text-[10px] font-bold flex items-center gap-2 shrink-0">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" /> <span>{fertiError}</span>
                  </div>
                )}
                {fertiPrivaError && (
                  <div className={`border p-2.5 rounded-xl text-[10px] font-bold flex items-center gap-2 shrink-0 ${
                    fertiPrivaError.startsWith("Info")
                      ? "bg-blue-500/10 border-blue-500/25 text-blue-700"
                      : "bg-amber-500/10 border-amber-500/25 text-amber-700"
                  }`}>
                    {fertiPrivaError.startsWith("Info") ? (
                      <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                    <span>{fertiPrivaError}</span>
                  </div>
                )}

                {/* Sensors marked FERTI in "Sélection des données" - editing which sensors are
                    active happens there (a sensor's Climat/Croissance and Ferti Irrigation
                    visibility are always set from the same single place, never duplicated), but
                    showing/hiding an active sensor on THIS chart is a display concern local to
                    this tab, same "loaded but hidden by default" pattern as Climat/Croissance. */}
                <div className="flex flex-wrap items-center gap-2 bg-background p-3 rounded-2xl border border-muted/20 shadow-sm shrink-0">
                  <span className="text-[10px] font-black text-muted-foreground uppercase mr-1">Afficher / Masquer :</span>
                  {fertiSelectedKeys.length === 0 ? (
                    <span className="text-[10px] text-muted-foreground italic">Aucun - cochez FERTI sur un capteur dans &quot;Sélection des données&quot;.</span>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 mr-2 shrink-0">
                        <button
                          onClick={() => setHiddenFertiKeysOnChart([])}
                          className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors"
                        >
                          Tout afficher
                        </button>
                        <button
                          onClick={() => setHiddenFertiKeysOnChart(fertiSelectedKeys)}
                          className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors"
                        >
                          Tout masquer
                        </button>
                      </div>
                      {fertiSelectedKeys.map(key => {
                        const m = allMetrics.find(item => item.key === key);
                        if (!m) return null;
                        const isVisible = !hiddenFertiKeysOnChart.includes(key);
                        const config = metricConfigs[key] || {};
                        const sensorColor = config.color || m.color;
                        return (
                          <button
                            key={`ferti-toggle-${key}`}
                            onClick={() => {
                              if (isVisible) {
                                setHiddenFertiKeysOnChart([...hiddenFertiKeysOnChart, key]);
                              } else {
                                setHiddenFertiKeysOnChart(hiddenFertiKeysOnChart.filter(k => k !== key));
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                              isVisible
                                ? "text-white shadow-sm"
                                : "bg-muted/10 text-muted-foreground border-muted-foreground/15 opacity-60 hover:opacity-85"
                            }`}
                            style={{
                              backgroundColor: isVisible ? sensorColor : undefined,
                              borderColor: isVisible ? sensorColor : undefined
                            }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            {config.customName || m.name}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>

                {fertiSelectedKeys.length === 0 ? (
                  <Card className="flex-1 flex flex-col items-center justify-center p-8 bg-background border border-muted/20 shadow-sm min-h-[300px]">
                    <Droplets className="h-8 w-8 text-muted-foreground animate-pulse mb-2" />
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider text-center">Aucun capteur sélectionné</p>
                  </Card>
                ) : fertiChartData.length === 0 ? (
                  <Card className="flex-1 flex items-center justify-center p-8 bg-background border border-muted/20 shadow-sm min-h-[300px] text-xs text-muted-foreground">
                    En attente de relevés pour cette période...
                  </Card>
                ) : (
                  <Card className="bg-background border border-muted/20 shadow-sm overflow-hidden">
                    <CardHeader className="p-4 border-b bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-xs font-black uppercase tracking-tight">Substrat & Bascule</CardTitle>
                        <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Axes regroupés par unité et par côté (gauche/droite), configurables par capteur dans &quot;Sélection des données&quot; — même système que Climat/Croissance.</p>
                      </div>
                      {/* Same Y-axis override system as Climat/Croissance, scoped to this chart */}
                      <div className="grid grid-cols-2 gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold text-primary">G</span>
                          <input type="number" placeholder="Min" value={yLeftMinFerti} onChange={(e) => setYLeftMinFerti(e.target.value)} className="w-14 text-[10px] border rounded-lg bg-background p-1 focus:outline-none focus:ring-1 focus:ring-primary text-center h-7 font-semibold" />
                          <input type="number" placeholder="Max" value={yLeftMaxFerti} onChange={(e) => setYLeftMaxFerti(e.target.value)} className="w-14 text-[10px] border rounded-lg bg-background p-1 focus:outline-none focus:ring-1 focus:ring-primary text-center h-7 font-semibold" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold text-green-600">D</span>
                          <input type="number" placeholder="Min" value={yRightMinFerti} onChange={(e) => setYRightMinFerti(e.target.value)} className="w-14 text-[10px] border rounded-lg bg-background p-1 focus:outline-none focus:ring-1 focus:ring-primary text-center h-7 font-semibold" />
                          <input type="number" placeholder="Max" value={yRightMaxFerti} onChange={(e) => setYRightMaxFerti(e.target.value)} className="w-14 text-[10px] border rounded-lg bg-background p-1 focus:outline-none focus:ring-1 focus:ring-primary text-center h-7 font-semibold" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="w-full h-[420px] sm:h-[460px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={fertiChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                            <XAxis
                              dataKey="time"
                              type="number"
                              scale="time"
                              domain={['auto', 'auto']}
                              tickFormatter={(ts) => {
                                const d = new Date(ts);
                                return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              }}
                              tick={{ fontSize: 8, fill: "#64748b", fontWeight: "600" }}
                              axisLine={false}
                              tickLine={false}
                              dy={5}
                            />

                            {/* Dynamic grouped Y-axes by unit & side, same system as Climat/Croissance */}
                            {fertiActiveYAxes.map((yAxis) => {
                              const isShared = yAxis.keys.length > 1;
                              const axisColor = isShared ? "#64748b" : yAxis.color;

                              const parsedLeftMin = Number(yLeftMinFerti);
                              const parsedLeftMax = Number(yLeftMaxFerti);
                              const parsedRightMin = Number(yRightMinFerti);
                              const parsedRightMax = Number(yRightMaxFerti);
                              const domainMin = yAxis.axis === "left"
                                ? (yLeftMinFerti !== "" && !isNaN(parsedLeftMin) ? parsedLeftMin : "auto")
                                : (yRightMinFerti !== "" && !isNaN(parsedRightMin) ? parsedRightMin : "auto");
                              const domainMax = yAxis.axis === "left"
                                ? (yLeftMaxFerti !== "" && !isNaN(parsedLeftMax) ? parsedLeftMax : "auto")
                                : (yRightMaxFerti !== "" && !isNaN(parsedRightMax) ? parsedRightMax : "auto");

                              return (
                                <YAxis
                                  key={`ferti-yAxis-${yAxis.axisId}`}
                                  yAxisId={yAxis.axisId}
                                  orientation={yAxis.axis}
                                  stroke={axisColor}
                                  tick={{ fontSize: 8, fill: axisColor }}
                                  domain={[domainMin, domainMax]}
                                  width={36}
                                  label={{
                                    value: yAxis.unitName,
                                    angle: yAxis.axis === "left" ? -90 : 90,
                                    position: yAxis.axis === "left" ? "insideLeft" : "insideRight",
                                    style: { textAnchor: "middle", fill: axisColor, fontSize: 8, fontWeight: "bold" }
                                  }}
                                />
                              );
                            })}

                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" iconType="plainline" iconSize={12} wrapperStyle={{ paddingTop: 10, fontSize: '10px', fontWeight: '600' }} />
                            {visibleFertiChartKeys.flatMap(key => {
                              const m = allMetrics.find((item: any) => item.key === key);
                              if (!m) return [];
                              const config = metricConfigs[key] || {};
                              const unitObj = m.units.find((u: any) => u.id === config.unit) || m.units[0];
                              const unitName = normalizeUnitName(unitObj ? unitObj.name : "");
                              const sensorColor = config.color || m.color;
                              const isSmooth = config.smooth === true || config.smooth === "true";

                              const lines = [
                                <Line
                                  key={`${key}-smoothed`}
                                  yAxisId={`${config.axis || "left"}-${unitName}`}
                                  type="monotone"
                                  dataKey={key}
                                  name={`${config.customName || m.name} (${unitName})`}
                                  stroke={sensorColor}
                                  strokeWidth={1.4}
                                  dot={false}
                                  connectNulls={true}
                                  isAnimationActive={false}
                                />
                              ];

                              if (isSmooth) {
                                lines.unshift(
                                  <Line
                                    key={`${key}-raw`}
                                    yAxisId={`${config.axis || "left"}-${unitName}`}
                                    type="monotone"
                                    dataKey={`${key}_raw`}
                                    name={`${config.customName || m.name} (Brut)`}
                                    stroke={sensorColor}
                                    strokeWidth={0.8}
                                    opacity={0.25}
                                    dot={false}
                                    connectNulls={true}
                                    legendType="none"
                                    isAnimationActive={false}
                                  />
                                );
                              }

                              return lines;
                            })}
                            <Brush
                              dataKey="time"
                              height={35}
                              stroke="#cbd5e1"
                              fill="#f8fafc"
                              tickFormatter={(timeMs) => {
                                if (!timeMs || isNaN(Number(timeMs))) return "";
                                const date = new Date(Number(timeMs));
                                return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Colored bottom indicator badges, same system as Climat/Croissance */}
                      <div className="flex items-center justify-between border-t pt-2 mt-2 px-1 text-[10px] font-bold">
                        <div className="flex flex-wrap gap-1.5">
                          {fertiLeftActiveKeys.map(key => {
                            const m = allMetrics.find(item => item.key === key);
                            if (!m) return null;
                            const config = metricConfigs[key] || {};
                            const sensorColor = config.color || m.color;
                            return (
                              <div key={`ferti-badge-${key}`} className="px-1.5 py-0.5 border rounded shadow-sm text-[9px]" style={{ borderColor: sensorColor, color: sensorColor, backgroundColor: `${sensorColor}05` }}>
                                {config.customName || m.name}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {fertiRightActiveKeys.map(key => {
                            const m = allMetrics.find(item => item.key === key);
                            if (!m) return null;
                            const config = metricConfigs[key] || {};
                            const sensorColor = config.color || m.color;
                            return (
                              <div key={`ferti-badge-${key}`} className="px-1.5 py-0.5 border rounded shadow-sm text-[9px]" style={{ borderColor: sensorColor, color: sensorColor, backgroundColor: `${sensorColor}05` }}>
                                {config.customName || m.name}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : activeTab === "selection" ? (
              /* Data Selection Tab Content (Beautiful Form Layout) */
              <div className="flex-1 overflow-y-auto bg-muted/10 p-6 md:p-10 max-h-[calc(100vh-3.5rem)] space-y-6">
                <Card className="border-none shadow-md bg-background rounded-3xl overflow-hidden">
                  <CardHeader className="p-6 border-b bg-muted/10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                          <Sliders className="h-5 w-5 text-primary animate-pulse" /> Configuration & Sélection des Capteurs
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Pour chaque capteur, cochez CLIMAT et/ou FERTI selon le(s) graphique(s) où il doit apparaître (aucun capteur redondant entre les deux), et ajustez ses options d&apos;axes et de lissage. Rien n&apos;est appliqué tant que vous n&apos;avez pas cliqué sur Enregistrer.
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasUnsavedSelectionChanges && (
                          <>
                            <span className="text-[9px] font-bold text-amber-500 flex items-center animate-pulse mr-1">
                              ⚠️ Non enregistré
                            </span>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={handleDiscardSelection}
                              className="font-black text-[10px] uppercase px-3 py-1 rounded-lg"
                            >
                              Annuler
                            </Button>
                          </>
                        )}
                        <Button
                          size="xs"
                          disabled={!hasUnsavedSelectionChanges}
                          onClick={handleSaveSelection}
                          className={`font-black text-[10px] uppercase px-3 py-1 rounded-lg transition-all shadow-sm ${
                            hasUnsavedSelectionChanges
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-muted-foreground border cursor-not-allowed"
                          }`}
                        >
                          💾 Enregistrer la sélection
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    
                    {/* Settings cards row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Physiology Parameters */}
                      <Card className="border border-muted-foreground/15 shadow-sm bg-muted/5 rounded-2xl">
                        <CardHeader className="p-4 pb-2 border-b bg-muted/10">
                          <CardTitle className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5 text-primary">
                            <Activity className="h-4 w-4" /> Paramètres Physiologiques
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-bold">Plants sur balance</label>
                            <input
                              type="number"
                              min="1"
                              value={plantsOnScaleDraft}
                              onChange={(e) => handlePlantsOnScaleDraftChange(e.target.value)}
                              className="w-full text-xs border rounded-xl bg-background p-2 focus:outline-none focus:ring-1 focus:ring-primary text-center font-bold"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-bold">Densité / m²</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={densityPerM2Draft}
                              onChange={(e) => handleDensityPerM2DraftChange(e.target.value)}
                              className="w-full text-xs border rounded-xl bg-background p-2 focus:outline-none focus:ring-1 focus:ring-primary text-center font-bold"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Paramètres Techniques de la Serre */}
                      <Card className="border border-muted-foreground/15 shadow-sm bg-muted/5 rounded-2xl">
                        <CardHeader className="p-4 pb-2 border-b bg-muted/10">
                          <CardTitle className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5 text-primary">
                            <Leaf className="h-4 w-4" /> Paramètres Techniques de la Serre
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-bold">Culture</label>
                            <select
                              value={greenhouseCulture}
                              onChange={(e) => {
                                const culture = e.target.value;
                                setGreenhouseCulture(culture);
                                setGreenhouseCultureTypology("");
                                commitGreenhouseSettings({ culture, cultureTypology: "" });
                              }}
                              className="w-full text-xs border rounded-xl bg-background p-2 focus:outline-none focus:ring-1 focus:ring-primary font-bold cursor-pointer"
                            >
                              <option value="">Sélectionner...</option>
                              {CULTURE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-bold">Typologie de culture</label>
                            <select
                              value={greenhouseCultureTypology}
                              onChange={(e) => {
                                setGreenhouseCultureTypology(e.target.value);
                                commitGreenhouseSettings({ cultureTypology: e.target.value });
                              }}
                              disabled={!greenhouseCulture || (CULTURE_TYPOLOGIES[greenhouseCulture] || []).length === 0}
                              className="w-full text-xs border rounded-xl bg-background p-2 focus:outline-none focus:ring-1 focus:ring-primary font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">Sélectionner...</option>
                              {(CULTURE_TYPOLOGIES[greenhouseCulture] || []).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-bold">Translucidité du verre (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={glassTranslucidityPercent}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const clamped = raw === "" ? "" : String(Math.min(100, Math.max(0, Number(raw))));
                                setGlassTranslucidityPercent(clamped);
                                commitGreenhouseSettings({ glassTranslucidityPercent: clamped });
                              }}
                              className="w-full text-xs border rounded-xl bg-background p-2 focus:outline-none focus:ring-1 focus:ring-primary text-center font-bold"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Global Savitzky-Golay */}
                      <Card className="border border-muted-foreground/15 shadow-sm bg-muted/5 rounded-2xl">
                        <CardHeader className="p-4 pb-2 border-b bg-muted/10">
                          <CardTitle className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5 text-primary">
                            <Sparkles className="h-4 w-4" /> Lissage des Courbes
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex flex-col justify-center h-[96px]">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                            <input
                              type="checkbox"
                              onChange={(e) => applyGlobalSmoothing(e.target.checked)}
                              className="rounded border-muted text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                            />
                            Lisser tous les capteurs coché
                          </label>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Sensor list grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                      {/* Left: Visible metrics */}
                      <Card className="border border-muted-foreground/15 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="p-4 pb-2 border-b bg-muted/5">
                          <CardTitle className="text-xs font-black uppercase tracking-tight text-primary flex items-center justify-between">
                            <span>Sélectionnés (Climat et/ou Ferti) ({visibleMetrics.length})</span>
                            {visibleMetrics.length > 0 && (
                              <button
                                onClick={() => { setSelectedKeysDraft([]); setFertiSelectedKeysDraft([]); }}
                                className="text-[10px] text-muted-foreground hover:text-primary font-bold transition-colors cursor-pointer"
                              >
                                Tout effacer
                              </button>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 max-h-[500px] overflow-y-auto space-y-1">
                          {visibleMetrics.length === 0 ? (
                            <div className="text-center py-8 text-xs text-muted-foreground font-semibold">
                              Aucun capteur activé. Cochez CLIMAT et/ou FERTI sur un capteur dans la liste de droite.
                            </div>
                          ) : (
                            renderGroupedMetrics(visibleMetrics)
                          )}
                        </CardContent>
                      </Card>

                      {/* Right: Hidden metrics (Aranet + Ordinateur Climatique non sélectionnés) */}
                      <Card className="border border-muted-foreground/15 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="p-4 pb-2 border-b bg-muted/5 space-y-2">
                          <CardTitle className="text-xs font-black uppercase tracking-tight text-muted-foreground flex items-center justify-between">
                            <span>Non sélectionnés ({hiddenMetrics.length + unselectedCatalogFiltered.length})</span>
                            {privaLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />}
                          </CardTitle>
                          <input
                            type="text"
                            placeholder="Rechercher un capteur (Aranet ou Ordinateur Climatique)..."
                            value={privaSearch}
                            onChange={(e) => setPrivaSearch(e.target.value)}
                            className="w-full border rounded-xl px-3 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary h-8 font-bold"
                          />
                        </CardHeader>
                        <CardContent className="p-4 max-h-[500px] overflow-y-auto space-y-1">
                          {hiddenMetricsFiltered.length === 0 && unselectedCatalogFiltered.length === 0 ? (
                            <div className="text-center py-8 text-xs text-emerald-500 font-bold">
                              {privaSearch.trim() ? "Aucun capteur ne correspond à votre recherche." : "Tous les capteurs sont actuellement actifs sur le graphique !"}
                            </div>
                          ) : (
                            <>
                              {renderGroupedMetrics(hiddenMetricsFiltered)}
                              {unselectedCatalogFiltered.length > 0 && (
                                <div className="space-y-2 mt-3 border border-muted/20 p-3 rounded-2xl bg-muted/5">
                                  <h4 className="text-[10px] font-black uppercase text-primary tracking-wider border-b pb-1 flex items-center justify-between">
                                    <span>Ordinateur Climatique - Catalogue</span>
                                    <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{unselectedCatalogFiltered.length}</span>
                                  </h4>
                                  <div className="space-y-1 pl-0.5 pt-1">
                                    {unselectedCatalogFiltered.map((dp, idx) => (
                                      <button
                                        key={`${dp.variableId}-${idx}`}
                                        onClick={() => toggleCatalogDatapoint(dp)}
                                        className="w-full flex items-center gap-2 text-left text-[11px] py-1 border-b last:border-0 border-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                                        title="Sélectionner pour le graphique"
                                      >
                                        <Square className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                                        <span className="truncate flex-1">{dp.name}</span>
                                        <span className="text-[9px] text-muted-foreground/70 shrink-0">{dp.unit || ""}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Agronomic Analysis Tab Content */
              <div className="flex-1 overflow-y-auto bg-muted/10 p-6 md:p-10 space-y-6 max-h-[calc(100vh-3.5rem)] select-none">
                {/* Independent date range - deliberately decoupled from the Climat/Croissance chart's
                    range, so browsing a different period here (ex: la semaine passée) never changes
                    what the main chart shows, and vice-versa. */}
                <div className="bg-background border border-border p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                      <ChartIcon className="h-4 w-4 text-primary" /> Période d&apos;Analyse Agronomique
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-semibold">Indépendante de la plage du graphique Climat/Croissance.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={agroStartDateDraft}
                      onChange={(e) => handleAgroStartDateDraftChange(e.target.value)}
                      className="border rounded-xl px-2.5 py-1 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-8"
                    />
                    <span className="text-xs text-muted-foreground font-bold">à</span>
                    <input
                      type="date"
                      value={agroEndDateDraft}
                      onChange={(e) => handleAgroEndDateDraftChange(e.target.value)}
                      className="border rounded-xl px-2.5 py-1 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-8"
                    />
                    {agroLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary ml-1" />}
                  </div>
                </div>

                {agroError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold">
                    {agroError}
                  </div>
                )}
                {agroPrivaChartError && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-bold">
                    {agroPrivaChartError}
                  </div>
                )}

                {/* Agent IA agronomique persistant : ce que l'historique de cette serre a
                    statistiquement montré - support de l'analyse ci-dessous, pas un onglet séparé.
                    La base bibliographique elle-même n'a pas d'UI dashboard : elle s'alimente
                    depuis le dossier agro-literature-docs/ via `npm run ingest:agro-literature`
                    (voir agro-literature-docs/README.md). */}
                <Card className="border border-muted-foreground/15 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="p-4 pb-2 border-b bg-muted/5">
                    <CardTitle className="text-xs font-black uppercase tracking-tight text-primary flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" /> Corrélations apprises sur cette serre
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      Coefficient de corrélation (Pearson) entre chaque facteur mesuré et le gain de croissance, calculé sur l&apos;historique enregistré. Les plages cibles, spécifiques à chaque créneau horaire, apparaissent dans le détail du jour ci-dessous.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 max-h-[220px] overflow-y-auto space-y-1.5">
                    {agroCorrelationsInsufficient ? (
                      <div className="text-center py-6 text-[10px] text-muted-foreground font-semibold">
                        Historique insuffisant pour calculer des corrélations fiables{agroCorrelationsSampleSize !== null ? ` (${agroCorrelationsSampleSize}/10 jours enregistrés)` : ""}. Continuez à consulter cet onglet pour l&apos;alimenter.
                      </div>
                    ) : agroCorrelations.length === 0 ? (
                      <div className="text-center py-6 text-[10px] text-muted-foreground font-semibold">
                        Aucune corrélation calculée pour l&apos;instant.
                      </div>
                    ) : (
                      agroCorrelations.slice(0, 12).map((c: any) => {
                        const label = formatAgroFactorLabel(c.factor_key, agroRoleLabels);
                        const abs = Math.abs(c.coefficient);
                        const strength = abs >= 0.5 ? "text-emerald-600" : abs >= 0.3 ? "text-amber-600" : "text-muted-foreground";
                        return (
                          <div key={`${c.factor_key}-${c.target}`} className="flex items-center justify-between text-[11px] border-b last:border-0 border-muted/20 py-1">
                            <span className="font-bold text-foreground truncate">{label}</span>
                            <span className={`font-mono font-black ${strength}`}>r={c.coefficient.toFixed(2)} <span className="text-muted-foreground font-normal">(n={c.sample_size})</span></span>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* Warning if radiation sum is not selected in chart data */}
                {(() => {
                  const hasRadiationData = agronomicDataWithBenchmark.some(d => d.radiationSumJcm2 !== null);
                  if (!hasRadiationData) {
                    return (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-3 shadow-sm">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                        <div>
                          <span>Sélection requise : Veuillez cocher la variable de rayonnement cumulé (ex: <b>Somme de rayonnement global en J/cm²</b>) dans l&apos;onglet <i>Sélection des données</i> pour activer le calcul dynamique du potentiel de gain et de ses pertes.</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Main Grid */}
                {agronomicDataWithBenchmark.length > 0 ? (
                  <div className="space-y-6 w-full">
                    {/* Full Width Table Card */}
                    <Card className="border border-border/80 shadow-md bg-background rounded-2xl overflow-hidden">
                      <CardHeader className="p-5 pb-3 border-b bg-muted/5">
                        <CardTitle className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                          Tableau de Bord de Performance et Biomasse
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[950px]">
                          <thead>
                            <tr className="border-b bg-muted/20 text-[9px] uppercase font-black text-muted-foreground">
                              <th className="p-3 pl-5">Jour / Date</th>
                              <th className="p-3 text-center">Gain Cumulé (g/m²)</th>
                              <th className="p-3 text-center">Somme de Rayonnement (J/cm²)</th>
                              <th className="p-3 text-center">Mouvements de Poids (g/m²)</th>
                              <th className="p-3 text-center">Nature</th>
                              <th className="p-3 text-center">Efficience (g / 100 J/cm²)</th>
                              <th className="p-3 text-center">Perte vs Meilleur Jour</th>
                              <th className="p-3 text-center">Analyse Agro (Score)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {agronomicDataWithBenchmark.map(d => {
                              const isActive = d.day === selectedDayNum || (selectedDayNum > agronomicDataWithBenchmark.length && d.day === 1);
                              const dayDrops: WeightDropCandidate[] = d.drops || [];

                              return (
                                <tr
                                  key={d.day}
                                  onClick={() => setSelectedDayNum(d.day)}
                                  className={`border-b border-border/30 text-xs font-semibold cursor-pointer transition-all hover:bg-slate-50/50 ${
                                    isActive ? "bg-slate-900/5 dark:bg-slate-100/5 font-bold" : ""
                                  }`}
                                >
                                  {/* Date / Day */}
                                  <td className="p-3 pl-5 flex items-center gap-2.5">
                                    <div className={`h-6 w-6 rounded-lg flex items-center justify-center font-bold text-[9px] ${
                                      isActive ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-muted text-muted-foreground"
                                    }`}>
                                      J{d.day}
                                    </div>
                                    <span className="font-bold text-[11px]">{d.dateStr}</span>
                                  </td>

                                  {/* Gain Cumulé */}
                                  <td className="p-3 text-center font-mono font-bold text-emerald-600 text-[11px]">
                                    {d.actualGain > 0 ? `+${d.actualGain}` : d.actualGain} g/m²
                                  </td>

                                  {/* Rayonnement */}
                                  <td className="p-3 text-center font-mono text-primary font-bold text-[11px]">
                                    {d.radiationSumJcm2 !== null ? `${d.radiationSumJcm2} J/cm²` : "N/A"}
                                  </td>

                                  {/* Every detected movement is auto-smoothed (see buildChartRows) - a consequence
                                      of past growth/logistics, not a growth loss, so it's shown neutrally rather
                                      than as a "perte". */}
                                  <td className="p-3 text-center text-[10px]">
                                    {dayDrops.length > 0 ? (
                                      <div className="flex flex-col gap-1 items-center">
                                        {dayDrops.map(drop => (
                                          <span key={drop.id} className="text-slate-600 dark:text-slate-300 font-bold bg-slate-500/10 px-2 py-0.5 rounded-md border border-slate-500/10 inline-block font-mono">
                                            {drop.timeStr} : {drop.suddenDropVal} g/m²
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground opacity-60">Aucune</span>
                                    )}
                                  </td>

                                  {/* Nature du mouvement - read-only here (auto-caractérisé) ; l'édition se fait
                                      dans l'onglet "Mouvements de Poids". */}
                                  <td className="p-3 text-center">
                                    {dayDrops.length === 0 ? (
                                      <span className="text-muted-foreground opacity-60 text-[10px]">—</span>
                                    ) : (
                                      <div className="flex flex-col gap-1 items-center">
                                        {dayDrops.map(drop => {
                                          const eventValue = dailyEvents[drop.id] || drop.autoEventType;
                                          const label = eventValue === "harvest" ? "Récolte"
                                            : eventValue === "thinning" ? "Effeuillage"
                                            : eventValue === "descent" ? "Descente"
                                            : eventValue === "recalibration" ? "Recalibrage"
                                            : "Arrosage";
                                          return (
                                            <span
                                              key={drop.id}
                                              className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                            >
                                              {drop.timeStr} · {label}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </td>

                                  {/* Efficience (gain / rayonnement) */}
                                  <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                                    {d.realizedEfficiencyPer100J !== null ? d.realizedEfficiencyPer100J : "N/A"}
                                    {d.bestEfficiencyInRange !== null && d.growthEfficiency !== null && d.growthEfficiency >= d.bestEfficiencyInRange && (
                                      <span title="Meilleur jour de la plage" className="ml-1">🏆</span>
                                    )}
                                  </td>

                                  {/* Perte vs meilleure journée d'efficience de la plage affichée */}
                                  <td className="p-3 text-center text-[10px]">
                                    {d.lostGainVsBestDay !== null ? (
                                      d.lostGainVsBestDay > 0 ? (
                                        <span className="text-rose-600 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/10 inline-block font-mono">
                                          -{d.lostGainVsBestDay} g/m² ({d.lostPercentVsBestDay}%)
                                        </span>
                                      ) : (
                                        <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10 inline-block">Référence</span>
                                      )
                                    ) : (
                                      <span className="text-muted-foreground opacity-60">N/A</span>
                                    )}
                                  </td>

                                  {/* Analyse Agro */}
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <span className={`inline-block w-1.5 h-1.5 rounded-full bg-${d.statusColor}-500`} />
                                      <Badge className={`font-black text-[9px] bg-${d.statusColor}-500/10 text-${d.statusColor}-500 border-${d.statusColor}-500/20`}>
                                        {d.overallScore}/100
                                      </Badge>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>

                    {/* Selected Day Audit Detail */}
                    <div className="w-full space-y-6">
                      {(() => {
                        const day = agronomicDataWithBenchmark.find(d => d.day === selectedDayNum) || agronomicDataWithBenchmark[0]
                        return (
                          <Card className="border-none shadow-md bg-background overflow-hidden rounded-2xl">
                            <CardHeader className="p-6 pb-3 border-b bg-muted/15 flex flex-row items-center justify-between">
                              <div>
                                <CardTitle className="text-sm font-black uppercase tracking-tight flex flex-col gap-1">
                                  <span>Analyse du {day.dateStr} — Score : {day.overallScore}/100</span>
                                  <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mt-0.5">
                                    {day.radiationSumJcm2 !== null ? (
                                      <>
                                        Somme de Radiation : <span className="text-primary">{day.radiationSumJcm2} J/cm²</span> | Efficience : <span className="text-emerald-600">{day.realizedEfficiencyPer100J !== null ? day.realizedEfficiencyPer100J : "N/A"} g / 100 J/cm²</span> | Perte vs meilleur jour : <span className="text-rose-600">-{day.lostGainVsBestDay ?? 0} g/m²</span>
                                      </>
                                    ) : (
                                      <span className="text-rose-500 font-black">⚠️ Somme de rayonnement (J/cm²) non sélectionnée sur le graphique</span>
                                    )}
                                  </span>
                                </CardTitle>
                              </div>
                              <Badge className={`bg-${day.statusColor}-500/10 text-${day.statusColor}-500 border-${day.statusColor}-500/20 font-bold px-2 py-0.5 text-[10px]`}>
                                {day.status}
                              </Badge>
                            </CardHeader>
                            
                            <CardContent className="p-6 space-y-6">
                              {/* Facteur limitant par plage horaire - où, dans la journée, un
                                  facteur est sorti de la plage cible et a probablement bridé le
                                  gain, plutôt qu'un seul verdict journalier agrégé. */}
                              {day.limitingFactorsBySlot && (
                                <div className="flex flex-col gap-2">
                                  <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Gauge className="h-3.5 w-3.5 text-primary" /> Facteur limitant par plage horaire
                                  </h4>
                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {day.limitingFactorsBySlot.map((slot: any) => (
                                      <div
                                        key={slot.label}
                                        className={`p-2.5 rounded-xl border text-center ${slot.limitingFactor ? "bg-rose-500/5 border-rose-500/20" : "bg-emerald-500/5 border-emerald-500/20"}`}
                                      >
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">{slot.label}</p>
                                        {slot.limitingFactor ? (
                                          <>
                                            <p className="text-[11px] font-black text-rose-600 mt-1 truncate">{formatAgroFactorLabel(slot.limitingFactor.field, agroRoleLabels)}</p>
                                            <p className="text-[9px] text-muted-foreground font-semibold">{slot.limitingFactor.value} (cible {slot.limitingFactor.range.min}–{slot.limitingFactor.range.max})</p>
                                          </>
                                        ) : (
                                          <p className="text-[11px] font-black text-emerald-600 mt-1">Optimal</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* AI black-box analysis trigger + result */}
                              {(() => {
                                const aiResult = aiAnalysisByDay[day.dateStr];
                                const isLoading = !!aiAnalysisLoading[day.dateStr];
                                const aiError = aiAnalysisError[day.dateStr];
                                return (
                                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex flex-col gap-3">
                                    <div className="flex items-center justify-between gap-3">
                                      <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-primary" /> Analyse IA (Boîte Noire)
                                      </h4>
                                      <Button
                                        size="sm"
                                        disabled={isLoading}
                                        onClick={() => handleAnalyzeDayWithAI(day)}
                                        className="bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase h-7 px-3 rounded-lg shadow-sm"
                                      >
                                        {isLoading ? (
                                          <span className="flex items-center gap-1.5"><RefreshCw className="h-3 w-3 animate-spin" /> Analyse...</span>
                                        ) : aiResult ? "Ré-analyser" : "Analyser avec l'IA"}
                                      </Button>
                                    </div>
                                    {aiError && (
                                      <p className="text-[10px] text-rose-500 font-bold">{aiError}</p>
                                    )}
                                    {aiResult && (
                                      <div className="space-y-2">
                                        <Badge className="font-black text-[9px] bg-primary/10 text-primary border-primary/20">
                                          {aiResult.keyLimitingFactor}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                                          {aiResult.explanation}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Step-by-Step Action Plan - sourced from the AI analysis only, once run for this day */}
                              {aiAnalysisByDay[day.dateStr]?.actionPlan && aiAnalysisByDay[day.dateStr].actionPlan.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
                                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Actions Recommandées
                                  </h4>
                                  <ul className="space-y-2">
                                    {aiAnalysisByDay[day.dateStr].actionPlan.map((action: string, index: number) => (
                                      <li key={index} className="flex gap-2.5 items-start text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">
                                          {index + 1}
                                        </div>
                                        <span>{action}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-12 bg-background border border-muted/20 shadow-sm rounded-2xl">
                    <p className="text-xs text-muted-foreground font-bold uppercase">Aucune donnée chargée pour la période sélectionnée.</p>
                  </div>
                )}
              </div>
            )}
          </>
        );
      })()}

      {/* Confirmation modal - leaving "Sélection des données" in-app with unsaved changes.
          beforeunload (above) only covers actually closing/refreshing the tab, not switching
          tabs within the app, which is a plain state change. */}
      {pendingTabSwitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm border shadow-2xl bg-background rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <CardHeader className="p-5 border-b bg-muted/20">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-amber-600 flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5" /> Modifications non enregistrées
              </CardTitle>
              <CardDescription className="text-[10px] font-bold">
                Vous avez des changements non enregistrés dans la Sélection des données. Voulez-vous les enregistrer avant de continuer ?
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-2">
              <Button
                onClick={() => {
                  handleSaveSelection();
                  setActiveTab(pendingTabSwitch);
                  setPendingTabSwitch(null);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl h-10"
              >
                💾 Enregistrer et continuer
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleDiscardSelection();
                  setActiveTab(pendingTabSwitch);
                  setPendingTabSwitch(null);
                }}
                className="w-full font-black text-xs uppercase rounded-xl h-10"
              >
                Ignorer les changements
              </Button>
              <Button
                variant="ghost"
                onClick={() => setPendingTabSwitch(null)}
                className="w-full font-bold text-xs uppercase rounded-xl h-10 text-muted-foreground"
              >
                Annuler
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
