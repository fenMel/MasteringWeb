import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionsFormationService } from '../services/sessions-formation.service';
import { SessionFormation } from './session-formation.model';
@Component({
 selector: 'app-sessions-formation',
 standalone: true,
 imports: [CommonModule, FormsModule],
 templateUrl: './sessions-formation.component.html',
 styleUrls: ['./sessions-formation.component.scss']
})
export class SessionsFormationComponent implements OnInit {
 sessions: SessionFormation[] = [];
 pageActuelle: number = 1;
 sessionsParPage: number = 5;
 @Input() setSousMenu?: (menu: string) => void;
 filtres = {
   formation: 'Toutes',
   titre: ''
 };
 optionsFormation: string[] = ['Toutes'];
 constructor(
   private sessionsFormationService: SessionsFormationService,
   private router: Router
 ) {}
 ngOnInit(): void {
   this.chargerSessions();
 }
 chargerSessions(): void {
   this.sessionsFormationService.getSessionsFormationAvecFormationEtUsers().subscribe({
 next: (data) => {
   this.sessions = data;
   this.remplirOptionsFormation();
 },
 error: (err) => console.error('Erreur lors du chargement des sessions :', err)
});
 }
 remplirOptionsFormation(): void {
   const formations = new Set<string>();
   this.sessions.forEach(s => {
     if (s.formation?.nom) {
       formations.add(s.formation.nom);
     }
   });
   this.optionsFormation = ['Toutes', ...Array.from(formations)];
 }
 get sessionsFiltrees(): SessionFormation[] {
   return this.sessions.filter(s => {
     const titreMatch = s.titre.toLowerCase().includes(this.filtres.titre.toLowerCase());
     const formationMatch = this.filtres.formation === 'Toutes' || s.formation?.nom === this.filtres.formation;
     return titreMatch && formationMatch;
   });
 }
 get sessionsAffichees(): SessionFormation[] {
   const debut = (this.pageActuelle - 1) * this.sessionsParPage;
   return this.sessionsFiltrees.slice(debut, debut + this.sessionsParPage);
 }
 get pages(): number[] {
   const totalPages = Math.ceil(this.sessionsFiltrees.length / this.sessionsParPage);
   return Array.from({ length: totalPages }, (_, i) => i + 1);
 }
 ajouterSession(): void {
   this.setSousMenu?.('ajouter');
   this.sessionsFormationService.setSelectedSession(undefined);
   this.router.navigate([], {
     queryParams: { menu: 'ListeSessionsFormation', sousMenu: 'ajouter' },
     queryParamsHandling: 'merge'
   });
 }
 modifierSession(session: SessionFormation): void {
   this.setSousMenu?.('edit-session');
   this.sessionsFormationService.setSelectedSession(session);
   this.router.navigate([], {
     queryParams: { menu: 'ListeSessionsFormation', sousMenu: 'edit-session' },
     queryParamsHandling: 'merge'
   });
 }
 voirSession(session: SessionFormation): void {
   this.setSousMenu?.('detail-session');
   this.sessionsFormationService.setSelectedSession(session);
   this.router.navigate([], {
     queryParams: { menu: 'ListeSessionsFormation', sousMenu: 'detail-session' },
     queryParamsHandling: 'merge'
   });
 }
 supprimerSession(session: SessionFormation): void {
   if (confirm(`Supprimer la session "${session.titre}" ?`)) {
     this.sessionsFormationService.supprimerSession(session.id!).subscribe({
       next: () => this.chargerSessions(),
       error: err => {
         console.error('Erreur lors de la suppression de la session :', err);
         alert('Une erreur est survenue lors de la suppression.');
       }
     });
   }
 }
 appliquerFiltres(): void {
   this.pageActuelle = 1;
 }
 trackBySession(_: number, session: SessionFormation): number {
   return session.id ?? 0;
 }
 retour(): void {
   this.setSousMenu?.('');
   this.router.navigate([], {
     queryParams: { menu: 'ListeSessionsFormation', sousMenu: null },
     queryParamsHandling: 'merge'
   });
 }
}