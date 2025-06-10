import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, BehaviorSubject, map, catchError } from 'rxjs';
import { of } from 'rxjs';
import { Evaluation } from '../evaluation/evaluation.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private apiUrl = environment.apiUrl;

  private selectedCandidatId: number | null = null;
  private selectedEvaluationId: number | null = null;
  private viewMode: boolean = false;

  private selectedCandidatDetailsSource = new BehaviorSubject<any | null>(null);
  selectedCandidatDetails$ = this.selectedCandidatDetailsSource.asObservable();

  constructor(private authService: AuthService, private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: 'Bearer ' + this.authService.getToken()
    });
  }

  getAllEvaluations(): Observable<Evaluation[]> {
    return this.http.get<Evaluation[]>(`${this.apiUrl}/api/evaluations`, {
      headers: this.getAuthHeaders()
    });
  }

  getEvaluationsFiltered(dateRange: string, statut: string, candidat: string): Observable<Evaluation[]> {
    let params = new HttpParams();
    if (dateRange && dateRange !== 'Toutes les dates') params = params.set('dateRange', dateRange);
    if (statut && statut !== 'Tout les statuts') params = params.set('statut', statut);
    if (candidat) params = params.set('candidat', candidat);

    return this.http.get<any[]>(`${this.apiUrl}/api/evaluations`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      map(data => {
        console.log('Données brutes de l\'API:', data); // Debug
        return data.map(e => {
          console.log('Mapping évaluation dans service:', e); // Debug
          return {
            ...e, // Conserver toutes les propriétés originales
            dateHeure: e.dateHeure ? new Date(e.dateHeure) : null,
            sujet: e.sujet || 'Sujet non spécifié',
            statut: e.moyenne ? 'Évalué' : 'Non Évalué'
          };
        });
      }),
      catchError(error => {
        console.error('Erreur dans getEvaluationsFiltered:', error);
        return of([]); // Retourner un tableau vide en cas d'erreur
      })
    );
  }

  updateEvaluation(id: number, evaluation: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/evaluations/${id}`, evaluation, {
      headers: this.getAuthHeaders()
    });
  }

  evaluer(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/evaluations/${id}/evaluer`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  createEvaluation(evaluation: any): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.apiUrl}/api/evaluations`, evaluation, {
      headers: this.getAuthHeaders()
    });
  }

  getCurrentUser(): any {
    const token = this.authService.getToken();
    if (token) {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  getEvaluation(id: number): Observable<Evaluation> {
    return this.http.get<Evaluation>(`${this.apiUrl}/api/evaluations/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // --- CANDIDATS ---

  getCandidat(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/evaluations/candidat/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération du candidat:', error);
        return of(null);
      })
    );
  }

  getJury(id: number): Observable<{id: number, nom: string, prenom: string}> {
    return this.http.get<{id: number, nom: string, prenom: string}>(
      `${this.apiUrl}/api/evaluations/jury-info/${id}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération du jury:', error);
        return of({id: id, nom: 'Nom inconnu', prenom: 'Prénom inconnu'});
      })
    );
  }

  getCandidats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/evaluations/candidat`, {
      headers: this.getAuthHeaders()
    });
  }

  getCandidatsPresents(): Observable<any[]> {
    const params = new HttpParams().set('present', 'true');
    return this.http.get<any[]>(`${this.apiUrl}/api/evaluations/candidat`, { 
      headers: this.getAuthHeaders(), 
      params 
    });
  }

  getCandidatsParDate(date: string): Observable<any[]> {
    const params = new HttpParams().set('date', date).set('present', 'true');
    return this.http.get<any[]>(`${this.apiUrl}/api/evaluations/candidat`, { 
      headers: this.getAuthHeaders(), 
      params 
    });
  }

  getCandidatsParIds(ids: number[]): Observable<any[]> {
    const requests = ids.map(id => this.getCandidat(id));
    return forkJoin(requests);
  }

  getJurysParIds(juryIds: number[]): Observable<any[]> {
    const requests = juryIds.map(id => this.getJury(id));
    return forkJoin(requests);
  }

  // --- EVALUATIONS PAR CANDIDAT ---

  getEvaluationForCandidat(candidatId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/evaluations/candidat/${candidatId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getCandidatId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/evaluations/candidat/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // --- SELECTIONS ET MODES ---

  setSelectedCandidatId(id: number): void { 
    this.selectedCandidatId = id; 
    console.log('Candidat ID sélectionné:', id);
  }
  
  getSelectedCandidatId(): number | null { 
    return this.selectedCandidatId; 
  }

  setSelectedEvaluationId(id: number): void { 
    this.selectedEvaluationId = id; 
    console.log('Évaluation ID sélectionnée:', id);
  }
  
  getSelectedEvaluationId(): number | null { 
    return this.selectedEvaluationId; 
  }
  
  resetSelectedEvaluationId(): void { 
    this.selectedEvaluationId = null; 
  }

  setViewMode(isViewMode: boolean): void { 
    this.viewMode = isViewMode; 
    console.log('Mode vue défini:', isViewMode);
  }
  
  getViewMode(): boolean { 
    return this.viewMode; 
  }
  
  resetSelection(): void { 
    this.selectedCandidatId = null; 
    this.selectedEvaluationId = null;
    this.viewMode = false; 
    console.log('Sélections réinitialisées');
  }

  // --- CRITERES ---

  getCriteres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/criteres`, {
      headers: this.getAuthHeaders()
    });
  }

  // --- CANDIDAT DETAILS PARTAGE ---

  setSelectedCandidatDetails(details: any): void {
    this.selectedCandidatDetailsSource.next(details);
    console.log('Détails candidat définis:', details);
  }

  getSelectedCandidatDetails(): Observable<any | null> {
    return this.selectedCandidatDetailsSource.asObservable();
  }

  // --- OPERATIONS AVANCEES ---

  resetEvaluation(evaluationId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/evaluations/${evaluationId}/reset`, null, {
      headers: this.getAuthHeaders()
    });
  }

  // Méthode pour récupérer une évaluation complète avec tous les détails
  getEvaluationComplete(evaluationId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/evaluations/${evaluationId}/complete`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération de l\'évaluation complète:', error);
        return of(null);
      })
    );
  }

  // Méthode utilitaire pour valider une évaluation
  validateEvaluation(evaluation: any): boolean {
    return !!(evaluation && evaluation.id && evaluation.candidatId);
  }

  // Méthode pour formater une date de manière cohérente
  formatDateForAPI(date: Date | string | null): string | null {
    if (!date) return null;
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toISOString();
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return null;
    }
  }

  // Méthode pour parser une date reçue de l'API
  parseDateFromAPI(dateString: string | null): Date | null {
    if (!dateString) return null;
    
    try {
      return new Date(dateString);
    } catch (error) {
      console.error('Erreur de parsing de date:', error);
      return null;
    }
  }

  // --- DEBUG ET UTILITAIRES ---

  logCurrentState(): void {
    console.log('État actuel du service:', {
      selectedCandidatId: this.selectedCandidatId,
      selectedEvaluationId: this.selectedEvaluationId,
      viewMode: this.viewMode,
      currentUser: this.getCurrentUser()
    });
  }

  // deleteEvaluation(evaluationId: number): Observable<any> {
  //   return this.http.delete<any>(`${this.apiUrl}/api/evaluations/${evaluationId}`, {
  //     headers: this.getAuthHeaders()
  //   });
  // }

  addOrUpdateDecision(candidatId: number, juryId: number, commentaireFinal: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/api/decisions`, // adapte l'URL si besoin
      {
        candidatId,
        juryId,
        commentaireFinal
      },
      { headers: this.getAuthHeaders() }
    );
  }
}