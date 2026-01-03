import React, { useState } from 'react';

const OnboardingFlowDiagram = () => {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      step: 1,
      name: 'Brand Setup',
      color: '#3B82F6',
      icon: '🌐',
      actions: [
        'User enters website URL',
        'POST /api/onboarding/brand',
        'Start Magic Import',
        'WebSocket: progress updates',
        'Create Brand360Profile',
        'Mark step 1 complete'
      ]
    },
    {
      step: 2,
      name: 'Choose Plan',
      color: '#8B5CF6',
      icon: '📋',
      actions: [
        'Select tier (Monitor/Growth/Dominance)',
        'Select billing cycle',
        'POST /api/onboarding/plan',
        'Save plan selection',
        'Mark step 2 complete'
      ]
    },
    {
      step: 3,
      name: 'Payment',
      color: '#10B981',
      icon: '💳',
      actions: [
        'POST /api/payments/stripe/create-setup-intent',
        'Get clientSecret from Stripe',
        'Enter payment / Apple Pay',
        'confirmSetup(elements)',
        'POST /api/onboarding/payment',
        'Create subscription (15-day trial)',
        'Mark step 3 complete'
      ]
    },
    {
      step: 4,
      name: 'First Scan',
      color: '#F59E0B',
      icon: '🔍',
      actions: [
        'Click "Start Scan" or "Skip"',
        'POST /api/aeo/perception-scan',
        'Scan started (optional)',
        'Mark step 4 complete'
      ]
    },
    {
      step: 5,
      name: 'Complete',
      color: '#EC4899',
      icon: '🎉',
      actions: [
        'POST /api/onboarding/complete',
        'Mark onboarding complete',
        'Redirect to dashboard'
      ]
    }
  ];

  const currentStep = steps.find(s => s.step === activeStep);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0A0A12 0%, #12121F 50%, #0A0A12 100%)', padding: '40px 24px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 8px 0' }}>Unified Onboarding Flow</h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>5-step guided setup with Magic Import</p>
      </div>

      {/* Step Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {steps.map((step, idx) => (
          <React.Fragment key={step.step}>
            <button
              onClick={() => setActiveStep(step.step)}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: activeStep === step.step ? `3px solid ${step.color}` : '2px solid #334155',
                background: activeStep === step.step ? `${step.color}20` : '#1A1F2E',
                color: activeStep === step.step ? step.color : '#64748B',
                fontWeight: '700',
                fontSize: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: activeStep === step.step ? `0 4px 16px ${step.color}40` : 'none'
              }}
            >
              {step.icon}
            </button>
            {idx < steps.length - 1 && (
              <div style={{ width: '40px', height: '3px', background: idx < activeStep - 1 ? '#10B981' : '#334155', borderRadius: '2px' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Labels */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {steps.map((step) => (
          <div key={step.step} style={{ textAlign: 'center', opacity: activeStep === step.step ? 1 : 0.5 }}>
            <div style={{ color: step.color, fontSize: '11px', fontWeight: '600', letterSpacing: '1px' }}>STEP {step.step}</div>
            <div style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: '500' }}>{step.name}</div>
          </div>
        ))}
      </div>

      {/* Current Step Detail */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: '#1A1F2E', borderRadius: '16px', border: `2px solid ${currentStep.color}`, overflow: 'hidden', boxShadow: `0 8px 32px ${currentStep.color}20` }}>
          <div style={{ background: `${currentStep.color}20`, padding: '18px 24px', borderBottom: `1px solid ${currentStep.color}40`, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: currentStep.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{currentStep.icon}</div>
            <div>
              <div style={{ color: currentStep.color, fontSize: '11px', fontWeight: '600', letterSpacing: '1px' }}>STEP {currentStep.step}</div>
              <div style={{ color: '#F8FAFC', fontSize: '18px', fontWeight: '700' }}>{currentStep.name}</div>
            </div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentStep.actions.map((action, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#0F172A', borderRadius: '10px', borderLeft: `3px solid ${currentStep.color}` }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${currentStep.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentStep.color, fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>{idx + 1}</div>
                  <span style={{ color: '#E2E8F0', fontSize: '13px' }}>{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Flow Summary */}
      <div style={{ maxWidth: '900px', margin: '40px auto 0', background: '#1A1F2E', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
        <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '14px' }}>FLOW SUMMARY</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {steps.map((step, idx) => (
            <React.Fragment key={step.step}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${step.color}20`, border: `2px solid ${step.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{step.icon}</div>
                <span style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '500' }}>{step.name}</span>
              </div>
              {idx < steps.length - 1 && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlowDiagram;
