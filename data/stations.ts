import type { Station } from './types'

export const stations: Station[] = [
  { code: 'NDLS', name: 'New Delhi', division: 'Delhi', zone: 'NR', status: 'Operational' },
  { code: 'GZB', name: 'Ghaziabad Jn', division: 'Delhi', zone: 'NR', status: 'Operational' },
  { code: 'MTC', name: 'Meerut City', division: 'Delhi', zone: 'NR', status: 'Restricted' },
  { code: 'MB', name: 'Moradabad', division: 'Moradabad', zone: 'NR', status: 'Operational' },
  { code: 'LKO', name: 'Lucknow NR', division: 'Lucknow', zone: 'NR', status: 'Maintenance' },
  { code: 'CNB', name: 'Kanpur Central', division: 'Prayagraj', zone: 'NR', status: 'Operational' },
]

export const stationByCode = (code: string) => stations.find((station) => station.code === code)
