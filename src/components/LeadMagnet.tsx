import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, ArrowRight, CheckCircle2, Home, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

interface LeadMagnetProps {
  onLeadCaptured: (lead: { id: string; address: string; phone: string }) => void;
}

export default function LeadMagnet({ onLeadCaptured }: LeadMagnetProps) {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const hasApiKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        setAddress(place.formatted_address);
      }
    }
  };

  const handleNext = () => {
    if (step === 1 && address.trim()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'leads'), {
        address,
        phone,
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      onLeadCaptured({ id: docRef.id, address, phone });
      setStep(3);
    } catch (error) {
      console.error('Error adding lead:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 text-center"
            >
              {/* Home Images at the Top */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border-2 border-white"
                >
                  <img src="https://picsum.photos/seed/home-modern/600/450" alt="Modern Home" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border-2 border-white -translate-y-4"
                >
                  <img src="https://picsum.photos/seed/home-luxury/600/450" alt="Luxury Home" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border-2 border-white"
                >
                  <img src="https://picsum.photos/seed/home-suburban/600/450" alt="Suburban Home" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </motion.div>
              </div>

              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-sm font-medium border border-brand-accent/20">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Valuation
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-ink">
                  What is your home <span className="text-brand-accent italic font-serif">really</span> worth?
                </h1>
                <p className="text-lg text-slate-600 max-w-md mx-auto">
                  Get an instant, data-driven estimate based on recent neighborhood sales and market trends.
                </p>
              </div>

              <div className="relative max-w-md mx-auto">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 z-10">
                  <MapPin className="w-5 h-5" />
                </div>
                {isLoaded && hasApiKey ? (
                  <Autocomplete
                    onLoad={onAutocompleteLoad}
                    onPlaceChanged={onPlaceChanged}
                  >
                    <input
                      type="text"
                      placeholder="Enter your street address..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-brand-border shadow-sm focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all text-lg"
                    />
                  </Autocomplete>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter your street address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-brand-border shadow-sm focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all text-lg"
                  />
                )}
                <button
                  onClick={handleNext}
                  disabled={!address.trim()}
                  className="mt-4 w-full bg-brand-ink text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group shadow-xl shadow-brand-ink/10"
                >
                  Get My Estimate
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-8 pt-8 border-t border-brand-border">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-bold text-brand-ink">10k+</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Reports Sent</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-bold text-brand-ink">98%</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Accuracy Rate</span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-3xl shadow-xl border border-brand-border space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-brand-ink">Almost there!</h2>
                <p className="text-slate-600">
                  Where should we send your personalized home value report for <span className="font-semibold text-brand-ink">{address}</span>?
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-brand-muted border border-brand-border focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all text-lg"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !phone.trim()}
                  className="w-full bg-brand-accent text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-brand-accent/20"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      See My Value Now
                      <Sparkles className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-slate-400">
                  By clicking, you agree to receive automated messages. Reply STOP to opt-out.
                </p>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-brand-accent blur-2xl opacity-20 animate-pulse" />
                <CheckCircle2 className="w-20 h-20 text-brand-accent relative" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-brand-ink">Calculation Started!</h2>
                <p className="text-lg text-slate-600">
                  Our AI is analyzing neighborhood sales for <span className="font-semibold">{address}</span>.
                </p>
                <p className="text-brand-accent font-medium bg-brand-accent/10 py-2 px-4 rounded-full inline-block mt-4">
                  Check your phone in 60 seconds!
                </p>
              </div>
              
              <div className="pt-8">
                <button 
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:text-brand-ink font-medium flex items-center gap-2 mx-auto"
                >
                  <Home className="w-4 h-4" />
                  Back to Home
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
