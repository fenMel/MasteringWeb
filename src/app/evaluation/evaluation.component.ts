import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';

import { Evaluation, FiltresEvaluation } from './evaluation.model';
import { EvaluationService } from '../services/evaluation.service';

@Component({
  standalone: true,
  selector: 'app-evaluation',
  imports: [ CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatFormFieldModule ],
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.scss']
})
export class EvaluationComponent implements OnInit {
  evaluations: Evaluation[] = [];
  totalEvaluations: number = 0;
  pageActuelle: number = 1;
  evaluationsParPage: number = 5;

  allCandidats: any[] = [];

  @Input() setSousMenu!: (menu: string) => void;

  filtres: any = {
    date: null,   // Date sélectionnée
    heure: '',    // Heure sélectionnée (format 'HH:mm')
    statut: 'Tout les statuts',
    candidat: ''
  };

  optionsDate = ['Toutes les dates', 'Aujourd\'hui', 'Cette semaine', 'Ce mois'];
  optionsStatut = ['Tout les statuts', 'Évalué', 'Non Évalué'];

  Math: Math = Math;

  modeVoir: boolean = false;

  constructor(
    private evaluationService: EvaluationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerEvaluations();
    this.modeVoir = this.evaluationService.getViewMode();
  }

  chargerEvaluations(): void {
    this.evaluationService.getEvaluationsFiltered(
      this.filtres.dateRange,
      this.filtres.statut,
      this.filtres.candidat
    ).subscribe(
      (data: any[]) => {
        const candidatIds = [...new Set(data.map(evaluation => evaluation.candidatId))];

        if (candidatIds.length > 0) {
          this.evaluationService.getCandidatsParIds(candidatIds).subscribe(
            (candidatsArrays: any[]) => {
              const allCandidats: any[] = [];
              candidatsArrays.forEach((candidatData) => {
                if (Array.isArray(candidatData) && candidatData.length > 0) {
                  candidatData.forEach(candidat => {
                    if (candidat && candidat.id) {
                      allCandidats.push(candidat);
                    }
                  });
                } else if (candidatData && candidatData.id) {
                  allCandidats.push(candidatData);
                }
              });

              this.evaluations = data.map(evaluation => {
                const candidatInfo = allCandidats.find(
                  c => String(c.candidat?.id) === String(evaluation.candidatId)
                )?.candidat;

                return {
                  id: evaluation.id,
                  candidatId: evaluation.candidatId,
                  candidat: candidatInfo
                    ? { nom: candidatInfo.nom ?? 'Nom inconnu', prenom: candidatInfo.prenom ?? 'Prénom inconnu' }
                    : { nom: 'Nom inconnu', prenom: 'Prénom inconnu' },
                  sujet: evaluation.sujet || 'Sujet non spécifié',
                  dateHeure: evaluation.dateHeure ? new Date(evaluation.dateHeure) : new Date(),
                  // Ajoute ici pour accès direct dans le template :
                  date: evaluation.dateHeure ? new Date(evaluation.dateHeure).toLocaleDateString() : '',
                  heure: evaluation.dateHeure ? new Date(evaluation.dateHeure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                  statut: evaluation.moyenne ? 'Évalué' : 'Non Évalué',
                  juryId: evaluation.juryId ?? evaluation.jury?.id ?? null // Ajout du juryId pour le filtre
                };
              });

              this.totalEvaluations = this.evaluations.length;
            },
            error => {
              console.error('Erreur lors de la récupération des candidats:', error);
            }
          );
        } else {
          this.evaluations = [];
          this.totalEvaluations = 0;
        }
      },
      error => {
        console.error('Erreur lors du chargement des évaluations:', error);
      }
    );
  }

  appliquerFiltres(): void {
    this.pageActuelle = 1;
    this.chargerEvaluations();
  }

  changerPage(page: number): void {
    this.pageActuelle = page;
  }

  get evaluationsAffichees(): Evaluation[] {
    // 1. Récupère l'ID du jury connecté
    const currentUser = this.evaluationService.getCurrentUser();
    const juryId = currentUser?.id;

    let filtered = this.evaluations;
  if (this.filtres.date) {
      filtered = filtered.filter(e => {
        if (!e.dateHeure) return false;
        const evalDate = new Date(e.dateHeure);
        const filtreDate = new Date(this.filtres.date);
        return evalDate.getFullYear() === filtreDate.getFullYear() &&
               evalDate.getMonth() === filtreDate.getMonth() &&
               evalDate.getDate() === filtreDate.getDate();
      });
    }

 

    // 4. Filtre par heure
    if (this.filtres.heure) {
      filtered = filtered.filter(e => {
        const evalDate = e.dateHeure ? new Date(e.dateHeure) : null;
        const heure = this.filtres.heure;
        return evalDate &&
          evalDate.getHours().toString().padStart(2, '0') + ':' +
          evalDate.getMinutes().toString().padStart(2, '0') === heure;
      });
    }
    // 2. Filtre par jury connecté
    if (juryId) {
      filtered = filtered.filter(e => e.juryId === juryId);
    }

    // 3. Filtre par statut
    if (this.filtres.statut && this.filtres.statut !== 'Tout les statuts') {
      filtered = filtered.filter(e => e.statut === this.filtres.statut);
    }

    // 4. Filtre par nom/prénom du candidat
    if (this.filtres.candidat && this.filtres.candidat.trim() !== '') {
      const search = this.filtres.candidat.trim().toLowerCase();
      filtered = filtered.filter(e =>
        (e.candidat.nom + ' ' + e.candidat.prenom).toLowerCase().includes(search) ||
        (e.candidat.prenom + ' ' + e.candidat.nom).toLowerCase().includes(search)
      );
    }
  this.totalEvaluations = filtered.length;

    // 5. Pagination
    const debut = (this.pageActuelle - 1) * this.evaluationsParPage;
const fin = debut + this.evaluationsParPage;
return filtered.slice(debut, fin);
  }

  get pages(): number[] {
    const totalPages = Math.ceil(this.totalEvaluations / this.evaluationsParPage);
    return Array(totalPages).fill(0).map((_, index) => index + 1);
  }

  nettoyerRecherche(): void {
    this.filtres.candidat = '';
    this.appliquerFiltres();
  }

  evaluer(evaluation: Evaluation): void {
    this.evaluationService.setSelectedCandidatId(evaluation.candidatId);
    this.evaluationService.setSelectedEvaluationId(evaluation.id);
    this.evaluationService.setViewMode(false);

    if (this.setSousMenu) {
      this.setSousMenu('ajouter-evaluation');
    } else {
      this.router.navigate(['/dashboard'], {
        queryParams: {
          menu: 'soutenances',
          sousMenu: 'ajouter-evaluation',
        }
      });
    }
  }

  voirEvaluation(evaluation: any): void {
    this.evaluationService.setViewMode(true);

    if (evaluation && evaluation.id && evaluation.candidatId) {
      this.evaluationService.setSelectedEvaluationId(evaluation.id);
      this.evaluationService.setSelectedCandidatId(evaluation.candidatId);
      this.evaluationService.setViewMode(true);

      const currentUser = this.evaluationService.getCurrentUser();
      if (currentUser) {
        const juryId = currentUser.id;
        console.log('Jury ID connecté :', juryId);
      } else {
        console.warn('Aucun utilisateur connecté trouvé.');
      }

      this.evaluationService.getCandidat(evaluation.candidatId).subscribe(
        (candidatInfo) => {
          this.evaluationService.setSelectedCandidatDetails(candidatInfo);
        },
        (error) => {
          this.evaluationService.setSelectedCandidatDetails(null);
        }
      );

      if (this.setSousMenu) {
        this.setSousMenu('ajouter-evaluation');
      } else {
        this.router.navigate(['/dashboard'], {
          queryParams: { menu: 'soutenances', sousMenu: 'ajouter-evaluation' }
        });
      }
    } else {
      console.error('L\'évaluation ne contient pas d\'ID ou de candidatId valide');
    }
  }

  getNomPrenomCandidat(candidat: { nom: string; prenom: string }): string {
    if (!candidat) return '';
    return `${candidat.nom ?? ''} ${candidat.prenom ?? ''}`.trim();
  }
}