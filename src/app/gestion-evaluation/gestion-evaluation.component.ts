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
 * Composant pour la gestion complète des évaluations
 * Permet de lister, filtrer et naviguer vers les évaluations
 */
@Component({
  selector: 'app-gestion-evaluation',
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatFormFieldModule
  ],
  templateUrl: './gestion-evaluation.component.html',
  styleUrl: './gestion-evaluation.component.scss'
})
export class GestionEvaluationComponent implements OnInit {
  // Liste des évaluations chargées
  evaluations: Evaluation[] = [];
  // Nombre total d'évaluations (pour pagination)
  totalEvaluations: number = 0;
  // Pagination - page courante
  pageActuelle: number = 1;
  // Nombre d'items par page
  evaluationsParPage: number = 5;

  // Liste des candidats pour les filtres
  allCandidats: any[] = [];

  // Fonction de callback pour changer le sous-menu
  @Input() setSousMenu!: (menu: string) => void;

  // Configuration des filtres disponibles
  filtres: any = {
    date: null,       // Filtre par date
    heure: '',        // Filtre par heure (format HH:mm)
    statut: 'Tout les statuts', // Filtre par statut
    candidat: '',     // Filtre par nom candidat
    jury: '',         // Filtre par nom jury
    recherche: ''     // Recherche globale
  };

  // Options prédéfinies pour les filtres
  optionsDate = ['Toutes les dates', 'Aujourd\'hui', 'Cette semaine', 'Ce mois'];
  optionsStatut = ['Tout les statuts', 'Évalué', 'Non Évalué'];

  // Référence à Math pour le template
  Math: Math = Math;

  // Mode affichage (lecture seule)
  modeVoir: boolean = false;

  constructor(
    private evaluationService: EvaluationService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) { }

  /**
   * Affiche un message de succès
   * @param message Message à afficher
   */
  showSuccess(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      panelClass: 'snackbar-success'
    });
  }

  /**
   * Affiche un message d'erreur
   * @param message Message à afficher
   */
  showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: 'snackbar-error'
    });
  }

  /**
   * Initialisation du composant
   */
  ngOnInit(): void {
    this.chargerEvaluations();
    this.modeVoir = this.evaluationService.getViewMode();

    // Gestion des paramètres de requête
    this.route.queryParams.subscribe(params => {
      if (params['suppressionSuccess'] === '1') {
        this.showSuccess('Suppression réussie');
      }
    });
  }

  /**
   * Charge les évaluations depuis l'API avec filtres
   */
  chargerEvaluations(): void {
    this.evaluationService.getEvaluationsFiltered(
      this.filtres.dateRange,
      this.filtres.statut,
      this.filtres.candidat
    ).subscribe({
      next: (data: any[]) => {
        console.log('Données reçues de l\'API:', data);
        
        // Extraction des IDs uniques
        const candidatIds = [...new Set(data.map(e => e.candidatId))];
        const juryIds = [...new Set(data.map(e => e.juryId))];

        // Si des évaluations existent
        if (candidatIds.length > 0 && juryIds.length > 0) {
          // Chargement parallèle des candidats et jurys
          forkJoin([
            this.evaluationService.getCandidatsParIds(candidatIds),
            this.evaluationService.getJurysParIds(juryIds)
          ]).subscribe({
            next: ([candidatsArrays, jurysArrays]) => {
              // Normalisation des données candidats
              const allCandidats = candidatsArrays.flatMap(c => 
                Array.isArray(c) ? c : [c]
              ).filter(c => c?.id);

              // Filtrage des jurys valides
              const allJurys = jurysArrays.filter(j => j?.id);

              // Mapping complet des évaluations
              this.evaluations = data.map(evaluation => {
                // Recherche des infos candidat
                const candidatInfo = allCandidats.find(
                  c => String(c.candidat?.id) === String(evaluation.candidatId)
                )?.candidat || allCandidats.find(c => String(c.id) === String(evaluation.candidatId));

                // Recherche des infos jury
                const juryInfo = allJurys.find(
                  j => String(j.id) === String(evaluation.juryId)
                );

                return {
                  id: evaluation.id,
                  candidatId: evaluation.candidatId,
                  candidat: {
                    nom: candidatInfo?.nom || 'Nom inconnu',
                    prenom: candidatInfo?.prenom || 'Prénom inconnu'
                  },
                  jury: {
                    nom: juryInfo?.nom || 'Nom inconnu',
                    prenom: juryInfo?.prenom || 'Prénom inconnu'
                  },
                  sujet: evaluation.sujet || 'Sujet non spécifié',
                  dateHeure: evaluation.dateHeure ? new Date(evaluation.dateHeure) : null,
                  statut: evaluation.moyenne ? 'Évalué' : 'Non Évalué',
                  juryId: evaluation.juryId || null
                };
              });

              this.totalEvaluations = this.evaluations.length;
            },
            error: (err) => {
              console.error('Erreur candidats/jurys:', err);
              // Fallback si erreur
              this.mapperEvaluationsSansDetails(data);
            }
          });
        } else {
          // Cas où pas d'évaluations
          this.mapperEvaluationsSansDetails(data);
        }
      },
      error: (err) => {
        console.error('Erreur chargement évaluations:', err);
        this.evaluations = [];
        this.totalEvaluations = 0;
      }
    });
  }

  /**
   * Mapping de secours quand on ne peut pas charger les détails
   * @param data Données brutes des évaluations
   */
  private mapperEvaluationsSansDetails(data: any[]): void {
    this.evaluations = data.map(evaluation => ({
      id: evaluation.id,
      candidatId: evaluation.candidat?.id,
      candidat: {
        nom: evaluation.candidat?.nom || 'Nom inconnu',
        prenom: evaluation.candidat?.prenom || 'Prénom inconnu'
      },
      jury: {
        nom: evaluation.jury?.nom || 'Nom inconnu',
        prenom: evaluation.jury?.prenom || 'Prénom inconnu'
      },
      sujet: evaluation.sujet || 'Sujet non défini',
      dateHeure: evaluation.dateHeure ? new Date(evaluation.dateHeure) : null,
      statut: evaluation.moyenne ? 'Évalué' : 'Non Évalué',
      juryId: evaluation.jury?.id ?? null
    }));
    this.totalEvaluations = this.evaluations.length;
  }

  /**
   * Applique les filtres et recharge les données
   */
  appliquerFiltres(): void {
    this.pageActuelle = 1;
    this.chargerEvaluations();
  }

  /**
   * Change la page courante
   * @param page Numéro de page
   */
  changerPage(page: number): void {
    this.pageActuelle = page;
  }

  /**
   * Filtre les évaluations selon les critères
   */
  get evaluationsAffichees(): Evaluation[] {
    const currentUser = this.evaluationService.getCurrentUser();
    const juryId = currentUser?.id;
    let filtered = [...this.evaluations]; // Copie pour immutabilité

    // 1. Filtrage par date
    if (this.filtres.date) {
      const filtreDate = new Date(this.filtres.date);
      filtered = filtered.filter(e => {
        if (!e.dateHeure) return false;
        const evalDate = new Date(e.dateHeure);
        return evalDate.toDateString() === filtreDate.toDateString();
      });
    }

    // 2. Filtrage par heure
    if (this.filtres.heure) {
      const [h, m] = this.filtres.heure.split(':');
      filtered = filtered.filter(e => {
        if (!e.dateHeure) return false;
        const evalDate = new Date(e.dateHeure);
        return evalDate.getHours() === +h && evalDate.getMinutes() === +m;
      });
    }

    // 3. Filtrage par statut
    if (this.filtres.statut && this.filtres.statut !== 'Tout les statuts') {
      filtered = filtered.filter(e => e.statut === this.filtres.statut);
    }

    // 4. Filtrage par nom candidat
    if (this.filtres.candidat?.trim()) {
      const search = this.filtres.candidat.trim().toLowerCase();
      filtered = filtered.filter(e => 
        `${e.candidat.nom} ${e.candidat.prenom}`.toLowerCase().includes(search) ||
        `${e.candidat.prenom} ${e.candidat.nom}`.toLowerCase().includes(search)
      );
    }

    // 5. Recherche globale (candidat ou jury)
    if (this.filtres.recherche?.trim()) {
      const search = this.filtres.recherche.trim().toLowerCase();
      filtered = filtered.filter(e =>
        (`${e.candidat.nom} ${e.candidat.prenom}`.toLowerCase().includes(search) ||
         `${e.candidat.prenom} ${e.candidat.nom}`.toLowerCase().includes(search) ||
         `${e.jury.nom} ${e.jury.prenom}`.toLowerCase().includes(search) ||
         `${e.jury.prenom} ${e.jury.nom}`.toLowerCase().includes(search))
      );
    }

    // Mise à jour du total et pagination
    this.totalEvaluations = filtered.length;
    const debut = (this.pageActuelle - 1) * this.evaluationsParPage;
    const fin = debut + this.evaluationsParPage;
    return filtered.slice(debut, fin);
  }

  /**
   * Génère les numéros de page disponibles
   */
  get pages(): number[] {
    const totalPages = Math.ceil(this.totalEvaluations / this.evaluationsParPage);
    return Array(totalPages).fill(0).map((_, index) => index + 1);
  }

  /**
   * Réinitialise la recherche par candidat
   */
  nettoyerRecherche(): void {
    this.filtres.candidat = '';
    this.appliquerFiltres();
  }

  /**
   * Navigation vers l'édition d'une évaluation
   * @param evaluation Évaluation à éditer
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
   * Navigation vers la visualisation d'une évaluation
   * @param evaluation Évaluation à visualiser
   */
  voirEvaluation(evaluation: Evaluation): void {
    this.evaluationService.setViewMode(true);

    if (evaluation?.id && evaluation.candidatId) {
      this.evaluationService.setSelectedEvaluationId(evaluation.id);
      this.evaluationService.setSelectedCandidatId(evaluation.candidatId);

      // Chargement des détails du candidat
      this.evaluationService.getCandidat(evaluation.candidatId).subscribe(
        (candidatInfo) => {
          this.evaluationService.setSelectedCandidatDetails(candidatInfo);
        },
        (error) => {
          console.error('Erreur détails candidat:', error);
          this.evaluationService.setSelectedCandidatDetails(null);
        }
      );

      // Navigation
      if (this.setSousMenu) {
        this.setSousMenu('ajouter-evaluation');
      } else {
        this.router.navigate(['/dashboard'], {
          queryParams: { menu: 'soutenances', sousMenu: 'ajouter-evaluation' }
        });
      }
    } else {
      console.error('Évaluation invalide');
    }
  }

  /**
   * Formate le nom complet d'un candidat
   * @param candidat Objet avec nom et prenom
   */
  getNomPrenomCandidat(candidat: { nom: string; prenom: string }): string {
    if (!candidat) return '';
    return `${candidat.nom ?? ''} ${candidat.prenom ?? ''}`.trim();
  }

  /**
   * Formate une date pour l'affichage
   * @param date Date à formater
   */
  formatDate(date: Date | null): string {
    if (!date) return 'Date non définie';
    
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return 'Date invalide';
    }
  }

  /**
   * Log les détails d'une évaluation (debug)
   * @param evaluation Évaluation à logger
   */
  logEvaluation(evaluation: Evaluation): void {
    console.log('Détails évaluation:', {
      id: evaluation.id,
      sujet: evaluation.sujet,
      dateHeure: evaluation.dateHeure,
      statut: evaluation.statut
    });
  }
}