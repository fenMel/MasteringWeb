import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';
import { AuthService } from './auth.service';
import { ArchiveDecision } from '../archive-decision/archive-decision.model'; // Import du modèle

@Injectable({
  providedIn: 'root'
})
export class ArchiveDecisionService {
  private apiUrl = environment.apiUrl;

  constructor(private authService: AuthService, private http: HttpClient) {}

  /**
   * Génère les en-têtes HTTP avec le token d'authentification.
   */
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: 'Bearer ' + this.authService.getToken()
    });
  }

  /**
   * Récupère toutes les décisions archivées depuis l'API.
   */
  getAll(): Observable<ArchiveDecision[]> {
    return this.http.get<ArchiveDecision[]>(`${this.apiUrl}/api/archive-decisions`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des archives:', error);
        return of([]);
      })
    );
  }

  /**
   * Archive une décision via l'API.
   */
  archive(decision: ArchiveDecision): Observable<ArchiveDecision> {
    return this.http.post<ArchiveDecision>(`${this.apiUrl}/api/archive-decisions`, decision, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'archivage de la décision:', error);
        return of(null as any);
      })
    );
  }
}