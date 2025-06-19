import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionsFormationService } from '../services/sessions-formation.service';
import { SessionFormation } from '../sessions-formation/session-formation.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-detail-session-formation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-session-formation.component.html',
  styleUrls: ['./detail-session-formation.component.scss']
})
export class DetailSessionFormationComponent implements OnInit {

  session?: SessionFormation;

  constructor(
    private sessionService: SessionsFormationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.session = this.sessionService.getSelectedSession();
  }

  supprimerSession(): void {
    if (!this.session?.id) return;

    const confirmation = confirm("Voulez-vous vraiment supprimer cette session ?");
    if (confirmation) {
      this.sessionService.supprimerSession(this.session.id).subscribe({
        next: () => {
          alert("Session supprimée avec succès.");
          this.router.navigate([], {
            queryParams: { menu: 'ListeSessionsFormation', sousMenu: 'liste' },
            queryParamsHandling: 'merge'
          });
        },
        error: () => {
          alert("Une erreur est survenue lors de la suppression.");
        }
      });
    }
  }

  annuler(): void {
    this.router.navigate([], {
      queryParams: { menu: 'ListeSessionsFormation', sousMenu: 'liste' },
      queryParamsHandling: 'merge'
    });
  }
}
