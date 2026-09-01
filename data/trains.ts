import type { Train } from './types'

export const trains: Train[] = [
  { id: 'TR-4821', number: '12951', type: 'Rajdhani Express', service: 'Passenger', section: 'A-14', arrival: '06:40', departure: '06:47', priority: 'Protected', color: 'bg-destructive' },
  { id: 'TR-7304', number: 'G-204', type: 'Northern Freight', service: 'Freight', section: 'B-07', arrival: '07:15', departure: '07:42', priority: 'High', color: 'bg-accent' },
  { id: 'TR-1188', number: '12426', type: 'Intercity Express', service: 'Passenger', section: 'C-22', arrival: '08:05', departure: '08:12', priority: 'Standard', color: 'bg-primary' },
  { id: 'TR-5512', number: 'S-882', type: 'Mineral Bulk', service: 'Freight', section: 'A-09', arrival: '09:10', departure: '09:58', priority: 'High', color: 'bg-accent' },
  { id: 'TR-9017', number: '12952', type: 'Rajdhani Express', service: 'Passenger', section: 'D-03', arrival: '10:25', departure: '10:32', priority: 'Protected', color: 'bg-destructive' },
  { id: 'TR-2260', number: 'G-318', type: 'Northern Freight', service: 'Freight', section: 'B-11', arrival: '11:40', departure: '12:18', priority: 'Standard', color: 'bg-primary' },
  { id: 'TR-6442', number: '14632', type: 'Regional Passenger', service: 'Passenger', section: 'C-18', arrival: '13:05', departure: '13:14', priority: 'Standard', color: 'bg-primary' },
]
