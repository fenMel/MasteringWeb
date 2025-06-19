import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './user.model';
import { environment } from '../../environments/environment.prod';
import {AuthService} from './auth.service';
import {Evaluation} from '../evaluation/evaluation.model';
import { UserDTO } from '../sessions-formation/session-formation.model';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  getUsersParRole(arg0: string) {
    throw new Error('Method not implemented.');
  }
  private apiUrl = environment.apiUrl ;

  constructor(private authService: AuthService, private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: 'Bearer ' + this.authService.getToken()
    });
  }
  /**
   * Crée un nouvel utilisateur
   * @param user Les données de l'utilisateur à créer
   */


  createUser(user: User): Observable<any> {
    return this.http.post<User>(`${this.apiUrl}/user/create`, user, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Met à jour un utilisateur existant
   * @param id L'ID de l'utilisateur
   * @param user Les nouvelles données de l'utilisateur
   */
  updateUser(id: string, user: User): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, user);
  }

  /**
   * Récupère un utilisateur par son ID
   * @param id L'ID de l'utilisateur
   */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  /**
   * Supprime un utilisateur
   * @param id L'ID de l'utilisateur à supprimer
   */
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Récupère tous les utilisateurs
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

//  getAllCandidats(p0: string): Observable<User[]> {
//   return this.http.get<User[]>(`${this.apiUrl}/candidat`, {
//     headers: this.getAuthHeaders()
//   });
// }

 // ✅ Nouvelle méthode à ajouter
  getCandidatById(p0: string): Observable<User[]> {
    return this.http.get<User[]>('http://localhost:8080/candidats');
  }

// getUsersByRole(role: string): Observable<UserDTO[]> {
//   return this.http.get<UserDTO[]>(`${this.apiUrl}/api/candidats/${role}`, {
//     headers: this.getAuthHeaders()
//   });
// }

getUsersByRole(role: string): Observable<UserDTO[]> {
  return this.http.get<UserDTO[]>(`/api/users/role/${role}`);
}

 

  // getAllCandidats(role: string = 'CANDIDAT'): Observable<UserDTO[]> {
  //   return this.http.get<UserDTO[]>(`${this.apiUrl}/api/users/role/${role}`, {
  //     headers: this.getAuthHeaders()
  //   });
  // }
  


getAllCandidats(): Observable<UserDTO[]> {
 return this.http.get<UserDTO[]>(`${this.apiUrl}/users/candidats`, {
   headers: this.authService.getAuthHeaders()
 });
}

}
