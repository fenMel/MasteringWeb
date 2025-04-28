import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Evaluation, FiltresEvaluation } from './evaluation.model';
import { EvaluationService } from '../services/evaluation.service';

@Component({
  standalone: true,
  selector: 'app-evaluation',
  imports: [ CommonModule, FormsModule ],
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.scss']
})
export class EvaluationComponent implements OnInit {
  evaluations: Evaluation[] = [];
  totalEvaluations: number = 0;
  pageActuelle: number = 1;
  evaluationsParPage: number = 5;

  @Input() setSousMenu!: (menu: string) => void;

  filtres: FiltresEvaluation = {
    dateRange: 'Toutes les dates',
    statut: 'Tout les statuts', 
    candidat: ''
  };

  optionsDate = ['Toutes les dates', 'Aujourd\'hui', 'Cette semaine', 'Ce mois'];
  optionsStatut = ['Tout les statuts', 'Évalué', 'Non Évalué'];

  Math: Math = Math; // Pour utiliser Math dans le template

  constructor(
    private evaluationService: EvaluationService,
    private router: Router
  ) {
    console.log('Router:', this.router);
  }

  ngOnInit(): void {
    this.chargerEvaluations();
  }

  chargerEvaluations(): void {
    this.evaluationService.getEvaluationsFiltered(
      this.filtres.dateRange,
      this.filtres.statut,
      this.filtres.candidat
    ).subscribe(
      (data: any[]) => {
        console.log('Données d\'évaluations reçues:', data);

        const candidatIds = [...new Set(data.map(evaluation => evaluation.candidatId))];

        if (candidatIds.length > 0) {
          this.evaluationService.getCandidatsParIds(candidatIds).subscribe(
            (candidats: any[]) => {
              console.log('Données de candidats reçues:', candidats);

              this.evaluations = data.map(evaluation => {
                const candidatInfo = candidats.find(c => c.id === evaluation.candidatId);

                return {
                  id: evaluation.id,
                  candidatId: evaluation.candidatId, // ✅ Ajout candidatId
                  candidat: candidatInfo ? candidatInfo.nom + ' ' + candidatInfo.prenom : 'Candidat #' + evaluation.candidatId,
                  sujet: candidatInfo ? candidatInfo.sujet : 'Sujet non spécifié',
                  dateHeure: candidatInfo ? new Date(candidatInfo.dateSoutenance) : new Date(),
                  statut: evaluation.moyenne ? 'Évalué' : 'Non Évalué'
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
    const debut = (this.pageActuelle - 1) * this.evaluationsParPage;
    const fin = debut + this.evaluationsParPage;
    return this.evaluations.slice(debut, fin);
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
    console.log('Évaluer cette évaluation :', evaluation);
  
    if (this.setSousMenu) {
      this.evaluationService.setSelectedEvaluationId(evaluation.id);    // ✅ Stocker l'ID de l'évaluation
      this.evaluationService.setSelectedCandidatId(evaluation.candidatId); // ✅ Stocker l'ID du candidat
      this.setSousMenu('ajouter-evaluation');
    } else {
      this.router.navigate(['/dashboard'], { 
        queryParams: { 
          menu: 'soutenances', 
          sousMenu: 'ajouter-evaluation', 
          id: evaluation.id 
        } 
      });
    }
  }
  

  voirEvaluation(evaluation: any): void {
    console.log('Voir évaluation:', evaluation);

    if (evaluation && evaluation.id && evaluation.candidatId) {
      this.evaluationService.setSelectedEvaluationId(evaluation.id);     // ✅ Stocker l'ID de l'évaluation
      this.evaluationService.setSelectedCandidatId(evaluation.candidatId); // ✅ Stocker l'ID du candidat
      this.evaluationService.setViewMode(true);                          // ✅ Mode lecture seule

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
}
