/**
 * RailOpt AI Data Models
 * Typed entities for railway operations, maintenance, and resources
 */

export interface Station {
  code: string
  name: string
  division: string
  zone: string
  status: 'Operational' | 'Restricted' | 'Maintenance'
}

export interface Section {
  id: string
  from: string
  to: string
  distance: string
  traction: string
  status: 'Available' | 'Restricted' | 'Maintenance'
  trains: number
  utilization: number
}

export interface Train {
  id: string
  number: string
  type: string
  service: 'Passenger' | 'Freight'
  section: string
  arrival: string
  departure: string
  priority: 'Protected' | 'High' | 'Standard'
  color: string
}

export interface Resource {
  id: string
  type: string
  department: string
  availability: 'Available' | 'Busy' | 'Conflict'
  quantity: number
  utilization: number
  tasks: string[]
  conflict: string
}

export interface MaintenanceRequest {
  id: string
  department: string
  section: string
  activity: string
  duration: string
  priority: 'Urgent' | 'High' | 'Medium' | 'Low'
  deadline: string
  resource: string
  status: 'Approved' | 'Pending' | 'In Progress' | 'Completed'
  overdue: boolean
  conflict: string
}

export interface Block {
  id: string
  section: string
  time: string
  tasks: string
  departments: string
  trains: string
  resources: string
  tone: string
}

export interface Scenario {
  id: string
  name: string
  parameters: Record<string, number | string>
  status: 'draft' | 'active' | 'completed'
}

export interface OptimizationResult {
  status: string
  blocks: Block[]
  conflicts: Array<Record<string, unknown>>
  metrics: {
    totalBlocks: number
    blockHours: number
    trainConflicts: number
    resourceConflicts: number
    maintenanceCompletion: number
    assetAvailability: number
    lateTasks: number
    completedTasks: number
    totalTasks: number
  }
  explanation: string
  generatedAt: string
}
