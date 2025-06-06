export interface Evaluation {
  id: number;
  candidat: { 
    nom: string;
    prenom: string;
  };
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