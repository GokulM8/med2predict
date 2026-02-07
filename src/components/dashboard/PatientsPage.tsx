import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Search, Eye, Trash2, AlertTriangle, CheckCircle, AlertCircle, Edit3, Download } from 'lucide-react';
import { PatientData, RiskResult, calculateRiskML, generatePatientId } from '@/lib/riskCalculator';
import { listPatientsApi, deletePatientApi, savePatientApi, updatePatientApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { validatePatientData } from '@/lib/validation';

interface SavedPatient {
  data: PatientData;
  result?: RiskResult;
  savedAt: Date;
}

interface PatientsPageProps {
  onSelectPatient: (patient: PatientData) => void;
}

// Sample patients from UCI dataset patterns (results filled via ML on mount)
const samplePatients: SavedPatient[] = [
  {
    data: { patientName: 'Alice Carter', patientId: 'PT-2024-001', age: 63, sex: 'M', chestPainType: 'typical_angina', restingBP: 145, cholesterol: 233, fastingBloodSugar: true, restingECG: 'lvh', maxHeartRate: 150, exerciseAngina: false, stDepression: 2.3, stSlope: 'downsloping', ca: 0, thal: 'normal' },
    savedAt: new Date('2024-01-15'),
  },
  {
    data: { patientName: 'Brian Kelly', patientId: 'PT-2024-002', age: 67, sex: 'M', chestPainType: 'asymptomatic', restingBP: 160, cholesterol: 286, fastingBloodSugar: false, restingECG: 'lvh', maxHeartRate: 108, exerciseAngina: true, stDepression: 1.5, stSlope: 'flat', ca: 0, thal: 'normal' },
    savedAt: new Date('2024-01-18'),
  },
  {
    data: { patientName: 'Clara Morris', patientId: 'PT-2024-003', age: 41, sex: 'F', chestPainType: 'atypical_angina', restingBP: 130, cholesterol: 204, fastingBloodSugar: false, restingECG: 'lvh', maxHeartRate: 172, exerciseAngina: false, stDepression: 1.4, stSlope: 'upsloping', ca: 0, thal: 'normal' },
    savedAt: new Date('2024-01-20'),
  },
  {
    data: { patientName: 'Daniel Singh', patientId: 'PT-2024-004', age: 56, sex: 'M', chestPainType: 'asymptomatic', restingBP: 120, cholesterol: 236, fastingBloodSugar: false, restingECG: 'normal', maxHeartRate: 178, exerciseAngina: false, stDepression: 0.8, stSlope: 'upsloping', ca: 0, thal: 'normal' },
    savedAt: new Date('2024-01-22'),
  },
  {
    data: { patientName: 'Emily Zhao', patientId: 'PT-2024-005', age: 62, sex: 'F', chestPainType: 'asymptomatic', restingBP: 140, cholesterol: 268, fastingBloodSugar: false, restingECG: 'lvh', maxHeartRate: 160, exerciseAngina: false, stDepression: 3.6, stSlope: 'downsloping', ca: 0, thal: 'normal' },
    savedAt: new Date('2024-01-23'),
  },
];

export function PatientsPage({ onSelectPatient }: PatientsPageProps) {
  const [patients, setPatients] = useState<SavedPatient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<SavedPatient | null>(null);
  const [editData, setEditData] = useState<PatientData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadPatients = async () => {
      try {
        const stored = await listPatientsApi();
        if (isMounted && stored.length > 0) {
          // Map stored records to SavedPatient view model
          setPatients(
            stored.map((r: Record<string, unknown>) => ({
              data: { ...r.data as Record<string, unknown>, patientName: (r.data as Record<string, unknown>)?.patientName || 'Unnamed Patient' },
              result: r.result,
              savedAt: new Date(r.savedAt as number),
            }))
          );
          return;
        }

        // Fallback: seed sample patients and persist once
        const withResults = await Promise.all(
          samplePatients.map(async (patient) => ({
            ...patient,
            result: await calculateRiskML(patient.data),
          }))
        );
        // Save seeds
        await Promise.all(withResults.map(p => savePatientApi({ patientId: p.data.patientId, data: p.data, result: p.result })));
        if (isMounted) setPatients(withResults);
      } catch (error) {
        console.error('Failed to load patients:', error);
        if (isMounted) setPatients(samplePatients);
      }
    };

    loadPatients();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.data.patientId.toLowerCase().includes(term) ||
      (p.data.patientName || '').toLowerCase().includes(term) ||
      p.data.sex.toLowerCase().includes(term)
    );
  });

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

  const handleDelete = async (patientId: string) => {
    const prev = patients;
    setPatients(prev.filter(p => p.data.patientId !== patientId));
    try {
      await deletePatientApi(patientId);
      toast({ title: 'Patient deleted', description: `Record ${patientId} removed.` });
    } catch (err) {
      setPatients(prev);
      toast({ title: 'Delete failed', description: 'Could not delete patient, reverting.', variant: 'destructive' });
    }
  };

  const startEdit = (patient: SavedPatient) => {
    setEditData({ ...patient.data });
  };

  const updateEditField = <K extends keyof PatientData>(field: K, value: PatientData[K]) => {
    setEditData(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  const saveEdit = async () => {
    if (!editData) return;
    const validation = validatePatientData(editData);
    if ('success' in validation && !validation.success) {
      toast({ title: 'Validation Error', description: 'Please correct invalid fields before saving.', variant: 'destructive' });
      return;
    }
    const prevPatients = patients;
    const result = await calculateRiskML(editData);
    const optimistic: SavedPatient = { data: editData, result, savedAt: new Date() };
    setPatients(prev => prev.map(p => p.data.patientId === editData.patientId ? optimistic : p));
    try {
      await updatePatientApi(editData.patientId, { data: editData, result });
      toast({ title: 'Patient Updated', description: `Record ${editData.patientId} updated.` });
      setEditData(null);
    } catch (err) {
      setPatients(prevPatients);
      toast({ title: 'Save failed', description: 'Could not save changes, reverting.', variant: 'destructive' });
    }
  };

  const exportCsv = async () => {
    // gather latest from backend to ensure consistency
    const stored = await listPatientsApi();
    const rows = stored.map(r => ({
      patientName: r.data.patientName || '',
      patientId: r.patientId,
      age: r.data.age,
      sex: r.data.sex,
      chestPainType: r.data.chestPainType,
      restingBP: r.data.restingBP,
      cholesterol: r.data.cholesterol,
      fastingBloodSugar: r.data.fastingBloodSugar,
      restingECG: r.data.restingECG,
      maxHeartRate: r.data.maxHeartRate,
      exerciseAngina: r.data.exerciseAngina,
      stDepression: r.data.stDepression,
      stSlope: r.data.stSlope,
      ca: r.data.ca ?? '',
      thal: r.data.thal ?? '',
      probability: r.result ? Math.round(r.result.probability * 100) : '',
      riskLevel: r.result?.riskLevel ?? '',
      savedAt: new Date(r.savedAt).toISOString(),
    }));

    const header = Object.keys(rows[0] ?? { patientId: '', age: '', sex: '' }).join(',');
    const csv = [header, ...rows.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Exported CSV', description: `Exported ${rows.length} records.` });
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
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
                <TableHead>Name</TableHead>
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
                  <TableCell>{patient.data.patientName || 'Unnamed Patient'}</TableCell>
                  <TableCell>{patient.data.age} yrs</TableCell>
                  <TableCell>{patient.data.sex}</TableCell>
                  <TableCell>
                    {patient.result ? (
                      <Badge variant="outline" className={getRiskBadgeClass(patient.result.riskLevel)}>
                        {getRiskIcon(patient.result.riskLevel)}
                        <span className="ml-1">{patient.result.riskLevel}</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={getRiskBadgeClass('Low')}>
                        <span className="ml-1">Calculating...</span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{patient.result ? `${Math.round(patient.result.probability * 100)}%` : '—'}</TableCell>
                  <TableCell>{patient.savedAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog open={!!editData && editData.patientId === patient.data.patientId} onOpenChange={(open) => !open && setEditData(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => startEdit(patient)}>
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Patient - {editData?.patientName || editData?.patientId}</DialogTitle>
                          </DialogHeader>
                          {editData && (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div className="space-y-2">
                                <label className="text-sm">Patient Name</label>
                                <Input value={editData.patientName || ''} onChange={e => updateEditField('patientName', e.target.value)} />
                                <label className="text-sm">Age</label>
                                <Input type="number" value={editData.age} onChange={e => updateEditField('age', parseInt(e.target.value) || 0)} />
                                <label className="text-sm">Gender</label>
                                <Input value={editData.sex} onChange={e => updateEditField('sex', e.target.value as PatientData['sex'])} />
                                <label className="text-sm">Resting BP</label>
                                <Input type="number" value={editData.restingBP} onChange={e => updateEditField('restingBP', parseInt(e.target.value) || 0)} />
                                <label className="text-sm">Cholesterol</label>
                                <Input type="number" value={editData.cholesterol} onChange={e => updateEditField('cholesterol', parseInt(e.target.value) || 0)} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm">Max Heart Rate</label>
                                <Input type="number" value={editData.maxHeartRate} onChange={e => updateEditField('maxHeartRate', parseInt(e.target.value) || 0)} />
                                <label className="text-sm">ST Depression</label>
                                <Input type="number" step="0.1" value={editData.stDepression} onChange={e => updateEditField('stDepression', parseFloat(e.target.value) || 0)} />
                                <label className="text-sm">Chest Pain Type</label>
                                <Input value={editData.chestPainType} onChange={e => updateEditField('chestPainType', e.target.value as PatientData['chestPainType'])} />
                                <label className="text-sm">ST Slope</label>
                                <Input value={editData.stSlope} onChange={e => updateEditField('stSlope', e.target.value as PatientData['stSlope'])} />
                              </div>
                            </div>
                          )}
                          <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditData(null)}>Cancel</Button>
                            <Button onClick={saveEdit}>Save Changes</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedPatient(patient)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Patient Details - {patient.data.patientName || patient.data.patientId}</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <p><span className="font-medium">Name:</span> {patient.data.patientName || 'Unnamed Patient'}</p>
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
                            {patient.result ? (
                              <>
                                <Badge variant="outline" className={getRiskBadgeClass(patient.result.riskLevel)}>
                                  {patient.result.riskLevel} Risk - {Math.round(patient.result.probability * 100)}%
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-2">{patient.result.interpretation}</p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">Calculating risk with ML model...</p>
                            )}
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
