import type { Resource } from './types'

export const resources: Resource[] = [
  { id: 'CREW-T04', type: 'Track crew', department: 'Track & Civil', availability: 'Busy', quantity: 1, utilization: 92, tasks: ['MR-2048 · Geometry inspection', 'MR-2065 · Drainage inspection'], conflict: 'Overlap 17:00–18:30' },
  { id: 'CREW-E12', type: 'Electrical crew', department: 'Electrical', availability: 'Available', quantity: 2, utilization: 48, tasks: ['MR-2051 · OHL maintenance'], conflict: '' },
  { id: 'CREW-S08', type: 'Signalling crew', department: 'Signalling', availability: 'Conflict', quantity: 1, utilization: 100, tasks: ['MR-2054 · Relay replacement', 'Block B-07 · Signal testing'], conflict: 'Double-booked 14:00–16:00' },
  { id: 'M-RG02', type: 'Rail grinder', department: 'Track & Civil', availability: 'Busy', quantity: 1, utilization: 76, tasks: ['MR-2058 · Rail grinding'], conflict: '' },
  { id: 'TEAM-TC03', type: 'Telecoms team', department: 'Telecoms', availability: 'Available', quantity: 3, utilization: 32, tasks: ['MR-2062 · CCTV upgrade'], conflict: '' },
  { id: 'VEH-UT12', type: 'Utility vehicle', department: 'Engineering', availability: 'Available', quantity: 4, utilization: 24, tasks: ['Standby · A-14 access'], conflict: '' },
  { id: 'CRANE-07', type: 'Mobile crane', department: 'Structures', availability: 'Busy', quantity: 1, utilization: 84, tasks: ['Bridge bearing renewal'], conflict: 'Requested by MR-2071' },
]
