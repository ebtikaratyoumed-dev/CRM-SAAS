import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompanyFinancials } from './actions';
import { formatCurrency } from '@/lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { CircleDollarSign, TrendingUp, TrendingDown, Target, Building2 } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Finance Dashboard',
  description: 'Company-wide financial tracking',
};

export default async function FinancePage() {
  const data = await getCompanyFinancials();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of company profitability based on project estimates and actual invoices.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Estimated Profit
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalEstimatedProfit)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on project planning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Actual Profit
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.totalActualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.totalActualProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue: {formatCurrency(data.totalActualRevenue)} | Spend: {formatCurrency(data.totalActualSpend)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Best Project (Estimated)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.bestEstimatedProject ? (
              <>
                <div className="text-lg font-bold truncate" title={(data.bestEstimatedProject as any).name}>
                  {(data.bestEstimatedProject as any).name}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Est. Profit: {formatCurrency((data.bestEstimatedProject as any).estimated_profit)}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground mt-2">N/A</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Best Project (Actual)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {data.bestActualProject ? (
              <>
                <div className="text-lg font-bold truncate" title={(data.bestActualProject as any).name}>
                  {(data.bestActualProject as any).name}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Actual Profit: {formatCurrency((data.bestActualProject as any).actualProfit)}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground mt-2">N/A</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              TVA Collectée (Ventes)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.totalTvaCollected)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Collected from client paid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              TVA Déductible (Achats)
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.totalTvaPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Paid to suppliers on invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Solde TVA (TVA Net)
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.netTva >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.netTva)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.netTva >= 0 ? 'Net amount owed to government' : 'Net credit due to company'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Project Financials Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead className="text-right">Est. Cost</TableHead>
                  <TableHead className="text-right">Est. Profit</TableHead>
                  <TableHead className="text-right">Actual Spend</TableHead>
                  <TableHead className="text-right">Actual Revenue</TableHead>
                  <TableHead className="text-right">TVA Net</TableHead>
                  <TableHead className="text-right">Actual Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.projectDetails.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(project.estimated_cost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(project.estimated_profit)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(project.actualSpend)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(project.actualRevenue)}</TableCell>
                    <TableCell className="text-right">
                      <div className="font-semibold">{formatCurrency(project.netTva)}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Coll: {formatCurrency(project.tvaCollected)} | Déd: {formatCurrency(project.tvaPaid)}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${project.actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(project.actualProfit)}
                    </TableCell>
                  </TableRow>
                ))}
                {data.projectDetails.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No projects found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
