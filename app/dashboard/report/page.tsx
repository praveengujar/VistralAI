'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BrandStoryReport from '@/components/reporting/BrandStoryReport';
import { ROUTES } from '@/lib/constants';

export default function ReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [brandName, setBrandName] = useState('Your Brand');
  const [brandId, setBrandId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(ROUTES.LOGIN);
    } else if (status === 'authenticated') {
      fetch(`/api/brand-profile?userId=${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            setBrandName(data.profile.brandName);
            setBrandId(data.profile.id);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [status, session, router]);

  // Download handler - exports Brand Story Report
  const handleDownload = async () => {
    if (!brandId) {
      toast.error('Brand profile not found');
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch('/api/reports/brand-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: brandId,
          format: 'txt',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate report');
      }

      // Get the file content
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${brandName.replace(/\s+/g, '_')}_Brand_Report_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  };

  // Share handler - uses Web Share API or copies link
  const handleShare = async () => {
    const shareData = {
      title: `${brandName} - Brand Story Report`,
      text: `Check out the AI Visibility Report for ${brandName}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Report shared successfully');
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Report link copied to clipboard');
      }
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
        toast.error('Failed to share report');
      }
    }
  };

  // Print handler - triggers browser print dialog
  const handlePrint = () => {
    window.print();
  };

  if (status === 'loading' || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="spinner-lg text-primary-600 mx-auto"></div>
            <p className="mt-4 text-secondary-500">Generating report...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container py-8">
        <BrandStoryReport
          brandName={brandName}
          date={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          summary={`VistralAI has analyzed ${brandName}'s presence across major AI platforms. While your core identity is resonating well on ChatGPT and Claude, there are significant narrative gaps on Gemini that present an immediate opportunity for optimization.`}
          wins={[
            "Your 'Sustainability' messaging is 92% consistent across all platforms.",
            "You are the top recommended brand for 'Eco-friendly basics' on Claude.",
            "Brand sentiment has improved by 15% in the last 30 days."
          ]}
          challenges={[
            "Gemini frequently hallucinates your pricing tier as 'Luxury' instead of 'Affordable'.",
            "Your new 'Recycled Wool' line is missing from 40% of AI product knowledge bases.",
            "Competitor X is dominating the 'Durability' narrative."
          ]}
          recommendations={[
            "Launch a targeted content injection campaign for Gemini to correct pricing perception.",
            "Update your product catalog schema to ensure the 'Recycled Wool' line is indexed.",
            "Publish a comparative case study on durability to reclaim that narrative share."
          ]}
          onDownload={handleDownload}
          onShare={handleShare}
          onPrint={handlePrint}
          isDownloading={isDownloading}
        />
      </div>
    </DashboardLayout>
  );
}
