import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SessionsFormationService } from '../services/sessions-formation.service';
import { UserService } from '../services/user.service';
import { SessionFormation } from '../services/sessions-formation.service';
import { Formation } from '../services/gestion-formation.service';
import { UserDTO } from '../sessions-formation/session-formation.model';
import { GestionFormationService } from '../services/gestion-formation.service';

@Component({
  selector: 'app-edit-session-formation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-session-formation.component.html',
  styleUrls: ['./edit-session-formation.component.scss']
})
export class EditSessionFormationComponent implements OnInit {

  session: SessionFormation | null = null;
  formations: Formation[] = [];
  candidats: UserDTO[] = [];
  candidatsIdsSelectionnes: number[] = [];

  constructor(
    private sessionService: SessionsFormationService,
    private formationService: GestionFormationService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('id'));
    if (id) {
      this.sessionService.getSessionById(id).subscribe({
        next: (session) => {
          this.session = {
            ...session,
            dateDebut: session.dateDebut?.split('T')[0] ?? '',
            dateFin: session.dateFin?.split('T')[0] ?? '',
          };
          this.candidatsIdsSelectionnes = session.candidats?.map(c => c.id) ?? [];
        },
        error: () => alert('Erreur chargement session')
      });
    }

    this.formationService.getFormations().subscribe({
      next: (data) => this.formations = data,
      error: () => alert('Erreur chargement formations')
    });

    this.userService.getUsersByRole('CANDIDAT').subscribe({
      next: (data: UserDTO[]) => this.candidats = data,
      error: () => alert('Erreur chargement candidats')
    });
  }

  enregistrer(): void {
    if (!this.session) return;

    const dto = {
      id: this.session.id,
      titre: this.session.titre,
      description: this.session.description,
      dateDebut: this.session.dateDebut,
      dateFin: this.session.dateFin,
      formationId: this.session.formation.id,
      candidatsIds: this.candidatsIdsSelectionnes
    };

    this.sessionService.modifierSession(dto).subscribe({
      next: () => {
        alert('Session modifiée avec succès');
        this.router.navigate(['/dashboard'], {
          queryParams: { menu: 'ListeSessionsFormation', sousMenu: 'liste' }
        });
      },
      error: () => alert('Erreur lors de la modification de la session')
    });
  }

  annuler(): void {
    this.router.navigate(['/dashboard'], {
      queryParams: { menu: 'ListeSessionsFormation', sousMenu: 'liste' }
    });
  }

  onCandidatCheckboxChange(event: Event, candidatId: number): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      if (!this.candidatsIdsSelectionnes.includes(candidatId)) {
        this.candidatsIdsSelectionnes.push(candidatId);
      }
    } else {
      this.candidatsIdsSelectionnes = this.candidatsIdsSelectionnes.filter(id => id !== candidatId);
    }
  }

  isCandidatSelected(id: number): boolean {
    return this.candidatsIdsSelectionnes.includes(id);
  }
}
