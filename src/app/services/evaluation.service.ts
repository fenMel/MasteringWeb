// evaluation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evaluation } from '../evaluation/evaluation.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private baseUrl = 'http://localhost:8080/api/evaluations'; // URL de votre API Spring Boot
  private apiUrl = 'http://localhost:8080/api'; // URL de base pour les autres endpoints

  constructor(private http: HttpClient) {}

  // Méthodes existantes
  getAllEvaluations(): Observable<Evaluation[]> {
    return this.http.get<Evaluation[]>(this.baseUrl);
  }

  getEvaluationsFiltered(dateRange: string, statut: string, candidat: string): Observable<Evaluation[]> {
    let url = `${this.baseUrl}?`;
    
    if (dateRange && dateRange !== 'Toutes les dates') {
      url += `dateRange=${dateRange}&`;
    }
    
    if (statut && statut !== 'Tout les statuts') {
      url += `statut=${statut}&`;
    }
    
    if (candidat) {
      url += `candidat=${candidat}`;
    }
    
    return this.http.get<Evaluation[]>(url);
  }

  evaluer(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/evaluer`, {});
  }

  // Nouvelles méthodes pour le composant d'ajout d'évaluation
  getCandidat(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/candidats/${id}`);
  }

  getCandidats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/candidats`);
  }

  getCriteres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/criteres`);
  }

  createEvaluation(evaluation: any): Observable<Evaluation> {
    return this.http.post<Evaluation>(this.baseUrl, evaluation);
  }

  getEvaluation(id: number): Observable<Evaluation> {
    return this.http.get<Evaluation>(`${this.baseUrl}/${id}`);
  }

  updateEvaluation(id: number, evaluation: any): Observable<Evaluation> {
    return this.http.put<Evaluation>(`${this.baseUrl}/${id}`, evaluation);
  }


  // Récupérer uniquement les candidats présents à la soutenance
  getCandidatsPresents(): Observable<any[]> {
    // Ajout du paramètre present=true pour filtrer
    const params = new HttpParams().set('present', 'true');
    return this.http.get<any[]>(`${this.apiUrl}/candidats`, { params });
  }

  // Récupérer tous les candidats pour une date de soutenance spécifique
  getCandidatsParDate(date: string): Observable<any[]> {
    const params = new HttpParams()
      .set('date', date)
      .set('present', 'true');
    return this.http.get<any[]>(`${this.apiUrl}/candidats`, { params });
  }


}