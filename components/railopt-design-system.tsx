'use client'

import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, Info, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type RailStatus = 'default' | 'hover' | 'active' | 'disabled' | 'loading' | 'error' | 'success' | 'warning'

export function RailButton({ status = 'default', tone = 'primary', className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { status?: RailStatus; tone?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const busy = status === 'loading'
  return <button {...props} disabled={status === 'disabled' || busy || props.disabled} aria-busy={busy || undefined} className={cn('inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', tone === 'primary' && 'bg-primary text-primary-foreground hover:opacity-90', tone === 'secondary' && 'border border-border bg-card text-foreground hover:bg-muted', tone === 'ghost' && 'text-muted-foreground hover:bg-muted hover:text-foreground', tone === 'danger' && 'bg-destructive text-destructive-foreground hover:opacity-90', (status === 'disabled' || busy || props.disabled) && 'cursor-not-allowed opacity-50', className)}>{busy && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}{children}</button>
}

export function RailInput({ label, error, hint, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }) {
  return <label className="flex flex-col gap-1.5 text-xs"><span className="font-medium text-foreground">{label}</span><input {...props} aria-invalid={Boolean(error)} className={cn('h-9 rounded-md border border-input bg-background px-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20', error && 'border-destructive focus:border-destructive focus:ring-destructive/20', className)} />{error ? <span className="text-[11px] text-destructive">{error}</span> : hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}</label>
}

export function RailSelect({ label, children, className, ...props }: HTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return <label className="flex flex-col gap-1.5 text-xs"><span className="font-medium text-foreground">{label}</span><span className="relative"><select {...props} className={cn('h-9 w-full appearance-none rounded-md border border-input bg-background px-3 pr-8 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/20', className)}>{children}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /></span></label>
}

export function RailBadge({ status, children, className }: { status: RailStatus; children?: ReactNode; className?: string }) {
  const Icon = status === 'success' ? CheckCircle2 : status === 'error' ? XCircle : status === 'warning' ? AlertTriangle : Info
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide', status === 'success' && 'bg-primary/10 text-primary', status === 'warning' && 'bg-accent/15 text-accent', status === 'error' && 'bg-destructive/10 text-destructive', !['success', 'warning', 'error'].includes(status) && 'bg-muted text-muted-foreground', className)}><Icon className="size-3" aria-hidden="true" />{children}</span>
}

export function RailCard({ title, description, action, children, className, ...props }: HTMLAttributes<HTMLElement> & { title?: string; description?: string; action?: ReactNode }) {
  return <section {...props} className={cn('rounded-xl border border-border bg-card shadow-sm', className)}><header className="flex items-start justify-between gap-4 border-b border-border p-5"><div>{title && <h3 className="font-mono text-sm font-semibold tracking-tight">{title}</h3>}{description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>}</div>{action}</header><div className="p-5">{children}</div></section>
}

export function RailKpi({ label, value, change, status = 'default', className }: { label: string; value: string; change: string; status?: RailStatus; className?: string }) {
  return <article className={cn('rounded-xl border border-border bg-card shadow-sm p-4 transition-colors hover:border-primary/40', className)}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-3 font-mono text-2xl font-semibold tracking-tight">{value}</p><p className={cn('mt-1 text-[11px]', status === 'error' && 'text-destructive', status === 'warning' && 'text-accent', status === 'success' && 'text-primary', !['error', 'warning', 'success'].includes(status) && 'text-muted-foreground')}>{change}</p></article>
}

export function RailAlert({ status = 'warning', title, children }: { status?: 'error' | 'warning' | 'success' | 'default'; title: string; children?: ReactNode }) {
  return <div role="status" className={cn('flex gap-3 rounded-lg border p-4 text-xs', status === 'error' && 'border-destructive/25 bg-destructive/5', status === 'warning' && 'border-accent/25 bg-accent/5', status === 'success' && 'border-primary/25 bg-primary/5', status === 'default' && 'border-border bg-muted/30')}><RailBadge status={status} className="mt-0.5 shrink-0" /><div><p className="font-semibold">{title}</p>{children ? <p className="mt-1 leading-5 text-muted-foreground">{children}</p> : null}</div></div>
}

export function RailEmpty({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center"><Info className="mb-3 size-5 text-muted-foreground" /><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{children}</p>{action && <div className="mt-4">{action}</div>}</div>
}

export function RailLoading({ label = 'Loading network data' }: { label?: string }) {
  return <div role="status" className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card shadow-sm p-6 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin text-primary" />{label}</div>
}

export function RailTabs({ items, active, onChange }: { items: string[]; active: string; onChange: (value: string) => void }) {
  return <div role="tablist" className="flex gap-1 border-b border-border">{items.map((item) => <button key={item} role="tab" aria-selected={active === item} onClick={() => onChange(item)} className={cn('border-b-2 border-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground', active === item && 'border-primary text-foreground')}>{item}</button>)}</div>
}

export function RailTimeline({ items }: { items: { label: string; start: number; width: number; status?: 'primary' | 'warning' }[] }) {
  return <div className="flex flex-col gap-2">{items.map((item) => <div key={item.label} className="flex items-center gap-3"><span className="w-24 shrink-0 text-right font-mono text-[11px] text-muted-foreground">{item.label}</span><div className="relative h-8 flex-1 overflow-hidden rounded bg-muted/60"><div className={cn('absolute top-1.5 h-5 rounded-sm', item.status === 'warning' ? 'bg-accent' : 'bg-primary')} style={{ left: `${item.start}%`, width: `${item.width}%` }} /></div></div>)}</div>
}

export function RailModal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="presentation" onClick={onClose}><div role="dialog" aria-modal="true" aria-labelledby="rail-modal-title" className="w-full max-w-lg rounded-xl border border-border bg-card shadow-sm shadow-xl" onClick={(event) => event.stopPropagation()}><header className="flex items-center justify-between border-b border-border p-5"><h2 id="rail-modal-title" className="font-mono text-sm font-semibold">{title}</h2><button aria-label="Close dialog" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><XCircle className="size-4" /></button></header><div className="p-5">{children}</div></div></div>
}

export function RailGantt({ rows }: { rows: { label: string; start: number; width: number; color?: 'primary' | 'warning' | 'error' }[] }) {
  return <div className="flex flex-col gap-2">{rows.map((row) => <div key={row.label} className="flex items-center gap-3"><span className="w-28 truncate text-right font-mono text-[10px] text-muted-foreground">{row.label}</span><div className="relative h-6 flex-1 rounded bg-muted/50"><div className={cn('absolute inset-y-1 rounded-sm', row.color === 'warning' && 'bg-accent', row.color === 'error' && 'bg-destructive', (!row.color || row.color === 'primary') && 'bg-primary')} style={{ left: `${row.start}%`, width: `${row.width}%` }} /></div></div>)}</div>
}
