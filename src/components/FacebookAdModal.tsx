import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Facebook, Rocket, CheckCircle2, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { Lead } from '../types';

interface FacebookAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export default function FacebookAdModal({ isOpen, onClose, lead }: FacebookAdModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/auth/facebook/status');
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (error) {
      console.error("Failed to check connection:", error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/auth/facebook/url');
      const { url } = await response.json();
      
      const authWindow = window.open(url, 'facebook_oauth', 'width=600,height=700');
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          setIsConnected(true);
          setIsConnecting(false);
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error("Failed to get auth URL:", error);
      setIsConnecting(false);
    }
  };

  const handleLaunch = async () => {
    if (!lead) return;
    setIsLaunching(true);
    setStatus('idle');
    
    try {
      const response = await fetch('/api/ads/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadAddress: lead.address,
          leadPhone: lead.phone
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.error || "Failed to launch ad");
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage("Network error occurred");
    } finally {
      setIsLaunching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl">
              <Facebook className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Launch Facebook Ad</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {!isConnected ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto">
                <Facebook className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Connect to Facebook</h3>
                <p className="text-slate-500 max-w-xs mx-auto">
                  Connect your Facebook Ad Account to start launching automated real estate ads.
                </p>
              </div>
              <button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Facebook className="w-5 h-5" />}
                Connect Facebook Account
              </button>
            </div>
          ) : status === 'success' ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Ad Campaign Launched!</h3>
                <p className="text-slate-500">
                  A new campaign has been created for <span className="font-bold text-slate-900">{lead?.address}</span>. Check your Facebook Ads Manager to finalize.
                </p>
              </div>
              <button 
                onClick={onClose}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Property</p>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <p className="font-bold text-slate-900">{lead?.address}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Ad Objective</span>
                  <span className="font-bold text-slate-900">Lead Generation</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Special Category</span>
                  <span className="font-bold text-slate-900">Housing (Required)</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Initial Status</span>
                  <span className="font-bold text-blue-600">Paused (Draft)</span>
                </div>
              </div>

              {status === 'error' && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{errorMessage}</p>
                </div>
              )}

              <button 
                onClick={handleLaunch}
                disabled={isLaunching}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLaunching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                Launch Campaign Now
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
