
import React, { useState } from 'react';
import { PersonaType } from './types';
import { PERSONAS } from './constants';
import Avatar3D from './components/Avatar3D';
import LiveSession from './components/LiveSession';
import SearchModule from './components/SearchModule';

const App: React.FC = () => {
  const [activePersona, setActivePersona] = useState<PersonaType>(PersonaType.FRIEND);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-[#050505] text-white selection:bg-white/20">
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] transition-colors duration-1000" 
          style={{ backgroundColor: `${PERSONAS[activePersona].color}15` }}
        />
        <div 
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] transition-colors duration-1000" 
          style={{ backgroundColor: `${PERSONAS[activePersona].color}10` }}
        />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 p-6 md:px-12 flex justify-between items-center backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent flex items-center justify-center border border-white/10 shadow-xl">
            <i className="fas fa-sparkles text-xl" style={{ color: PERSONAS[activePersona].color }}></i>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter leading-none">DAMBRU AI</h1>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Multimodal Companion</span>
          </div>
        </div>
        
        <button 
          onClick={() => setShowSearch(!showSearch)}
          className="px-6 py-2.5 rounded-2xl text-sm font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-3 group"
        >
          <i className="fas fa-search text-gray-400 group-hover:text-white transition-colors"></i>
          Research
        </button>
      </header>

      <main className="w-full max-w-7xl flex flex-col lg:flex-row gap-10 items-stretch justify-center mt-24 mb-12">
        {/* Avatar Viewport */}
        <div className="w-full lg:w-3/5 aspect-square lg:aspect-auto min-h-[500px] relative rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0a] group">
          <Avatar3D persona={PERSONAS[activePersona]} isSpeaking={isLiveActive} />
          
          <div className="absolute top-8 left-8 flex flex-col gap-2 pointer-events-none">
            <div className="glass-morphism px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border-white/5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Rendering
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-max px-8 py-4 rounded-3xl glass-morphism border border-white/10 flex flex-col items-center gap-1 backdrop-blur-2xl">
            <span className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black">Mode Active</span>
            <span className="text-2xl font-black italic tracking-tight" style={{ color: PERSONAS[activePersona].color }}>
              {activePersona.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="w-full lg:w-2/5 flex flex-col gap-6">
          <div className="glass-morphism p-10 rounded-[3rem] border border-white/10 flex flex-col gap-8 h-full shadow-2xl">
            <div>
              <h2 className="text-4xl font-black tracking-tighter mb-3">Vibe Check</h2>
              <p className="text-gray-400 text-sm">Select a personality that matches your energy today.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {(Object.values(PersonaType)).map((type) => (
                <button
                  key={type}
                  onClick={() => setActivePersona(type)}
                  className={`flex flex-col items-start gap-4 p-5 rounded-[2rem] transition-all duration-500 border relative overflow-hidden group ${
                    activePersona === type 
                      ? 'bg-white/10 border-white/20 shadow-[0_15px_30px_rgba(0,0,0,0.5)] scale-[1.02]' 
                      : 'border-white/5 hover:bg-white/5 opacity-40 hover:opacity-100'
                  }`}
                >
                  {activePersona === type && (
                    <div className="absolute top-0 right-0 w-16 h-16 blur-2xl opacity-50" style={{ backgroundColor: PERSONAS[type].color }} />
                  )}
                  <div 
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 ${
                      activePersona === type ? 'shadow-lg rotate-6' : ''
                    }`}
                    style={{ 
                      backgroundColor: activePersona === type ? PERSONAS[type].color : 'rgba(255,255,255,0.05)',
                      color: activePersona === type ? '#fff' : PERSONAS[type].color 
                    }}
                  >
                    <i className={`fas ${PERSONAS[type].icon}`}></i>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider">{type}</span>
                </button>
              ))}
            </div>

            <div className="mt-auto">
              <LiveSession 
                persona={PERSONAS[activePersona]} 
                onStatusChange={setIsLiveActive} 
              />
            </div>
          </div>
        </div>
      </main>

      {showSearch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-5xl max-h-[90vh]">
            <SearchModule onClose={() => setShowSearch(false)} persona={PERSONAS[activePersona]} />
          </div>
        </div>
      )}

      <footer className="w-full max-w-7xl mt-12 mb-8 border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-gray-500 text-[10px] font-bold tracking-widest uppercase">
        <div className="flex gap-8">
          <span>Gemini 2.5 Native Audio</span>
          <span className="text-white/10">|</span>
          <span>Three.js Visuals</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="opacity-50">Crafted by</span>
          <span className="text-white tracking-[0.4em] font-black ml-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">dambru sah</span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        .glass-morphism { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
      `}} />
    </div>
  );
};

export default App;
