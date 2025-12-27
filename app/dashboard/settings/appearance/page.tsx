'use client';

import { ThemeSettings } from '@/components/settings/ThemeSettings';

export default function AppearanceSettingsPage() {
  return (
    <div className="p-6">
      <div
        className="p-6 rounded-xl"
        style={{
          backgroundColor: 'rgb(var(--surface))',
          border: '1px solid rgb(var(--border))',
        }}
      >
        <ThemeSettings />
      </div>
    </div>
  );
}
