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

/**
 * Composant pour la gestion des évaluations
 */
@Component({
  standalone: true,
  selector: 'app-evaluation',
  imports: [ 
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatFormFieldModule 
  ],
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.scss']
})
export class EvaluationComponent implements OnInit {
  // Liste des évaluations à afficher
  evaluations: Evaluation[] = [];
  // Nombre total d'évaluations (pour la pagination)
  totalEvaluations: number = 0;
  // Page actuelle
  pageActuelle: number = 1;
  // Nombre d'évaluations par page
  evaluationsParPage: number = 5;

  // Liste de tous les candidats (pour les filtres)
  allCandidats: any[] = [];

  // Fonction pour changer le sous-menu (injectée depuis le parent)
  @Input() setSousMenu!: (menu: string) => void;

  // Filtres disponibles
  filtres: any = {
    date: null,   // Date sélectionnée
    heure: '',    // Heure sélectionnée (format 'HH:mm')
    statut: 'Tout les statuts', // Statut de l'évaluation
    candidat: ''  // Nom du candidat
  };

  // Options pour les filtres de date
  optionsDate = ['Toutes les dates', 'Aujourd\'hui', 'Cette semaine', 'Ce mois'];
  // Options pour les filtres de statut
  optionsStatut = ['Tout les statuts', 'Évalué', 'Non Évalué'];

  // Référence à l'objet Math pour utilisation dans le template
  Math: Math = Math;

  // Mode "voir" (lecture seule) ou "éditer"
  modeVoir: boolean = false;

  constructor(
    private evaluationService: EvaluationService,
    private router: Router
  ) {}

  /**
   * Initialisation du composant
   */
  ngOnInit(): void {
    this.chargerEvaluations();
    this.modeVoir = this.evaluationService.getViewMode();
  }

  /**
   * Charge les évaluations depuis le service
   */
  chargerEvaluations(): void {
    this.evaluationService.getEvaluationsFiltered(
      this.filtres.dateRange,
      this.filtres.statut,
      this.filtres.candidat
    ).subscribe(
      (data: any[]) => {
        // Récupère les IDs uniques des candidats
        const candidatIds = [...new Set(data.map(evaluation => evaluation.candidatId))];

        if (candidatIds.length > 0) {
          // Charge les informations des candidats en parallèle
          this.evaluationService.getCandidatsParIds(candidatIds).subscribe(
            (candidatsArrays: any[]) => {
              const allCandidats: any[] = [];
              
              // Normalise les données des candidats (peuvent être dans des tableaux)
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

              // Mappe les évaluations avec les informations des candidats
              this.evaluations = data.map(evaluation => {
                const candidatInfo = allCandidats.find(
                  c => String(c.candidat?.id) === String(evaluation.candidatId)
                )?.candidat;

                return {
                  id: evaluation.id,
                  candidatId: evaluation.candidatId,
                  candidat: {
                    nom: candidatInfo?.nom || 'Nom inconnu',
                    prenom: candidatInfo?.prenom || 'Prénom inconnu',
                  },
                  sujet: evaluation.sujet || 'Sujet non spécifié',
                  dateHeure: evaluation.dateHeure ? new Date(evaluation.dateHeure) : new Date(),
                  // Formatage pour l'affichage
                  date: evaluation.dateHeure ? new Date(evaluation.dateHeure).toLocaleDateString() : '',
                  heure: evaluation.dateHeure ? new Date(evaluation.dateHeure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                  statut: evaluation.moyenne ? 'Évalué' : 'Non Évalué',
                  juryId: evaluation.juryId ?? evaluation.jury?.id ?? null
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

  /**
   * Applique les filtres et recharge les évaluations
   */
  appliquerFiltres(): void {
    this.pageActuelle = 1;
    this.chargerEvaluations();
  }

  /**
   * Change la page actuelle
   * @param page Numéro de la page
   */
  changerPage(page: number): void {
    this.pageActuelle = page;
  }

  /**
   * Retourne les évaluations à afficher en fonction des filtres et de la pagination
   */
  get evaluationsAffichees(): Evaluation[] {
    // Récupère l'ID du jury connecté
    const currentUser = this.evaluationService.getCurrentUser();
    const juryId = currentUser?.id;

    let filtered = this.evaluations;
    
    // Filtre par date
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

    // Filtre par heure
    if (this.filtres.heure) {
      filtered = filtered.filter(e => {
        const evalDate = e.dateHeure ? new Date(e.dateHeure) : null;
        const heure = this.filtres.heure;
        return evalDate &&
          evalDate.getHours().toString().padStart(2, '0') + ':' +
          evalDate.getMinutes().toString().padStart(2, '0') === heure;
      });
    }
    
    // Filtre par jury connecté
    if (juryId) {
      filtered = filtered.filter(e => e.juryId === juryId);
    }

    // Filtre par statut
    if (this.filtres.statut && this.filtres.statut !== 'Tout les statuts') {
      filtered = filtered.filter(e => e.statut === this.filtres.statut);
    }

    // Filtre par nom/prénom du candidat
    if (this.filtres.candidat && this.filtres.candidat.trim() !== '') {
      const search = this.filtres.candidat.trim().toLowerCase();
      filtered = filtered.filter(e =>
        (e.candidat.nom + ' ' + e.candidat.prenom).toLowerCase().includes(search) ||
        (e.candidat.prenom + ' ' + e.candidat.nom).toLowerCase().includes(search)
      );
    }
    
    this.totalEvaluations = filtered.length;

    // Pagination
    const debut = (this.pageActuelle - 1) * this.evaluationsParPage;
    const fin = debut + this.evaluationsParPage;
    return filtered.slice(debut, fin);
  }

  /**
   * Retourne la liste des numéros de page disponibles
   */
  get pages(): number[] {
    const totalPages = Math.ceil(this.totalEvaluations / this.evaluationsParPage);
    return Array(totalPages).fill(0).map((_, index) => index + 1);
  }

  /**
   * Réinitialise le filtre de recherche par candidat
   */
  nettoyerRecherche(): void {
    this.filtres.candidat = '';
    this.appliquerFiltres();
  }

  /**
   * Redirige vers l'écran d'évaluation d'un candidat
   * @param evaluation L'évaluation à modifier
   */
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

  /**
   * Redirige vers l'écran de visualisation d'une évaluation
   * @param evaluation L'évaluation à visualiser
   */
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

      // Charge les détails du candidat
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

  /**
   * Retourne le nom complet d'un candidat
   * @param candidat L'objet candidat contenant nom et prénom
   */
  getNomPrenomCandidat(candidat: { nom: string; prenom: string }): string {
    if (!candidat) return '';
    return `${candidat.nom ?? ''} ${candidat.prenom ?? ''}`.trim();
  }
}