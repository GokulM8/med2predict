import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download } from 'lucide-react';
import { FeatureContribution } from '@/lib/riskCalculator';
import { cn } from '@/lib/utils';

interface FeatureImportanceCardProps {
  contributions: FeatureContribution[];
}

export function FeatureImportanceCard({ contributions }: FeatureImportanceCardProps) {
  const maxAbsImpact = Math.max(...contributions.map(c => Math.abs(c.impact)), 0.3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="w-5 h-5 text-primary" />
          Feature Importance (SHAP Analysis)
        </CardTitle>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-6">
          Shows the contribution of each clinical factor to the final risk score. Positive values increase risk.
        </p>

        <div className="space-y-4">
          {contributions.map((contribution, index) => {
            const isPositive = contribution.impact >= 0;
            const barWidth = Math.min((Math.abs(contribution.impact) / maxAbsImpact) * 100, 100);
            
            return (
              <div key={index} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{contribution.feature}</span>
                    <span className="text-xs text-muted-foreground">({contribution.value})</span>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold",
                    isPositive ? "text-red-600" : "text-green-600"
                  )}>
                    {isPositive ? '+' : ''}{contribution.impact.toFixed(2)}
                  </span>
                </div>
                
                <div className="relative h-7 bg-muted rounded-md overflow-hidden">
                  <div
                    className={cn(
                      "absolute top-0 bottom-0 rounded-md flex items-center px-2 transition-all",
                      isPositive ? "bg-gradient-to-r from-red-400 to-red-500" : "bg-gradient-to-r from-green-400 to-green-500"
                    )}
                    style={{ width: `${barWidth}%` }}
                  >
                    <span className="text-xs font-medium text-white whitespace-nowrap">
                      {isPositive ? '+' : ''}{contribution.impact.toFixed(2)} Impact
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {contribution.description}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
