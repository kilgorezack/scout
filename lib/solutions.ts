export type Solution = {
  id: string;
  name: string;
  blurb: string;
  audience: 'residential' | 'smb' | 'municipal' | 'mdu';
};

export const SOLUTIONS: Solution[] = [
  {
    id: 'smart-home',
    name: 'HomeConnect',
    blurb: 'Whole-home WiFi experience with managed network security for residential subscribers.',
    audience: 'residential'
  },
  {
    id: 'smart-town',
    name: 'CommunityConnect',
    blurb: 'Municipal and community broadband enablement — bring connected services to civic partners.',
    audience: 'municipal'
  },
  {
    id: 'smart-mdu',
    name: 'PropertyConnect',
    blurb: 'Multi-dwelling unit managed connectivity — turn apartments and condos into a managed footprint.',
    audience: 'mdu'
  },
  {
    id: 'home-office',
    name: 'HomeOffice Pro',
    blurb: 'Premium work-from-home tier with prioritized bandwidth and SLA-style support.',
    audience: 'residential'
  },
  {
    id: 'smart-biz',
    name: 'BusinessConnect',
    blurb: 'Managed connectivity and WiFi for small business with simple self-serve tools.',
    audience: 'smb'
  },
  {
    id: 'smart-biz-mobile',
    name: 'BusinessConnect Mobile',
    blurb: 'Converged fixed + mobile bundle for SMB — answer cable MSO mobile bundling head-on.',
    audience: 'smb'
  }
];

export function solutionById(id: string): Solution | undefined {
  return SOLUTIONS.find((s) => s.id === id);
}
