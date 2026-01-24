import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PatientDataForm } from '@/components/dashboard/PatientDataForm';
import { RiskProbabilityCard } from '@/components/dashboard/RiskProbabilityCard';
import { FeatureImportanceCard } from '@/components/dashboard/FeatureImportanceCard';
import { ClinicalThresholdsCard } from '@/components/dashboard/ClinicalThresholdsCard';
import { ActionsCard } from '@/components/dashboard/ActionsCard';
import { PatientsPage } from '@/components/dashboard/PatientsPage';
import { ReportsPage } from '@/components/dashboard/ReportsPage';
import { SettingsPage } from '@/components/dashboard/SettingsPage';
import { PatientData, RiskResult, calculateRisk } from '@/lib/riskCalculator';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [currentPatient, setCurrentPatient] = useState<PatientData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate initial risk on mount
  useEffect(() => {
    const defaultPatient: PatientData = {
      patientId: 'PT-2024-8921',
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
    };
    setCurrentPatient(defaultPatient);
    setRiskResult(calculateRisk(defaultPatient));
  }, []);

  const handleCalculate = (data: PatientData) => {
    setIsCalculating(true);
    setCurrentPatient(data);
    // Simulate calculation delay for UX
    setTimeout(() => {
      const result = calculateRisk(data);
      setRiskResult(result);
      setIsCalculating(false);
    }, 600);
  };

  const handleSelectPatient = (patient: PatientData) => {
    setCurrentPatient(patient);
    setRiskResult(calculateRisk(patient));
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'patients':
        return <PatientsPage onSelectPatient={handleSelectPatient} />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Patient Data Form */}
            <div className="lg:col-span-4">
              <PatientDataForm 
                onCalculate={handleCalculate} 
                isCalculating={isCalculating}
                initialData={currentPatient || undefined}
              />
            </div>

            {/* Right Column - Results */}
            <div className="lg:col-span-8 space-y-6">
              {/* Risk Probability */}
              <RiskProbabilityCard result={riskResult} />

              {/* Feature Importance */}
              {riskResult && (
                <FeatureImportanceCard contributions={riskResult.featureContributions} />
              )}

              {/* Bottom Row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  {riskResult && (
                    <ClinicalThresholdsCard thresholds={riskResult.clinicalThresholds} />
                  )}
                </div>
                <div>
                  <ActionsCard result={riskResult} patient={currentPatient} />
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
