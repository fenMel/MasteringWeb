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
    candidat: '',
    jury: '' ,
      recherche: ''
  };

  optionsDate = ['Toutes les dates', 'Aujourd\'hui', 'Cette semaine', 'Ce mois'];
  optionsStatut = ['Tout les statuts', 'Évalué', 'Non Évalué'];

  Math: Math = Math;

  modeVoir: boolean = false;

  constructor(
    private evaluationService: EvaluationService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) { }

  // --- Ajoute ces méthodes utilitaires ---
  showSuccess(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      panelClass: 'snackbar-success'
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: 'snackbar-error'
    });
  }
  // ---------------------------------------

  ngOnInit(): void {
    this.chargerEvaluations();
    this.modeVoir = this.evaluationService.getViewMode();

    this.route.queryParams.subscribe(params => {
      if (params['suppressionSuccess'] === '1') {
        this.showSuccess('Suppression réussie');
      }
    });
  }

  chargerEvaluations(): void {
    this.evaluationService.getEvaluationsFiltered(
      this.filtres.dateRange,
      this.filtres.statut,
      this.filtres.candidat
    ).subscribe({
      next: (data: any[]) => {
        console.log('Données reçues de l\'API:', data); // Debug
        
        const candidatIds = [...new Set(data.map(e => e.candidatId))];
        const juryIds = [...new Set(data.map(e => e.juryId))];

        if (candidatIds.length > 0 && juryIds.length > 0) {
          forkJoin([
            this.evaluationService.getCandidatsParIds(candidatIds),
            this.evaluationService.getJurysParIds(juryIds)
          ]).subscribe({
            next: ([candidatsArrays, jurysArrays]) => {
              // Traitement des candidats
              const allCandidats = candidatsArrays.flatMap(c => 
                Array.isArray(c) ? c : [c]
              ).filter(c => c?.id);

              // Traitement des jurys
              const allJurys = jurysArrays.filter(j => j?.id);

              this.evaluations = data.map(evaluation => {
                const candidatInfo = allCandidats.find(
                  c => String(c.candidat?.id) === String(evaluation.candidatId)
                )?.candidat || allCandidats.find(c => String(c.id) === String(evaluation.candidatId));

                const juryInfo = allJurys.find(
                  j => String(j.id) === String(evaluation.juryId)
                );

                console.log('Mapping évaluation:', evaluation); // Debug

                return {
                  id: evaluation.id,
                  candidatId: evaluation.candidatId,
                  candidat: {
                    nom: candidatInfo?.nom || 'Nom inconnu',
                    prenom: candidatInfo?.prenom || 'Prénom inconnu',
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
              console.log('Évaluations finales:', this.evaluations); // Debug
            },
            error: (err) => {
              console.error('Erreur lors du chargement des candidats/jurys:', err);
              // En cas d'erreur, mapper quand même les évaluations avec les données disponibles
              this.mapperEvaluationsSansDetails(data);
            }
          });
        } else {
          // Si pas de candidats/jurys, mapper quand même les évaluations
          this.mapperEvaluationsSansDetails(data);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des évaluations:', err);
        this.evaluations = [];
        this.totalEvaluations = 0;
      }
    });
  }

  private mapperEvaluationsSansDetails(data: any[]): void {
    this.evaluations = data.map(evaluation => ({
      id: evaluation.id,
      candidatId: evaluation.candidatId,
      candidat: {
        nom: 'Nom inconnu',
        prenom: 'Prénom inconnu',
      },
      jury: {
        nom: 'Nom inconnu',
        prenom: 'Prénom inconnu'
      },
      sujet: evaluation.sujet || 'Sujet non spécifié',
dateHeure: evaluation.dateHeure ? new Date(evaluation.dateHeure) : new Date(),
      statut: evaluation.moyenne ? 'Évalué' : 'Non Évalué',
      juryId: evaluation.juryId || null
    }));
    this.totalEvaluations = this.evaluations.length;
  }

  appliquerFiltres(): void {
    this.pageActuelle = 1;
    this.chargerEvaluations();
    // Exemple d'utilisation :
    // this.showSuccess('Filtres appliqués');
  }

  changerPage(page: number): void {
    this.pageActuelle = page;
  }

get evaluationsAffichees(): Evaluation[] {
  const currentUser = this.evaluationService.getCurrentUser();
  const juryId = currentUser?.id;
  let filtered = [...this.evaluations]; // Create a new array to avoid mutation

  // Debug logs
  console.log('Current User:', currentUser);
  console.log('Jury ID:', juryId);
  console.log('Initial Evaluations:', filtered);

  

  // 2. Date filter
  if (this.filtres.date) {
    const filtreDate = new Date(this.filtres.date);
    filtered = filtered.filter(e => {
      if (!e.dateHeure) return false;
      const evalDate = new Date(e.dateHeure);
      return evalDate.toDateString() === filtreDate.toDateString();
    });
  }

  // 3. Time filter
  if (this.filtres.heure) {
    const [h, m] = this.filtres.heure.split(':');
    filtered = filtered.filter(e => {
      if (!e.dateHeure) return false;
      const evalDate = new Date(e.dateHeure);
      return evalDate.getHours() === +h && evalDate.getMinutes() === +m;
    });
  }

  // 4. Status filter
  if (this.filtres.statut && this.filtres.statut !== 'Tout les statuts') {
    filtered = filtered.filter(e => e.statut === this.filtres.statut);
  }

  // 5. Candidate name filter
  if (this.filtres.candidat?.trim()) {
    const search = this.filtres.candidat.trim().toLowerCase();
    filtered = filtered.filter(e => 
      `${e.candidat.nom} ${e.candidat.prenom}`.
        toLowerCase().includes(search) ||
      `${e.candidat.prenom} ${e.candidat.nom}`.
        toLowerCase().includes(search)
    );
  }

  // Filtre par nom/prénom candidat OU jury
  if (this.filtres.recherche?.trim()) {
    const search = this.filtres.recherche.trim().toLowerCase();
    filtered = filtered.filter(e =>
      (`${e.candidat.nom} ${e.candidat.prenom}`.toLowerCase().includes(search) ||
       `${e.candidat.prenom} ${e.candidat.nom}`.toLowerCase().includes(search) ||
       `${e.jury.nom} ${e.jury.prenom}`.toLowerCase().includes(search) ||
       `${e.jury.prenom} ${e.jury.nom}`.toLowerCase().includes(search))
    );
  }

  this.totalEvaluations = filtered.length;
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

  voirEvaluation(evaluation: Evaluation): void {
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
          console.error('Erreur lors de la récupération des détails du candidat:', error);
          this.evaluationService.setSelectedCandidatDetails(null);
        }
      );

      console.log('Évaluation sélectionnée:', evaluation);

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
      console.error('Erreur de formatage de date:', error);
      return 'Date invalide';
    }
  }

  // Méthode utilitaire pour débugger
  logEvaluation(evaluation: Evaluation): void {
    console.log('Détails de l\'évaluation:', {
      id: evaluation.id,
      sujet: evaluation.sujet,
      dateHeure: evaluation.dateHeure,
      statut: evaluation.statut
    });
  }
}