"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  // Left side state
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  
  // Right side state
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    targetRole: "",
    seniority: "",
    workPreference: "",
    relocation: false,
    timeline: ""
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024,
  });

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleAnalyze = async () => {
    router.push("/processing");
  };

  const renderQuestion = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4"
          >
            <h3 className="text-xl font-medium">What role are you targeting?</h3>
            <input 
              type="text" 
              placeholder="e.g. Full Stack Engineer"
              className="bg-surface border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-accent"
              value={profile.targetRole}
              onChange={(e) => setProfile({...profile, targetRole: e.target.value})}
            />
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4"
          >
            <h3 className="text-xl font-medium">What seniority level?</h3>
            <div className="flex flex-wrap gap-2">
              {["Junior", "Mid", "Senior", "Lead"].map(level => (
                <button 
                  key={level}
                  onClick={() => setProfile({...profile, seniority: level})}
                  className={`px-4 py-2 rounded-full border ${profile.seniority === level ? 'bg-accent border-accent text-white' : 'border-gray-800 text-gray-400 hover:border-gray-600'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4"
          >
            <h3 className="text-xl font-medium">Work preference?</h3>
            <div className="flex flex-wrap gap-2">
              {["Remote", "Hybrid", "On-site"].map(pref => (
                <button 
                  key={pref}
                  onClick={() => setProfile({...profile, workPreference: pref})}
                  className={`px-4 py-2 rounded-full border ${profile.workPreference === pref ? 'bg-accent border-accent text-white' : 'border-gray-800 text-gray-400 hover:border-gray-600'}`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4"
          >
            <h3 className="text-xl font-medium">Open to relocation?</h3>
            <div className="flex items-center gap-4">
               <button 
                  onClick={() => setProfile({...profile, relocation: true})}
                  className={`px-4 py-2 rounded-full border ${profile.relocation === true ? 'bg-accent border-accent text-white' : 'border-gray-800 text-gray-400 hover:border-gray-600'}`}
                >
                  Yes
                </button>
                <button 
                  onClick={() => setProfile({...profile, relocation: false})}
                  className={`px-4 py-2 rounded-full border ${profile.relocation === false ? 'bg-accent border-accent text-white' : 'border-gray-800 text-gray-400 hover:border-gray-600'}`}
                >
                  No
                </button>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4"
          >
            <h3 className="text-xl font-medium">How soon are you looking?</h3>
            <div className="flex flex-wrap gap-2">
              {["Immediately", "1-3 months", "3-6 months", "Just exploring"].map(time => (
                <button 
                  key={time}
                  onClick={() => setProfile({...profile, timeline: time})}
                  className={`px-4 py-2 rounded-full border ${profile.timeline === time ? 'bg-accent border-accent text-white' : 'border-gray-800 text-gray-400 hover:border-gray-600'}`}
                >
                  {time}
                </button>
              ))}
            </div>
          </motion.div>
        );
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 lg:p-24">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Column - Upload */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div 
            {...getRootProps()} 
            className={`
              flex flex-col items-center justify-center p-12 text-center
              border-2 border-dashed rounded-3xl min-h-[280px] cursor-pointer
              transition-all duration-300
              ${isDragActive ? 'border-accent bg-accent/10 animate-pulse' : 'border-accent/30 hover:border-accent hover:bg-accent/5'}
            `}
          >
            <input {...getInputProps()} />
            
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle className="w-12 h-12 text-emerald" />
                <p className="text-lg font-medium text-white">{file.name}</p>
                <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB • Looks good</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-12 h-12 text-accent" />
                <h2 className="text-2xl font-semibold text-white mt-2">Drop your resume here</h2>
                <p className="text-gray-400">PDF or DOCX, max 10MB</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <button 
              onClick={() => setShowPaste(!showPaste)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              or paste resume text
            </button>
            <AnimatePresence>
              {showPaste && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <textarea 
                    className="w-full h-32 bg-surface border border-gray-800 rounded-xl p-4 text-sm focus:outline-none focus:border-accent resize-none"
                    placeholder="Paste your raw resume text here..."
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleAnalyze}
            className="w-full h-12 bg-gradient-to-r from-accent to-accent-dark rounded-xl font-medium text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-shadow flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            disabled={!file && !pastedText.trim()}
          >
            Analyze my resume <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right Column - Profiler */}
        <div className="lg:col-span-2 relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/30 to-emerald/15 pointer-events-none" style={{ padding: '1px' }}>
            <div className="absolute inset-0 bg-card rounded-2xl" />
          </div>
          
          <div className="relative p-8 h-full flex flex-col">
            <div className="flex gap-2 mb-8">
              {[0, 1, 2, 3, 4].map(i => (
                <div 
                  key={i} 
                  className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-gray-800'}`}
                />
              ))}
            </div>

            <div className="flex-1">
              <AnimatePresence mode="wait">
                {renderQuestion()}
              </AnimatePresence>
            </div>

            {step < 4 && (
              <button 
                onClick={handleNext}
                className="mt-8 flex items-center gap-2 text-accent hover:text-accent-light transition-colors font-medium self-end"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
