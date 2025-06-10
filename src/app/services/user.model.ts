
export interface User {
  role: string;
  id: any;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  roleName: 'COORDINATEUR' | 'JURY' | 'CANDIDAT';
}
