
import React, { useState, useCallback, useEffect } from 'react';
import { AppView, User, AnalysisResult, HistoryItem } from './types';
import { SKIN_CONCERNS } from './constants';
import Layout from './components/Layout';
import Scanner from './components/Scanner';
import ChatInterface from './components/ChatInterface';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('login');
  const [user, setUser] = useState<User | null>(null);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [showAnnotations, setShowAnnotations] = useState(true);

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('derma_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ id: '1', name: 'John Doe', email: authForm.email });
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
    setSelectedConcerns([]);
    setAnalysis(null);
    setCapturedImage(null);
  };

  const toggleConcern = (id: string) => {
    setSelectedConcerns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleCapture = async (base64: string) => {
    setCapturedImage(base64);
    setIsAnalyzing(true);
    setView('results');
    
    try {
      const result = await geminiService.analyzeSkin(base64, selectedConcerns);
      setAnalysis(result);
      
      // Save to history
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        condition: result.condition,
        image: base64,
        result: result
      };
      const updatedHistory = [newItem, ...history].slice(0, 5);
      setHistory(updatedHistory);
      localStorage.setItem('derma_history', JSON.stringify(updatedHistory));
      
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please ensure you have a valid Internet connection and try again.");
      setView('dashboard');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setCapturedImage(item.image);
    setAnalysis(item.result);
    setSelectedConcerns([]); // Reset current selection when viewing history
    setView('results');
  };

  // Helper to render bounding boxes
  const renderAnnotations = () => {
    if (!analysis?.detections || !showAnnotations) return null;

    return analysis.detections.map((det, idx) => {
      const [ymin, xmin, ymax, xmax] = det.box_2d;
      
      // Convert 1000-based coordinates to percentages
      const top = (ymin / 1000) * 100;
      const left = (xmin / 1000) * 100;
      const height = ((ymax - ymin) / 1000) * 100;
      const width = ((xmax - xmin) / 1000) * 100;

      return (
        <div
          key={idx}
          className="absolute border-2 border-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] group hover:bg-red-500/10 transition-colors cursor-help"
          style={{
            top: `${top}%`,
            left: `${left}%`,
            width: `${width}%`,
            height: `${height}%`,
          }}
        >
          {/* Tooltip */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            {det.label}
          </div>
        </div>
      );
    });
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen flex bg-slate-50">
        {/* Left Side - Visual */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-sky-900/90 to-purple-900/90"></div>
          
          <div className="relative z-10 max-w-xl text-white">
            <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-sky-500/30">
              <i className="fa-solid fa-dna text-3xl"></i>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight mb-6">Advanced Skin Diagnostics.</h1>
            <p className="text-xl text-slate-300 font-light leading-relaxed">
              Experience the future of dermatology with our clinical-grade AI analysis. Instant insights, personalized care, and real-time tracking.
            </p>
            
            <div className="mt-12 flex gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                <i className="fa-solid fa-check text-green-400"></i> AI Powered
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                <i className="fa-solid fa-check text-green-400"></i> Instant Results
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                <i className="fa-solid fa-check text-green-400"></i> Secure
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-slate-100">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
              <p className="text-slate-500">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    value={authForm.email}
                    onChange={e => setAuthForm(prev => ({...prev, email: e.target.value}))}
                    placeholder="name@company.com"
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium text-slate-900 placeholder:text-slate-400"
                  />
                  <i className="fa-regular fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required
                    value={authForm.password}
                    onChange={e => setAuthForm(prev => ({...prev, password: e.target.value}))}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium text-slate-900 placeholder:text-slate-400"
                  />
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                  <span className="text-slate-500 font-medium">Remember me</span>
                </label>
                <a href="#" className="text-sky-600 font-bold hover:underline">Forgot password?</a>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Sign In <i className="fa-solid fa-arrow-right"></i>
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-slate-500 font-medium">
                Don't have an account? 
                <a href="#" className="ml-1 text-sky-600 font-bold hover:underline">Create free account</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout onLogout={handleLogout}>
      {view === 'dashboard' && (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
          <section>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Skin Wellness Hub</h1>
            <p className="text-slate-500 mt-2 text-lg">Select your current concerns to begin a new personalized scan.</p>
          </section>

          {history.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Recent Scans</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {history.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="flex-shrink-0 w-64 bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:border-sky-500 hover:shadow-md transition-all text-left group"
                  >
                    <img src={item.image} className="w-12 h-12 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform" />
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 truncate">{item.condition}</p>
                      <p className="text-xs text-slate-400">{item.date}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {SKIN_CONCERNS.map((concern) => (
                <button
                  key={concern.id}
                  onClick={() => toggleConcern(concern.id)}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center group ${
                    selectedConcerns.includes(concern.id) 
                      ? 'border-sky-500 bg-sky-50 shadow-md' 
                      : 'bg-white border-transparent shadow-sm hover:border-slate-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                    selectedConcerns.includes(concern.id) ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                  }`}>
                    <i className={`fa-solid ${concern.icon}`}></i>
                  </div>
                  <span className="text-sm font-bold text-slate-700">{concern.label}</span>
                </button>
              ))}
            </div>
            
            <div className="bg-slate-900 p-10 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-3">Professional AI Scan</h2>
                <p className="text-slate-400 text-base max-w-sm leading-relaxed">
                  Utilize advanced computer vision for a clinical-grade dermatological assessment in under 10 seconds.
                </p>
              </div>
              <button 
                onClick={() => setView('scanner')}
                disabled={selectedConcerns.length === 0}
                className="relative z-10 px-10 py-5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-2xl disabled:bg-slate-700 disabled:text-slate-500 transition-all flex items-center gap-4 group active:scale-95"
              >
                <i className="fa-solid fa-camera text-xl group-hover:rotate-12 transition-transform"></i>
                <span className="text-lg">Start Analysis</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {view === 'scanner' && (
        <div className="max-w-lg mx-auto py-10 animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Align Your Face</h2>
            <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-slate-600 font-medium">Cancel</button>
          </div>
          <Scanner onCapture={handleCapture} onCancel={() => setView('dashboard')} />
        </div>
      )}

      {view === 'results' && (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Image and Basic Info */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-4 rounded-[32px] border border-slate-200 shadow-lg">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4]">
                  {capturedImage && (
                    <img 
                      src={capturedImage} 
                      alt="Skin Capture" 
                      className="w-full h-full object-contain" 
                    />
                  )}
                  {/* Annotations Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {renderAnnotations()}
                  </div>

                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-sky-900/60 backdrop-blur-md flex flex-col items-center justify-center text-white text-center p-6 z-20">
                      <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
                      <p className="font-bold uppercase tracking-widest text-sm">Detecting Issues...</p>
                    </div>
                  )}
                </div>
                
                {analysis?.detections && analysis.detections.length > 0 && (
                  <div className="mt-4 flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-slate-500">
                      {analysis.detections.length} Issues Detected
                    </span>
                    <button 
                      onClick={() => setShowAnnotations(!showAnnotations)}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                    >
                      {showAnnotations ? <><i className="fa-solid fa-eye-slash"></i> Hide</> : <><i className="fa-solid fa-eye"></i> Show</>}
                    </button>
                  </div>
                )}
              </div>

              {analysis && (
                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Severity Indicator</h4>
                  <div className={`w-full py-3 px-4 rounded-xl text-center font-bold text-lg ${
                    analysis.severity === 'Mild' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    analysis.severity === 'Moderate' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {analysis.severity}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Detailed Findings & Chat */}
            <div className="lg:col-span-8 space-y-8">
              {isAnalyzing ? (
                <div className="space-y-6">
                  <div className="h-40 bg-white rounded-3xl animate-pulse"></div>
                  <div className="h-60 bg-white rounded-3xl animate-pulse"></div>
                  <div className="h-80 bg-white rounded-3xl animate-pulse"></div>
                </div>
              ) : analysis ? (
                <>
                  <section className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl relative">
                    <button 
                      onClick={() => setView('dashboard')} 
                      className="absolute top-8 right-8 w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 transition-colors"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>

                    <div className="mb-8">
                      <span className="inline-block px-3 py-1 bg-sky-100 text-sky-700 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">Diagnosis Match</span>
                      <h2 className="text-4xl font-extrabold text-slate-900">{analysis.condition}</h2>
                    </div>

                    <div className="prose prose-slate max-w-none mb-10">
                      <p className="text-lg text-slate-600 leading-relaxed italic border-l-4 border-sky-500 pl-6 py-2">
                        {analysis.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                      <div>
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <i className="fa-solid fa-list-check text-emerald-500"></i>
                          Key Recommendations
                        </h4>
                        <ul className="space-y-3">
                          {analysis.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                              <span className="flex-shrink-0 w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                                {i + 1}
                              </span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <i className="fa-solid fa-vial text-purple-500"></i>
                          Effective Ingredients
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.suggestedIngredients.map((ing, i) => (
                            <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-sm font-bold border border-purple-100 shadow-sm">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                      <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-1"></i>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        <strong className="block mb-1">Medical Disclaimer:</strong>
                        {analysis.disclaimer}
                      </p>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900">Follow-up Consult</h3>
                      <span className="text-xs text-slate-400 font-medium">Powered by Gemini AI</span>
                    </div>
                    <ChatInterface analysis={analysis} />
                  </section>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center px-6">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <i className="fa-solid fa-magnifying-glass text-4xl text-slate-200"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Analysis Failed</h3>
                  <p className="text-slate-500 max-w-sm mb-8">We couldn't process your scan. Please ensure your camera lens is clear and lighting is adequate.</p>
                  <button 
                    onClick={() => setView('dashboard')}
                    className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
