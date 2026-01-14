
export interface User {
  id: string;
  name: string;
  email: string;
  skinType?: string;
}

export interface SkinIssue {
  id: string;
  label: string;
  icon: string;
}

export interface Detection {
  label: string;
  box_2d: number[]; // [ymin, xmin, ymax, xmax] in 0-1000 scale
}

export interface AnalysisResult {
  condition: string;
  confidence: number;
  description: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  recommendations: string[];
  suggestedIngredients: string[];
  disclaimer: string;
  detections: Detection[];
}

export interface HistoryItem {
  id: string;
  date: string;
  condition: string;
  image: string;
  result: AnalysisResult;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type AppView = 'login' | 'dashboard' | 'scanner' | 'results';
