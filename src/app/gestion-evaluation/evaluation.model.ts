export interface Evaluation {
  id: number;
  candidatId: number;
  candidat: { 
    nom: string;
    prenom: string;
  };
  jury: { 
    nom: string;
    prenom: string;
  }; 
  sujet: string;
  dateHeure: Date;
  statut: string;
  juryId?: number;

}

export interface FiltresEvaluation {
  dateRange: string;
  statut: string;
  candidat: string;
}