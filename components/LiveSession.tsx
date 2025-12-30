
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Persona } from '../types';

interface LiveSessionProps {
  persona: Persona;
  onStatusChange: (active: boolean) => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ persona, onStatusChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const microphoneStreamRef = useRef<MediaStream | null>(null);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array): Blob => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      microphoneStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    setIsConnected(false);
    onStatusChange(false);
  }, [onStatusChange]);

  const startSession = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;

      const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Critical: Resume contexts for browser security policies
      if (inputAudioCtx.state === 'suspended') await inputAudioCtx.resume();
      if (outputAudioCtx.state === 'suspended') await outputAudioCtx.resume();

      inputAudioContextRef.current = inputAudioCtx;
      audioContextRef.current = outputAudioCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            onStatusChange(true);
            setIsInitializing(false);
            
            const source = inputAudioCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.find(p => p.inlineData)?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.onended = () => sourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Session Error:', e);
            setError('Connection encountered an error. Please try again.');
            stopSession();
          },
          onclose: () => {
            setIsConnected(false);
            onStatusChange(false);
            setIsInitializing(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: persona.voice } }
          },
          systemInstruction: persona.instruction
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error('Start Error:', err);
      setError('Could not access microphone or connect to AI service.');
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (isConnected) stopSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona]);

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl flex items-center gap-3 animate-pulse">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/10">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-gray-600'}`}></div>
          <div>
            <span className="text-sm font-bold block text-white">
              {isInitializing ? 'Preparing...' : isConnected ? 'Live Connection' : 'Voice Mode'}
            </span>
            <span className="text-xs text-gray-500">
              {isConnected ? 'Speaking with ' + persona.type : 'Microphone ready'}
            </span>
          </div>
        </div>
        
        <button
          onClick={isConnected ? stopSession : startSession}
          disabled={isInitializing}
          className={`h-12 px-6 rounded-2xl font-bold transition-all flex items-center gap-2 ${
            isConnected 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30' 
              : 'bg-white text-black hover:scale-105 active:scale-95 disabled:opacity-50'
          }`}
        >
          {isInitializing ? (
            <i className="fas fa-circle-notch fa-spin"></i>
          ) : isConnected ? (
            <><i className="fas fa-stop"></i> Stop</>
          ) : (
            <><i className="fas fa-microphone"></i> Talk</>
          )}
        </button>
      </div>
    </div>
  );
};

export default LiveSession;
