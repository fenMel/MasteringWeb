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
  
dateHeure:Date| null; // Modification ici
  sujet: string;
  statut: string;
  juryId?: number;

}

export interface FiltresEvaluation {
  dateRange: string;
  statut: string;
  candidat: string;
}