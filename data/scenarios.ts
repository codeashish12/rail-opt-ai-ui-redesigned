import type { Scenario } from './types'

export const scenarios: Scenario[] = [
  { id: 'SCN-001', name: 'Baseline operating window', parameters: { traffic: 'Normal', delay: 0, weather: 'Clear' }, status: 'completed' },
  { id: 'SCN-002', name: 'Peak traffic stress test', parameters: { traffic: 'High', delay: 12, weather: 'Clear' }, status: 'draft' },
]
