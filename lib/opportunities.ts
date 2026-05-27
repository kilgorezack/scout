import type { ProviderInZip } from './bdc';
import type { ZipDemographics } from './census';
import type { CompetitorNews } from './news';
import { SOLUTIONS, type Solution } from './solutions';

export type Opportunity = {
  id: string;
  solution: Solution;
  rationaleHeadline: string;
  rationaleDetail: string;
  targetZips: string[];
  evidence: string[];
  priority: 'high' | 'medium' | 'low';
};

function findSolution(id: string): Solution {
  const s = SOLUTIONS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown solution: ${id}`);
  return s;
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function generateOpportunities(args: {
  providersByZip: ProviderInZip[];
  demographics: ZipDemographics[];
  news: CompetitorNews[];
  ownCompany: string | null;
}): Opportunity[] {
  const { providersByZip, demographics, news } = args;
  const ownCompany = (args.ownCompany ?? '').trim().toLowerCase();
  const opportunities: Opportunity[] = [];

  const zips = Array.from(new Set(providersByZip.map((p) => p.zip)));

  const smartHomeNews = news.filter((n) => n.category === 'smart_home');
  if (smartHomeNews.length > 0) {
    opportunities.push({
      id: 'counter-smarthome',
      solution: findSolution('smart-home'),
      rationaleHeadline: 'Competitors are racing to managed in-home WiFi — counter with a premium experience tier.',
      rationaleDetail:
        'Recent competitor launches focus on managed WiFi, mesh gateways, and in-home security. A whole-home WiFi experience with bundled network security neutralizes their pitch and protects ARPU.',
      targetZips: zips,
      evidence: smartHomeNews.slice(0, 4).map((n) => `${n.providerName}: "${n.title}" (${n.publishedAt})`),
      priority: 'high'
    });
  }

  const mobileNews = news.filter((n) => n.category === 'mobile');
  if (mobileNews.length > 0) {
    opportunities.push({
      id: 'counter-mobile-bundle',
      solution: findSolution('smart-biz-mobile'),
      rationaleHeadline: 'Cable MSOs are weaponizing mobile bundles — respond with a converged SMB offer.',
      rationaleDetail:
        'A fixed + mobile bundle for small business answers MSO mobile growth directly and lifts retention on the SMB base.',
      targetZips: zips,
      evidence: mobileNews.slice(0, 3).map((n) => `${n.providerName}: "${n.title}" (${n.publishedAt})`),
      priority: 'medium'
    });
  }

  const fwaNews = news.filter((n) => n.category === 'fwa');
  if (fwaNews.length > 0) {
    opportunities.push({
      id: 'counter-fwa',
      solution: findSolution('home-office'),
      rationaleHeadline: 'FWA expansion is targeting your work-from-home base — protect ARPU with a premium tier.',
      rationaleDetail:
        'FWA undercuts on price but loses on consistent uplink and latency. Lead with a guaranteed-experience Home Office tier (priority bandwidth, white-glove support).',
      targetZips: zips,
      evidence: fwaNews.slice(0, 3).map((n) => `${n.providerName}: "${n.title}" (${n.publishedAt})`),
      priority: 'high'
    });
  }

  const incomeByZip = new Map(demographics.map((d) => [d.zip, d.medianHouseholdIncome]));
  const businessByZip = new Map(demographics.map((d) => [d.zip, d.businessEstablishments]));
  const householdsByZip = new Map(demographics.map((d) => [d.zip, d.households]));
  const housingByZip = new Map(demographics.map((d) => [d.zip, d.housingUnits]));

  const medianIncome = median(demographics.map((d) => d.medianHouseholdIncome));
  const medianBiz = median(demographics.map((d) => d.businessEstablishments));

  const highIncomeZips = zips.filter((z) => (incomeByZip.get(z) ?? 0) >= medianIncome * 1.15);
  if (highIncomeZips.length > 0) {
    opportunities.push({
      id: 'wfh-premium',
      solution: findSolution('home-office'),
      rationaleHeadline: 'High-income ZIPs over-index on work-from-home demand.',
      rationaleDetail:
        `${highIncomeZips.length} ZIP${highIncomeZips.length > 1 ? 's' : ''} in this footprint sit at least 15% above the market median household income — ideal targets for a Home OfficeIQ premium tier.`,
      targetZips: highIncomeZips,
      evidence: highIncomeZips
        .slice(0, 5)
        .map((z) => `${z}: $${(incomeByZip.get(z) ?? 0).toLocaleString()} median HH income`),
      priority: 'medium'
    });
  }

  const smbZips = zips.filter((z) => (businessByZip.get(z) ?? 0) >= medianBiz * 1.2);
  if (smbZips.length > 0) {
    opportunities.push({
      id: 'smb-density',
      solution: findSolution('smart-biz'),
      rationaleHeadline: 'Concentrated small-business footprint to upsell into managed SMB connectivity.',
      rationaleDetail:
        `${smbZips.length} ZIP${smbZips.length > 1 ? 's' : ''} show business establishment counts 20%+ above market median — strong candidates for a SmartBiz managed-WiFi rollout.`,
      targetZips: smbZips,
      evidence: smbZips
        .slice(0, 5)
        .map((z) => `${z}: ${(businessByZip.get(z) ?? 0).toLocaleString()} establishments`),
      priority: 'medium'
    });
  }

  // Identify ZIPs that look civic / dense for SmartTown / SmartMDU.
  const denseZips = zips.filter((z) => {
    const hu = housingByZip.get(z) ?? 0;
    const hh = householdsByZip.get(z) ?? 0;
    return hu >= 6000 && hh >= 4000;
  });
  if (denseZips.length > 0) {
    opportunities.push({
      id: 'mdu-density',
      solution: findSolution('smart-mdu'),
      rationaleHeadline: 'Dense housing footprint ready for an MDU/civic managed-connectivity play.',
      rationaleDetail:
        `${denseZips.length} ZIP${denseZips.length > 1 ? 's' : ''} have housing-unit density consistent with significant MDU stock. SmartMDU or SmartTown packaging unlocks bulk-billing and civic partnerships.`,
      targetZips: denseZips,
      evidence: denseZips
        .slice(0, 5)
        .map((z) => `${z}: ${(housingByZip.get(z) ?? 0).toLocaleString()} housing units`),
      priority: 'low'
    });
  }

  // Whitespace: ZIPs where no competitor (excluding the user) is on Fiber.
  const fiberCompetitorsByZip = new Map<string, Set<string>>();
  for (const p of providersByZip) {
    if (ownCompany && p.providerName.toLowerCase().includes(ownCompany)) continue;
    if (p.technologies.includes('Fiber')) {
      const set = fiberCompetitorsByZip.get(p.zip) ?? new Set<string>();
      set.add(p.providerName);
      fiberCompetitorsByZip.set(p.zip, set);
    }
  }
  const fiberWhitespaceZips = zips.filter((z) => (fiberCompetitorsByZip.get(z)?.size ?? 0) === 0);
  if (fiberWhitespaceZips.length > 0) {
    opportunities.push({
      id: 'fiber-whitespace',
      solution: findSolution('smart-home'),
      rationaleHeadline: 'Fiber whitespace — no fiber competitor in these ZIPs.',
      rationaleDetail:
        'These ZIPs have no fiber competitor active in the BDC data. A fiber-led SmartHome experience launches without a head-to-head fiber rival.',
      targetZips: fiberWhitespaceZips,
      evidence: fiberWhitespaceZips.slice(0, 6).map((z) => `${z}: 0 fiber competitors on record`),
      priority: 'high'
    });
  }

  // Municipal / civic angle if any ZIPs have unusually high housing unit count.
  const civicZips = zips.filter((z) => (housingByZip.get(z) ?? 0) >= 10000);
  if (civicZips.length > 0) {
    opportunities.push({
      id: 'civic',
      solution: findSolution('smart-town'),
      rationaleHeadline: 'Footprint includes communities large enough to benefit from a civic partnership.',
      rationaleDetail:
        'Community-scale ZIPs are good candidates for a SmartTown program that bundles community WiFi, public-safety connectivity, and digital-equity grants alongside your network.',
      targetZips: civicZips,
      evidence: civicZips.slice(0, 4).map((z) => `${z}: ${(housingByZip.get(z) ?? 0).toLocaleString()} housing units`),
      priority: 'low'
    });
  }

  const priorityRank = { high: 0, medium: 1, low: 2 } as const;
  return opportunities.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
}
