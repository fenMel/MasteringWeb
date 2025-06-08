import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { EvaluationService } from '../services/evaluation.service';
import { AuthService } from '../services/auth.service';
import { Subject, forkJoin, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

interface Critere {
  id: number;
  nom: string;
  description: string;
  coefficient: number;
}

interface Candidat {
  id: number;
  nom: string;
  prenom: string;
}
interface Evaluation {
  id: number;
  jury: { id: number };
  candidat: Candidat; // Nested candidate object
  sujet: string;
  dateHeure: string; // Or Date, depending on your backend's date format and Angular's parsing
  salle: string;
  noteClarte: number;
  noteContenu: number;
  notePertinence: number;
  notePresentation: number;
  noteReponses: number;
  commentaire: string;
  moyenne: number;
}


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
  MatButtonModule   
 
],})
export class AjouterEvaluationComponent implements OnInit, OnDestroy {
  evaluationForm: FormGroup;
  criteres: Critere[] = []; // This doesn't seem to be used, consider removing if not needed.
  candidat: any = {}; // Consider a more specific interface for Candidat
  loading: boolean = true;
  error: string | null = null;
  noteFinale: number = 0;
  evaluationId: number | null = null;
  candidatId: number | null = null;
  juryId: number | null = null;
  isViewMode: boolean = false; // Controls if the form is disabled
  modeVoir: boolean = false; // Another flag for view mode, consider consolidating with isViewMode

  // Store the full evaluation data loaded from the backend for updates
  evaluationLoadedData: any = null; // Use EvaluationData interface here if defined
  private initialFormValue: any;

  @Input() setSousMenu!: (val: string) => void;

  private destroy$ = new Subject<void>();
 

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private evaluationService: EvaluationService,
    public authService: AuthService,
     private snackBar: MatSnackBar,
      private dialog: MatDialog


  ) {
    this.evaluationForm = this.fb.group({
      note_clarte: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      note_contenu: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      note_pertinence: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      note_presentation: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      note_reponses: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      commentaire: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    // 1. Get Jury ID from current user
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.juryId = currentUser.id;
      console.log('Jury ID connecté dans AjouterEvaluationComponent:', this.juryId);
    } else {
      console.warn('Aucun utilisateur connecté trouvé, ou ID du jury non disponible.');
      this.error = "Erreur: ID du jury non disponible. Veuillez vous reconnecter.";
      this.loading = false;
      return;
    }

    // 2. Get data passed from EvaluationComponent (via service)
    this.evaluationId = this.evaluationService.getSelectedEvaluationId();
    console.log('DEBUG: evaluationId récupéré:', this.evaluationId);
    this.candidatId = this.evaluationService.getSelectedCandidatId();
    this.isViewMode = this.evaluationService.getViewMode();
    this.modeVoir = this.evaluationService.getViewMode(); // Synchronize with isViewMode
    if (this.modeVoir) {
      this.evaluationForm.disable();
    } else {
      this.evaluationForm.enable();
    }

    // 3. Load data based on available IDs
    if (this.candidatId) {
      this.chargerDonnees(this.candidatId, this.evaluationId ?? null);
    } else {
      // Fallback for direct URL access without service data (e.g., if refreshed)
      this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
        if (params['id']) {
          this.evaluationId = +params['id']; // Convert to number
          // If only evaluationId is available, fetch the evaluation to get candidatId
          this.evaluationService.getEvaluation(this.evaluationId).pipe(takeUntil(this.destroy$)).subscribe({
            next: (evaluation: any) => {
              this.candidatId = evaluation.candidat.id; // Correctly get candidat ID from nested object
              this.evaluationLoadedData = evaluation; // Store the loaded evaluation data here too
              this.chargerDonnees(this.candidatId, this.evaluationId);
            },
            error: (err) => {
              console.error("Erreur lors de la récupération de l'évaluation par ID:", err);
              this.error = "Impossible de charger l'évaluation.";
              this.loading = false;
            }
          });
        } else {
          this.error = "Aucun ID d'évaluation ou de candidat fourni.";
          this.loading = false;
        }
      });
    }

    // Subscribe to form value changes to update the final note dynamically
    this.evaluationForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculerNoteFinale();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Reset service state when component is destroyed to prevent stale data
    this.evaluationService.resetSelection();
    this.evaluationService.setSelectedCandidatDetails(null);
  }

  private chargerDonnees(candidatId: number | null, evaluationId: number | null): void {
    this.loading = true;
    this.error = null;

    if (candidatId === null) {
      this.error = "Impossible de charger les données: l'ID du candidat est manquant.";
      this.loading = false;
      return;
    }

    const requests: Observable<any>[] = [
      this.evaluationService.getCandidat(candidatId)
    ];

    if (evaluationId) {
      requests.push(this.evaluationService.getEvaluation(evaluationId));
    }

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results: any[]) => {
        const [candidatData, evaluationData] = results;

        // --- LOGIQUE POUR EXTRAIRE LE BON CANDIDAT ---
        let candidatInfo: any = null;
        if (Array.isArray(candidatData) && candidatData.length > 0) {
          // Si c'est un tableau, cherche la propriété 'candidat'
          candidatInfo = candidatData.find(
            c => String(c.candidat?.id) === String(candidatId)
          )?.candidat;
        } else if (candidatData && candidatData.candidat) {
          // Si c'est un objet direct avec .candidat
          candidatInfo = candidatData.candidat;
        } else if (candidatData && candidatData.id) {
          // Si c'est un objet candidat simple
          candidatInfo = candidatData;
        }
        this.candidat = candidatInfo
          ? {
            nom: candidatInfo.nom ?? 'Nom inconnu',
            prenom: candidatInfo.prenom ?? 'Prénom inconnu',
            sujet: evaluationData?.sujet || 'Sujet non spécifié',
            dateHeure: evaluationData?.dateHeure || '',
            salle: evaluationData?.salle || ''
          }
          : {
            nom: 'Nom inconnu',
            prenom: 'Prénom inconnu',
            sujet: evaluationData?.sujet || 'Sujet non spécifié',
            dateHeure: evaluationData?.dateHeure || '',
            salle: evaluationData?.salle || ''
          };

        if (evaluationId && evaluationData) {
          this.evaluationLoadedData = evaluationData;
          this.evaluationForm.patchValue({
            note_clarte: evaluationData.noteClarte,
            note_contenu: evaluationData.noteContenu,
            note_pertinence: evaluationData.notePertinence,
            note_presentation: evaluationData.notePresentation,
            note_reponses: evaluationData.noteReponses,
            commentaire: evaluationData.commentaire
          });
          this.initialFormValue = this.evaluationForm.getRawValue();
          this.calculerNoteFinale();
        } else {
          this.evaluationForm.reset();
          this.noteFinale = 0;
          this.evaluationLoadedData = null;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des données (candidat ou évaluation):", err);
        this.error = "Impossible de charger les informations nécessaires.";
        this.loading = false;
      }
    });
  }

  calculerNoteFinale(): void {
    const notes = [
      this.evaluationForm.get('note_clarte')?.value || 0,
      this.evaluationForm.get('note_contenu')?.value || 0,
      this.evaluationForm.get('note_pertinence')?.value || 0,
      this.evaluationForm.get('note_presentation')?.value || 0,
      this.evaluationForm.get('note_reponses')?.value || 0
    ];

    // Filter out non-numeric or out-of-range values to ensure valid calculation
    const validNotes = notes.filter(note => typeof note === 'number' && note >= 0 && note <= 20);

    if (validNotes.length > 0) {
      const sum = validNotes.reduce((a, b) => a + b, 0);
      this.noteFinale = parseFloat((sum / validNotes.length).toFixed(1));
    } else {
      this.noteFinale = 0;
    }
  }

  mettreAJourNote(): void {
    this.calculerNoteFinale();
  }

  annuler(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Confirmation',
        message: 'Êtes-vous sûr de vouloir annuler cette évaluation ? Toutes les modifications non sauvegardées seront perdues.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.snackBar.open('Évaluation annulée.', undefined, {
          duration: 2000,
          panelClass: 'snackbar-error'
        });
        this.retourListe();
      }
      // Si result est false ou undefined, on ne fait rien
    });
  }

  retourListe(): void {
    if (this.setSousMenu) {
      this.setSousMenu('liste');
    } else {
      this.router.navigate(['/dashboard'], { queryParams: { menu: 'soutenances' } });
    }
  }

  validerEvaluation(): void {
    if (this.evaluationForm.invalid) {
      Object.keys(this.evaluationForm.controls).forEach(key => {
        this.evaluationForm.get(key)?.markAsTouched();
      });
      this.snackBar.open('Veuillez corriger les erreurs dans le formulaire.', 'Fermer', {
        duration: 4000,
        panelClass: 'snackbar-error'
      });
      return;
    }

    if (this.evaluationForm.pristine ||
        JSON.stringify(this.evaluationForm.getRawValue()) === JSON.stringify(this.initialFormValue)) {
      this.snackBar.open('Aucune modification détectée.', undefined, {
        duration: 3000,
        panelClass: 'snackbar-error'
      });
      return;
    }

    if (this.evaluationForm.valid) {
      const formValues = this.evaluationForm.value;

      if (this.candidatId === null) {
        this.snackBar.open("Erreur: ID du candidat non disponible.", 'Fermer', {
          duration: 4000,
          panelClass: 'snackbar-error'
        });
        return;
      }
      if (this.juryId === null) {
        this.snackBar.open("Erreur: ID du jury non disponible. Veuillez vous reconnecter.", 'Fermer', {
          duration: 4000,
          panelClass: 'snackbar-error'
        });
        return;
      }

      const evaluationPayload = {
        jury: { id: this.juryId },
        candidat: { id: this.candidatId },
        noteClarte: formValues.note_clarte,
        noteContenu: formValues.note_contenu,
        notePertinence: formValues.note_pertinence,
        notePresentation: formValues.note_presentation,
        noteReponses: formValues.note_reponses,
        commentaire: formValues.commentaire,
        moyenne: this.noteFinale,
        sujet: this.evaluationLoadedData?.sujet || null,
        dateHeure: this.evaluationLoadedData?.dateHeure || null,
        salle: this.evaluationLoadedData?.salle || null
      };

      console.log('Payload sent to backend:', evaluationPayload);

      let operation$: Observable<any>;

      if (this.evaluationId) {
        operation$ = this.evaluationService.updateEvaluation(this.evaluationId, evaluationPayload);
      } else {
        operation$ = this.evaluationService.createEvaluation(evaluationPayload);
      }

      operation$.pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.snackBar.open(
            this.evaluationId ? 'Évaluation mise à jour avec succès!' : 'Évaluation enregistrée avec succès!',
            undefined,
            { duration: 3000, panelClass: 'snackbar-success' }
          );
          this.retourListe();
        },
        error: (err) => {
          const errorMessage = err.error?.message || err.message || "Erreur inconnue lors de l'enregistrement/mise à jour.";
          this.snackBar.open(
            "Erreur lors de l'opération sur l'évaluation: " + errorMessage,
            undefined,
            { duration: 4000, panelClass: 'snackbar-error' }
          );
        }
      });

    } else {
      Object.keys(this.evaluationForm.controls).forEach(key => {
        this.evaluationForm.get(key)?.markAsTouched();
      });
      this.snackBar.open('Veuillez remplir tous les champs obligatoires et corriger les erreurs.', 'Fermer', {
        duration: 4000,
        panelClass: 'snackbar-error'
      });
    }
  }

  // Helper methods to control form state
  voirEvaluation(): void {
    this.modeVoir = true;
    this.evaluationForm.disable();
  }

  modifierEvaluation(): void {
    this.modeVoir = false;
    this.evaluationForm.enable();
  }

  supprimerEvaluation(): void {
    if (!this.evaluationId) return;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Confirmation',
        message: 'Êtes-vous sûr de vouloir supprimer cette évaluation ? Cette action est irréversible.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
        console.log('Résultat du dialog:', result);

      if (result === true) {
          console.log('Suppression demandée pour evaluationId:', this.evaluationId);

        this.evaluationService.resetEvaluation(this.evaluationId!).subscribe({
          next: () => {
            this.snackBar.open('Évaluation supprimée avec succès.', undefined, {
              duration: 3000,
              panelClass: 'snackbar-success'
            });
            this.retourListe();
          },
          error: (err) => {
            console.error('Erreur lors de la suppression:', err);
          }
        });
      }
    });
  }
}