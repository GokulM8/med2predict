import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Calculator, Upload, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { PatientData, generatePatientId } from '@/lib/riskCalculator';
import { 
  validatePatientData, 
  validateMaxHeartRateForAge, 
  getBPWarning, 
  getCholesterolWarning,
  HEALTH_LIMITS 
} from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PatientDataFormProps {
  onCalculate: (data: PatientData) => void;
  isCalculating: boolean;
  initialData?: PatientData;
}

export function PatientDataForm({ onCalculate, isCalculating, initialData }: PatientDataFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<PatientData[]>([]);
  const [selectedCsvIndex, setSelectedCsvIndex] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<PatientData>(initialData || {
    patientId: generatePatientId(),
    age: 62,
    sex: 'Male',
    chestPainType: 'asymptomatic',
    restingBP: 145,
    cholesterol: 240,
    fastingBloodSugar: false,
    restingECG: 'lv hypertrophy',
    maxHeartRate: 150,
    exerciseAngina: true,
    stDepression: 2.3,
    stSlope: 'flat',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setErrors({});
    }
  }, [initialData]);

  // Real-time validation and warnings
  useEffect(() => {
    const newWarnings: string[] = [];
    
    const bpWarning = getBPWarning(formData.restingBP);
    if (bpWarning) newWarnings.push(bpWarning);
    
    const cholWarning = getCholesterolWarning(formData.cholesterol);
    if (cholWarning) newWarnings.push(cholWarning);
    
    const hrWarning = validateMaxHeartRateForAge(formData.age, formData.maxHeartRate);
    if (hrWarning) newWarnings.push(hrWarning);
    
    setWarnings(newWarnings);
  }, [formData.restingBP, formData.cholesterol, formData.age, formData.maxHeartRate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validatePatientData(formData);
    
    if (!validation.success) {
      if ('errors' in validation) {
        setErrors(validation.errors);
      }
      toast({
        title: "Validation Error",
        description: "Please correct the highlighted fields before calculating risk.",
        variant: "destructive",
      });
      return;
    }
    
    setErrors({});
    onCalculate(formData);
  };

  const updateField = <K extends keyof PatientData>(field: K, value: PatientData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateNumberField = (field: keyof PatientData, value: string, isFloat = false) => {
    const parsed = isFloat ? parseFloat(value) : parseInt(value);
    if (!isNaN(parsed)) {
      updateField(field, parsed as PatientData[typeof field]);
    } else if (value === '') {
      updateField(field, 0 as PatientData[typeof field]);
    }
  };

  const getInputClassName = (field: string, baseClasses = '') => {
    return cn(
      baseClasses,
      errors[field] && 'border-destructive bg-destructive/5 focus-visible:ring-destructive'
    );
  };

  const parseCSV = (text: string): PatientData[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const patients: PatientData[] = [];
    
    for (let i = 1; i < Math.min(lines.length, 11); i++) {
      const values = lines[i].split(',');
      
      const getVal = (key: string) => {
        const idx = headers.indexOf(key);
        return idx >= 0 ? values[idx]?.trim() : '';
      };
      
      const chestPainMap: Record<string, PatientData['chestPainType']> = {
        'typical angina': 'typical angina',
        'atypical angina': 'atypical angina',
        'non-anginal': 'non-anginal',
        'asymptomatic': 'asymptomatic',
      };
      
      const slopeMap: Record<string, PatientData['stSlope']> = {
        'upsloping': 'upsloping',
        'flat': 'flat',
        'downsloping': 'downsloping',
      };

      const age = Math.max(HEALTH_LIMITS.age.min, Math.min(HEALTH_LIMITS.age.max, parseInt(getVal('age')) || 50));
      const restingBP = Math.max(HEALTH_LIMITS.restingBP.min, Math.min(HEALTH_LIMITS.restingBP.max, parseInt(getVal('trestbps')) || 120));
      const cholesterol = Math.max(HEALTH_LIMITS.cholesterol.min, Math.min(HEALTH_LIMITS.cholesterol.max, parseInt(getVal('chol')) || 200));
      const maxHeartRate = Math.max(HEALTH_LIMITS.maxHeartRate.min, Math.min(HEALTH_LIMITS.maxHeartRate.max, parseInt(getVal('thalch')) || 150));
      const stDepression = Math.max(HEALTH_LIMITS.stDepression.min, Math.min(HEALTH_LIMITS.stDepression.max, parseFloat(getVal('oldpeak')) || 0));

      const patient: PatientData = {
        patientId: getVal('id') ? `PT-CSV-${getVal('id')}` : generatePatientId(),
        age,
        sex: getVal('sex') === 'Female' ? 'Female' : 'Male',
        chestPainType: chestPainMap[getVal('cp')] || 'non-anginal',
        restingBP,
        cholesterol,
        fastingBloodSugar: getVal('fbs') === 'TRUE' || getVal('fbs') === '1',
        restingECG: getVal('restecg') === 'lv hypertrophy' ? 'lv hypertrophy' : 'normal',
        maxHeartRate,
        exerciseAngina: getVal('exang') === 'TRUE' || getVal('exang') === '1',
        stDepression,
        stSlope: slopeMap[getVal('slope')] || 'flat',
      };
      
      patients.push(patient);
    }
    
    return patients;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const patients = parseCSV(text);
      
      if (patients.length > 0) {
        setCsvData(patients);
        setSelectedCsvIndex(0);
        setFormData(patients[0]);
        setErrors({});
        toast({
          title: "CSV Loaded Successfully",
          description: `Loaded ${patients.length} patient records. Values have been validated and clamped to acceptable ranges.`,
        });
      } else {
        toast({
          title: "CSV Parse Error",
          description: "Could not parse any patient records from the file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSelectCsvPatient = (index: number) => {
    setSelectedCsvIndex(index);
    setFormData(csvData[index]);
    setErrors({});
    onCalculate(csvData[index]);
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5 text-primary" />
          Patient Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv">Upload CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="csv">
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Click to upload CSV file</p>
                <p className="text-sm text-muted-foreground mt-1">Supports UCI Heart Disease format</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
              
              {csvData.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Patient from CSV ({csvData.length} loaded)</Label>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {csvData.map((patient, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCsvIndex === idx 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() => handleSelectCsvPatient(idx)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{patient.patientId}</p>
                            <p className="text-xs text-muted-foreground">
                              {patient.age}y, {patient.sex}, BP: {patient.restingBP}
                            </p>
                          </div>
                          {selectedCsvIndex === idx && (
                            <CheckCircle className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Warnings */}
              {warnings.length > 0 && (
                <Alert variant="default" className="border-risk-medium/50 bg-risk-medium/5">
                  <AlertTriangle className="h-4 w-4 text-risk-medium" />
                  <AlertDescription className="text-sm">
                    <ul className="list-disc list-inside space-y-1">
                      {warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Patient ID */}
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID</Label>
                <Input
                  id="patientId"
                  value={formData.patientId}
                  onChange={(e) => updateField('patientId', e.target.value)}
                  className={getInputClassName('patientId', 'bg-muted/50')}
                  maxLength={50}
                />
                {errors.patientId && <p className="text-xs text-destructive">{errors.patientId}</p>}
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">
                    Age <span className="text-xs text-muted-foreground">({HEALTH_LIMITS.age.min}-{HEALTH_LIMITS.age.max})</span>
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min={HEALTH_LIMITS.age.min}
                    max={HEALTH_LIMITS.age.max}
                    value={formData.age}
                    onChange={(e) => updateNumberField('age', e.target.value)}
                    className={getInputClassName('age')}
                  />
                  {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={formData.sex} onValueChange={(v) => updateField('sex', v as 'Male' | 'Female')}>
                    <SelectTrigger className={getInputClassName('sex')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.sex && <p className="text-xs text-destructive">{errors.sex}</p>}
                </div>
              </div>

              {/* Blood Pressure & Cholesterol */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restingBP">
                    Resting BP <span className="text-xs text-muted-foreground">({HEALTH_LIMITS.restingBP.min}-{HEALTH_LIMITS.restingBP.max} mmHg)</span>
                  </Label>
                  <Input
                    id="restingBP"
                    type="number"
                    min={HEALTH_LIMITS.restingBP.min}
                    max={HEALTH_LIMITS.restingBP.max}
                    value={formData.restingBP}
                    onChange={(e) => updateNumberField('restingBP', e.target.value)}
                    className={getInputClassName('restingBP', formData.restingBP >= 140 ? 'border-risk-medium bg-risk-medium/5' : '')}
                  />
                  {errors.restingBP && <p className="text-xs text-destructive">{errors.restingBP}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cholesterol">
                    Cholesterol <span className="text-xs text-muted-foreground">({HEALTH_LIMITS.cholesterol.min}-{HEALTH_LIMITS.cholesterol.max} mg/dL)</span>
                  </Label>
                  <Input
                    id="cholesterol"
                    type="number"
                    min={HEALTH_LIMITS.cholesterol.min}
                    max={HEALTH_LIMITS.cholesterol.max}
                    value={formData.cholesterol}
                    onChange={(e) => updateNumberField('cholesterol', e.target.value)}
                    className={getInputClassName('cholesterol', formData.cholesterol >= 240 ? 'border-risk-medium bg-risk-medium/5' : '')}
                  />
                  {errors.cholesterol && <p className="text-xs text-destructive">{errors.cholesterol}</p>}
                </div>
              </div>

              {/* Max Heart Rate & ST Depression */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxHeartRate">
                    Max Heart Rate <span className="text-xs text-muted-foreground">({HEALTH_LIMITS.maxHeartRate.min}-{HEALTH_LIMITS.maxHeartRate.max} bpm)</span>
                  </Label>
                  <Input
                    id="maxHeartRate"
                    type="number"
                    min={HEALTH_LIMITS.maxHeartRate.min}
                    max={HEALTH_LIMITS.maxHeartRate.max}
                    value={formData.maxHeartRate}
                    onChange={(e) => updateNumberField('maxHeartRate', e.target.value)}
                    className={getInputClassName('maxHeartRate')}
                  />
                  {errors.maxHeartRate && <p className="text-xs text-destructive">{errors.maxHeartRate}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stDepression">
                    ST Depression <span className="text-xs text-muted-foreground">({HEALTH_LIMITS.stDepression.min}-{HEALTH_LIMITS.stDepression.max} mm)</span>
                  </Label>
                  <Input
                    id="stDepression"
                    type="number"
                    step="0.1"
                    min={HEALTH_LIMITS.stDepression.min}
                    max={HEALTH_LIMITS.stDepression.max}
                    value={formData.stDepression}
                    onChange={(e) => updateNumberField('stDepression', e.target.value, true)}
                    className={getInputClassName('stDepression')}
                  />
                  {errors.stDepression && <p className="text-xs text-destructive">{errors.stDepression}</p>}
                </div>
              </div>

              {/* Chest Pain Type */}
              <div className="space-y-2">
                <Label>Chest Pain Type</Label>
                <Select value={formData.chestPainType} onValueChange={(v) => updateField('chestPainType', v as PatientData['chestPainType'])}>
                  <SelectTrigger className={getInputClassName('chestPainType')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="typical angina">Typical Angina</SelectItem>
                    <SelectItem value="atypical angina">Atypical Angina</SelectItem>
                    <SelectItem value="non-anginal">Non-Anginal Pain</SelectItem>
                    <SelectItem value="asymptomatic">Asymptomatic</SelectItem>
                  </SelectContent>
                </Select>
                {errors.chestPainType && <p className="text-xs text-destructive">{errors.chestPainType}</p>}
              </div>

              {/* ST Slope */}
              <div className="space-y-2">
                <Label>ST Slope</Label>
                <Select value={formData.stSlope} onValueChange={(v) => updateField('stSlope', v as PatientData['stSlope'])}>
                  <SelectTrigger className={getInputClassName('stSlope')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upsloping">Upsloping</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="downsloping">Downsloping</SelectItem>
                  </SelectContent>
                </Select>
                {errors.stSlope && <p className="text-xs text-destructive">{errors.stSlope}</p>}
              </div>

              {/* Exercise Angina */}
              <div className="space-y-2">
                <Label>Exercise-Induced Angina</Label>
                <RadioGroup
                  value={formData.exerciseAngina ? 'yes' : 'no'}
                  onValueChange={(v) => updateField('exerciseAngina', v === 'yes')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="angina-yes" />
                    <Label htmlFor="angina-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="angina-no" />
                    <Label htmlFor="angina-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Fasting Blood Sugar */}
              <div className="space-y-2">
                <Label>Fasting Blood Sugar &gt; 120 mg/dL</Label>
                <RadioGroup
                  value={formData.fastingBloodSugar ? 'yes' : 'no'}
                  onValueChange={(v) => updateField('fastingBloodSugar', v === 'yes')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="fbs-yes" />
                    <Label htmlFor="fbs-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="fbs-no" />
                    <Label htmlFor="fbs-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Validation Info */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p>All values are validated against medically acceptable ranges. Invalid entries will be highlighted in red.</p>
              </div>

              <Button type="submit" className="w-full mt-6" size="lg" disabled={isCalculating}>
                <Calculator className="w-4 h-4 mr-2" />
                {isCalculating ? 'Calculating...' : 'Recalculate Risk'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
