'use client';

import { FileText, Download, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useInvoices } from '@/lib/hooks/useSubscriptionManagement';
import { formatPrice } from '@/lib/config/pricing';

export function InvoiceHistory() {
  const { data, isLoading } = useInvoices();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-32 bg-[rgb(var(--surface-hover))] rounded" />
          <div className="h-12 bg-[rgb(var(--surface-hover))] rounded" />
          <div className="h-12 bg-[rgb(var(--surface-hover))] rounded" />
        </div>
      </Card>
    );
  }

  const invoices = data?.stripeInvoices || [];

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-[rgb(var(--border))]">
        <h3 className="font-semibold text-[rgb(var(--foreground))]">Invoice History</h3>
      </div>

      {invoices.length === 0 ? (
        <div className="p-8 text-center">
          <FileText className="w-10 h-10 text-[rgb(var(--foreground-secondary))] mx-auto mb-2" />
          <p className="text-[rgb(var(--foreground-secondary))]">No invoices yet</p>
        </div>
      ) : (
        <div className="divide-y divide-[rgb(var(--border))]">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="p-4 flex items-center justify-between hover:bg-[rgb(var(--surface-hover))]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[rgb(var(--surface))] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[rgb(var(--foreground-secondary))]" />
                </div>
                <div>
                  <p className="font-medium text-[rgb(var(--foreground))]">{invoice.number}</p>
                  <p className="text-sm text-[rgb(var(--foreground-secondary))]">
                    {new Date(invoice.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium text-[rgb(var(--foreground))]">
                    {formatPrice(invoice.total)}
                  </p>
                  <p className={`text-xs ${
                    invoice.status === 'paid' ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </p>
                </div>

                <div className="flex gap-1">
                  {invoice.pdfUrl && (
                    <a
                      href={invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-[rgb(var(--surface))] rounded"
                    >
                      <Download className="w-4 h-4 text-[rgb(var(--foreground-secondary))]" />
                    </a>
                  )}
                  {invoice.hostedUrl && (
                    <a
                      href={invoice.hostedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-[rgb(var(--surface))] rounded"
                    >
                      <ExternalLink className="w-4 h-4 text-[rgb(var(--foreground-secondary))]" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
