import type { Block, MaintenanceRequest, Resource, Train } from './types'

export const totalMaintenanceRequests = (requests: MaintenanceRequest[]) => requests.length
export const activeTrains = (trains: Train[]) => trains.filter((train) => train.priority !== 'Standard').length
export const totalResources = (resources: Resource[]) => resources.reduce((total, resource) => total + resource.quantity, 0)
export const plannedBlocks = (blocks: Block[]) => blocks.length
export const totalBlockHours = (blocks: Block[]) => blocks.reduce((total, block) => {
  const [start, end] = block.time.split('–').map((value) => value.split(':').map(Number))
  return total + ((end[0] * 60 + end[1]) - (start[0] * 60 + start[1])) / 60
}, 0)
export const trainConflicts = (trains: Train[]) => trains.filter((train) => train.priority === 'Protected').length

export const activeConflicts = (blocks: Block[], trains: Train[], resources: Resource[]) => {
  const trainOverlapCount = blocks.filter((block) => trains.some((train) => block.section.startsWith(train.section) && train.priority !== 'Standard')).length
  const resourceOverlapCount = resources.filter((resource) => resource.availability === 'Conflict' || resource.tasks.length > 1).length
  return trainOverlapCount + resourceOverlapCount
}

export const maintenanceCompletion = (requests: MaintenanceRequest[]) => requests.length ? Math.round(requests.filter((request) => request.status === 'Approved').length / requests.length * 100) : 0
export const assetAvailability = (resources: Resource[]) => resources.length ? Math.round(resources.filter((resource) => resource.availability === 'Available').length / resources.length * 1000) / 10 : 0
