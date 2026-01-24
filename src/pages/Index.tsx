import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PatientDataForm } from '@/components/dashboard/PatientDataForm';
import { RiskProbabilityCard } from '@/components/dashboard/RiskProbabilityCard';
import { FeatureImportanceCard } from '@/components/dashboard/FeatureImportanceCard';
import { ClinicalThresholdsCard } from '@/components/dashboard/ClinicalThresholdsCard';
import { ActionsCard } from '@/components/dashboard/ActionsCard';
import { PatientData, RiskResult, calculateRisk } from '@/lib/riskCalculator';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
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
    setRiskResult(calculateRisk(defaultPatient));
  }, []);

  const handleCalculate = (data: PatientData) => {
    setIsCalculating(true);
    // Simulate calculation delay for UX
    setTimeout(() => {
      const result = calculateRisk(data);
      setRiskResult(result);
      setIsCalculating(false);
    }, 600);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Patient Data Form */}
            <div className="lg:col-span-4">
              <PatientDataForm onCalculate={handleCalculate} isCalculating={isCalculating} />
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
                  <ActionsCard />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
