import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateInitialMessage, analyzeLeadIntent } from '../services/geminiService';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: any;
}

interface ChatInterfaceProps {
  leadId: string;
  address: string;
  onComplete: (transcript: string) => void;
}

export default function ChatInterface({ leadId, address, onComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'leads', leadId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        role: doc.data().role,
        content: doc.data().content,
        timestamp: doc.data().createdAt
      })) as Message[];
      setMessages(msgs);

      // If no messages yet, send initial AI message
      if (snapshot.empty && !isTyping) {
        sendInitialAI();
      }
    });

    return () => unsubscribe();
  }, [leadId]);

  const sendInitialAI = async () => {
    setIsTyping(true);
    try {
      const initialText = await generateInitialMessage(address);
      await addDoc(collection(db, 'leads', leadId, 'messages'), {
        leadId,
        role: 'bot',
        content: initialText || 'Hello! I noticed you were interested in a valuation for your home. Have you done any recent renovations?',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to send initial AI message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userContent = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // 1. Add user message to Firestore
      await addDoc(collection(db, 'leads', leadId, 'messages'), {
        leadId,
        role: 'user',
        content: userContent,
        createdAt: serverTimestamp()
      });

      // 2. Update lead status to qualifying
      await updateDoc(doc(db, 'leads', leadId), {
        status: 'qualifying',
        updatedAt: serverTimestamp()
      });

      // 3. If we have enough messages, analyze intent
      if (messages.length >= 4) {
        const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n') + `\nuser: ${userContent}`;
        const intent = await analyzeLeadIntent(transcript);
        
        await updateDoc(doc(db, 'leads', leadId), {
          score: intent.score,
          aiSummary: intent.summary,
          budget: intent.budget,
          timeline: intent.timeline,
          status: intent.score > 70 ? 'hot' : 'qualifying',
          transcript: transcript,
          updatedAt: serverTimestamp()
        });

        // Final AI message
        await addDoc(collection(db, 'leads', leadId, 'messages'), {
          leadId,
          role: 'bot',
          content: "Thanks for sharing! Agent Sarah will review this and get back to you with a detailed report shortly.",
          createdAt: serverTimestamp()
        });
        
        onComplete(transcript);
      }
    } catch (error) {
      console.error('Error in chat flow:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">EstateFlow Assistant</p>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">AI Qualifying</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex items-end gap-2 max-w-[80%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-600"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "p-3 rounded-2xl text-sm shadow-sm",
                msg.role === 'user' ? "bg-slate-900 text-white rounded-br-none" : "bg-white border border-slate-100 rounded-bl-none"
              )}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="bg-white border border-slate-100 p-3 rounded-2xl flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
