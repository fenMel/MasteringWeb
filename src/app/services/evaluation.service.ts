import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, BehaviorSubject } from 'rxjs';
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

    return this.http.get<Evaluation[]>(`${this.apiUrl}/api/evaluations`, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  updateEvaluation(id: number, evaluation: any) {
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
    });
  }

  getCandidats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/evaluations/candidat`, {
      headers: this.getAuthHeaders()
    });
  }

  getCandidatsPresents(): Observable<any[]> {
    const params = new HttpParams().set('present', 'true');
    return this.http.get<any[]>(`${this.apiUrl}/api/evaluations/candidat`, { headers: this.getAuthHeaders(), params });
  }

  getCandidatsParDate(date: string): Observable<any[]> {
    const params = new HttpParams().set('date', date).set('present', 'true');
    return this.http.get<any[]>(`${this.apiUrl}/api/evaluations/candidat`, { headers: this.getAuthHeaders(), params });
  }

  getCandidatsParIds(ids: number[]): Observable<any[]> {
    const requests = ids.map(id => this.getCandidat(id));
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

  setSelectedCandidatId(id: number): void { this.selectedCandidatId = id; }
  getSelectedCandidatId(): number | null { return this.selectedCandidatId; }

  setSelectedEvaluationId(id: number): void { this.selectedEvaluationId = id; }
  getSelectedEvaluationId(): number | null { return this.selectedEvaluationId; }
  resetSelectedEvaluationId(): void { this.selectedEvaluationId = null; }

  setViewMode(isViewMode: boolean): void { this.viewMode = isViewMode; }
  getViewMode(): boolean { return this.viewMode; }
  resetSelection(): void { this.selectedCandidatId = null; this.viewMode = false; }

  // --- CRITERES ---

  getCriteres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/criteres`, {
      headers: this.getAuthHeaders()
    });
  }

  // --- CANDIDAT DETAILS PARTAGE ---

  setSelectedCandidatDetails(details: any): void {
    this.selectedCandidatDetailsSource.next(details);
  }

  getSelectedCandidatDetails(): Observable<any | null> {
    return this.selectedCandidatDetailsSource.asObservable();
  }
}