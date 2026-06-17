import speedsSnap from './provider-speeds.json';
import { canonicalKey } from './provider-aliases';

export type MaxSpeed = { down: number; up: number };

// Snapshot rows: [provider, tech, maxDownMbps, maxUpMbps] where tech is one of
// DSL | Cable | Fiber | Satellite | FWA.
type SpeedRow = [string, string, number, number];

// Index keyed by `${canonicalKey}|${tech}` plus an all-tech max per provider.
// Per-technology granularity stops brand-level merging from showing, say,
// T-Mobile's fiber speed for its fixed-wireless product.
let byKeyTech: Map<string, MaxSpeed> | null = null;
let byKeyAll: Map<string, MaxSpeed> | null = null;

function build() {
  if (byKeyTech && byKeyAll) return;
  const kt = new Map<string, MaxSpeed>();
  const ka = new Map<string, MaxSpeed>();
  const bump = (m: Map<string, MaxSpeed>, key: string, down: number, up: number) => {
    const prev = m.get(key);
    m.set(key, { down: Math.max(prev?.down ?? 0, down ?? 0), up: Math.max(prev?.up ?? 0, up ?? 0) });
  };
  for (const [name, tech, down, up] of speedsSnap.speeds as SpeedRow[]) {
    const key = canonicalKey(name);
    bump(kt, `${key}|${tech}`, down, up);
    bump(ka, key, down, up);
  }
  byKeyTech = kt;
  byKeyAll = ka;
}

// Real max residential speed for a provider. When `techs` is given (the
// competitor's BDC technologies) we return the max across those technologies —
// so an FWA listing gets the provider's FWA speed, not its fiber speed. Falls
// back to the provider's overall max, then null when we have no plan data.
export function maxSpeedForProvider(name: string, techs?: string[]): MaxSpeed | null {
  build();
  const key = canonicalKey(name);
  if (techs && techs.length) {
    let down = 0;
    let up = 0;
    for (const t of techs) {
      const hit = byKeyTech!.get(`${key}|${t}`);
      if (hit) {
        down = Math.max(down, hit.down);
        up = Math.max(up, hit.up);
      }
    }
    if (down > 0) return { down, up };
  }
  const all = byKeyAll!.get(key);
  return all && all.down > 0 ? all : null;
}
