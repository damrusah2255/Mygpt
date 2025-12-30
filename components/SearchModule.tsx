
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Persona } from '../types';

interface SearchModuleProps {
  onClose: () => void;
  persona: Persona;
}

const SearchModule: React.FC<SearchModuleProps> = ({ onClose, persona }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    setSources([]);

    try {
      // Use process.env.API_KEY directly as required by guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: `${persona.instruction} Additionally, summarize the information found from the web accurately.`
        },
      });

      setResult(response.text || 'No response generated.');
      
      // Extract website URLs from groundingChunks as required when using googleSearch
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedSources = chunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title,
          uri: chunk.web.uri
        }));
      setSources(extractedSources);
    } catch (err) {
      console.error('Search error:', err);
      setResult('Failed to perform research. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <i className="fas fa-search"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold">Research Mode</h3>
            <p className="text-xs text-gray-500">Ask {persona.type} to search the web for you</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="p-8">
        <form onSubmit={handleSearch} className="flex gap-4 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask ${persona.type} a complex question...`}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-black px-8 py-4 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Research'}
          </button>
        </form>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="prose prose-invert max-w-none">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 leading-relaxed text-gray-200">
                {result.split('\n').map((line, i) => (
                  <p key={i} className="mb-4">{line}</p>
                ))}
              </div>
            </div>

            {sources.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Sources Found</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs"
                    >
                      <i className="fas fa-external-link-alt text-purple-400"></i>
                      <span className="truncate flex-1">{source.title || source.uri}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!result && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-600">
            <i className="fas fa-book-open text-4xl mb-4"></i>
            <p>Ready to look up information grounded in real-time data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModule;
