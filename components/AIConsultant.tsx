import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon, 
  Mic, 
  X, 
  Volume2, 
  PhoneOff, 
  BrainCircuit,
  MessageCircle
} from 'lucide-react';
import { ChatMessage } from '../types';
import { analyzeHealthQuery } from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// Base64 helpers
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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
}

interface AIConsultantProps {
  initialQuery?: string;
  initialImage?: string;
  onResetContext?: () => void;
}

const AIConsultant: React.FC<AIConsultantProps> = ({ initialQuery, initialImage, onResetContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Hello! I'm your **Healthcare AI** assistant. How can I help you with your symptoms, medications, or health goals today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (initialQuery || initialImage) {
      if (initialImage) setAttachedImage(initialImage);
      if (initialQuery) setInput(initialQuery);
      if (initialQuery && !isLoading) handleSendMessage(initialQuery, initialImage);
      if (onResetContext) onResetContext();
    }
  }, [initialQuery, initialImage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (overrideInput?: string, overrideImage?: string) => {
    const finalInput = overrideInput !== undefined ? overrideInput : input;
    const finalImage = overrideImage !== undefined ? overrideImage : attachedImage;
    if ((!finalInput.trim() && !finalImage) || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: finalInput || "Analyze this image." };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      const imageBase64 = finalImage ? finalImage.split(',')[1] : undefined;
      const aiResponse = await analyzeHealthQuery(finalInput, history, imageBase64);
      setMessages(prev => [...prev, { role: 'model', content: aiResponse || "Error generating response." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Failed to connect to AI server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceAssistant = async () => {
    setIsVoiceActive(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioCtxRef.current = outputAudioCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) setVoiceTranscription(message.serverContent.outputTranscription.text);
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = audioCtxRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
            }
          },
          onclose: () => setIsVoiceActive(false),
          onerror: () => setIsVoiceActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are a warm, professional medical assistant. Keep voice responses short.',
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setIsVoiceActive(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto card overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-none">Health Assistant</h3>
            <span className="text-[10px] text-emerald-500 font-bold uppercase">Online & Private</span>
          </div>
        </div>
        <button 
          onClick={() => setMessages([messages[0]])}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-standard"
        >
          Reset Session
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-xl text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-700 shadow-sm prose prose-sm max-w-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              <span className="text-xs text-slate-400 font-medium">Assistant is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        {attachedImage && (
          <div className="mb-4 flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
             <img src={attachedImage} className="w-12 h-12 rounded object-cover" />
             <div className="flex-1">
               <p className="text-xs font-bold text-slate-700">Image attached</p>
               <button onClick={() => setAttachedImage(null)} className="text-[10px] text-red-500 font-bold uppercase">Remove</button>
             </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your health question..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white text-sm"
          />
          <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-blue-600 transition-standard">
            <ImageIcon size={20} />
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                const r = new FileReader();
                r.onload = () => setAttachedImage(r.result as string);
                r.readAsDataURL(f);
              }
            }} />
          </button>
          <button onClick={startVoiceAssistant} className="p-3 text-slate-400 hover:text-indigo-600 transition-standard">
            <Mic size={20} />
          </button>
          <button 
            onClick={() => handleSendMessage()}
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-standard disabled:opacity-50"
            disabled={(!input.trim() && !attachedImage) || isLoading}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {isVoiceActive && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="text-center space-y-8">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <Mic size={48} className="text-white" />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-bold text-white">Voice Assistant Active</h4>
              <p className="text-blue-200 text-sm max-w-xs">{voiceTranscription || 'Listening to you...'}</p>
            </div>
            <button 
              onClick={() => setIsVoiceActive(false)}
              className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 mx-auto"
            >
              <PhoneOff size={20} /> End Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConsultant;