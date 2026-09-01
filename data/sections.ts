import type { Section } from './types'

export const sections: Section[] = [
  { id: 'A-14', from: 'NDLS', to: 'GZB', distance: '46 km', traction: '25 kV AC · Double', status: 'Available', trains: 12, utilization: 68 },
  { id: 'B-07', from: 'GZB', to: 'MTC', distance: '64 km', traction: '25 kV AC · Double', status: 'Restricted', trains: 8, utilization: 84 },
  { id: 'C-22', from: 'MTC', to: 'MB', distance: '112 km', traction: '25 kV AC · Double', status: 'Available', trains: 15, utilization: 71 },
  { id: 'D-03', from: 'MB', to: 'LKO', distance: '387 km', traction: '25 kV AC · Double', status: 'Maintenance', trains: 6, utilization: 42 },
  { id: 'E-18', from: 'LKO', to: 'CNB', distance: '72 km', traction: '25 kV AC · Double', status: 'Available', trains: 10, utilization: 59 },
]
