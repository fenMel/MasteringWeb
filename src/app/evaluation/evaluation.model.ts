
export interface Evaluation {
    id: number;
    candidat: string;
    sujet: string;
    dateHeure: Date;
    statut: 'Non Évalué' | 'Évalué';
    // Autres champs au besoin
  }
  export interface FiltresEvaluation {
    dateRange: string;
    statut: string;
    candidat: string;
  }