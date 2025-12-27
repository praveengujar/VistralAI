'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Globe,
  Package,
  Users,
  CheckCircle2,
  Sparkles,
  Plus,
  X,
  Rocket
} from 'lucide-react';
import { ROUTES, BRAND_CATEGORIES } from '@/lib/constants';

const STORY_STEPS = [
  { id: 1, title: 'Identity', label: 'Where Does Your Brand Live?', icon: Globe },
  { id: 2, title: 'Offerings', label: 'What Do You Offer?', icon: Package },
  { id: 3, title: 'Landscape', label: 'Who Shares Your Stage?', icon: Users },
  { id: 4, title: 'Review', label: 'Your Brand Story', icon: CheckCircle2 },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const { data: session } = useSession();

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [direction, setDirection] = useState(1);

  const [formData, setFormData] = useState({
    brandName: '',
    domain: '',
    category: BRAND_CATEGORIES[0],
    products: [] as string[],
    competitors: [] as string[],
  });

  const [productInput, setProductInput] = useState('');
  const [competitorInput, setCompetitorInput] = useState('');

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep(prev => prev - 1);
  };

  const addProduct = () => {
    if (productInput.trim()) {
      updateFormData({ products: [...formData.products, productInput.trim()] });
      setProductInput('');
    }
  };

  const addCompetitor = () => {
    if (competitorInput.trim()) {
      updateFormData({ competitors: [...formData.competitors, competitorInput.trim()] });
      setCompetitorInput('');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/brand-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          brandName: formData.brandName,
          domain: formData.domain,
          category: formData.category,
          competitors: formData.competitors,
          products: formData.products,
        }),
      });

      if (!response.ok) throw new Error('Failed to create profile');

      setTimeout(() => {
        router.push(ROUTES.DASHBOARD);
      }, 1500);

    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 40 : -40,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 40 : -40,
      opacity: 0
    })
  };

  // Welcome Screen
  if (currentStep === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4 leading-tight">
            Welcome to Your Brand&apos;s<br />
            <span className="text-gradient">AI Command Center</span>
          </h1>
          <p className="text-xl text-secondary-500 mb-12 leading-relaxed max-w-lg mx-auto">
            Let&apos;s secure your place in the AI era. We&apos;ll start by mapping your brand&apos;s digital DNA so AI platforms can tell your story correctly.
          </p>
          <button
            onClick={handleNext}
            className="btn-primary btn-xl group"
          >
            Begin Transformation
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex justify-between mb-4">
          {STORY_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i + 1 === currentStep;
            const isCompleted = i + 1 < currentStep;
            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl mb-2 transition-all duration-300 ${
                  isActive ? 'bg-primary-600 text-white shadow-glow' :
                  isCompleted ? 'bg-success-500 text-white' :
                  'bg-secondary-100 text-secondary-400'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider hidden sm:block ${
                  isActive ? 'text-primary-600' : isCompleted ? 'text-success-600' : 'text-secondary-400'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
        <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-600 to-primary-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / STORY_STEPS.length) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Steps Content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="card p-8 md:p-10"
        >
          {/* Step 1: Identity */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-7 h-7 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-secondary-900">Where Does Your Brand Live?</h2>
                <p className="text-secondary-500 mt-1">Enter your primary digital home.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="label">Brand Name</label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => updateFormData({ brandName: e.target.value })}
                    className="input"
                    placeholder="e.g. Acme Corp"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Website URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Globe className="w-5 h-5 text-secondary-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) => updateFormData({ domain: e.target.value })}
                      className="input pl-11"
                      placeholder="acme.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Industry Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateFormData({ category: e.target.value as any })}
                    className="input"
                  >
                    {BRAND_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Offerings */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-accent-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-7 h-7 text-accent-600" />
                </div>
                <h2 className="text-2xl font-bold text-secondary-900">What Do You Offer?</h2>
                <p className="text-secondary-500 mt-1">List your key products or services (top 3-5).</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productInput}
                    onChange={(e) => setProductInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct())}
                    className="input flex-1"
                    placeholder="Add a product (e.g. Cloud Hosting)"
                    autoFocus
                  />
                  <button
                    onClick={addProduct}
                    className="btn-primary btn-md px-4"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[120px] p-4 bg-secondary-50 rounded-xl border border-secondary-100">
                  {formData.products.length === 0 && (
                    <span className="text-secondary-400 text-sm w-full text-center py-8">No products added yet</span>
                  )}
                  {formData.products.map((p, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-secondary-200 text-sm font-medium text-secondary-700 shadow-sm"
                    >
                      {p}
                      <button
                        onClick={() => updateFormData({ products: formData.products.filter((_, idx) => idx !== i) })}
                        className="text-secondary-400 hover:text-error-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Landscape */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-warning-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-warning-600" />
                </div>
                <h2 className="text-2xl font-bold text-secondary-900">Who Shares Your Stage?</h2>
                <p className="text-secondary-500 mt-1">Identify competitors AI might compare you with.</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                    className="input flex-1"
                    placeholder="Add a competitor"
                    autoFocus
                  />
                  <button
                    onClick={addCompetitor}
                    className="btn-primary btn-md px-4"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[120px] p-4 bg-secondary-50 rounded-xl border border-secondary-100">
                  {formData.competitors.length === 0 && (
                    <span className="text-secondary-400 text-sm w-full text-center py-8">No competitors added yet</span>
                  )}
                  {formData.competitors.map((c, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-secondary-200 text-sm font-medium text-secondary-700 shadow-sm"
                    >
                      {c}
                      <button
                        onClick={() => updateFormData({ competitors: formData.competitors.filter((_, idx) => idx !== i) })}
                        className="text-secondary-400 hover:text-error-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-success-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-success-600" />
                </div>
                <h2 className="text-2xl font-bold text-secondary-900">Your Brand Story, Verified</h2>
                <p className="text-secondary-500 mt-1">Ready to take control of your AI narrative?</p>
              </div>

              <div className="bg-secondary-50 rounded-xl divide-y divide-secondary-100 overflow-hidden">
                <div className="flex justify-between items-center p-5">
                  <div>
                    <span className="badge-secondary text-2xs uppercase mb-1">Brand Identity</span>
                    <p className="font-semibold text-secondary-900 text-lg">{formData.brandName}</p>
                    <p className="text-sm text-secondary-500">{formData.domain}</p>
                  </div>
                  <button onClick={() => setCurrentStep(1)} className="btn-ghost btn-sm text-primary-600">Edit</button>
                </div>

                <div className="flex justify-between items-center p-5">
                  <div>
                    <span className="badge-secondary text-2xs uppercase mb-1">Category</span>
                    <p className="font-medium text-secondary-900">{formData.category}</p>
                  </div>
                  <button onClick={() => setCurrentStep(1)} className="btn-ghost btn-sm text-primary-600">Edit</button>
                </div>

                <div className="flex justify-between items-center p-5">
                  <div>
                    <span className="badge-secondary text-2xs uppercase mb-1">Offerings</span>
                    <p className="font-medium text-secondary-900">{formData.products.length} Products Listed</p>
                  </div>
                  <button onClick={() => setCurrentStep(2)} className="btn-ghost btn-sm text-primary-600">Edit</button>
                </div>

                <div className="flex justify-between items-center p-5">
                  <div>
                    <span className="badge-secondary text-2xs uppercase mb-1">Competition</span>
                    <p className="font-medium text-secondary-900">{formData.competitors.length} Competitors Tracked</p>
                  </div>
                  <button onClick={() => setCurrentStep(3)} className="btn-ghost btn-sm text-primary-600">Edit</button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-10 flex justify-between items-center pt-6 border-t border-secondary-100">
            <button
              onClick={handleBack}
              className="btn-ghost btn-md group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>

            {currentStep === 4 ? (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary btn-lg group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="spinner-sm border-white/30 border-t-white" />
                    Launching...
                  </div>
                ) : (
                  <>
                    Launch Command Center
                    <Rocket className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentStep === 1 && (!formData.brandName || !formData.domain)}
                className="btn-primary btn-lg group"
              >
                Continue
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
