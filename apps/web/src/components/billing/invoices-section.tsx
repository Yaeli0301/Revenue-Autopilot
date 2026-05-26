"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@revenue-autopilot/ui";
import {
  Download,
  FileArchive,
  FileText,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  documentTypeLabel: string;
  statusLabel: string;
  issuedAtLabel: string;
  description: string;
  planLabel: string | null;
  totalLabel: string;
  hasStripePdf: boolean;
}

interface BillingDetails {
  billingLegalName: string;
  billingTaxId: string;
  billingAddress: string;
  billingEmail: string;
}

const MONTHS = [
  { value: "", label: "כל השנה" },
  { value: "1", label: "ינואר" },
  { value: "2", label: "פברואר" },
  { value: "3", label: "מרץ" },
  { value: "4", label: "אפריל" },
  { value: "5", label: "מאי" },
  { value: "6", label: "יוני" },
  { value: "7", label: "יולי" },
  { value: "8", label: "אוגוסט" },
  { value: "9", label: "ספטמבר" },
  { value: "10", label: "אוקטובר" },
  { value: "11", label: "נובמבר" },
  { value: "12", label: "דצמבר" },
];

export function InvoicesSection() {
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => currentYear - i),
    [currentYear]
  );

  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState("");
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
  const [canSync, setCanSync] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(
    async (options?: { sync?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ year });
        if (month) params.set("month", month);
        if (options?.sync) params.set("sync", "1");

        const res = await fetch(`/api/billing/invoices?${params.toString()}`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setError(data.error ?? "שגיאה בטעינת חשבוניות");
          return;
        }

        setInvoices(data.invoices ?? []);
        setBillingDetails(data.billingDetails ?? null);
        setCanSync(!!data.canSync);
      } catch {
        setError("שגיאה בטעינת חשבוניות");
      } finally {
        setLoading(false);
      }
    },
    [year, month]
  );

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  async function syncFromStripe() {
    setSyncing(true);
    setError(null);
    try {
      await loadInvoices({ sync: true });
    } finally {
      setSyncing(false);
    }
  }

  function downloadSingle(invoiceId: string) {
    setDownloadingId(invoiceId);
    window.location.href = `/api/billing/invoices/${invoiceId}/download`;
    setTimeout(() => setDownloadingId(null), 1500);
  }

  async function exportPeriod() {
    setExporting(true);
    setError(null);
    try {
      const params = new URLSearchParams({ year });
      if (month) params.set("month", month);
      const res = await fetch(`/api/billing/invoices/export?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "לא נמצאו חשבוניות לתקופה זו");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = month
        ? `invoices-${year}-${month.padStart(2, "0")}.zip`
        : `invoices-${year}.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function saveBillingDetails() {
    if (!billingDetails) return;
    setSavingDetails(true);
    setDetailsSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/billing/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billingDetails),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "שגיאה בשמירת פרטי חיוב");
        return;
      }
      setBillingDetails(data.billingDetails);
      setDetailsSaved(true);
    } finally {
      setSavingDetails(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            חשבוניות וקבלות
          </CardTitle>
          <CardDescription>
            הורידו חשבונית בודדת או את כל החשבוניות של חודש או שנה — לצורכי מס ודיווח
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-2">
              <Label htmlFor="invoice-year">שנה</Label>
              <select
                id="invoice-year"
                className="flex h-10 w-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-month">תקופה</Label>
              <select
                id="invoice-month"
                className="flex h-10 min-w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {MONTHS.map((m) => (
                  <option key={m.value || "all"} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              onClick={exportPeriod}
              disabled={exporting || loading || invoices.length === 0}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <FileArchive className="h-4 w-4 ml-2" />
                  הורידו הכל (ZIP)
                </>
              )}
            </Button>
            {canSync && (
              <Button variant="ghost" onClick={syncFromStripe} disabled={syncing || loading}>
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 ml-2" />
                    סנכרון מ-Stripe
                  </>
                )}
              </Button>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              טוען חשבוניות...
            </div>
          ) : invoices.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              <p>אין חשבוניות לתקופה שנבחרה.</p>
              <p className="mt-2">
                לאחר תשלום ראשון, החשבוניות יופיעו כאן. אם כבר שילמתם — לחצו על &quot;סנכרון מ-Stripe&quot;.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-right p-3 font-medium">מספר</th>
                    <th className="text-right p-3 font-medium">תאריך</th>
                    <th className="text-right p-3 font-medium">סוג</th>
                    <th className="text-right p-3 font-medium">תיאור</th>
                    <th className="text-right p-3 font-medium">סכום</th>
                    <th className="text-right p-3 font-medium">סטטוס</th>
                    <th className="text-right p-3 font-medium">הורדה</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-border">
                      <td className="p-3 font-mono text-xs">{invoice.invoiceNumber}</td>
                      <td className="p-3">{invoice.issuedAtLabel}</td>
                      <td className="p-3">{invoice.documentTypeLabel}</td>
                      <td className="p-3">
                        {invoice.description}
                        {invoice.planLabel ? (
                          <span className="text-muted-foreground"> · {invoice.planLabel}</span>
                        ) : null}
                      </td>
                      <td className="p-3 font-medium">{invoice.totalLabel}</td>
                      <td className="p-3">
                        <Badge variant="outline">{invoice.statusLabel}</Badge>
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadSingle(invoice.id)}
                          disabled={downloadingId === invoice.id}
                        >
                          {downloadingId === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-4 w-4 ml-1" />
                              {invoice.hasStripePdf ? "PDF" : "הורדה"}
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {billingDetails && (
        <Card>
          <CardHeader>
            <CardTitle>פרטי חיוב לחשבונית</CardTitle>
            <CardDescription>
              שם העסק, ח.פ / ע.מ וכתובת — יופיעו על החשבוניות שלכם (לצורכי מס)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>שם משפטי / שם העסק</Label>
                <Input
                  value={billingDetails.billingLegalName}
                  onChange={(e) =>
                    setBillingDetails({
                      ...billingDetails,
                      billingLegalName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>ח.פ / ע.מ / ת.ז</Label>
                <Input
                  value={billingDetails.billingTaxId}
                  onChange={(e) =>
                    setBillingDetails({
                      ...billingDetails,
                      billingTaxId: e.target.value,
                    })
                  }
                  placeholder="לדוגמה: 123456789"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>כתובת</Label>
                <Input
                  value={billingDetails.billingAddress}
                  onChange={(e) =>
                    setBillingDetails({
                      ...billingDetails,
                      billingAddress: e.target.value,
                    })
                  }
                  placeholder="רחוב, עיר, מיקוד"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>אימייל לחשבוניות</Label>
                <Input
                  type="email"
                  value={billingDetails.billingEmail}
                  onChange={(e) =>
                    setBillingDetails({
                      ...billingDetails,
                      billingEmail: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={saveBillingDetails} disabled={savingDetails}>
                {savingDetails ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    שמרו פרטי חיוב
                  </>
                )}
              </Button>
              {detailsSaved && (
                <span className="text-sm text-accent">נשמר ✓</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
