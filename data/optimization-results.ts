'use client'

import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Block, MaintenanceRequest, OptimizationResult } from './types'

export type BackendOptimizationBlock = {
  block_id?: string
  id?: string
  section_id?: string
  section?: string
  start_time?: string
  end_time?: string
  maintenance_request_ids?: string[]
  resource_ids?: string[]
  affected_trains?: Array<string | Record<string, unknown>>
  trains?: Array<string | Record<string, unknown>>
  explanation?: string
  [key: string]: unknown
}

export function normalizeOptimizationBlocks(
  blocks: Array<Record<string, unknown>> | undefined,
  maintenanceRequests: MaintenanceRequest[] = []
): Block[] {
  if (!Array.isArray(blocks)) return []

  return blocks.map((block, index) => {
    const rawBlock = block as BackendOptimizationBlock
    const maintenanceRequestIds = Array.isArray(rawBlock.maintenance_request_ids)
      ? rawBlock.maintenance_request_ids.filter((id): id is string => typeof id === 'string' && !!id)
      : []

    const departments = Array.from(
      new Set(
        maintenanceRequestIds
          .map((id) => maintenanceRequests.find((request) => request.id === id)?.department)
          .filter((value): value is string => Boolean(value))
      )
    )

    const resourceIds = Array.isArray(rawBlock.resource_ids)
      ? rawBlock.resource_ids.filter((id): id is string => typeof id === 'string' && !!id)
      : []

    const rawAffectedTrains = Array.isArray(rawBlock.affected_trains)
      ? rawBlock.affected_trains
      : Array.isArray(rawBlock.trains)
        ? rawBlock.trains
        : []

    const affectedTrainIds = rawAffectedTrains.flatMap((train) => {
      if (typeof train === 'string') return train.trim() ? [train] : []
      if (train && typeof train === 'object') {
        const candidate = train as Record<string, unknown>
        const directId = typeof candidate.train_id === 'string' ? candidate.train_id : typeof candidate.id === 'string' ? candidate.id : ''
        return directId.trim() ? [directId] : []
      }
      return []
    })

    const startTime = typeof rawBlock.start_time === 'string' ? rawBlock.start_time : '—'
    const endTime = typeof rawBlock.end_time === 'string' ? rawBlock.end_time : '—'
    const blockId = String(rawBlock.block_id ?? rawBlock.id ?? `BLK-${index + 1}`)
    const section = String(rawBlock.section_id ?? rawBlock.section ?? 'Unknown section')

    return {
      id: blockId,
      section,
      time: startTime === '—' && endTime === '—' ? 'Unscheduled' : `${startTime} → ${endTime}`,
      tasks: maintenanceRequestIds.length ? maintenanceRequestIds.join(', ') : 'Maintenance window',
      departments: departments.length ? departments.join(', ') : '—',
      trains: affectedTrainIds.length ? affectedTrainIds.join(', ') : '—',
      resources: resourceIds.length ? resourceIds.join(', ') : '—',
      tone: 'bg-accent',
    }
  })
}

export function normalizeOptimizationMetrics(
  metrics: Record<string, unknown> | undefined,
  blocks: Array<Record<string, unknown>> = []
): OptimizationResult['metrics'] {
  const source = metrics && typeof metrics === 'object' ? metrics : {}

  const totalBlocks = Number(source.total_blocks ?? source.totalBlocks ?? 0)
  const blockHours = Number(source.total_block_hours ?? source.blockHours ?? 0)
  const trainConflicts = Number(source.train_conflicts ?? source.trainConflicts ?? 0)
  const resourceConflicts = Number(source.resource_conflicts ?? source.resourceConflicts ?? 0)
  const maintenanceCompletion = Number(source.maintenance_completion_percent ?? source.maintenanceCompletion ?? 0)
  const lateTasks = Number(source.late_tasks ?? source.lateTasks ?? 0)
  const completedTasks = Number(source.completed_tasks ?? source.completedTasks ?? 0)
  const totalTasks = Number(source.total_tasks ?? source.totalTasks ?? 0)

  const assignedResourceIds = blocks.flatMap((block) => {
    const candidate = block as Record<string, unknown> & { resource_ids?: unknown }
    if (!Array.isArray(candidate.resource_ids)) return []
    return candidate.resource_ids.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  })

  const rawAssetAvailability = Number(source.asset_availability ?? source.assetAvailability ?? 0)
  const assetAvailability = Number.isFinite(rawAssetAvailability) && rawAssetAvailability >= 0
    ? rawAssetAvailability
    : assignedResourceIds.length > 0
      ? 100
      : 0

  return {
    totalBlocks: Number.isFinite(totalBlocks) ? totalBlocks : 0,
    blockHours: Number.isFinite(blockHours) ? blockHours : 0,
    trainConflicts: Number.isFinite(trainConflicts) ? trainConflicts : 0,
    resourceConflicts: Number.isFinite(resourceConflicts) ? resourceConflicts : 0,
    maintenanceCompletion: Number.isFinite(maintenanceCompletion) ? maintenanceCompletion : 0,
    assetAvailability: Number.isFinite(assetAvailability) ? assetAvailability : 0,
    lateTasks: Number.isFinite(lateTasks) ? lateTasks : 0,
    completedTasks: Number.isFinite(completedTasks) ? completedTasks : 0,
    totalTasks: Number.isFinite(totalTasks) ? totalTasks : 0,
  }
}

export function normalizeOptimizationResult(
  result: {
    status?: string
    blocks?: Array<Record<string, unknown>>
    conflicts?: Array<Record<string, unknown>>
    metrics?: Record<string, unknown>
    explanation?: string
  } | null | undefined,
  maintenanceRequests: MaintenanceRequest[] = []
): OptimizationResult | null {
  if (!result) return null

  return {
    status: typeof result.status === 'string' ? result.status : 'unknown',
    blocks: normalizeOptimizationBlocks(result.blocks, maintenanceRequests),
    conflicts: Array.isArray(result.conflicts) ? result.conflicts : [],
    metrics: normalizeOptimizationMetrics(result.metrics, Array.isArray(result.blocks) ? result.blocks : []),
    explanation: typeof result.explanation === 'string' ? result.explanation : 'No optimization explanation available.',
    generatedAt: new Date().toISOString(),
  }
}

type OptimizationResultContextValue = {
  result: OptimizationResult | null
  setResult: (result: OptimizationResult | null) => void
  clearResult: () => void
}

const OptimizationResultContext = createContext<OptimizationResultContextValue | null>(null)
const optimizationResultStorageKey = 'railopt-latest-optimization-result'

export function OptimizationResultProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(optimizationResultStorageKey)
      if (stored) {
        setResult(JSON.parse(stored) as OptimizationResult)
      }
    } catch {
      window.localStorage.removeItem(optimizationResultStorageKey)
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return

    if (result) {
      window.localStorage.setItem(
        optimizationResultStorageKey,
        JSON.stringify(result),
      )
    } else {
      window.localStorage.removeItem(optimizationResultStorageKey)
    }
  }, [hydrated, result])

  const value = useMemo<OptimizationResultContextValue>(
    () => ({
      result,
      setResult,
      clearResult: () => setResult(null),
    }),
    [result]
  )

  return createElement(OptimizationResultContext.Provider, { value }, children)
}

export function useOptimizationResult() {
  const context = useContext(OptimizationResultContext)
  if (!context) {
    throw new Error('useOptimizationResult must be used inside OptimizationResultProvider')
  }
  return context
}
