
import React, { useState } from 'react';
import { 
  HeartPulse, 
  User, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Database,
  WifiOff,
  Wifi,
  CheckCircle2
} from 'lucide-react';
import { dbService } from '../services/dbService';

interface AuthProps {
  onAuthSuccess: (user: { name: string; email: string }) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; type?: 'NOT_FOUND' | 'INVALID_PASS' | 'CONFIRMATION_REQUIRED' | 'SERVER_OFFLINE' | 'CONNECTION_ERROR' } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        const response = await dbService.signIn(formData.email, formData.password);
        onAuthSuccess(response.user);
      } else {
        if (!formData.name.trim()) throw new Error("Please enter your full name");
        if (formData.password.length < 6) throw new Error("Password must be at least 6 characters");
        
        const response = await dbService.signUp(formData.name, formData.email, formData.password);
        
        if (response.status === "confirmation_required") {
          setSuccessMsg("Account created! Please check your email for a verification link before signing in.");
          setIsLogin(true); // Move to sign in mode after successful sign up
        } else if (response.user) {
          onAuthSuccess(response.user);
        }
      }
    } catch (err: any) {
      const msg = err.message || "";
      const lowerMsg = msg.toLowerCase();
      
      if (lowerMsg.includes("email not confirmed") || lowerMsg.includes("email_not_confirmed")) {
        setError({ 
          message: "Email verification required. Please check your inbox for the confirmation link.", 
          type: 'CONFIRMATION_REQUIRED' 
        });
        setIsLogin(true); // Ensure they are on the login form to see the error
      } else if (msg === "CONNECTION_ERROR") {
        setError({ 
          message: "Unable to reach health database server.", 
          type: 'CONNECTION_ERROR' 
        });
      } else if (lowerMsg.includes("invalid login credentials") || lowerMsg.includes("invalid credentials")) {
        setError({ message: "Incorrect email or password. Access denied.", type: 'INVALID_PASS' });
      } else {
        setError({ message: err.message || "Authentication failed. Try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Decoration */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-50 border-r border-slate-100 flex-col justify-center p-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-200 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-72 h-72 bg-indigo-200 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-md relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <HeartPulse className="text-white" size={28} />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">Healthcare AI</span>
          </div>
          <h2 className="text-5xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
            Intelligent health <br/>
            <span className="text-blue-600">management.</span>
          </h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10">
            A secure, HIPAA-ready platform designed to help you stay on track with medications and health insights.
          </p>
          <div className="space-y-6">
            {[
              { icon: ShieldCheck, title: "Private & Secure", desc: "Data is encrypted and stored in your Supabase vault." },
              { icon: Sparkles, title: "AI Guided", desc: "Powered by Gemini for deep medication analysis." },
              { icon: Database, title: "Cloud Synchronization", desc: "Access your records across any authorized device." }
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                  <item.icon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                  <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Form Area */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-white">
        <div className="max-w-sm w-full mx-auto">
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <HeartPulse className="text-blue-600" size={32} />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Healthcare AI</h1>
          </div>
          
          <div className="mb-10">
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h3>
            <p className="text-slate-500 font-medium">
              {isLogin ? 'Access your secure healthcare dashboard.' : 'Join us to start managing your health better.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-bold flex items-start gap-3 animate-in slide-in-from-top-2">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <p>{successMsg}</p>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-slate-700 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="text" 
                    placeholder="John Doe" 
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-slate-300" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="email" 
                  placeholder="name@example.com" 
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-slate-300" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                {isLogin && (
                  <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-slate-300" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            {error && (
              <div className={`p-5 rounded-3xl text-xs font-bold flex flex-col gap-4 animate-in shake ${error.type === 'CONNECTION_ERROR' ? 'bg-orange-50 border border-orange-100 text-orange-700' : 'bg-red-50 border border-red-100 text-red-600'}`}>
                <div className="flex items-start gap-3">
                  {error.type === 'CONNECTION_ERROR' ? <WifiOff size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                  <div className="space-y-2">
                    <p className="text-sm font-black">{error.message}</p>
                    
                    {error.type === 'CONNECTION_ERROR' && (
                      <div className="p-3 bg-white/50 rounded-xl border border-orange-200 text-[10px] text-orange-800 leading-relaxed font-medium">
                        <p className="font-black uppercase mb-1 flex items-center gap-1">
                          <Wifi size={10} /> Troubleshooting
                        </p>
                        1. Check your internet connection.<br/>
                        2. Ensure ad-blockers aren't blocking Supabase.<br/>
                        3. Verify your Supabase project isn't "Paused".
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'} 
                  <ArrowRight size={18} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center space-y-4">
            <p className="text-sm font-medium text-slate-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={handleToggleMode}
                className="text-blue-600 font-bold hover:underline transition-all"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
