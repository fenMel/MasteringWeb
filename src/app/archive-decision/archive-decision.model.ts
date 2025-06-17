export interface ArchiveDecision {
  id: number;
  candidatId: number;
  candidatNom: string;      
  candidatPrenom: string;   
  juryId: number;
  juryNom: string;          
  juryPrenom: string;      
  moyenne: number;
  commentaire: string;
  verdict: string;
  dateArchivage: string;
  archivePar: string;
}