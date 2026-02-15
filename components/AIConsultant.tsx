import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  MessageCircleQuestion, 
  Image as ImageIcon, 
  Mic, 
  X, 
  Volume2, 
  PhoneOff, 
  Camera
} from 'lucide-react';
import { ChatMessage } from '../types';
import { analyzeHealthQuery } from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// Base64 helpers as required
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

const AIConsultant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Hello! I'm your Healthcare AI Health Assistant. I can help you understand your medications, check symptoms, or give you health tips. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState('');
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice API refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !attachedImage) || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input || "Check this image." };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    const currentImage = attachedImage;
    
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      
      const imageBase64 = currentImage ? currentImage.split(',')[1] : undefined;
      const aiResponse = await analyzeHealthQuery(currentInput, history, imageBase64);
      
      setMessages(prev => [...prev, { role: 'model', content: aiResponse || "I couldn't generate a response. Please try again." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Error: Unable to connect to health services. Check your connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Voice Assistant Implementation ---

  const startVoiceAssistant = async () => {
    setIsVoiceActive(true);
    setIsVoiceLoading(true);
    setVoiceTranscription('Connecting to Healthcare AI Voice...');

    try {
      // Create GoogleGenAI instance right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioCtxRef.current = outputAudioCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsVoiceLoading(false);
            setVoiceTranscription('Listening for your health questions...');
            
            const source = inputAudioCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              // CRITICAL: Solely rely on sessionPromise resolves
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setVoiceTranscription(prev => prev + ' ' + message.serverContent?.outputTranscription?.text);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = audioCtxRef.current!;
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
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopVoiceAssistant(),
          onerror: () => stopVoiceAssistant(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: 'You are a warm, helpful medical assistant. Keep voice responses concise and encouraging.',
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      stopVoiceAssistant();
    }
  };

  const stopVoiceAssistant = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsVoiceActive(false);
    setVoiceTranscription('');
    setIsVoiceLoading(false);
  };

  const suggestions = [
    "Side effects of Metformin?",
    "When should I take my vitamins?",
    "Tips for managing hypertension",
    "How to improve sleep hygiene"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto relative">
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-amber-500 fill-amber-500" size={24} />
            Healthcare AI Health Assistant
          </h2>
          <p className="text-slate-500 text-sm">Powered by Gemini AI for professional guidance</p>
        </div>
        <div className="hidden md:flex px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-bold text-blue-600 uppercase tracking-widest">
          Always Consult a Doctor
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 px-2 mb-4 scrollbar-hide"
      >
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white border border-slate-200 text-slate-700 shadow-sm prose prose-slate max-w-none'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center text-slate-400 bg-white border border-slate-100 px-4 py-3 rounded-2xl shadow-sm">
              <Loader2 size={18} className="animate-spin text-blue-500" />
              <span className="text-xs font-medium">Assistant is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {messages.length === 1 && !attachedImage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          {suggestions.map((s, idx) => (
            <button 
              key={idx}
              onClick={() => setInput(s)}
              className="text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-xs flex items-center gap-2 group"
            >
              <MessageCircleQuestion size={14} className="text-slate-400 group-hover:text-blue-400" />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Section */}
      <div className="flex flex-col gap-2">
        {attachedImage && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-2xl animate-in slide-in-from-bottom-2">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white shadow-sm">
              <img src={attachedImage} alt="Attachment" className="w-full h-full object-cover" />
              <button 
                onClick={() => setAttachedImage(null)}
                className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg"
              >
                <X size={12} />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-blue-700">Image Attached</p>
              <p className="text-[10px] text-blue-500">Ask the assistant about this photo</p>
            </div>
          </div>
        )}

        <div className="relative group flex items-center gap-2">
          <div className="flex-1 relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about meds, symptoms, or habits..."
              className="w-full pl-6 pr-24 py-5 bg-white border-2 border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 shadow-sm transition-all text-slate-700 placeholder:text-slate-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                title="Attach Photo"
              >
                <ImageIcon size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
              <button 
                onClick={handleSendMessage}
                disabled={(!input.trim() && !attachedImage) || isLoading}
                className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-200"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
          
          <button 
            onClick={startVoiceAssistant}
            className="w-14 h-14 bg-indigo-600 text-white rounded-3xl flex items-center justify-center hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all hover:scale-110 active:scale-95 group"
          >
            <Mic size={24} className="group-hover:animate-pulse" />
          </button>
        </div>
      </div>
      
      <p className="text-[10px] text-center text-slate-400 mt-3 px-10 leading-tight">
        Disclaimer: This AI assistant provides general information only. It is not a substitute for professional medical advice.
      </p>

      {/* Voice Assistant Overlay */}
      {isVoiceActive && (
        <div className="fixed inset-0 z-[150] bg-indigo-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
          <div className="w-full max-w-lg flex flex-col items-center gap-12 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative w-32 h-32 bg-indigo-600 text-white rounded-[40px] flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                <Bot size={64} className={isVoiceLoading ? 'animate-bounce' : ''} />
              </div>
              {!isVoiceLoading && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div 
                      key={i} 
                      className="w-1 bg-blue-400 rounded-full animate-bounce" 
                      style={{ height: `${Math.random() * 40 + 20}px`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-3xl font-black text-white">Healthcare AI Live Voice</h3>
              <div className="min-h-[100px] flex items-center justify-center">
                <p className="text-xl text-indigo-200 font-medium leading-relaxed italic max-w-md">
                  "{voiceTranscription || 'Speak naturally to your health assistant...'}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4">
                <Volume2 className="text-indigo-300" />
                <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-blue-500 animate-pulse" />
                </div>
              </div>
              <button 
                onClick={stopVoiceAssistant}
                className="w-20 h-20 bg-red-500 text-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-red-500/40 hover:bg-red-600 transition-all hover:scale-105 active:scale-95"
              >
                <PhoneOff size={32} strokeWidth={2.5} />
              </button>
            </div>
            
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">
              Secured HD Audio Link Active
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConsultant;