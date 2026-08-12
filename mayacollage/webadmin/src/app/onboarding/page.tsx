"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Building, Settings, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

const steps = [
  { id: 1, title: "Welcome", icon: User },
  { id: 2, title: "College Details", icon: Building },
  { id: 3, title: "Preferences", icon: Settings },
  { id: 4, title: "Finish", icon: CheckCircle },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    adminName: "",
    collegeName: "",
    timezone: "UTC",
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleFinish = () => {
    // In a real app, save onboarding data via API here
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-gray-200">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-900/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-3xl relative z-10">
        
        {/* Progress Bar Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-800 rounded-full z-0"></div>
            <motion.div 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-500 ease-in-out"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></motion.div>
            
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <motion.div 
                    initial={false}
                    animate={{
                      backgroundColor: isActive || isCompleted ? '#6366f1' : '#1f2937',
                      borderColor: isActive ? '#818cf8' : (isCompleted ? '#6366f1' : '#374151'),
                      color: isActive || isCompleted ? '#ffffff' : '#9ca3af'
                    }}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-colors duration-300`}
                  >
                    <StepIcon size={20} />
                  </motion.div>
                  <span className={`mt-2 text-xs font-medium absolute -bottom-6 w-24 text-center transition-colors ${isActive ? 'text-indigo-300' : (isCompleted ? 'text-indigo-400' : 'text-gray-500')}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl p-8 sm:p-12 min-h-[400px] flex flex-col justify-between mt-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1"
              >
                <h2 className="text-3xl font-bold text-white mb-2">Welcome to Maya ERP</h2>
                <p className="text-gray-400 mb-8">Let's set up your admin profile to get started.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Your Full Name</label>
                    <input 
                      type="text" 
                      value={formData.adminName}
                      onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                      className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="e.g. Maya Admin"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1"
              >
                <h2 className="text-3xl font-bold text-white mb-2">College Details</h2>
                <p className="text-gray-400 mb-8">Tell us about your institution.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">College/Institution Name</label>
                    <input 
                      type="text" 
                      value={formData.collegeName}
                      onChange={(e) => setFormData({...formData, collegeName: e.target.value})}
                      className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="e.g. Maya Institute of Technology"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1"
              >
                <h2 className="text-3xl font-bold text-white mb-2">System Preferences</h2>
                <p className="text-gray-400 mb-8">Configure your default settings.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Default Timezone</label>
                    <select 
                      value={formData.timezone}
                      onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                      className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                    >
                      <option value="UTC">UTC (Universal Coordinated Time)</option>
                      <option value="EST">EST (Eastern Standard Time)</option>
                      <option value="IST">IST (Indian Standard Time)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col items-center justify-center text-center"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-24 h-24 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-6"
                >
                  <CheckCircle size={48} />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">All Set!</h2>
                <p className="text-gray-400 max-w-sm mx-auto">
                  Your ERP system is configured. You can now proceed to your dashboard and manage your institution.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 pt-6 border-t border-gray-800">
            <button 
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center px-5 py-2.5 rounded-lg font-medium transition-all ${currentStep === 1 ? 'opacity-0 cursor-default' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </button>
            
            {currentStep < steps.length ? (
              <button 
                onClick={nextStep}
                className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
              >
                Continue
                <ArrowRight size={18} className="ml-2" />
              </button>
            ) : (
              <button 
                onClick={handleFinish}
                className="flex items-center px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold shadow-lg shadow-green-900/20 transition-all active:scale-95"
              >
                Go to Dashboard
                <CheckCircle size={18} className="ml-2" />
              </button>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
