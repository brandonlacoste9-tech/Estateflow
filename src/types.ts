export interface Lead {
  id: string;
  address: string;
  phone: string;
  status: 'new' | 'qualifying' | 'hot' | 'dead';
  score: number;
  aiSummary?: string;
  budget?: string;
  timeline?: string;
  transcript?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface Message {
  id: string;
  leadId: string;
  role: 'user' | 'bot';
  content: string;
  createdAt: any; // Firestore Timestamp
}

export interface LeadIntent {
  budget?: string;
  timeline?: string;
  leadType: 'buyer' | 'seller' | 'both';
  score: number;
  summary: string;
}
