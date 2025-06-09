export interface Evaluation {
  juryId: any;
  id: number;
  candidat: { 
    nom: string;
    prenom: string;
  };
  sujet: string;
dateHeure:Date| null; // Modification ici
  statut: 'Non Évalué' | 'Évalué';
  candidatId: number;
}

export interface FiltresEvaluation {
  dateRange: string;
  statut: string;
  candidat: string;
}