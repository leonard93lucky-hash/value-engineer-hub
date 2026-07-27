const SHORT_TO_FULL: Record<string, string> = {
  "Kenny": "Kenny Chandra",
  "Olla": "Agausilia Dinda Asmara",
  "Dinda": "Agausilia Dinda Asmara",
  "Aji": "Rizki Aji Pramono",
  "Esty": "Nabilla Sabta Putri Pramesty",
  "Ika": "Ika Ambarwati",
  "Lucky": "Lucky Leonard",
  "Zara": "Zara Zafira",
  "Diah": "Fitriana Diah",
  "Rembulan": "Rembulan Selaras",
  "Sungguh": "Sungguh Indra Malaon",
  "Lola": "Anindita Lola Rizka",
}

export function displayName(name: string): string {
  return SHORT_TO_FULL[name] || name
}

export function getShortName(fullName: string): string {
  const entry = Object.entries(SHORT_TO_FULL).find(([, v]) => v === fullName)
  return entry?.[0] || fullName
}
