import speedsSnap from './provider-speeds.json';
import { canonicalKey } from './provider-aliases';

export type MaxSpeed = { down: number; up: number };

// Snapshot rows: [provider, maxDownMbps, maxUpMbps].
type SpeedRow = [string, number, number];

// Canonical-key index of real max residential speeds, built once. When several
// BDC providers normalize to one brand key we keep the highest observed speed.
let index: Map<string, MaxSpeed> | null = null;
function getIndex(): Map<string, MaxSpeed> {
  if (index) return index;
  const m = new Map<string, MaxSpeed>();
  for (const [name, down, up] of speedsSnap.speeds as SpeedRow[]) {
    const key = canonicalKey(name);
    const prev = m.get(key);
    m.set(key, {
      down: Math.max(prev?.down ?? 0, down ?? 0),
      up: Math.max(prev?.up ?? 0, up ?? 0)
    });
  }
  index = m;
  return m;
}

// Real max residential speed for a provider, or null if we have no plan data
// (caller should then keep the technology-level default).
export function maxSpeedForProvider(name: string): MaxSpeed | null {
  const hit = getIndex().get(canonicalKey(name));
  return hit && hit.down > 0 ? hit : null;
}
