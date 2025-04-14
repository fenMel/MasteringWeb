import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evaluation } from '../evaluation/evaluation.model'

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private baseUrl = 'http://localhost:8080/api/evaluations'; // URL de votre API Spring Boot

  constructor(private http: HttpClient) {}

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
}