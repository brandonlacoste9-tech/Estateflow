import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocFromServer, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Lead } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Users, TrendingUp, MessageSquare, Phone, MapPin, ChevronRight, Star, Clock, Rocket, Sparkles, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';
import FacebookAdModal from './FacebookAdModal';
import AITools from './AITools';

type Tab = 'leads' | 'insights';

export default function AgentDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadForAd, setSelectedLeadForAd] = useState<Lead | null>(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('leads');

  useEffect(() => {
    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (err) {
        if (err instanceof Error && err.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(leadsData);
      setLoading(false);
    }, (err) => {
      console.error('Firestore Error:', err);
      setError('Missing or insufficient permissions. Are you logged in as an admin?');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-12 text-center text-slate-500">Loading leads...</div>;
  if (error) return <div className="p-12 text-center text-red-500 bg-red-50 rounded-3xl mx-6 mt-6 border border-red-100">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-ink tracking-tight">Agent Command Center</h1>
          <p className="text-slate-500 font-medium">You have {leads.filter(l => l.status === 'hot').length} hot leads waiting for follow-up.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-brand-border p-1 rounded-2xl flex items-center gap-1 shadow-sm">
            <button 
              onClick={() => setActiveTab('leads')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'leads' ? "bg-brand-ink text-white shadow-md" : "text-slate-500 hover:bg-brand-muted"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Leads
            </button>
            <button 
              onClick={() => setActiveTab('insights')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'insights' ? "bg-brand-ink text-white shadow-md" : "text-slate-500 hover:bg-brand-muted"
              )}
            >
              <Sparkles className="w-4 h-4" />
              AI Insights
            </button>
          </div>
          <button 
            onClick={() => {
              setSelectedLeadForAd(null);
              setIsAdModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-brand-accent text-white font-bold hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-brand-accent/20"
          >
            <Rocket className="w-4 h-4" />
            Launch Ad
          </button>
        </div>
      </header>

      <FacebookAdModal 
        isOpen={isAdModalOpen} 
        onClose={() => setIsAdModalOpen(false)} 
        lead={selectedLeadForAd} 
      />

      <AnimatePresence mode="wait">
        {activeTab === 'leads' ? (
          <motion.div
            key="leads"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Total Leads" value={leads.length.toString()} icon={Users} trend="+12%" />
              <StatCard label="Hot Leads" value={leads.filter(l => l.status === 'hot').length.toString()} icon={Star} trend="+2" />
              <StatCard label="Response Rate" value="94%" icon={MessageSquare} trend="+3%" />
            </div>

            <div className="bg-white rounded-[40px] border border-brand-border overflow-hidden shadow-sm">
              <div className="p-8 border-b border-brand-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-ink">Recent Activity</h2>
                <button className="text-brand-accent font-bold text-sm hover:underline">View All Leads</button>
              </div>
              <div className="divide-y divide-brand-border">
                {leads.length > 0 ? (
                  leads.map((lead) => (
                    <LeadRow 
                      key={lead.id} 
                      lead={lead} 
                      onLaunchAd={(l) => {
                        setSelectedLeadForAd(l);
                        setIsAdModalOpen(true);
                      }} 
                    />
                  ))
                ) : (
                  <div className="p-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-brand-muted rounded-3xl flex items-center justify-center mx-auto">
                      <Users className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-medium italic">No leads captured yet. Share your landing page to start.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AITools />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string; icon: any; trend: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl bg-slate-50 text-slate-600">
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{trend}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function LeadRow({ lead, onLaunchAd }: { lead: Lead; onLaunchAd: (lead: Lead) => void }) {
  return (
    <motion.div 
      whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
      className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
          lead.status === 'hot' ? "bg-orange-100 text-orange-600" : 
          lead.status === 'qualifying' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
        )}>
          <MapPin className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900">{lead.address}</h3>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
              lead.status === 'hot' ? "bg-orange-100 text-orange-600" : 
              lead.status === 'qualifying' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
            )}>
              {lead.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</span>
            {lead.budget && <span className="flex items-center gap-1 font-medium text-emerald-600">Budget: {lead.budget}</span>}
            {lead.timeline && <span className="flex items-center gap-1 font-medium text-blue-600">Timeline: {lead.timeline}</span>}
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lead.createdAt}</span>
          </div>
          {lead.aiSummary && (
            <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-600 italic">
                <span className="font-bold text-slate-900 not-italic mr-1">AI Summary:</span>
                {lead.aiSummary}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score</p>
          <p className={cn(
            "text-xl font-black",
            lead.score > 80 ? "text-emerald-600" : lead.score > 50 ? "text-blue-600" : "text-slate-400"
          )}>{lead.score}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onLaunchAd(lead);
            }}
            className="p-2 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <Rocket className="w-4 h-4" />
            Ad
          </button>
          <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
