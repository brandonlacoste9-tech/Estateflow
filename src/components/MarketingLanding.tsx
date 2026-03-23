import { motion } from 'motion/react';
import { Sparkles, Users, TrendingUp, Rocket, Shield, MessageSquare, ArrowRight, Building2, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';

interface MarketingLandingProps {
  onTryDemo: () => void;
  onLogin: () => void;
}

export default function MarketingLanding({ onTryDemo, onLogin }: MarketingLandingProps) {
  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative pt-12 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-accent/10 text-brand-accent text-sm font-bold border border-brand-accent/20"
          >
            <Sparkles className="w-4 h-4" />
            The Future of Real Estate Lead Gen
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-brand-ink tracking-tight leading-[0.9]"
          >
            AI That Qualifies Your <br />
            <span className="text-brand-accent italic font-serif">Leads While You Sleep.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 max-w-2xl mx-auto font-medium"
          >
            Stop chasing cold leads. EstateFlow AI uses advanced conversational intelligence to qualify sellers, estimate home values, and book appointments for you.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button 
              onClick={onTryDemo}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-ink text-white font-bold text-lg hover:opacity-90 transition-all shadow-xl shadow-brand-ink/20 flex items-center justify-center gap-2 group"
            >
              Try the Lead Capture Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-brand-border text-brand-ink font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-5 h-5" />
              Agent Dashboard
            </button>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-10 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-brand-ink/5 rounded-full blur-3xl animate-pulse" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<MessageSquare className="w-8 h-8" />}
            title="Conversational AI"
            description="Our AI chats with sellers to gather budget, timeline, and motivation before you ever pick up the phone."
          />
          <FeatureCard 
            icon={<TrendingUp className="w-8 h-8" />}
            title="Smart Valuation"
            description="Provide instant, data-driven home estimates that hook sellers and build immediate trust."
          />
          <FeatureCard 
            icon={<Rocket className="w-8 h-8" />}
            title="Ad Generation"
            description="One-click Facebook and Instagram ad creation for your hottest leads to keep your pipeline full."
          />
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-[48px] border border-brand-border shadow-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="p-12 space-y-8 relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-brand-ink">The Agent Command Center</h2>
                <p className="text-slate-500 font-medium">Manage your entire business from one AI-powered dashboard.</p>
              </div>
              <div className="w-12 h-12 bg-brand-ink rounded-2xl flex items-center justify-center text-white">
                <LayoutDashboard className="w-6 h-6" />
              </div>
            </div>
            <div className="aspect-video rounded-3xl bg-brand-muted border border-brand-border overflow-hidden shadow-inner">
              <img 
                src="https://picsum.photos/seed/dashboard-preview/1200/800" 
                alt="Dashboard Preview" 
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-brand-ink py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-12">
          <h2 className="text-4xl font-bold tracking-tight">Built for Modern Realtors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <TrustStat value="500+" label="Active Agents" />
            <TrustStat value="12k+" label="Leads Qualified" />
            <TrustStat value="94%" label="Accuracy Rate" />
            <TrustStat value="3.5x" label="ROI Increase" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-8">
        <h2 className="text-4xl font-bold text-brand-ink">Ready to automate your growth?</h2>
        <p className="text-xl text-slate-600">Join hundreds of agents who are using AI to dominate their local market.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onTryDemo}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-accent text-white font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-brand-accent/20"
          >
            Start Free Trial
          </button>
          <button 
            onClick={onLogin}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-ink text-white font-bold text-lg hover:opacity-90 transition-all"
          >
            Agent Login
          </button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-brand-border shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group">
      <div className="w-16 h-16 bg-brand-muted rounded-2xl flex items-center justify-center text-brand-ink mb-6 group-hover:bg-brand-accent group-hover:text-white transition-all">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-brand-ink mb-2">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
    </div>
  );
}

function TrustStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="space-y-2">
      <div className="text-4xl font-black text-brand-accent">{value}</div>
      <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}
