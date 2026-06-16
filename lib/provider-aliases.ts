// Bridges the website's provider catalog names (from lib/bdc.ts, Hotrod and
// the BDC) to the brand names used in the Google review data
// (public.provider_reviews). Review rows use bare brands ("Xfinity",
// "Spectrum", "Verizon"); the catalog uses fuller names ("Comcast Xfinity",
// "Charter Spectrum", "Verizon Fios"). We normalize both sides to a single
// canonical key so ratings attach to the right competitor.

// Noise words stripped during normalization. Kept deliberately broad so that
// regional ISPs match on their distinctive token (e.g. "TDS Telecom" -> "tds",
// "Consolidated Communications" -> "consolidated").
const STOPWORDS = new Set([
  'inc', 'llc', 'llp', 'lp', 'corp', 'corporation', 'co', 'company', 'the',
  'dba', 'communications', 'communication', 'broadband', 'internet', 'cable',
  'fiber', 'fibre', 'wireless', 'networks', 'network', 'telecom',
  'telecommunications', 'telephone', 'services', 'service', 'solutions',
  'holdings', 'holding', 'tv', 'phone', 'optics', 'optic', 'isp', 'group',
  'systems', 'system', 'home'
]);

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t))
    .join('');
}

// Ordered brand rules applied to the normalized string; first match wins.
// These collapse sub-brands and review-name variants onto one brand key
// (e.g. "comcastxfinity" and "xfinity" -> "xfinity"; "Verizon Fios",
// "Verizon 5G Home" and "Verizon" -> "verizon"; "Mediacom Xtream" and
// "Mediacom" -> "mediacom"). Applied to BOTH catalog and review names.
const BRAND_RULES: Array<[RegExp, string]> = [
  [/xfinity/, 'xfinity'],
  [/spectrum/, 'spectrum'],
  [/^verizon/, 'verizon'],
  [/^att/, 'att'],
  [/optimum/, 'optimum'],
  [/^tmobile/, 'tmobile'],
  [/sparklight/, 'sparklight'],
  [/windstream/, 'windstream'],
  [/hughesnet/, 'hughesnet'],
  [/starlink/, 'starlink'],
  [/viasat/, 'viasat'],
  [/^cox/, 'cox'],
  [/frontier/, 'frontier'],
  [/centurylink/, 'centurylink'],
  [/quantum/, 'quantum'],
  [/ziply/, 'ziply'],
  [/mediacom/, 'mediacom'],
  [/astound/, 'astound'],
  [/brightspeed/, 'brightspeed'],
  [/breezeline/, 'breezeline'],
  [/metronet/, 'metronet'],
  [/googlefiber|^google$/, 'google'],
  [/^wow$/, 'wow']
];

// Returns the canonical matching key for a provider name. Used to key both the
// review snapshot index and the lookup for the site's competitors.
export function canonicalKey(name: string): string {
  const norm = normalize(name);
  for (const [re, key] of BRAND_RULES) {
    if (re.test(norm)) return key;
  }
  return norm;
}
