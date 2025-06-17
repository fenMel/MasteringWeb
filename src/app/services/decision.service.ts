import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';
import { AuthService } from './auth.service';
import { Decision } from '../decision/decision.model';

@Injectable({ providedIn: 'root' })
export class DecisionService {
  // URL de base de l'API définie dans l'environnement de production
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
   * Récupère toutes les décisions depuis l'API.
   * @returns Observable contenant la liste des décisions.
   */
  getAllDecisions(): Observable<Decision[]> {
    return this.http.get<Decision[]>(`${this.apiUrl}/api/decisions`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des décisions:', error);
        return of([]); // Retourne un tableau vide en cas d'erreur
      })
    );
  }

  /**
   * Récupère les décisions associées à un candidat spécifique.
   * @param candidatId ID du candidat concerné
   * @returns Observable contenant les décisions du candidat
   */
  getDecisionsByCandidat(candidatId: number): Observable<Decision[]> {
    return this.http.get<Decision[]>(`${this.apiUrl}/api/decisions/candidat/${candidatId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des décisions du candidat:', error);
        return of([]);
      })
    );
  }

  /**
   * Ajoute une nouvelle décision via l'API.
   * @param data Données de la décision à ajouter
   * @returns Observable du résultat de la requête
   */
  addDecision(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/decisions`, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'ajout de la décision:', error);
        return of(null);
      })
    );
  }


  /**
   * Supprime une décision et envoie le nom/prénom de l'utilisateur dans le header X-User.
   * @param id ID de la décision à supprimer
   * @param utilisateur Nom et prénom de l'utilisateur (string)
   * @returns Observable du résultat de la requête
   */
  deleteDecision(id: number, utilisateur: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/decisions/${id}`, {
      headers: this.getAuthHeaders().set('X-User', utilisateur)
    });
  }
}
