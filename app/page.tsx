import { DashboardClient } from '@/components/DashboardClient'
import { getDashboardData } from '@/lib/analytics'

export const dynamic = 'force-dynamic'


export default async function Dashboard() {
  const data = await getDashboardData()

  return <DashboardClient data={data} />
}
