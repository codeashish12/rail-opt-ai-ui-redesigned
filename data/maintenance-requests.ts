import type { MaintenanceRequest } from './types'

export const maintenanceRequests: MaintenanceRequest[] = []

type MaintenanceRecord = {
  request_id?: string
  department?: string
  section_id?: string
  activity_maintenance_scope?: string
  duration?: number
  priority?: number | string
  execution_deadline?: string
  required_resource_equipment?: string
  approval_status?: MaintenanceRequest['status'] | string
}

const priorityMap: Record<number, MaintenanceRequest['priority']> = { 1: 'Urgent', 2: 'High', 3: 'Medium', 4: 'Low' }
const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`
const normalizeStatus = (status?: string): MaintenanceRequest['status'] => {
  if (status === 'Approved' || status === 'Pending' || status === 'In Progress' || status === 'Completed') return status
  return 'Pending'
}

export function normalizeMaintenanceRequests(records: unknown): MaintenanceRequest[] {
  if (!Array.isArray(records)) return []

  return records.flatMap((record) => {
    if (!record || typeof record !== 'object') return []

    const item = record as Partial<MaintenanceRecord>
    const id = item.request_id?.trim() ?? ''
    if (!id) return []

    const durationMinutes = typeof item.duration === 'number' ? item.duration : Number(item.duration ?? 0)

    return [{
      id,
      department: item.department ?? 'Unknown',
      section: item.section_id ?? 'Unknown',
      activity: item.activity_maintenance_scope ?? 'Unspecified maintenance activity',
      duration: Number.isFinite(durationMinutes) && durationMinutes > 0 ? formatDuration(durationMinutes) : '0h',
      priority: typeof item.priority === 'number' ? (priorityMap[item.priority] ?? 'Low') : (item.priority === 'Urgent' || item.priority === 'High' || item.priority === 'Medium' || item.priority === 'Low' ? item.priority : 'Low'),
      deadline: item.execution_deadline ?? '',
      resource: item.required_resource_equipment ?? '',
      status: normalizeStatus(item.approval_status),
      overdue: false,
      conflict: '',
    }]
  })
}

