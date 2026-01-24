import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Grid } from 'lucide-react';
import { ClinicalThreshold } from '@/lib/riskCalculator';
import { cn } from '@/lib/utils';

interface ClinicalThresholdsCardProps {
  thresholds: ClinicalThreshold[];
}

export function ClinicalThresholdsCard({ thresholds }: ClinicalThresholdsCardProps) {
  const getStatusConfig = (status: ClinicalThreshold['status']) => {
    switch (status) {
      case 'High':
        return { variant: 'destructive' as const, className: 'bg-red-100 text-red-700 border-red-200' };
      case 'Elevated':
        return { variant: 'secondary' as const, className: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'Borderline':
        return { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
      default:
        return { variant: 'outline' as const, className: 'bg-green-100 text-green-700 border-green-200' };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Grid className="w-5 h-5 text-primary" />
          Clinical Thresholds
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Patient Value</TableHead>
              <TableHead>Clinical Target</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {thresholds.map((threshold, index) => {
              const config = getStatusConfig(threshold.status);
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{threshold.metric}</TableCell>
                  <TableCell className={cn(
                    threshold.status !== 'Normal' && "font-semibold text-foreground"
                  )}>
                    {threshold.patientValue}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{threshold.clinicalTarget}</TableCell>
                  <TableCell>
                    <Badge variant={config.variant} className={config.className}>
                      {threshold.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
