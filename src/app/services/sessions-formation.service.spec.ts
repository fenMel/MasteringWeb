import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Formation, SessionFormation, SessionFormationDTO, UserDTO } from '../sessions-formation/session-formation.model';
import { environment } from '../../environments/environment.prod';
import { AuthService } from './auth.service';
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
 getSessionsFormationAvecFormationEtUsers(): Observable<SessionFormation[]> {
   return this.http.get<SessionFormation[]>(this.apiUrl, {
     headers: this.getAuthHeaders()
   });
 }
 createSessionFormation(sessionDTO: SessionFormationDTO): Observable<SessionFormation> {
   return this.http.post<SessionFormation>(this.apiUrl, sessionDTO, {
     headers: this.getAuthHeaders()
   });
 }
 modifierSession(dto: SessionFormationDTO): Observable<SessionFormation> {
   return this.http.put<SessionFormation>(`${this.apiUrl}/sessions/${dto.id}`, dto, {
     headers: this.getAuthHeaders()
   });
 }
 supprimerSession(id: number): Observable<void> {
   return this.http.delete<void>(`${this.apiUrl}/${id}`, {
     headers: this.getAuthHeaders()
   });
 }
 getSessionById(id: number): Observable<SessionFormation> {
   return this.http.get<SessionFormation>(`${this.apiUrl}/id/${id}`, {
     headers: this.getAuthHeaders()
   });
 }
 getAllFormations(): Observable<Formation[]> {
   return this.http.get<Formation[]>(`${environment.apiUrl}/api/formations`, {
     headers: this.getAuthHeaders()
   });
 }
 getAllCandidats(role: string = 'CANDIDAT'): Observable<UserDTO[]> {
   return this.http.get<UserDTO[]>(`${environment.apiUrl}/api/users/role/${role}`, {
     headers: this.getAuthHeaders()
   });
 }
 setSelectedSession(session: SessionFormation | undefined): void {
   this.selectedSession = session;
 }
 getSelectedSession(): SessionFormation | undefined {
   return this.selectedSession;
 }
}