"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Circle, Brain } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Processing() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { id: "parsing", label: "Parsing resume..." },
    { id: "scoring", label: "Computing health score..." },
    { id: "extracting_skills", label: "Extracting skills & strengths..." },
    { id: "finding_jobs", label: "Finding matched jobs..." },
    { id: "complete", label: "Building your battle plan..." },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get("taskId");
    const userId = params.get("userId") || "demo-user";

    if (!taskId) {
      let current = 0;
      const interval = setInterval(() => {
        current++;
        if (current <= steps.length) {
          setCurrentStep(current - 1);
          setProgress((current / steps.length) * 100);
        }
        if (current === steps.length) {
          clearInterval(interval);
          setTimeout(() => {
            router.push(`/results/${userId}`);
          }, 1500);
        }
      }, 2000);
      return () => clearInterval(interval);
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resume/${taskId}`);
        const data = await res.json();
        
        if (data.success) {
          const status = data.data.status;
          const prog = data.data.progress;
          const stepName = data.data.step;
          
          if (prog > progress) setProgress(prog);
          
          const stepIndex = steps.findIndex(s => s.id === stepName);
          if (stepIndex !== -1) {
            setCurrentStep(stepIndex);
          }
          
          if (status === "complete") {
            setCurrentStep(steps.length);
            setProgress(100);
            clearInterval(interval);
            setTimeout(() => {
              router.push(`/results/${userId}?taskId=${taskId}`);
            }, 1500);
          } else if (status === "failed") {
            clearInterval(interval);
            alert("Processing failed: " + data.data.error);
            router.push("/");
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-background">
      <div className="flex flex-col items-center max-w-md w-full z-10">
        
        <div className="w-48 h-48 mb-8 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-accent/20 rounded-full blur-3xl animate-pulse" />
          <Brain className="w-24 h-24 text-accent relative z-10" />
        </div>

        <h2 className="text-xl font-medium text-white mb-12 h-8 flex items-center">
          {steps[currentStep]?.label || "Complete!"}
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="ml-1"
          >_</motion.span>
        </h2>

        <div className="w-full space-y-6">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            
            return (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 ${isActive ? 'text-white' : isCompleted ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {isCompleted ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle className="w-6 h-6 text-emerald" />
                  </motion.div>
                ) : isActive ? (
                  <div className="w-6 h-6 rounded-full border-2 border-accent flex items-center justify-center relative">
                    <div className="w-2 h-2 rounded-full bg-accent animate-ping absolute" />
                    <div className="w-2 h-2 rounded-full bg-accent relative" />
                  </div>
                ) : (
                  <Circle className="w-6 h-6" />
                )}
                <span className="text-lg">{step.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-surface">
        <motion.div 
          className="h-full bg-gradient-to-r from-accent to-accent-light"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </main>
  );
}
