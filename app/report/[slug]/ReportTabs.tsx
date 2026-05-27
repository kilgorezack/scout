'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ReportPayload } from '@/lib/report';
import OverviewTab from './tabs/OverviewTab';
import CompetitorsTab from './tabs/CompetitorsTab';
import CoverageTab from './tabs/CoverageTab';
import DemographicsTab from './tabs/DemographicsTab';
import OpportunitiesTab from './tabs/OpportunitiesTab';
import NewsTab from './tabs/NewsTab';
import AIReadinessTab from './tabs/AIReadinessTab';

const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'competitors', label: 'Competitors' },
  { id: 'coverage',    label: 'Coverage' },
  { id: 'demographics',label: 'Demographics' },
  { id: 'news',        label: 'Launch radar' },
  { id: 'ai',          label: 'AI readiness' }
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ReportTabs({ report }: { report: ReportPayload }) {
  const [active, setActive] = useState<TabId>('overview');

  return (
    <div className="mt-8">
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                'border-b-2 px-4 py-2.5 text-sm font-medium transition',
                active === t.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-6">
        {active === 'overview' && <OverviewTab report={report} />}
        {active === 'opportunities' && <OpportunitiesTab report={report} />}
        {active === 'competitors' && <CompetitorsTab report={report} />}
        {active === 'coverage' && <CoverageTab report={report} />}
        {active === 'demographics' && <DemographicsTab report={report} />}
        {active === 'news' && <NewsTab report={report} />}
        {active === 'ai' && <AIReadinessTab />}
      </div>
    </div>
  );
}
