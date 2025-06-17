import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { EvaluationService } from '../services/evaluation.service';
import { AuthService } from '../services/auth.service';
import { Subject, forkJoin, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

/**
 * Interface définissant la structure d'un candidat
 */
interface Candidat {
  id: number;
  nom: string;
  prenom: string;
}

/**
 * Interface définissant la structure complète d'une évaluation
 * Contient toutes les notes, coefficients et métadonnées
 */
interface Evaluation {
  id: number;
  jury: { id: number };
  candidat: Candidat;
  sujet: string;
  dateHeure: string;
  salle: string;
  noteClarte: number;
  noteContenu: number;
  notePertinence: number;
  notePresentation: number;
  noteReponses: number;
  commentaire: string;
  moyenne: number;
  // Coefficients optionnels pour la pondération des notes
  coefClarte?: number;
  coefContenu?: number;
  coefPertinence?: number;
  coefPresentation?: number;
  coefReponses?: number;
}

/**
 * Composant principal pour l'ajout et la modification d'évaluations
 * Gère les modes création, édition et visualisation
 * 
 * RESPONSABILITÉS:
 * - Gestion du formulaire d'évaluation avec validation
 * - Calcul automatique de la note finale pondérée
 * - Navigation entre les modes vue/édition
 * - Sauvegarde et suppression des évaluations
 * - Gestion des cas spéciaux (candidat absent)
 */
@Component({
  selector: 'app-ajouter-evaluation',
  templateUrl: './ajouter-evaluation.component.html',
  styleUrls: ['./ajouter-evaluation.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatButtonModule,
    DatePipe
  ],
})
export class AjouterEvaluationComponent implements OnInit, OnDestroy {
  // === PROPRIÉTÉS DU FORMULAIRE ===
  evaluationForm: FormGroup;
  
  // === DONNÉES MÉTIER ===
  candidat: any = {}; // Informations du candidat évalué
  noteFinale = 0; // Note finale calculée avec pondération
  contributions: { [key: string]: number } = {}; // Coefficients de pondération
  evaluationLoadedData: any = null; // Données de l'évaluation chargée
  
  // === ÉTAT DU COMPOSANT ===
  loading = true; // Indicateur de chargement
  error: string | null = null; // Message d'erreur à afficher
  isViewMode = false; // Mode visualisation (lecture seule)
  modeVoir = false; // PROBLÈME: Duplication avec isViewMode - À refactoriser
  
  // === IDENTIFIANTS ===
  evaluationId: number | null = null; // ID de l'évaluation (null = création)
  candidatId: number | null = null; // ID du candidat
  juryId: number | null = null; // ID du jury connecté
  
  // === GESTION MÉMOIRE ===
  private destroy$ = new Subject<void>(); // Subject pour nettoyer les subscriptions
  private initialFormValue: any; // Valeur initiale du formulaire pour détection des changements
  
  // === PROTECTION CONTRE LES ACTIONS MULTIPLES ===
  public isDeleting = false; // Prévient les double-clics sur suppression
  private deleteTimeout: any = null; // Timeout pour réinitialiser l'état
  
  // === INPUT EXTERNE ===
  @Input() setSousMenu!: (val: string) => void; // Callback pour navigation parent

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private evaluationService: EvaluationService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // === INITIALISATION DU FORMULAIRE RÉACTIF ===
    // Définition des contrôles avec validation (notes de 0 à 20, commentaire obligatoire)
    this.evaluationForm = this.fb.group({
      note_clarte: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      note_contenu: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      note_pertinence: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      note_presentation: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      note_reponses: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      commentaire: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  /**
   * Initialisation du composant
   * Détermine le contexte (création/édition) et charge les données appropriées
   */
  ngOnInit(): void {
    // === RÉCUPÉRATION DE L'UTILISATEUR CONNECTÉ ===
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.error = "Erreur: ID du jury non disponible.";
      this.loading = false;
      return;
    }

    this.juryId = currentUser.id;
    
    // === RÉCUPÉRATION DES PARAMÈTRES DE NAVIGATION ===
    // Priorité 1: Données du service (navigation depuis une liste)
    this.evaluationId = this.evaluationService.getSelectedEvaluationId();
    this.candidatId = this.evaluationService.getSelectedCandidatId();
    this.modeVoir = this.isViewMode = this.evaluationService.getViewMode();

    // Mode lecture seule: désactivation du formulaire
    if (this.modeVoir) this.evaluationForm.disable();

    if (this.candidatId) {
      // === SCÉNARIO 1: Navigation depuis une liste avec candidat pré-sélectionné ===
      this.chargerDonnees(this.candidatId, this.evaluationId ?? null);
    } else {
      // === SCÉNARIO 2: Navigation directe avec ID d'évaluation en URL ===
      this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
        if (params['id']) {
          this.evaluationId = +params['id'];
          // Chargement de l'évaluation pour récupérer l'ID du candidat
          this.evaluationService.getEvaluation(this.evaluationId).pipe(takeUntil(this.destroy$)).subscribe({
            next: (evaluation: any) => {
              this.candidatId = evaluation.candidat.id;
              this.evaluationLoadedData = evaluation;
              if (this.candidatId !== null && this.candidatId !== undefined) {
                this.chargerDonnees(this.candidatId, this.evaluationId);
              }
            },
            error: (err) => {
              console.error("Error loading evaluation by ID:", err);
              this.error = "Impossible de charger l'évaluation.";
              this.loading = false;
            }
          });
        } else {
            // === SCÉNARIO 3: État invalide - pas de données ===
            this.error = "Aucun candidat ou évaluation sélectionné.";
            this.loading = false;
        }
      });
    }

    // === ÉCOUTE DES CHANGEMENTS DU FORMULAIRE ===
    // Recalcul automatique de la note finale à chaque modification
    // TODO: Optimiser avec debounceTime pour éviter les calculs excessifs
    this.evaluationForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calculerNoteFinale();
    });
  }

  /**
   * Nettoyage lors de la destruction du composant
   * Évite les fuites mémoire et remet à zéro les sélections
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Nettoyage des sélections dans le service pour éviter les états résiduels
    this.evaluationService.resetSelection();
    this.evaluationService.setSelectedCandidatDetails(null);
  }

  /**
   * Méthode centrale de chargement des données
   * Combine les appels API pour candidat et évaluation
   * 
   * @param candidatId - ID du candidat à évaluer
   * @param evaluationId - ID de l'évaluation (null pour création)
   * 
   * PROBLÈME: Méthode trop complexe, devrait être divisée
   */
  private chargerDonnees(candidatId: number, evaluationId: number | null): void {
    this.loading = true;
    
    // === PRÉPARATION DES REQUÊTES PARALLÈLES ===
    const requests: Observable<any>[] = [this.evaluationService.getCandidat(candidatId)];
    // Ajout conditionnel de la requête d'évaluation
    if (evaluationId) requests.push(this.evaluationService.getEvaluation(evaluationId));

    // === EXÉCUTION PARALLÈLE DES REQUÊTES ===
    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([candidatData, evaluationData]) => {
        // === TRAITEMENT DES DONNÉES CANDIDAT ===
        // Gestion de la variation de structure de réponse API
        const candidat = Array.isArray(candidatData) ? candidatData[0]?.candidat : candidatData?.candidat ?? candidatData;

        // Construction de l'objet candidat avec valeurs par défaut
        this.candidat = {
          nom: candidat?.nom ?? 'Nom inconnu',
          prenom: candidat?.prenom ?? 'Prénom inconnu',
          // Priorité aux données d'évaluation si disponibles
          sujet: evaluationData?.sujet ?? 'Sujet non spécifié',
          dateHeure: evaluationData?.dateHeure ?? '',
          salle: evaluationData?.salle ?? ''
        };

        // === TRAITEMENT DES DONNÉES D'ÉVALUATION (MODE ÉDITION) ===
        if (evaluationData) {
          this.evaluationLoadedData = evaluationData;
          
          // Remplissage du formulaire avec les données existantes
          this.evaluationForm.patchValue({
            note_clarte: evaluationData.noteClarte,
            note_contenu: evaluationData.noteContenu,
            note_pertinence: evaluationData.notePertinence,
            note_presentation: evaluationData.notePresentation,
            note_reponses: evaluationData.noteReponses,
            commentaire: evaluationData.commentaire,
          });
          
          // Configuration des coefficients de pondération
          this.contributions = {
            note_clarte: evaluationData.coefClarte ?? 1,
            note_contenu: evaluationData.coefContenu ?? 1,
            note_pertinence: evaluationData.coefPertinence ?? 1,
            note_presentation: evaluationData.coefPresentation ?? 1,
            note_reponses: evaluationData.coefReponses ?? 1,
          };
          
          // Sauvegarde pour détection des changements
          this.initialFormValue = this.evaluationForm.getRawValue();
          this.calculerNoteFinale(); // Recalcul avec les nouvelles données
        }

        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading candidate or evaluation data:", err);
        this.error = "Erreur lors du chargement des données.";
        this.loading = false;
      }
    });
  }

  /**
   * Calcul de la note finale pondérée
   * Applique les coefficients et ignore les notes invalides
   * 
   * ALGORITHME:
   * 1. Récupère chaque note avec son coefficient
   * 2. Filtre les notes valides (0-20)
   * 3. Calcule la moyenne pondérée
   * 4. Arrondit à 1 décimale
   */
  calculerNoteFinale(): void {
    const f = this.evaluationForm.value;
    
    // === CONSTRUCTION DU TABLEAU DE NOTES PONDÉRÉES ===
    const notes = [
      { val: f.note_clarte, coef: this.contributions['note_clarte'] ?? 1 },
      { val: f.note_contenu, coef: this.contributions['note_contenu'] ?? 1 },
      { val: f.note_pertinence, coef: this.contributions['note_pertinence'] ?? 1 },
      { val: f.note_presentation, coef: this.contributions['note_presentation'] ?? 1 },
      { val: f.note_reponses, coef: this.contributions['note_reponses'] ?? 1 },
    ];

    // === CALCUL DE LA MOYENNE PONDÉRÉE ===
    let total = 0, totalCoef = 0;
    for (const { val, coef } of notes) {
      // Validation: note numérique dans la plage 0-20
      if (typeof val === 'number' && val >= 0 && val <= 20) {
        total += val * coef;
        totalCoef += coef;
      }
    }
    
    // Calcul final avec protection division par zéro
    this.noteFinale = totalCoef > 0 ? parseFloat((total / totalCoef).toFixed(1)) : 0;
  }

  /**
   * Méthode publique pour forcer le recalcul
   * Utilisée par le template lors de changements manuels
   */
  mettreAJourNote(): void {
    this.calculerNoteFinale();
  }

  /**
   * Annulation de l'édition avec confirmation
   * Remet le formulaire en mode lecture seule
   */
  annuler(): void {
    // === DIALOG DE CONFIRMATION ===
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Confirmation',
        message: 'Êtes-vous sûr de vouloir annuler cette évaluation ? Toutes les modifications non sauvegardées seront perdues.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // === RETOUR EN MODE LECTURE ===
        this.modeVoir = true;
        this.evaluationForm.disable();
        this.snackBar.open('Édition annulée.', undefined, {
          duration: 2000,
          panelClass: 'snackbar-error'
        });
      }
    });
  }

  /**
   * Validation et sauvegarde de l'évaluation
   * Gère les cas spéciaux (candidat absent) et la logique métier
   * 
   * PROBLÈME: Méthode trop longue et complexe, devrait être refactorisée
   */
  validerEvaluation(): void {
    // === VALIDATION DU FORMULAIRE ===
    if (this.evaluationForm.invalid) {
      // Marquage de tous les champs pour affichage des erreurs
      Object.values(this.evaluationForm.controls).forEach(c => c.markAsTouched());
      this.snackBar.dismiss();
      this.snackBar.open('Veuillez remplir tous les champs obligatoires et corriger les erreurs.', undefined, {
        duration: 3000,
        panelClass: 'snackbar-error'
      });
      return;
    }

    const values = this.evaluationForm.getRawValue();

    // === DÉTECTION DU CAS "CANDIDAT ABSENT" ===
    // Si toutes les notes sont à 0, considérer comme absence
    const notes = [
      values.note_clarte,
      values.note_contenu,
      values.note_pertinence,
      values.note_presentation,
      values.note_reponses
    ];
    
    if (notes.every(n => Number(n) === 0)) {
      // === CONFIRMATION POUR CANDIDAT ABSENT ===
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        disableClose: true,
        data: {
          title: 'Confirmation',
          message: 'Toutes les notes sont à 0, ce qui veut dire que le candidat est absent. Voulez-vous valider cette évaluation comme "Absent" ?',
          confirmButtonText: 'Confirmer'
        }
      });

      dialogRef.afterClosed().subscribe(confirmed => {
        if (confirmed) {
          // === TRAITEMENT SPÉCIAL CANDIDAT ABSENT ===
          this.evaluationForm.patchValue({ commentaire: 'Absent' });
          
          // Validation des IDs requis
          if (!this.juryId || !this.candidatId) {
            this.snackBar.open('Erreur: Impossible d\'enregistrer l\'évaluation sans ID du jury ou du candidat.', undefined, { duration: 3000, panelClass: 'snackbar-error' });
            return;
          }

          // Construction du payload pour candidat absent
          const absentValues = this.evaluationForm.getRawValue();
          const absentPayload = {
            jury: { id: this.juryId },
            candidat: { id: this.candidatId },
            noteClarte: absentValues.note_clarte,
            noteContenu: absentValues.note_contenu,
            notePertinence: absentValues.note_pertinence,
            notePresentation: absentValues.note_presentation,
            noteReponses: absentValues.note_reponses,
            commentaire: absentValues.commentaire,
            moyenne: this.noteFinale,
            sujet: this.candidat.sujet || this.evaluationLoadedData?.sujet,
            dateHeure: this.candidat.dateHeure || this.evaluationLoadedData?.dateHeure,
            salle: this.candidat.salle || this.evaluationLoadedData?.salle
          };

          // Choix de l'opération (création vs mise à jour)
          const absentReq = this.evaluationId
            ? this.evaluationService.updateEvaluation(this.evaluationId, absentPayload)
            : this.evaluationService.createEvaluation(absentPayload);

          absentReq.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
              this.snackBar.dismiss();
              this.snackBar.open('Évaluation sauvegardée avec succès !', undefined, {
                duration: 2000,
                panelClass: 'snackbar-success'
              });
              this.retourListe();
            },
            error: (err) => {
              console.error("Error saving evaluation:", err);
              this.snackBar.dismiss();
              this.snackBar.open('Erreur lors de l\'enregistrement de l\'évaluation.', undefined, {
                duration: 2000,
                panelClass: 'snackbar-error'
              });
            }
          });
        }
        // Si refusé, ne rien faire et laisser l'utilisateur modifier
      });
      return;
    }

    // === VALIDATION DES PRÉREQUIS ===
    if (!this.juryId || !this.candidatId) {
      this.snackBar.open('Erreur: Impossible d\'enregistrer l\'évaluation sans ID du jury ou du candidat.', undefined, { duration: 3000, panelClass: 'snackbar-error' });
      return;
    }

    // === CONSTRUCTION DU PAYLOAD STANDARD ===
    // TODO: Extraire cette logique dans une factory
    const payload = {
      jury: { id: this.juryId },
      candidat: { id: this.candidatId },
      noteClarte: values.note_clarte,
      noteContenu: values.note_contenu,
      notePertinence: values.note_pertinence,
      notePresentation: values.note_presentation,
      noteReponses: values.note_reponses,
      commentaire: values.commentaire,
      moyenne: this.noteFinale,
      // Récupération des métadonnées de contexte
      sujet: this.candidat.sujet || this.evaluationLoadedData?.sujet,
      dateHeure: this.candidat.dateHeure || this.evaluationLoadedData?.dateHeure,
      salle: this.candidat.salle || this.evaluationLoadedData?.salle
    };

    // === EXÉCUTION DE LA SAUVEGARDE ===
    const req = this.evaluationId
      ? this.evaluationService.updateEvaluation(this.evaluationId, payload)
      : this.evaluationService.createEvaluation(payload);

    req.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.dismiss();
        this.snackBar.open('Évaluation sauvegardée avec succès !', undefined, {
          duration: 2000,
          panelClass: 'snackbar-success'
        });
        
        // === MISE À JOUR DE LA DÉCISION CANDIDAT ===
        // Logique métier: notifier le système de la modification
        if (this.candidatId && this.juryId) {
          this.evaluationService.addOrUpdateDecision(
            this.candidatId,
            this.juryId,
            'Ajout ou modification d\'évaluation'
          ).subscribe({
            next: () => this.retourListe(),
            error: (err) => {
              console.error('Erreur lors de la mise à jour de la décision:', err);
              this.retourListe(); // Continuer malgré l'erreur
            }
          });
        } else {
          this.retourListe();
        }
      },
      error: (err) => {
        console.error("Error saving evaluation:", err);
        this.snackBar.dismiss();
        this.snackBar.open('Erreur lors de l\'enregistrement de l\'évaluation.', undefined, {
          duration: 2000,
          panelClass: 'snackbar-error'
        });
      }
    });
  }

  /**
   * Activation du mode édition
   * Permet la modification d'une évaluation existante
   */
  modifierEvaluation(): void {
    this.modeVoir = false;
    this.evaluationForm.enable();
    console.log('Mode set to Modifier. Form enabled.');
  }

  /**
   * Activation du mode visualisation
   * Formulaire en lecture seule
   */
  voirEvaluation(): void {
    this.modeVoir = true;
    this.evaluationForm.disable();
    console.log('Mode set to Voir. Form disabled.');
  }

  /**
   * Suppression d'une évaluation avec protection contre les double-clics
   * Utilise un système de timeout pour éviter les actions multiples
   */
  supprimerEvaluation(): void {
    // === LOGS DE DÉBOGAGE ===
    console.log('ID évaluation actuel:', this.evaluationId, 
                'Source:', this.route.snapshot.params, 
                'Service:', this.evaluationService.getSelectedEvaluationId());
    console.log('Appel à supprimerEvaluation', {
      isDeleting: this.isDeleting,
      evaluationId: this.evaluationId
    });

    // === PROTECTION CONTRE LES DOUBLE-CLICS ===
    if(this.isDeleting) {
      console.log('Blocage: suppression déjà en cours');
      return;
    }

    // Activation du verrou avec timeout de sécurité
    this.isDeleting = true;
    this.deleteTimeout = setTimeout(() => {
      this.isDeleting = false;
    }, 3000); // Réinitialise après 3s même en cas d'erreur

    // === VALIDATION DES PRÉREQUIS ===
    if (!this.evaluationId) {
      console.error('Erreur critique: evaluationId manquant', {
        routeParams: this.route.snapshot.params,
        serviceData: this.evaluationService.getSelectedEvaluationId(),
        componentState: {
          evaluationId: this.evaluationId,
          candidatId: this.candidatId
        }
      });
      this.snackBar.open('Erreur: Évaluation introuvable', 'OK', { duration: 3000 });
      return;
    }
    
    // === CONFIRMATION DE SUPPRESSION ===
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: {
        title: 'Confirmation',
        message: 'Êtes-vous sûr de vouloir supprimer cette évaluation ?'
      }
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(confirmed => {
      if (!confirmed) {
        this.resetDeleteState();
        return;
      }
      this.executeDelete();
    });
  }

  /**
   * Exécution de la suppression
   * Méthode extraite pour améliorer la lisibilité
   */
  private executeDelete(): void {
    this.evaluationService.resetEvaluation(this.evaluationId!).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => this.handleDeleteSuccess(),
      error: (err) => this.handleDeleteError(err)
    });
  }

  /**
   * Gestion du succès de suppression
   * Met à jour les décisions et navigue vers la liste
   */
  private handleDeleteSuccess(): void {
    this.resetDeleteState();
    this.snackBar.open('Évaluation supprimée.', undefined, { duration: 10000, panelClass: 'snackbar-success' });

    // === MISE À JOUR DE LA DÉCISION CANDIDAT ===
    if (this.candidatId && this.juryId) {
      this.evaluationService.addOrUpdateDecision(this.candidatId, this.juryId, 'Suppression ou modification d\'évaluation').subscribe({
        next: () => console.log('Décision mise à jour après suppression'),
        error: (err) => console.error('Erreur lors de la mise à jour de la décision:', err)
      });
    }

    this.retourListe(true);
  }

  /**
   * Gestion des erreurs de suppression
   */
  private handleDeleteError(err: any): void {
    console.error('Erreur suppression:', err);
    this.resetDeleteState();
    this.snackBar.open('Échec de la suppression', 'OK', { duration: 3000 });
  }

  /**
   * Réinitialisation de l'état de suppression
   * Nettoie le timeout et remet le verrou à false
   */
  private resetDeleteState(): void {
    clearTimeout(this.deleteTimeout);
    this.isDeleting = false;
    console.log('État suppression réinitialisé');
  }

  /**
   * Navigation de retour vers la liste
   * Gère deux modes de navigation: callback parent ou routing direct
   * 
   * @param suppressionSuccess - Indique si on revient après une suppression réussie
   */
  retourListe(suppressionSuccess: boolean = false): void {
    console.log('Navigating back to list...');
    if (this.setSousMenu) {
      // === MODE 1: Navigation via callback parent ===
      this.setSousMenu('liste');
    } else {
      // === MODE 2: Navigation via router ===
      // Passage du statut de suppression via queryParams
      this.router.navigate(
        ['/dashboard'],
        { queryParams: { menu: 'soutenances', suppressionSuccess: suppressionSuccess ? 1 : 0 } }
      );
    }
  }
}