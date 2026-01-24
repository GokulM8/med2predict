import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calculator, Upload, CheckCircle } from 'lucide-react';
import { PatientData, generatePatientId } from '@/lib/riskCalculator';
import { useToast } from '@/hooks/use-toast';

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
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  const updateField = <K extends keyof PatientData>(field: K, value: PatientData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const parseCSV = (text: string): PatientData[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const patients: PatientData[] = [];
    
    for (let i = 1; i < Math.min(lines.length, 11); i++) { // Limit to 10 patients
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

      const patient: PatientData = {
        patientId: getVal('id') ? `PT-CSV-${getVal('id')}` : generatePatientId(),
        age: parseInt(getVal('age')) || 50,
        sex: getVal('sex') === 'Female' ? 'Female' : 'Male',
        chestPainType: chestPainMap[getVal('cp')] || 'non-anginal',
        restingBP: parseInt(getVal('trestbps')) || 120,
        cholesterol: parseInt(getVal('chol')) || 200,
        fastingBloodSugar: getVal('fbs') === 'TRUE' || getVal('fbs') === '1',
        restingECG: getVal('restecg') === 'lv hypertrophy' ? 'lv hypertrophy' : 'normal',
        maxHeartRate: parseInt(getVal('thalch')) || 150,
        exerciseAngina: getVal('exang') === 'TRUE' || getVal('exang') === '1',
        stDepression: parseFloat(getVal('oldpeak')) || 0,
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
        toast({
          title: "CSV Loaded Successfully",
          description: `Loaded ${patients.length} patient records from the file.`,
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
              {/* Patient ID */}
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID</Label>
                <Input
                  id="patientId"
                  value={formData.patientId}
                  onChange={(e) => updateField('patientId', e.target.value)}
                  className="bg-muted/50"
                />
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={formData.sex} onValueChange={(v) => updateField('sex', v as 'Male' | 'Female')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Blood Pressure & Cholesterol */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restingBP">Resting BP (mmHg)</Label>
                  <Input
                    id="restingBP"
                    type="number"
                    value={formData.restingBP}
                    onChange={(e) => updateField('restingBP', parseInt(e.target.value) || 0)}
                    className={formData.restingBP >= 140 ? 'border-destructive bg-destructive/5' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cholesterol">Cholesterol (mg/dL)</Label>
                  <Input
                    id="cholesterol"
                    type="number"
                    value={formData.cholesterol}
                    onChange={(e) => updateField('cholesterol', parseInt(e.target.value) || 0)}
                    className={formData.cholesterol >= 240 ? 'border-destructive bg-destructive/5' : ''}
                  />
                </div>
              </div>

              {/* Max Heart Rate & ST Depression */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxHeartRate">Max Heart Rate (bpm)</Label>
                  <Input
                    id="maxHeartRate"
                    type="number"
                    value={formData.maxHeartRate}
                    onChange={(e) => updateField('maxHeartRate', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stDepression">ST Depression (mm)</Label>
                  <Input
                    id="stDepression"
                    type="number"
                    step="0.1"
                    value={formData.stDepression}
                    onChange={(e) => updateField('stDepression', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Chest Pain Type */}
              <div className="space-y-2">
                <Label>Chest Pain Type</Label>
                <Select value={formData.chestPainType} onValueChange={(v) => updateField('chestPainType', v as PatientData['chestPainType'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="typical angina">Typical Angina</SelectItem>
                    <SelectItem value="atypical angina">Atypical Angina</SelectItem>
                    <SelectItem value="non-anginal">Non-Anginal Pain</SelectItem>
                    <SelectItem value="asymptomatic">Asymptomatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ST Slope */}
              <div className="space-y-2">
                <Label>ST Slope</Label>
                <Select value={formData.stSlope} onValueChange={(v) => updateField('stSlope', v as PatientData['stSlope'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upsloping">Upsloping</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="downsloping">Downsloping</SelectItem>
                  </SelectContent>
                </Select>
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
