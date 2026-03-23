import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { LogIn, Sparkles } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user profile exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // Create initial agent profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'agent',
          createdAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-brand-border"
      >
        <div className="p-10 text-center space-y-8">
          <div className="w-20 h-20 bg-brand-accent rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-brand-accent/20">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-brand-ink tracking-tight">EstateFlow AI</h1>
            <p className="text-slate-500 font-medium">The intelligent command center for modern real estate agents.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-brand-ink text-white py-5 rounded-3xl font-bold text-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-brand-ink/10"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-6 h-6" />
                Sign in with Google
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 font-medium">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
