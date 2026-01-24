import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, FileText } from 'lucide-react';

export function ActionsCard() {
  return (
    <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-primary-foreground">
          <FileText className="w-5 h-5" />
          Actions & Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-primary-foreground/80">
          Generate a comprehensive PDF report including SHAP visualizations and clinical recommendations.
        </p>

        <Button 
          variant="secondary" 
          className="w-full bg-background text-foreground hover:bg-background/90"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Full Report
        </Button>

        <Button 
          variant="outline" 
          className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share with Patient
        </Button>
      </CardContent>
    </Card>
  );
}
