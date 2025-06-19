export interface Formation {
  id: number;
  nom: string;
  description: string;
}

export interface UserDTO {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
}

export interface SessionFormation {
  id?: number;
  titre: string;
  description: string;
  dateDebut: string; // ISO date string
  dateFin: string;
  formation: Formation;
  candidats: UserDTO[];
  nombreCandidats?: number;
}

export interface SessionFormationDTO {
  id?: number;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  formationId: number;
  candidatsIds: number[];
  nbCandidats?: number;
}


export type SessionFormModel = {
  id?: number;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  formation: Formation;
  candidatsIds: number[];
};
