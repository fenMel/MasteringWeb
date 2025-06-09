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
  coefClarte?: number;
  coefContenu?: number;
  coefPertinence?: number;
  coefPresentation?: number;
  coefReponses?: number;
}
interface Critere {
  id: number;
  nom: string;
  description: string;
  coefficient: number;
}

export interface FiltresEvaluation {
  dateRange: string;
  statut: string;
  candidat: string;
}