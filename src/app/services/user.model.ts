
export interface User {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  roleName: 'COORDINATEUR' | 'JURY' | 'CANDIDAT';
}
