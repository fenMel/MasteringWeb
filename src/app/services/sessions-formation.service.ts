import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Formation, SessionFormation, SessionFormationDTO } from '../sessions-formation/session-formation.model';
import { environment } from '../../environments/environment.prod';
import { AuthService } from './auth.service';
import { UserDTO } from '../sessions-formation/session-formation.model';


@Injectable({
  providedIn: 'root'
})
export class SessionsFormationService {

  private apiUrl = `${environment.apiUrl}/api/sessionsFormation`;
 private selectedSession?: SessionFormation;
 constructor(private http: HttpClient, private authService: AuthService) {}
 private getAuthHeaders(): HttpHeaders {
   return new HttpHeaders({
     Authorization: 'Bearer ' + this.authService.getToken()
   });
 }

  // ✅ Récupérer toutes les sessions avec formation et candidats
  getSessionsFormationAvecFormationEtUsers( ): Observable<SessionFormation[]> {
    return this.http.get<SessionFormation[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  // ✅ Ajouter une session
  CreateSessionFormation(sessionDTO: SessionFormationDTO): Observable<SessionFormation> {
    return this.http.post<SessionFormation>(this.apiUrl, sessionDTO, {
      headers: this.getAuthHeaders()
    });
  }

//   // ✅ Modifier une session
//   modifierSession(dto: SessionFormationDTO): Observable<SessionFormation> {
//   return this.http.put<SessionFormation>(`${this.apiUrl}/${dto.id}`, dto, {
//     headers: this.getAuthHeaders()
//   });
// }

  // ✅ Supprimer une session
  supprimerSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ✅ Récupérer une session par ID
  getSessionById(id: number): Observable<SessionFormation> {
    return this.http.get<SessionFormation>(`${this.apiUrl}/id/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ✅ Récupérer toutes les formations
  getAllFormations(): Observable<Formation[]> {
    return this.http.get<Formation[]>(`${environment.apiUrl}/api/formations`, {
      headers: this.getAuthHeaders()
    });
  }

  // ✅ Récupérer tous les candidats (utilisateurs avec rôle 'candidat')
  getCandidats(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${environment.apiUrl}/api/candidats`, {
      headers: this.getAuthHeaders()
    });
  }

  // ✅ Stocker une session sélectionnée temporairement
  setSelectedSession(session: SessionFormation | undefined): void {
    this.selectedSession = session;
  }

  getSelectedSession(): SessionFormation | undefined {
    return this.selectedSession;
  }

  // ✅ Récupérer tous les candidats (utilisateurs avec rôle 'candidat')
getAllCandidats(role: string = 'CANDIDAT'): Observable<UserDTO[]> {
  return this.http.get<UserDTO[]>(`${environment.apiUrl}/api/users/role/${role}`, {
    headers: this.getAuthHeaders()
  });
}


// ✅ Mettre à jour une session de formation
modifierSession(dto: SessionFormationDTO): Observable<SessionFormation> {
  return this.http.put<SessionFormation>(`${this.apiUrl}/sessions/${dto.id}`, dto, {
    headers: this.getAuthHeaders()
  });
}
updateSession(id: number, session: SessionFormationDTO): Observable<SessionFormationDTO> {
    return this.http.put<SessionFormationDTO>(`${this.apiUrl}api/sessionsFormation/${id}`, session);
  }


  getAllSessions(): Observable<SessionFormation[]> {
  return this.http.get<SessionFormation[]>(`${this.apiUrl}/api/sessionsFormation`);
}

}

export type { SessionFormation };
