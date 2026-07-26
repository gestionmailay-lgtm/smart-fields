import { NextRequest, NextResponse } from "next/server";

// Ignore SSL verification errors for Aranet Cloud API in local env
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const ARANET_API_KEY = "rvt3mbkpwudukptx2f3as7jcpja3srdw";
const BASE_URL = "https://aranet.cloud/api/v1";

const headers = {
  "Authorization": `ApiKey ${ARANET_API_KEY}`,
  "Accept": "application/json"
};

// Simple in-memory cache helper
interface CacheEntry {
  data: any;
  expiry: number;
}
const aranetCache = new Map<string, CacheEntry>();

function getFromCache(key: string): any | null {
  const entry = aranetCache.get(key);
  if (entry && Date.now() < entry.expiry) {
    return entry.data;
  }
  return null;
}

function setToCache(key: string, data: any, ttlSeconds: number) {
  aranetCache.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action") || "summary";

  try {
    if (action === "summary") {
      const cacheKey = "summary_cache";
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }

      // 1. Fetch sensors list
      const sensorsRes = await fetch(`${BASE_URL}/sensors`, { headers });
      if (!sensorsRes.ok) throw new Error(`Failed to fetch sensors: ${sensorsRes.statusText}`);
      const sensorsData = await sensorsRes.json();
      const sensorsList = sensorsData.sensors || [];

      // 2. Fetch last measurements
      const measurementsRes = await fetch(`${BASE_URL}/measurements/last`, { headers });
      if (!measurementsRes.ok) throw new Error(`Failed to fetch measurements: ${measurementsRes.statusText}`);
      const measurementsData = await measurementsRes.json();
      const readings = measurementsData.readings || [];

      // 3. Fetch last telemetry
      const telemetryRes = await fetch(`${BASE_URL}/telemetry/last`, { headers });
      if (!telemetryRes.ok) throw new Error(`Failed to fetch telemetry: ${telemetryRes.statusText}`);
      const telemetryData = await telemetryRes.json();
      const telemetryReadings = telemetryData.readings || [];

      // 4. Fetch metrics metadata
      const metricsRes = await fetch(`${BASE_URL}/metrics`, { headers });
      if (!metricsRes.ok) throw new Error(`Failed to fetch metrics: ${metricsRes.statusText}`);
      const metricsData = await metricsRes.json();
      const metricsList = metricsData.metrics || [];

      // Create lookup maps
      const metricsMap = new Map();
      metricsList.forEach((m: any) => {
        metricsMap.set(m.id, {
          name: m.name,
          units: m.units || [],
          defaultUnit: m.units?.find((u: any) => u.default)?.name || m.units?.[0]?.name || ""
        });
      });

      // Group readings and telemetry by sensor ID
      const sensorReadings = new Map();
      const sensorTelemetry = new Map();

      readings.forEach((r: any) => {
        if (!sensorReadings.has(r.sensor)) {
          sensorReadings.set(r.sensor, []);
        }
        const metricInfo = metricsMap.get(r.metric) || { name: `Metric ${r.metric}`, defaultUnit: "" };
        sensorReadings.get(r.sensor).push({
          metricId: r.metric,
          metricName: metricInfo.name,
          value: r.value,
          unit: metricInfo.defaultUnit,
          time: r.time
        });
      });

      telemetryReadings.forEach((t: any) => {
        if (!sensorTelemetry.has(t.sensor)) {
          sensorTelemetry.set(t.sensor, {});
        }
        if (t.metric === "61") { // RSSI
          sensorTelemetry.get(t.sensor).rssi = t.value;
        } else if (t.metric === "62") { // Battery
          sensorTelemetry.get(t.sensor).battery = t.value;
        } else if (t.metric === "63") { // Power supply type
          sensorTelemetry.get(t.sensor).powerSupply = t.value;
        }
      });

      // Combine everything
      const combinedSensors = sensorsList.map((s: any) => {
        const sReadings = sensorReadings.get(s.id) || [];
        const sTelemetry = sensorTelemetry.get(s.id) || {};
        
        return {
          id: s.id,
          sensorId: s.sensorId,
          name: s.name,
          type: s.type,
          battery: sTelemetry.battery !== undefined ? sTelemetry.battery : null,
          rssi: sTelemetry.rssi !== undefined ? sTelemetry.rssi : null,
          powerSupply: sTelemetry.powerSupply !== undefined ? sTelemetry.powerSupply : null,
          readings: sReadings,
          lastSeen: sReadings.length > 0 ? sReadings[0].time : null
        };
      });

      const responseData = {
        success: true,
        sensors: combinedSensors,
        timestamp: new Date().toISOString()
      };
      setToCache(cacheKey, responseData, 60);
      return NextResponse.json(responseData);
    } 
    
    if (action === "history") {
      const sensorId = searchParams.get("sensor");
      const hours = searchParams.get("hours");
      const days = searchParams.get("days");
      const unitId = searchParams.get("unit");
      const metricId = searchParams.get("metric");

      const historyCacheKey = `history_${sensorId}_${hours || ""}_${days || ""}_${unitId || ""}_${metricId || ""}`;
      const cachedHistory = getFromCache(historyCacheKey);
      if (cachedHistory) {
        return NextResponse.json(cachedHistory);
      }

      const params = new URLSearchParams();

      if (sensorId) params.append("sensor", sensorId);
      
      let hasDuration = false;
      if (hours) {
        const parsedHours = parseInt(hours, 10);
        if (!isNaN(parsedHours)) {
          params.append("hours", parsedHours.toString());
          hasDuration = true;
        }
      }
      
      if (days && !hasDuration) {
        const parsedDays = parseInt(days, 10);
        if (!isNaN(parsedDays)) {
          params.append("days", parsedDays.toString());
          hasDuration = true;
        }
      }
      
      if (unitId) params.append("unit", unitId);
      if (metricId) params.append("metric", metricId);

      // Default to 24 hours if no valid duration is set
      if (!hasDuration) {
        params.append("hours", "24");
      }

      // Aranet's history endpoint caps each response at 10000 readings, even scoped to a single
      // metric - a frequently-reporting sensor (e.g. the scale/plant_weight_gain probe) can hit
      // that cap in under a week, silently truncating the rest of a longer requested range (found
      // via the Mouvements de Poids chart going blank mid-range for a 26-day window). "from"
      // anchors the window start (confirmed empirically - "to"/"start"/"end"/"after" are all
      // ignored by this API), so we page forward from the last returned timestamp until the
      // cursor reaches "now" or a page comes back empty. A page returning fewer than the cap is
      // NOT a reliable "no more data" signal on its own (observed a 9999-reading page mid-range,
      // not the full cap, followed by more data still further ahead) - only an empty page or
      // reaching "now" means there's nothing left to fetch.
      const MAX_PAGES = 12; // 12 x ~7 days for a busy sensor comfortably covers the 30-day max range
      const windowStart = new Date();
      if (hasDuration && days) {
        windowStart.setDate(windowStart.getDate() - parseInt(days, 10));
      } else if (hasDuration && hours) {
        windowStart.setHours(windowStart.getHours() - parseInt(hours, 10));
      } else {
        windowStart.setHours(windowStart.getHours() - 24);
      }

      const allReadings: any[] = [];
      let cursor = windowStart;
      for (let page = 0; page < MAX_PAGES; page++) {
        const pageParams = new URLSearchParams(params);
        pageParams.delete("hours");
        pageParams.delete("days");
        pageParams.set("from", cursor.toISOString());

        const pageRes = await fetch(`${BASE_URL}/measurements/history?${pageParams.toString()}`, { headers });
        if (!pageRes.ok) throw new Error(`Failed to fetch history: ${pageRes.statusText}`);
        const pageData = await pageRes.json();
        const pageReadings: any[] = pageData.readings || [];
        if (pageReadings.length === 0) break;

        allReadings.push(...pageReadings);

        const latest = pageReadings.reduce((max: string, r: any) => (r.time > max ? r.time : max), pageReadings[0].time);
        const nextCursor = new Date(latest);
        nextCursor.setSeconds(nextCursor.getSeconds() + 1);
        if (nextCursor.getTime() <= cursor.getTime()) break; // safety: no forward progress
        if (nextCursor.getTime() >= Date.now()) break; // reached "now" - nothing more to fetch
        cursor = nextCursor;
      }

      const responseHistoryData = {
        success: true,
        readings: allReadings,
        timestamp: new Date().toISOString()
      };
      setToCache(historyCacheKey, responseHistoryData, 300); // 5 minutes cache
      return NextResponse.json(responseHistoryData);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Aranet API Proxy Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Aranet data", details: error.message },
      { status: 500 }
    );
  }
}
