import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Header() {
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">Patient Risk Assessment</h1>
        <p className="text-sm text-muted-foreground">Cardiovascular Disease Prediction Model</p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium">Dr. Sarah Chen</p>
          <p className="text-xs text-muted-foreground">Cardiology Dept.</p>
        </div>
        <Avatar className="h-10 w-10 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">SC</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
