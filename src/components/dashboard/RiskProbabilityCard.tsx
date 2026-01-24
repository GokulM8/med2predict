import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { RiskResult } from '@/lib/riskCalculator';
import { cn } from '@/lib/utils';

interface RiskProbabilityCardProps {
  result: RiskResult | null;
}

export function RiskProbabilityCard({ result }: RiskProbabilityCardProps) {
  if (!result) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Enter patient data to calculate risk</p>
        </CardContent>
      </Card>
    );
  }

  const probability = Math.round(result.probability * 1000) / 10;
  
  const getRiskConfig = () => {
    switch (result.riskLevel) {
      case 'High':
        return {
          gradient: 'from-red-500 to-orange-500',
          bgColor: 'bg-red-500',
          textColor: 'text-red-600',
          badgeVariant: 'destructive' as const,
          icon: AlertTriangle,
          progressColor: 'bg-gradient-to-r from-green-500 via-yellow-500 to-red-500',
        };
      case 'Medium':
        return {
          gradient: 'from-yellow-500 to-orange-500',
          bgColor: 'bg-yellow-500',
          textColor: 'text-yellow-600',
          badgeVariant: 'secondary' as const,
          icon: AlertCircle,
          progressColor: 'bg-gradient-to-r from-green-500 via-yellow-500 to-red-500',
        };
      default:
        return {
          gradient: 'from-green-500 to-emerald-500',
          bgColor: 'bg-green-500',
          textColor: 'text-green-600',
          badgeVariant: 'outline' as const,
          icon: CheckCircle,
          progressColor: 'bg-gradient-to-r from-green-500 via-yellow-500 to-red-500',
        };
    }
  };

  const config = getRiskConfig();
  const Icon = config.icon;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Predicted Risk Probability
        </div>
        
        <div className={cn("text-6xl font-bold bg-gradient-to-r bg-clip-text text-transparent", config.gradient)}>
          {probability}%
        </div>

        <Badge variant={config.badgeVariant} className="mt-3 gap-1">
          <Icon className="w-3.5 h-3.5" />
          {result.riskLevel} Risk Detected
        </Badge>

        <p className="text-xs text-muted-foreground mt-4">
          Based on model confidence interval of 95%.
        </p>

        {/* Risk Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Low Risk</span>
            <span>High Risk</span>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden bg-muted">
            <div className={cn("absolute inset-0", config.progressColor)} />
            <div
              className="absolute top-0 bottom-0 w-1 bg-background border-2 border-foreground rounded-full shadow-lg"
              style={{ left: `${Math.min(98, probability)}%`, transform: 'translateX(-50%)' }}
            />
          </div>
        </div>

        <p className="text-sm mt-4 p-3 rounded-lg bg-muted/50">
          <span className="font-medium">Interpretation:</span> {result.interpretation}
        </p>
      </CardContent>
    </Card>
  );
}
