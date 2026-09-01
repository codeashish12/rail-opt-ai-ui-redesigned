'use client'

import useSWR from 'swr'
import type { MaintenanceRequest } from './types'
import { normalizeMaintenanceRequests } from './maintenance-requests'

type MaintenanceRecord = {
  request_id?: string
  department?: string
  section_id?: string
  activity_maintenance_scope?: string
  duration?: number
  priority?: number
  execution_deadline?: string
  required_resource_equipment?: string
  approval_status?: MaintenanceRequest['status']
}

type MaintenanceResponse =
  | { 'Maintenance Requests Master'?: MaintenanceRecord[] }
  | MaintenanceRecord[]

const fetcher = async (url: string): Promise<MaintenanceResponse> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Unable to load maintenance requests')

  const payload = await response.json()
  if (Array.isArray(payload)) return payload as MaintenanceRecord[]
  if (payload && Array.isArray((payload as { 'Maintenance Requests Master'?: MaintenanceRecord[] })['Maintenance Requests Master'])) {
    return payload as MaintenanceResponse
  }

  throw new Error('Maintenance requests payload is malformed')
}

export function useMaintenanceRequests() {
  const { data, error, isLoading } = useSWR('/data/maintenance_requests.json', fetcher)

  const maintenanceRequests = Array.isArray(data)
    ? normalizeMaintenanceRequests(data)
    : data && Array.isArray(data['Maintenance Requests Master'])
      ? normalizeMaintenanceRequests(data['Maintenance Requests Master'])
      : []

  return {
    maintenanceRequests,
    error,
    isLoading,
  }
}
