export interface Decision {
  id: number;
  candidat: { nom: string; prenom: string; };
  jury: { nom: string; prenom: string; };
  verdict?: string;
  dateHeure: Date | string | null;
  commentaireFinal?: string;
  evaluation?: { moyenne: number; [key: string]: any };
}