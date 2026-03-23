import { useState, useEffect } from 'react';
import LeadMagnet from './components/LeadMagnet';
import AgentDashboard from './components/AgentDashboard';
import ChatInterface from './components/ChatInterface';
import Login from './components/Login';
import { auth } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Home, Users, Building2, ArrowLeft, LogOut } from 'lucide-react';
import { cn } from './lib/utils';

type View = 'seller' | 'agent';

interface CapturedLead {
  id: string;
  address: string;
  phone: string;
}

export default function App() {
  const [view, setView] = useState<View>('seller');
  const [capturedLead, setCapturedLead] = useState<CapturedLead | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLeadCaptured = (lead: CapturedLead) => {
    setCapturedLead(lead);
  };

  const handleChatComplete = (transcript: string) => {
    console.log('Chat Complete. Transcript:', transcript);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-10 h-10 border-4 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-ink">
      {/* Navigation for Demo Purposes */}
      {!capturedLead && (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-md border border-brand-border rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
          <button
            onClick={() => setView('seller')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all",
              view === 'seller' ? "bg-brand-ink text-white shadow-md" : "text-slate-500 hover:bg-brand-muted"
            )}
          >
            <Home className="w-4 h-4" />
            Seller View
          </button>
          <button
            onClick={() => setView('agent')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all",
              view === 'agent' ? "bg-brand-ink text-white shadow-md" : "text-slate-500 hover:bg-brand-muted"
            )}
          >
            <Users className="w-4 h-4" />
            Agent View
          </button>
          {user && view === 'agent' && (
            <button
              onClick={() => auth.signOut()}
              className="p-2 rounded-full text-slate-400 hover:text-red-500 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </nav>
      )}

      {/* Main Content */}
      <main className={cn("pt-24 pb-12 relative", capturedLead && "pt-12")}>
        {view === 'seller' && !capturedLead && (
          <div className="absolute top-0 left-0 w-full h-[500px] -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-bg/0 via-brand-bg/80 to-brand-bg" />
            <img 
              src="https://picsum.photos/seed/realestate-hero/1920/1080?blur=4" 
              alt="Background" 
              className="w-full h-full object-cover opacity-20"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        {view === 'seller' ? (
          <div className="max-w-4xl mx-auto px-4">
            {!capturedLead ? (
              <LeadMagnet onLeadCaptured={handleLeadCaptured} />
            ) : (
              <div className="max-w-md mx-auto space-y-6">
                <button 
                  onClick={() => setCapturedLead(null)}
                  className="flex items-center gap-2 text-slate-400 hover:text-brand-ink font-bold text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="bg-brand-accent p-6 rounded-3xl text-white shadow-xl">
                  <h3 className="text-xl font-bold">Great! AI is calculating...</h3>
                  <p className="text-white/80 text-sm mt-1">
                    While we analyze {capturedLead.address}, our assistant has a few questions to refine your estimate.
                  </p>
                </div>
                <ChatInterface 
                  leadId={capturedLead.id}
                  address={capturedLead.address} 
                  onComplete={handleChatComplete} 
                />
              </div>
            )}
          </div>
        ) : (
          !user ? <Login /> : <AgentDashboard />
        )}
      </main>

      {/* Footer / Branding */}
      <footer className="fixed bottom-6 left-6 flex items-center gap-2 text-slate-400">
        <Building2 className="w-5 h-5" />
        <span className="text-sm font-bold tracking-tighter uppercase">EstateFlow AI</span>
      </footer>
    </div>
  );
}
