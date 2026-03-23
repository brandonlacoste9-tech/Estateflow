import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocFromServer, doc, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Lead } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Users, TrendingUp, MessageSquare, Phone, MapPin, ChevronRight, Star, Clock, Rocket, Sparkles, LayoutDashboard, Search, Bookmark, Trash2, History, Filter, Loader2, Camera, Edit2, Check, X, LogIn } from 'lucide-react';
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
  const [leadFilter, setLeadFilter] = useState('');
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [isSavingFilter, setIsSavingFilter] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'agent' | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch user role
    const fetchUserRole = async () => {
      try {
        const userDoc = await getDocFromServer(doc(db, 'users', auth.currentUser!.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        } else {
          // Fallback or wait for Login.tsx to create it
          console.log("User profile not found yet, retrying...");
          setTimeout(fetchUserRole, 1000);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    };
    fetchUserRole();

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
  }, []);

  useEffect(() => {
    if (!auth.currentUser || !userRole) return;

    let q;
    if (userRole === 'admin' || auth.currentUser.email === 'marifaf11@gmail.com') {
      q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    } else {
      // Agents can only see their own leads
      q = query(
        collection(db, 'leads'), 
        where('agentUid', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(leadsData);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Firestore Error:', err);
      if (err.code === 'permission-denied') {
        setError('Access denied. You may not have any leads assigned to you yet, or your account permissions are still being processed.');
      } else {
        setError('Failed to load leads. Please try again later.');
      }
      setLoading(false);
    });

    // Load saved filters
    const fq = query(
      collection(db, 'users', auth.currentUser.uid, 'savedSearches'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeFilters = onSnapshot(fq, (snapshot) => {
      const filters = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((s: any) => s.tool === 'leads');
      setSavedFilters(filters);
    });

    return () => {
      unsubscribe();
      unsubscribeFilters();
    };
  }, [userRole]);

  const handleSaveFilter = async () => {
    if (!auth.currentUser || !leadFilter.trim()) return;
    
    setIsSavingFilter(true);
    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'savedSearches'), {
        agentUid: auth.currentUser.uid,
        name: `Filter: ${leadFilter}`,
        tool: 'leads',
        params: { filter: leadFilter },
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Save Filter Error:", error);
    } finally {
      setIsSavingFilter(false);
    }
  };

  const handleDeleteFilter = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'savedSearches', id));
    } catch (error) {
      console.error("Delete Filter Error:", error);
    }
  };

  const filteredLeads = leads.filter(l => 
    l.address.toLowerCase().includes(leadFilter.toLowerCase()) ||
    l.phone.includes(leadFilter) ||
    l.status.toLowerCase().includes(leadFilter.toLowerCase())
  );

  if (loading && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
          <p className="text-slate-500 font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="bg-white border-b border-brand-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center shadow-lg shadow-brand-accent/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-brand-ink tracking-tight">EstateFlow AI</h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Agent Command Center</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-brand-ink">{auth.currentUser?.displayName}</span>
                <span className="text-[10px] text-brand-accent uppercase font-bold tracking-wider">{userRole || 'Agent'}</span>
              </div>
              <img 
                src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.displayName}`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-brand-border"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => auth.signOut()}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogIn className="w-5 h-5 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            label="Total Leads" 
            value={leads.length.toString()} 
            icon={Users}
            trend="+12% this week"
          />
          <StatCard 
            label="Hot Leads" 
            value={leads.filter(l => l.status === 'hot').length.toString()} 
            icon={Star}
            trend="+2"
          />
          <StatCard 
            label="AI Insights" 
            value="14" 
            icon={Sparkles}
            trend="New opportunities"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-brand-border w-fit mb-8">
          <button
            onClick={() => setActiveTab('leads')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'leads' ? "bg-brand-ink text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Leads
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'insights' ? "bg-brand-ink text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Sparkles className="w-4 h-4" />
            AI Tools
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'leads' ? (
            <motion.div
              key="leads"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Filters & Actions */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-brand-border shadow-sm">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search leads by address or phone..."
                    value={leadFilter}
                    onChange={(e) => setLeadFilter(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-brand-muted border border-brand-border focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button 
                    onClick={handleSaveFilter}
                    disabled={isSavingFilter || !leadFilter}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white border border-brand-border text-brand-ink font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    <Bookmark className="w-4 h-4" />
                    Save Filter
                  </button>
                </div>
              </div>

              {/* Saved Filters */}
              {savedFilters.length > 0 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">Saved:</span>
                  {savedFilters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setLeadFilter(filter.params.filter)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-brand-border text-sm font-medium text-slate-600 hover:border-brand-accent hover:text-brand-accent transition-all whitespace-nowrap group"
                    >
                      {filter.name.replace('Filter: ', '')}
                      <Trash2 
                        className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" 
                        onClick={(e) => handleDeleteFilter(e, filter.id)}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Leads List */}
              <div className="bg-white rounded-[40px] border border-brand-border shadow-sm overflow-hidden">
                {loading ? (
                  <div className="p-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
                    <p className="text-slate-500 font-medium">Loading your leads...</p>
                  </div>
                ) : error ? (
                  <div className="p-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                      <X className="w-8 h-8 text-red-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-brand-ink">Connection Issue</h3>
                      <p className="text-slate-500 max-w-md mx-auto">{error}</p>
                    </div>
                  </div>
                ) : filteredLeads.length > 0 ? (
                  <div className="divide-y divide-brand-border">
                    {filteredLeads.map((lead) => (
                      <LeadRow key={lead.id} lead={lead} onLaunchAd={(l) => {
                        setSelectedLeadForAd(l);
                        setIsAdModalOpen(true);
                      }} />
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center space-y-6">
                    <div className="w-20 h-20 bg-brand-muted rounded-full flex items-center justify-center mx-auto">
                      <Users className="w-10 h-10 text-slate-300" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-brand-ink">No leads found</h3>
                      <p className="text-slate-500 max-w-sm mx-auto">
                        {leadFilter 
                          ? `No leads match "${leadFilter}". Try a different search term.`
                          : "You don't have any leads assigned to you yet. New leads from the landing page will appear here."}
                      </p>
                    </div>
                    {!leadFilter && (
                      <button 
                        onClick={async () => {
                          if (!auth.currentUser) return;
                          await addDoc(collection(db, 'leads'), {
                            address: '123 AI Avenue, Silicon Valley, CA',
                            phone: '555-0123',
                            status: 'new',
                            agentUid: auth.currentUser.uid,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp()
                          });
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-accent text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-accent/20"
                      >
                        <Rocket className="w-5 h-5" />
                        Create Sample Lead
                      </button>
                    )}
                  </div>
                )}
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
      </main>

      {selectedLeadForAd && (
        <FacebookAdModal
          isOpen={isAdModalOpen}
          onClose={() => {
            setIsAdModalOpen(false);
            setSelectedLeadForAd(null);
          }}
          lead={selectedLeadForAd}
        />
      )}
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
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [newPhotoURL, setNewPhotoURL] = useState(lead.photoURL || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const streetViewUrl = mapsApiKey 
    ? `https://maps.googleapis.com/maps/api/streetview?size=400x400&location=${encodeURIComponent(lead.address)}&key=${mapsApiKey}`
    : `https://picsum.photos/seed/${encodeURIComponent(lead.address)}/400/400`;

  const displayPhoto = lead.photoURL || streetViewUrl;

  const handleUpdatePhoto = async () => {
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'leads', lead.id), {
        photoURL: newPhotoURL,
        updatedAt: serverTimestamp()
      });
      setIsEditingPhoto(false);
    } catch (error) {
      console.error("Error updating photo:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedDate = lead.createdAt?.seconds 
    ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString()
    : 'Recently';

  return (
    <motion.div 
      whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
      className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group/row"
    >
      <div className="flex items-start gap-4 flex-1">
        {/* Property Thumbnail */}
        <div className="relative shrink-0 group/photo">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-brand-muted">
            <img 
              src={displayPhoto} 
              alt="Property" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/placeholder/400/400';
              }}
            />
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingPhoto(true);
            }}
            className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-lg text-slate-400 hover:text-brand-accent opacity-0 group-hover/photo:opacity-100 transition-opacity border border-slate-100"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1 flex-1">
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</span>
            {lead.budget && <span className="flex items-center gap-1 font-medium text-emerald-600">Budget: {lead.budget}</span>}
            {lead.timeline && <span className="flex items-center gap-1 font-medium text-blue-600">Timeline: {lead.timeline}</span>}
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formattedDate}</span>
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

      {/* Photo Edit Modal Overlay (Inline) */}
      <AnimatePresence>
        {isEditingPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-ink/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-brand-ink">Update Property Photo</h3>
                <button onClick={() => setIsEditingPhoto(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="aspect-video rounded-2xl overflow-hidden border border-brand-border bg-brand-muted">
                  <img 
                    src={newPhotoURL || streetViewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Photo URL</label>
                  <input 
                    type="text" 
                    value={newPhotoURL}
                    onChange={(e) => setNewPhotoURL(e.target.value)}
                    placeholder="Paste image URL here..."
                    className="w-full bg-brand-muted border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-accent outline-none"
                  />
                  <p className="text-[10px] text-slate-400 px-1">
                    Tip: If empty, we'll use Google Street View for {lead.address}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditingPhoto(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-slate-500 hover:bg-brand-muted transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdatePhoto}
                  disabled={isUpdating}
                  className="flex-1 bg-brand-accent text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Photo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
