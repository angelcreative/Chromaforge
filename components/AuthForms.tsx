
import React, { useState } from 'react';
import { loginUser, registerUser, resetPassword, loginWithGoogle } from '../services/authService';
import { isDemoMode } from '../firebaseConfig';
import { HiX } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';

type AuthMode = 'login' | 'register' | 'forgot';

interface AuthFormsProps {
  initialMode?: AuthMode;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthForms: React.FC<AuthFormsProps> = ({ initialMode = 'login', onClose, onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const clearState = () => { setError(''); setSuccessMsg(''); };
  const switchMode = (m: AuthMode) => { clearState(); setMode(m); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
        if (mode === 'login') {
            await loginUser(email, password);
            onSuccess();
        } else if (mode === 'register') {
            await registerUser(email, password, name);
            onSuccess();
        } else if (mode === 'forgot') {
            await resetPassword(email);
            setSuccessMsg(isDemoMode ? "Demo Mode: Reset link simulated." : "Reset link sent! Check your email.");
            setLoading(false); // Stay on form
            return;
        }
    } catch (err: any) {
        let msg = "An error occurred.";
        // Handle both Firebase Error codes and generic errors
        if (err.code === 'auth/invalid-email') msg = "Invalid email address.";
        else if (err.code === 'auth/user-not-found') msg = "No user found with this email.";
        else if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
        else if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
        else if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
        else if (err.message) msg = err.message;
        
        setError(msg);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
      setLoading(true);
      setError('');
      try {
          await loginWithGoogle();
          onSuccess();
      } catch (err: any) {
          console.error(err);
          let msg = "Failed to sign in with Google.";
          if (err.code === 'auth/popup-closed-by-user') msg = "Sign-in cancelled.";
          setError(msg);
      }
      setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                <HiX className="w-5 h-5" />
            </button>

            <div className="p-8">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}
                    </h2>
                    <p className="text-sm text-slate-400">
                        {isDemoMode && <span className="text-yellow-400 font-bold block mb-1 uppercase text-xs tracking-wider">Demo Mode Active</span>}
                        {mode === 'login' ? 'Enter your details to access your palette.' : mode === 'register' ? 'Join ChromaForge to start building.' : 'Enter your email to receive a recovery link.'}
                    </p>
                </div>

                {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">{error}</div>}
                {successMsg && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs text-center">{successMsg}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition-colors" placeholder="Jane Doe" required />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition-colors" placeholder="you@example.com" required />
                    </div>

                    {mode !== 'forgot' && (
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Password</label>
                                {mode === 'login' && <button type="button" onClick={() => switchMode('forgot')} className="text-xs text-indigo-400 hover:text-indigo-300">Forgot?</button>}
                            </div>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition-colors" placeholder="••••••••" required />
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex justify-center items-center"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (mode === 'login' ? 'Sign In' : mode === 'register' ? 'Sign Up' : 'Send Link')}
                    </button>
                </form>
                
                {/* Google Sign In Section */}
                {mode !== 'forgot' && (
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-700"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="mt-4 w-full py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white rounded-lg font-bold transition-all flex justify-center items-center gap-3 disabled:opacity-50"
                        >
                             <FcGoogle className="w-5 h-5" />
                            Google
                        </button>
                    </div>
                )}

                <div className="mt-6 text-center text-sm text-slate-400">
                    {mode === 'login' && (
                        <>Don't have an account? <button onClick={() => switchMode('register')} className="text-white hover:underline">Sign up</button></>
                    )}
                    {mode === 'register' && (
                        <>Already have an account? <button onClick={() => switchMode('login')} className="text-white hover:underline">Log in</button></>
                    )}
                    {mode === 'forgot' && (
                        <button onClick={() => switchMode('login')} className="text-white hover:underline">Back to Log in</button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AuthForms;
