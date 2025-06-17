import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DecisionService } from '../services/decision.service'; // adapte le chemin si besoin
import {  ArchiveDecisionService } from '../services/archive-decision.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-voir-decision',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voir-decision.component.html',
  styleUrls: ['./voir-decision.component.scss']
})
export class VoirDecisionComponent {
  @Input() evaluationResults: any[] = [];
  @Input() setSousMenu: any;
   constructor(
    private decisionsService: DecisionService,
    private archiveService: ArchiveDecisionService,
        private authService: AuthService,

   )
{ }
supprimerDecision(id: number) {
  const nomPrenom = this.authService.getUserFullName();
  console.log('Nom/prénom envoyé au backend :', nomPrenom);
  this.decisionsService.deleteDecision(id, nomPrenom).subscribe({
    next: () => {
      console.log('Suppression réussie pour la décision', id);
      this.evaluationResults = this.evaluationResults.filter(e => e.id !== id);
    },
    error: (err) => {
      console.error('Erreur lors de la suppression :', err);
    }
  });
}



}
