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

  allCandidats: any[] = []; // To store all candidates fetched from the service

  @Input() setSousMenu!: (menu: string) => void;

  filtres: FiltresEvaluation = {
    dateRange: 'Toutes les dates',
    statut: 'Tout les statuts',
    candidat: ''
  };

  optionsDate = ['Toutes les dates', 'Aujourd\'hui', 'Cette semaine', 'Ce mois'];
  optionsStatut = ['Tout les statuts', 'Évalué', 'Non Évalué'];

  Math: Math = Math; // To use Math in the template

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
      console.log('IDs de candidats à récupérer:', candidatIds);

      if (candidatIds.length > 0) {
        this.evaluationService.getCandidatsParIds(candidatIds).subscribe(
          (candidatsArrays: any[]) => {
            console.log('Données de candidats reçues (brutes):', candidatsArrays);
            
            // Debug: Log each candidate array and its contents
            candidatsArrays.forEach((candidatArray, index) => {
              console.log(`Candidat array ${index}:`, candidatArray);
              if (Array.isArray(candidatArray) && candidatArray.length > 0) {
                console.log(`  - Contient ${candidatArray.length} élément(s)`);
                console.log(`  - Premier élément:`, candidatArray[0]);
                console.log(`  - ID du premier élément:`, candidatArray[0]?.id);
              } else if (candidatArray && typeof candidatArray === 'object') {
                console.log(`  - Objet direct avec ID:`, candidatArray.id);
              } else {
                console.log(`  - Données vides ou invalides`);
              }
            }); 

            // Create a flat array of all candidate objects with their IDs
            const allCandidats: any[] = [];
            candidatsArrays.forEach((candidatData, index) => {
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

            console.log('Tous les candidats disponibles:', allCandidats);
            console.log('IDs des candidats disponibles:', allCandidats.map(c => c.id));

            this.evaluations = data.map(evaluation => {
  // Cherche le bon candidat dans la propriété 'candidat' de chaque objet
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
      this.evaluationService.setSelectedEvaluationId(evaluation.id);
      this.evaluationService.setSelectedCandidatId(evaluation.candidatId);
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
      // Set selected evaluation and candidate IDs for navigation
      this.evaluationService.setSelectedEvaluationId(evaluation.id);
      this.evaluationService.setSelectedCandidatId(evaluation.candidatId);
      this.evaluationService.setViewMode(true);

      // Get current user (jury) information
      const currentUser = this.evaluationService.getCurrentUser();
      if (currentUser) {
        const juryId = currentUser.id; // Assuming 'id' is the property for jury ID
        console.log('Jury ID connecté :', juryId);
        // At this point, the juryId is logged. You might want to pass it
        // to the next component via a service or query params if needed.
      } else {
        console.warn('Aucun utilisateur connecté trouvé.');
      }

      // Get candidate information and store it in the service
      this.evaluationService.getCandidat(evaluation.candidatId).subscribe(
        (candidatInfo) => {
          console.log('Informations du candidat :', candidatInfo);
          // Store candidate details in the service for access in 'ajouter-evaluation'
          this.evaluationService.setSelectedCandidatDetails(candidatInfo);
        },
        (error) => {
          console.error('Erreur lors de la récupération des informations du candidat :', error);
          this.evaluationService.setSelectedCandidatDetails(null); // Clear if error
        }
      );

      // Navigate to the 'ajouter-evaluation' component
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

  // Modified to expect an object for 'candidat'
 getNomPrenomCandidat(candidat: { nom: string; prenom: string }): string {
  if (!candidat) return '';
  return `${candidat.nom ?? ''} ${candidat.prenom ?? ''}`.trim();
}
}