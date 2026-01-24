import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Search, Plus, Eye, Trash2, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { PatientData, RiskResult, calculateRisk, generatePatientId } from '@/lib/riskCalculator';

interface SavedPatient {
  data: PatientData;
  result: RiskResult;
  savedAt: Date;
}

interface PatientsPageProps {
  onSelectPatient: (patient: PatientData) => void;
}

// Sample patients from UCI dataset patterns
const samplePatients: SavedPatient[] = [
  {
    data: { patientId: 'PT-2024-001', age: 63, sex: 'Male', chestPainType: 'typical angina', restingBP: 145, cholesterol: 233, fastingBloodSugar: true, restingECG: 'lv hypertrophy', maxHeartRate: 150, exerciseAngina: false, stDepression: 2.3, stSlope: 'downsloping' },
    result: calculateRisk({ patientId: 'PT-2024-001', age: 63, sex: 'Male', chestPainType: 'typical angina', restingBP: 145, cholesterol: 233, fastingBloodSugar: true, restingECG: 'lv hypertrophy', maxHeartRate: 150, exerciseAngina: false, stDepression: 2.3, stSlope: 'downsloping' }),
    savedAt: new Date('2024-01-15'),
  },
  {
    data: { patientId: 'PT-2024-002', age: 67, sex: 'Male', chestPainType: 'asymptomatic', restingBP: 160, cholesterol: 286, fastingBloodSugar: false, restingECG: 'lv hypertrophy', maxHeartRate: 108, exerciseAngina: true, stDepression: 1.5, stSlope: 'flat' },
    result: calculateRisk({ patientId: 'PT-2024-002', age: 67, sex: 'Male', chestPainType: 'asymptomatic', restingBP: 160, cholesterol: 286, fastingBloodSugar: false, restingECG: 'lv hypertrophy', maxHeartRate: 108, exerciseAngina: true, stDepression: 1.5, stSlope: 'flat' }),
    savedAt: new Date('2024-01-18'),
  },
  {
    data: { patientId: 'PT-2024-003', age: 41, sex: 'Female', chestPainType: 'atypical angina', restingBP: 130, cholesterol: 204, fastingBloodSugar: false, restingECG: 'lv hypertrophy', maxHeartRate: 172, exerciseAngina: false, stDepression: 1.4, stSlope: 'upsloping' },
    result: calculateRisk({ patientId: 'PT-2024-003', age: 41, sex: 'Female', chestPainType: 'atypical angina', restingBP: 130, cholesterol: 204, fastingBloodSugar: false, restingECG: 'lv hypertrophy', maxHeartRate: 172, exerciseAngina: false, stDepression: 1.4, stSlope: 'upsloping' }),
    savedAt: new Date('2024-01-20'),
  },
  {
    data: { patientId: 'PT-2024-004', age: 56, sex: 'Male', chestPainType: 'asymptomatic', restingBP: 120, cholesterol: 236, fastingBloodSugar: false, restingECG: 'normal', maxHeartRate: 178, exerciseAngina: false, stDepression: 0.8, stSlope: 'upsloping' },
    result: calculateRisk({ patientId: 'PT-2024-004', age: 56, sex: 'Male', chestPainType: 'asymptomatic', restingBP: 120, cholesterol: 236, fastingBloodSugar: false, restingECG: 'normal', maxHeartRate: 178, exerciseAngina: false, stDepression: 0.8, stSlope: 'upsloping' }),
    savedAt: new Date('2024-01-22'),
  },
  {
    data: { patientId: 'PT-2024-005', age: 62, sex: 'Female', chestPainType: 'asymptomatic', restingBP: 140, cholesterol: 268, fastingBloodSugar: false, restingECG: 'lv hypertrophy', maxHeartRate: 160, exerciseAngina: false, stDepression: 3.6, stSlope: 'downsloping' },
    result: calculateRisk({ patientId: 'PT-2024-005', age: 62, sex: 'Female', chestPainType: 'asymptomatic', restingBP: 140, cholesterol: 268, fastingBloodSugar: false, restingECG: 'lv hypertrophy', maxHeartRate: 160, exerciseAngina: false, stDepression: 3.6, stSlope: 'downsloping' }),
    savedAt: new Date('2024-01-23'),
  },
];

export function PatientsPage({ onSelectPatient }: PatientsPageProps) {
  const [patients, setPatients] = useState<SavedPatient[]>(samplePatients);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<SavedPatient | null>(null);

  const filteredPatients = patients.filter(p => 
    p.data.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.data.sex.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'High': return <AlertTriangle className="w-4 h-4" />;
      case 'Medium': return <AlertCircle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case 'High': return 'bg-risk-high/10 text-risk-high border-risk-high/20';
      case 'Medium': return 'bg-risk-medium/10 text-risk-medium border-risk-medium/20';
      default: return 'bg-risk-low/10 text-risk-low border-risk-low/20';
    }
  };

  const handleDelete = (patientId: string) => {
    setPatients(prev => prev.filter(p => p.data.patientId !== patientId));
  };

  const handleViewInDashboard = (patient: SavedPatient) => {
    onSelectPatient(patient.data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patient Records</h2>
          <p className="text-muted-foreground">Manage and review patient risk assessments</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New Patient
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              All Patients ({patients.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Probability</TableHead>
                <TableHead>Assessment Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.data.patientId}>
                  <TableCell className="font-medium">{patient.data.patientId}</TableCell>
                  <TableCell>{patient.data.age} yrs</TableCell>
                  <TableCell>{patient.data.sex}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRiskBadgeClass(patient.result.riskLevel)}>
                      {getRiskIcon(patient.result.riskLevel)}
                      <span className="ml-1">{patient.result.riskLevel}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>{Math.round(patient.result.probability * 100)}%</TableCell>
                  <TableCell>{patient.savedAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedPatient(patient)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Patient Details - {patient.data.patientId}</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <p><span className="font-medium">Age:</span> {patient.data.age} years</p>
                              <p><span className="font-medium">Gender:</span> {patient.data.sex}</p>
                              <p><span className="font-medium">Resting BP:</span> {patient.data.restingBP} mmHg</p>
                              <p><span className="font-medium">Cholesterol:</span> {patient.data.cholesterol} mg/dL</p>
                              <p><span className="font-medium">Max Heart Rate:</span> {patient.data.maxHeartRate} bpm</p>
                            </div>
                            <div className="space-y-2">
                              <p><span className="font-medium">Chest Pain:</span> {patient.data.chestPainType}</p>
                              <p><span className="font-medium">ST Depression:</span> {patient.data.stDepression} mm</p>
                              <p><span className="font-medium">ST Slope:</span> {patient.data.stSlope}</p>
                              <p><span className="font-medium">Exercise Angina:</span> {patient.data.exerciseAngina ? 'Yes' : 'No'}</p>
                              <p><span className="font-medium">Fasting BS &gt; 120:</span> {patient.data.fastingBloodSugar ? 'Yes' : 'No'}</p>
                            </div>
                          </div>
                          <div className="mt-4 p-4 rounded-lg bg-muted">
                            <p className="font-medium mb-2">Risk Assessment Result:</p>
                            <Badge variant="outline" className={getRiskBadgeClass(patient.result.riskLevel)}>
                              {patient.result.riskLevel} Risk - {Math.round(patient.result.probability * 100)}%
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-2">{patient.result.interpretation}</p>
                          </div>
                          <Button className="mt-4" onClick={() => handleViewInDashboard(patient)}>
                            View in Dashboard
                          </Button>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(patient.data.patientId)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
