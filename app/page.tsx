import RailOptDashboard from '@/components/railopt-dashboard'
import { OptimizationResultProvider } from '@/data/optimization-results'

export default function Page() {
  return (
    <OptimizationResultProvider>
      <RailOptDashboard />
    </OptimizationResultProvider>
  )
}
