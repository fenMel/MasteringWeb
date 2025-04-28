
export interface Evaluation {
    id: number;
    candidat: string;
    sujet: string;
    dateHeure: Date;
    statut: 'Non Évalué' | 'Évalué';
    candidatId: number;
  }
  export interface FiltresEvaluation {
    dateRange: string;
    statut: string;
    candidat: string;
  }