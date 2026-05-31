export type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export async function searchNominatim(query: string, opts?: { signal?: AbortSignal }) {
  const q = query.trim();
  if (!q) return [] as NominatimResult[];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("limit", "6");

  const res = await fetch(url.toString(), {
    method: "GET",
    signal: opts?.signal,
    headers: {
      // Nominatim usage policy requests a valid UA/Referer. Browsers control UA; keep a clear Accept.
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Geocoding failed (${res.status})`);
  }
  return (await res.json()) as NominatimResult[];
}

