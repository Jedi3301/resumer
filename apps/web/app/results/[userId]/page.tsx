"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import 'react-circular-progressbar/dist/styles.css';
import { Target, Zap, Briefcase, ChevronRight, X, ExternalLink, MapPin, Calendar, AlertCircle, Clock, BookOpen, Star, User, Plus, Loader2, Check } from "lucide-react";
import Link from "next/link";

// --- DEFAULT FALLBACK DATA ---
const defaultData = {
  healthScore: {
    total: 78,
    formatting: 15,
    keyword_density: 18,
    quantified_impact: 12,
    ats_compatibility: 20,
    readability: 13,
    flags: ["Add more numbers and metrics to your bullets", "Bullet points are slightly long, aim for 15-20 words"],
    strengths: ["Clear and complete section formatting", "Strong use of action verbs"]
  },
  strengths: {
    top_strengths: [
      { title: "Distributed Systems", description: "Experience building resilient microservices", market_demand: "High" },
      { title: "React Performance", description: "Optimized complex frontends for speed", market_demand: "High" },
      { title: "Team Leadership", description: "Mentored 3 junior developers", market_demand: "Medium" }
    ],
    elevator_pitch: "I am a full-stack engineer with a strong focus on distributed systems and React performance. I have a track record of mentoring junior developers and driving technical excellence."
  },
  roles: [
    { title: "Senior Full Stack Engineer", fit_score: 0.92, avg_salary_usd: 160000 },
    { title: "Backend Engineer", fit_score: 0.88, avg_salary_usd: 155000 },
    { title: "Frontend Engineer", fit_score: 0.85, avg_salary_usd: 145000 },
    { title: "Lead Developer", fit_score: 0.75, avg_salary_usd: 180000 },
    { title: "Solutions Architect", fit_score: 0.65, avg_salary_usd: 190000 }
  ],
  skills: {
    confirmed_high: ["JavaScript", "TypeScript", "React", "Node.js", "Python"],
    confirmed_med: ["Docker", "AWS", "SQL"],
    inferred: ["Kubernetes", "GraphQL", "System Design"],
    missing: ["Rust", "Go"]
  },
  jobs: [
    { id: "1", title: "Senior Software Engineer", company: "Stripe", location: "San Francisco, CA (Hybrid)", posted: "2 days ago", match_score: 92, stale: false, missing_skills: [{ skill: "Go", severity: "critical", hours: 15 }] },
    { id: "2", title: "Full Stack Developer", company: "Vercel", location: "Remote", posted: "5 days ago", match_score: 88, stale: false, missing_skills: [{ skill: "Rust", severity: "important", hours: 20 }] },
    { id: "3", title: "Backend Engineer", company: "Meta", location: "Menlo Park, CA (On-site)", posted: "16 days ago", match_score: 82, stale: true, missing_skills: [{ skill: "System Design", severity: "critical", hours: 30 }] }
  ]
};

// Map backend agent result format to our UI format
const mapBackendData = (backend: any) => {
  return {
    healthScore: backend.health_score,
    strengths: {
      top_strengths: backend.agent_result?.skills_data?.top_strengths || [],
      elevator_pitch: backend.agent_result?.skills_data?.elevator_pitch || "No pitch generated.",
    },
    roles: backend.agent_result?.roles_data?.suggested_roles || [],
    skills: {
      confirmed_high: backend.agent_result?.skills_data?.confirmed_high || [],
      confirmed_med: backend.agent_result?.skills_data?.confirmed_med || [],
      inferred: backend.agent_result?.skills_data?.inferred || [],
      missing: backend.agent_result?.skills_data?.missing || [],
    },
    jobs: backend.jobs || [],
  };
};

// --- COMPONENTS ---
const ScoreBar = ({ label, score }: { label: string, score: number }) => (
  <div className="flex flex-col gap-1 mb-3">
    <div className="flex justify-between text-xs text-gray-400">
      <span>{label}</span>
      <span className="font-mono">{score}/20</span>
    </div>
    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${(score/20)*100}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="h-full bg-accent"
      />
    </div>
  </div>
);

export default function ResultsDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [data, setData] = useState(defaultData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get("taskId");

    if (!taskId) {
      // Use fallback mock data if no taskId
      setIsLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/resume/${taskId}`);
        const result = await res.json();
        if (result.success && result.data?.data) {
           setData(mapBackendData(result.data.data));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResult();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const openDrawer = (job: any) => {
    setSelectedJob(job);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-white pb-24">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-accent" />
          <span className="font-semibold text-lg tracking-tight">JobCopilot</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium hover:text-accent transition-colors">
            New analysis
          </Link>
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
            <p>Loading your results...</p>
          </div>
        ) : (
          <>
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          
          {/* Card 1: Health Score */}
          <motion.div variants={itemVariants} className="glow-card p-6 flex flex-col">
            <h3 className="text-lg font-medium mb-6">Resume Health</h3>
            <div className="flex justify-center mb-8">
              <div className="w-36 h-36">
                <CircularProgressbar 
                  value={data.healthScore.total} 
                  text={`${data.healthScore.total}`}
                  styles={buildStyles({
                    pathColor: data.healthScore.total >= 80 ? '#10B981' : data.healthScore.total >= 60 ? '#F59E0B' : '#EF4444',
                    textColor: '#fff',
                    trailColor: '#2a2a35',
                    textSize: '24px',
                    pathTransitionDuration: 1.2
                  })}
                />
              </div>
            </div>
            <div className="space-y-1 mb-6">
              <ScoreBar label="Formatting" score={data.healthScore.formatting} />
              <ScoreBar label="Keyword Density" score={data.healthScore.keyword_density} />
              <ScoreBar label="Impact (Quantified)" score={data.healthScore.quantified_impact} />
              <ScoreBar label="ATS Compatibility" score={data.healthScore.ats_compatibility} />
              <ScoreBar label="Readability" score={data.healthScore.readability} />
            </div>
            <div>
              <p className="text-sm font-medium text-danger mb-2">Fix these:</p>
              <div className="flex flex-col gap-2">
                {data.healthScore.flags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs bg-danger/10 border border-danger/20 text-danger-light p-2 rounded-md">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card 2: Strengths */}
          <motion.div variants={itemVariants} className="glow-card p-6 flex flex-col">
            <h3 className="text-lg font-medium mb-6">Your Strengths</h3>
            <div className="flex flex-col gap-4 flex-1">
              {data.strengths.top_strengths.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{s.title}</h4>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-semibold ${s.market_demand === 'High' ? 'bg-emerald/20 text-emerald' : 'bg-yellow-500/20 text-yellow-500'}`}>
                        {s.market_demand} Demand
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl bg-surface border border-gray-800 italic text-sm text-gray-300">
              "{data.strengths.elevator_pitch}"
            </div>
          </motion.div>

          {/* Card 3: Target Roles */}
          <motion.div variants={itemVariants} className="glow-card p-6 flex flex-col">
            <h3 className="text-lg font-medium mb-6">Target Roles</h3>
            <div className="flex flex-col gap-3">
              {data.roles.map((r, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface cursor-pointer transition-colors group">
                  <div className="w-6 text-center font-mono text-gray-500 group-hover:text-accent">#{i+1}</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{r.title}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <div className="h-1 w-24 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${r.fit_score * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono text-emerald">${(r.avg_salary_usd / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </motion.div>

        {/* Section B: Skill Map */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="glow-card p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Your Skill Universe</h3>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent"></div> Confirmed</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full border border-gray-500"></div> Inferred</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full border border-danger"></div> Missing</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {data.skills.confirmed_high.map(s => (
              <motion.div key={s} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-3 py-1.5 rounded-full bg-accent text-white text-sm font-medium">
                {s}
              </motion.div>
            ))}
            {data.skills.confirmed_med.map(s => (
              <motion.div key={s} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-3 py-1.5 rounded-full border border-accent text-accent-light text-sm font-medium">
                {s}
              </motion.div>
            ))}
            {data.skills.inferred.map(s => (
              <motion.div key={s} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-3 py-1.5 rounded-full border border-dashed border-gray-600 text-gray-400 text-sm">
                {s}
              </motion.div>
            ))}
            {data.skills.missing.map(s => (
              <motion.div key={s} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-3 py-1.5 rounded-full border border-danger/50 text-danger-light text-sm flex items-center gap-1 cursor-help relative group">
                <Plus className="w-3 h-3" /> {s}
                <div className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-gray-900 text-xs p-2 rounded z-10 border border-gray-700">
                  Critical gap • ~15 hrs to learn
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Section C: Matched Jobs */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-medium flex items-center gap-2">
              Jobs matched for you
              <span className="bg-accent/20 text-accent text-xs font-semibold px-2 py-0.5 rounded-full">{data.jobs.length}</span>
            </h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs rounded-full bg-surface border border-gray-700 hover:bg-gray-800">All</button>
              <button className="px-3 py-1 text-xs rounded-full bg-surface border border-gray-700 hover:bg-gray-800">Remote</button>
              <button className="px-3 py-1 text-xs rounded-full bg-surface border border-gray-700 hover:bg-gray-800">&lt; 7 days</button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {data.jobs.map((job, index) => (
              <motion.div 
                key={job.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glow-card overflow-hidden"
              >
                <div 
                  className="p-5 flex items-center gap-6 cursor-pointer"
                  onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                >
                  <img src={`https://logo.clearbit.com/${job.company.toLowerCase().replace(' ', '')}.com`} onError={(e) => { e.currentTarget.style.display = 'none' }} className="w-12 h-12 rounded-lg bg-white" alt={job.company} />
                  
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-white">{job.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {job.company}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {job.posted}
                        {job.stale && <span className="ml-2 text-[10px] uppercase bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded">Stale</span>}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-mono font-semibold text-accent">{job.match_score}</span>
                      <div className="h-1 w-16 bg-gray-800 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-accent" style={{ width: `${job.match_score}%` }} />
                      </div>
                    </div>
                    <button 
                      className="px-4 py-2 bg-surface hover:bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (expandedJob !== job.id) setExpandedJob(job.id);
                        else openDrawer(job);
                      }}
                    >
                      View gap analysis <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedJob === job.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-800 bg-black/20"
                    >
                      <div className="p-6 grid grid-cols-2 gap-8">
                        <div>
                          <h5 className="text-sm font-medium mb-3 text-gray-300">Skills Analysis</h5>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="px-2 py-1 bg-emerald/10 border border-emerald/20 text-emerald text-xs rounded flex items-center gap-1"><Check className="w-3 h-3" /> React</span>
                            <span className="px-2 py-1 bg-emerald/10 border border-emerald/20 text-emerald text-xs rounded flex items-center gap-1"><Check className="w-3 h-3" /> Node.js</span>
                            {job.missing_skills.map(ms => (
                              <span key={ms.skill} className="px-2 py-1 bg-danger/10 border border-danger/20 text-danger text-xs rounded flex items-center gap-1">
                                <X className="w-3 h-3" /> Missing {ms.skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium mb-3 text-gray-300">Battle Plan Preview</h5>
                          <div className="bg-surface p-3 rounded-lg border border-gray-800 mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold text-accent uppercase tracking-wide">Week 1</span>
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {job.missing_skills[0]?.hours} hrs</span>
                            </div>
                            <p className="text-sm">Learn {job.missing_skills[0]?.skill} fundamentals</p>
                          </div>
                          <button 
                            onClick={() => openDrawer(job)}
                            className="w-full py-2 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            See full battle plan
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
        </>
        )}
      </main>

      {/* Section D: Battle Plan Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface border-l border-gray-800 z-50 overflow-y-auto shadow-2xl"
            >
              <div className="p-6 border-b border-gray-800 flex justify-between items-start sticky top-0 bg-surface/90 backdrop-blur z-10">
                <div>
                  <h2 className="text-xl font-medium">{selectedJob?.title}</h2>
                  <p className="text-gray-400 text-sm mt-1">{selectedJob?.company}</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-8 flex items-center gap-4 p-4 rounded-xl bg-accent/10 border border-accent/20">
                  <div className="w-16 h-16">
                    <CircularProgressbar 
                      value={100 - selectedJob?.match_score} 
                      text={`${100 - selectedJob?.match_score}%`}
                      styles={buildStyles({
                        pathColor: '#EF4444',
                        textColor: '#fff',
                        trailColor: 'rgba(239,68,68,0.2)',
                        textSize: '24px',
                      })}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-danger-light">Gap Score</h3>
                    <p className="text-sm text-gray-400 mt-1">Total time to close: 3 weeks, 45 free hours</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {selectedJob?.missing_skills.map((ms: any, i: number) => (
                    <div key={i} className="relative pl-8">
                      {/* Timeline line */}
                      <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-gray-800" />
                      
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-surface border-2 border-accent flex items-center justify-center font-mono text-xs font-bold text-accent">
                        {i + 1}
                      </div>

                      <div className="glow-card p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-white text-lg">{ms.skill}</h4>
                            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] uppercase font-bold bg-danger/20 text-danger rounded">
                              {ms.severity}
                            </span>
                          </div>
                          <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">{ms.hours} hrs</span>
                        </div>

                        <div className="mt-4 space-y-3">
                          <div>
                            <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Free Resources</p>
                            <a href="#" className="flex items-center justify-between p-2 rounded border border-emerald/30 hover:bg-emerald/10 transition-colors text-sm text-emerald-light group">
                              <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Official Docs</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                            </a>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider mt-4">Premium Path</p>
                            <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className="text-xs text-accent font-semibold">Educative.io</span>
                                  <p className="text-sm font-medium text-white">Grokking {ms.skill}</p>
                                </div>
                                <span className="text-sm font-mono font-bold">$79</span>
                              </div>
                              <button className="w-full py-1.5 mt-2 bg-white text-black hover:bg-gray-200 text-xs font-bold rounded transition-colors">
                                View Course
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
