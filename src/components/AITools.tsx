import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Map, Image as ImageIcon, Sparkles, Loader2, ExternalLink, Maximize2, Globe, Bookmark, Trash2, History } from 'lucide-react';
import { getMarketTrends, getLocalRealEstateInsights, generatePropertyVisualization, analyzeListingUrl } from '../services/geminiService';
import { cn } from '../lib/utils';
import { collection, addDoc, serverTimestamp, query, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';

type Tool = 'search' | 'maps' | 'image' | 'crawl';

export default function AITools() {
  const [activeTool, setActiveTool] = useState<Tool>('search');
  const [queryText, setQueryText] = useState('');
  const [location, setLocation] = useState('San Francisco, CA');
  const [aspectRatio, setAspectRatio] = useState<any>("16:9");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'savedSearches'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const searches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedSearches(searches);
    });

    return () => unsubscribe();
  }, []);

  const handleRunTool = async () => {
    setLoading(true);
    setResult(null);
    try {
      if (activeTool === 'search') {
        const data = await getMarketTrends(location);
        setResult(data);
      } else if (activeTool === 'maps') {
        const data = await getLocalRealEstateInsights(location, queryText || "top rated schools and amenities");
        setResult(data);
      } else if (activeTool === 'image') {
        const imageUrl = await generatePropertyVisualization(queryText || "A modern luxury home with large windows and a pool at sunset", aspectRatio);
        setResult({ imageUrl });
      } else if (activeTool === 'crawl') {
        const data = await analyzeListingUrl(queryText);
        setResult(data);
      }
    } catch (error) {
      console.error("Tool Error:", error);
      setResult({ error: "Failed to process request. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!auth.currentUser) return;
    
    setIsSaving(true);
    try {
      const name = activeTool === 'search' ? `Market: ${location}` : 
                   activeTool === 'maps' ? `Local: ${location}` :
                   activeTool === 'crawl' ? `Listing: ${queryText.substring(0, 20)}...` :
                   `Visual: ${queryText.substring(0, 20)}...`;

      await addDoc(collection(db, 'users', auth.currentUser.uid, 'savedSearches'), {
        agentUid: auth.currentUser.uid,
        name,
        tool: activeTool,
        params: {
          location,
          query: queryText,
          aspectRatio
        },
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Save Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSearch = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'savedSearches', id));
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const loadSavedSearch = (search: any) => {
    setActiveTool(search.tool);
    setLocation(search.params.location || '');
    setQueryText(search.params.query || '');
    setAspectRatio(search.params.aspectRatio || '16:9');
    setResult(null);
  };

  return (
    <div className="bg-white rounded-[40px] border border-brand-border overflow-hidden shadow-sm flex flex-col md:flex-row h-[700px]">
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-brand-muted border-r border-brand-border flex flex-col">
        <div className="p-6 space-y-2 overflow-y-auto flex-1">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-2">AI Power Tools</h3>
          
          <ToolButton 
            active={activeTool === 'search'} 
            onClick={() => setActiveTool('search')}
            icon={Search}
            label="Market Trends"
            description="Google Search Grounding"
          />
          <ToolButton 
            active={activeTool === 'maps'} 
            onClick={() => setActiveTool('maps')}
            icon={Map}
            label="Local Insights"
            description="Google Maps Grounding"
          />
          <ToolButton 
            active={activeTool === 'crawl'} 
            onClick={() => setActiveTool('crawl')}
            icon={Globe}
            label="Listing Analyzer"
            description="URL Context Crawling"
          />
          <ToolButton 
            active={activeTool === 'image'} 
            onClick={() => setActiveTool('image')}
            icon={ImageIcon}
            label="Property Visualizer"
            description="Gemini Image Gen"
          />

          {savedSearches.length > 0 && (
            <div className="pt-8 space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Saved Searches</h3>
                <History className="w-3 h-3 text-slate-400" />
              </div>
              <div className="space-y-1">
                {savedSearches.map((search) => (
                  <button
                    key={search.id}
                    onClick={() => loadSavedSearch(search)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white hover:shadow-sm transition-all group text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 border border-brand-border">
                        {search.tool === 'search' ? <Search className="w-4 h-4 text-slate-400" /> :
                         search.tool === 'maps' ? <Map className="w-4 h-4 text-slate-400" /> :
                         search.tool === 'crawl' ? <Globe className="w-4 h-4 text-slate-400" /> :
                         <ImageIcon className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-600 truncate">{search.name}</p>
                        <p className="text-[10px] text-slate-400">{new Date(search.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteSearch(e, search.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-brand-border space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            {activeTool !== 'crawl' && (
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Location</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Neighborhood..."
                  className="w-full bg-brand-muted border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-accent outline-none"
                />
              </div>
            )}
            {activeTool !== 'search' && (
              <div className="flex-[2] space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  {activeTool === 'maps' ? 'What are you looking for?' : activeTool === 'crawl' ? 'Listing URL' : 'Image Prompt'}
                </label>
                <input 
                  type="text" 
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder={activeTool === 'maps' ? "e.g. Best coffee shops, commute times..." : activeTool === 'crawl' ? "https://www.zillow.com/homedetails/..." : "e.g. Modern kitchen with marble island..."}
                  className="w-full bg-brand-muted border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-accent outline-none"
                />
              </div>
            )}
          </div>

          {activeTool === 'image' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Aspect Ratio</label>
              <div className="flex flex-wrap gap-2">
                {["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                      aspectRatio === ratio 
                        ? "bg-brand-ink text-white border-brand-ink shadow-md" 
                        : "bg-white text-slate-500 border-brand-border hover:border-slate-400"
                    )}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={handleRunTool}
              disabled={loading}
              className="flex-1 bg-brand-accent text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-brand-accent/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? 'Processing with AI...' : `Run ${activeTool === 'search' ? 'Market Analysis' : activeTool === 'maps' ? 'Local Search' : 'Visualization'}`}
            </button>
            <button 
              onClick={handleSaveSearch}
              disabled={isSaving || (!location && !queryText)}
              className="px-6 bg-white border border-brand-border text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-muted transition-all active:scale-[0.98] disabled:opacity-50"
              title="Save Search"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bookmark className="w-5 h-5" />}
              <span className="hidden md:inline">Save</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-brand-muted/30">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key={activeTool + (result.imageUrl || 'text')}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {result.error ? (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-medium">
                    {result.error}
                  </div>
                ) : activeTool === 'image' ? (
                  <div className="space-y-4">
                    <div className="relative group rounded-3xl overflow-hidden shadow-2xl border border-white">
                      <img src={result.imageUrl} alt="Generated Property" className="w-full h-auto" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="p-3 bg-white rounded-full text-brand-ink shadow-xl">
                          <Maximize2 className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 text-center font-medium italic">AI Generated Property Visualization • {aspectRatio}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="prose prose-slate max-w-none">
                      <div className="bg-white p-6 rounded-3xl border border-brand-border shadow-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                        {result.text}
                      </div>
                    </div>
                    
                    {result.groundingChunks && result.groundingChunks.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Sources & Grounding</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {result.groundingChunks.map((chunk: any, i: number) => {
                            const source = chunk.web || chunk.maps;
                            if (!source) return null;
                            return (
                              <a 
                                key={i}
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-white rounded-2xl border border-brand-border hover:border-brand-accent transition-colors group"
                              >
                                <span className="text-xs font-bold text-slate-600 truncate mr-2">{source.title || source.uri}</span>
                                <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-brand-accent" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <div className="w-16 h-16 bg-brand-muted rounded-3xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-400">Ready for AI Analysis</p>
                  <p className="text-sm text-slate-400">Configure your tool above and click run.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ active, onClick, icon: Icon, label, description }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-left group",
        active 
          ? "bg-white shadow-md border border-brand-border" 
          : "hover:bg-brand-muted"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
        active ? "bg-brand-accent text-white" : "bg-brand-muted text-slate-500 group-hover:bg-slate-300"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className={cn("text-sm font-bold", active ? "text-brand-ink" : "text-slate-600")}>{label}</p>
        <p className="text-[10px] text-slate-400 font-medium">{description}</p>
      </div>
    </button>
  );
}
