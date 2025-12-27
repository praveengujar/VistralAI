import { Building2, Target, Users, Package } from 'lucide-react';

interface ProfileStrengthMeterProps {
  overall: number;
  pillars: {
    identity: number;
    marketPosition: number;
    competitors: number;
    products: number;
  };
}

export default function ProfileStrengthMeter({ overall, pillars }: ProfileStrengthMeterProps) {
  // Determine strength level and color
  const getStrengthLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'green' };
    if (score >= 60) return { label: 'Good', color: 'blue' };
    if (score >= 40) return { label: 'Fair', color: 'yellow' };
    return { label: 'Needs Improvement', color: 'red' };
  };

  const strengthLevel = getStrengthLevel(overall);

  const pillarData = [
    { name: 'Identity', value: pillars.identity, icon: Building2, color: 'blue' },
    { name: 'Market', value: pillars.marketPosition, icon: Target, color: 'green' },
    { name: 'Competitors', value: pillars.competitors, icon: Users, color: 'purple' },
    { name: 'Products', value: pillars.products, icon: Package, color: 'orange' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>Profile Strength</h2>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            Complete your profile to improve AI visibility insights
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>{overall}%</div>
          <div
            className={`text-sm font-medium mt-1 ${
              strengthLevel.color === 'green'
                ? 'text-status-success'
                : strengthLevel.color === 'blue'
                ? 'text-primary-600'
                : strengthLevel.color === 'yellow'
                ? 'text-status-warning'
                : 'text-status-danger'
            }`}
          >
            {strengthLevel.label}
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="relative w-full rounded-full h-4 overflow-hidden" style={{ backgroundColor: 'rgb(var(--background-tertiary))' }}>
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
              strengthLevel.color === 'green'
                ? 'bg-status-success'
                : strengthLevel.color === 'blue'
                ? 'bg-primary-500'
                : strengthLevel.color === 'yellow'
                ? 'bg-status-warning'
                : 'bg-status-danger'
            }`}
            style={{ width: `${overall}%` }}
          >
            {overall > 10 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white">{overall}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pillar Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {pillarData.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div key={pillar.name} className="rounded-lg p-4" style={{ backgroundColor: 'rgb(var(--background-secondary))' }}>
              <div className="flex items-center justify-between mb-2">
                <Icon
                  className={`h-5 w-5 ${
                    pillar.color === 'blue'
                      ? 'text-primary-600'
                      : pillar.color === 'green'
                      ? 'text-status-success'
                      : pillar.color === 'purple'
                      ? 'text-accent-600'
                      : 'text-warning-600'
                  }`}
                />
                <span className="text-sm font-bold" style={{ color: 'rgb(var(--foreground))' }}>{pillar.value}%</span>
              </div>
              <div className="text-sm mb-2" style={{ color: 'rgb(var(--foreground-secondary))' }}>{pillar.name}</div>
              <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'rgb(var(--background-tertiary))' }}>
                <div
                  className={`rounded-full h-1.5 transition-all ${
                    pillar.color === 'blue'
                      ? 'bg-primary-600'
                      : pillar.color === 'green'
                      ? 'bg-status-success'
                      : pillar.color === 'purple'
                      ? 'bg-accent-600'
                      : 'bg-warning-600'
                  }`}
                  style={{ width: `${pillar.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {overall < 80 && (
        <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
          <h3 className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">
            Recommendations to improve your profile:
          </h3>
          <ul className="text-sm text-primary-600 dark:text-primary-400 space-y-1">
            {pillars.identity < 100 && (
              <li>• Complete your brand identity (mission, vision, values)</li>
            )}
            {pillars.marketPosition < 100 && (
              <li>• Add target audience and market positioning details</li>
            )}
            {pillars.competitors < 100 && <li>• Add competitor analysis and differentiators</li>}
            {pillars.products < 100 && <li>• Upload your complete product catalog</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
