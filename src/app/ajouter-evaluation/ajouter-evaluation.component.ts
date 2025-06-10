import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common'; // Import DatePipe
import { EvaluationService } from '../services/evaluation.service';
import { AuthService } from '../services/auth.service';
import { Subject, forkJoin, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

interface Candidat {
  id: number;
  nom: string;
  prenom: string;
}

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
  coefClarte?: number;
  coefContenu?: number;
  coefPertinence?: number;
  coefPresentation?: number;
  coefReponses?: number;
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
    MatButtonModule,
    DatePipe // Make sure DatePipe is imported for the template pipe
  ],
})
export class AjouterEvaluationComponent implements OnInit, OnDestroy {
  evaluationForm: FormGroup;
  candidat: any = {};
  loading = true;
  error: string | null = null;
  noteFinale = 0;
  evaluationId: number | null = null;
  candidatId: number | null = null;
  juryId: number | null = null;
  isViewMode = false;
  modeVoir = false;
  contributions: { [key: string]: number } = {};
  evaluationLoadedData: any = null;
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
      commentaire: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.error = "Erreur: ID du jury non disponible.";
      this.loading = false;
      return;
    }

    this.juryId = currentUser.id;
    // Attempt to get evaluationId and candidatId from service first (if set by a previous route)
    this.evaluationId = this.evaluationService.getSelectedEvaluationId();
    this.candidatId = this.evaluationService.getSelectedCandidatId();
    this.modeVoir = this.isViewMode = this.evaluationService.getViewMode();

    if (this.modeVoir) this.evaluationForm.disable();

    if (this.candidatId) {
      // If candidatId is already set (e.g., from a list selection)
      this.chargerDonnees(this.candidatId, this.evaluationId ?? null);
    } else {
      // If directly navigating to this component with an evaluation ID in URL
      this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
        if (params['id']) {
          this.evaluationId = +params['id'];
          // Fetch evaluation details to get candidatId and other data
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
            // If no candidatId or evaluationId is found, it's an error or incomplete state
            this.error = "Aucun candidat ou évaluation sélectionné.";
            this.loading = false;
        }
      });
    }

    this.evaluationForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calculerNoteFinale();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // It's good practice to reset selections when leaving the component
    this.evaluationService.resetSelection();
    this.evaluationService.setSelectedCandidatDetails(null);
  }

  private chargerDonnees(candidatId: number, evaluationId: number | null): void {
    this.loading = true;
    const requests: Observable<any>[] = [this.evaluationService.getCandidat(candidatId)];
    // Only fetch evaluation details if an evaluationId is provided
    if (evaluationId) requests.push(this.evaluationService.getEvaluation(evaluationId));

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([candidatData, evaluationData]) => {
        // Adjust based on how your API returns candidat data.
        // It seems `getCandidat` might return an array or an object directly.
        const candidat = Array.isArray(candidatData) ? candidatData[0]?.candidat : candidatData?.candidat ?? candidatData;

        this.candidat = {
          nom: candidat?.nom ?? 'Nom inconnu',
          prenom: candidat?.prenom ?? 'Prénom inconnu',
          // If evaluationData is present, use its subject, dateHeure, salle. Otherwise, default.
          sujet: evaluationData?.sujet ?? 'Sujet non spécifié',
          dateHeure: evaluationData?.dateHeure ?? '',
          salle: evaluationData?.salle ?? ''
        };

        if (evaluationData) {
          this.evaluationLoadedData = evaluationData;
          this.evaluationForm.patchValue({
            note_clarte: evaluationData.noteClarte,
            note_contenu: evaluationData.noteContenu,
            note_pertinence: evaluationData.notePertinence,
            note_presentation: evaluationData.notePresentation,
            note_reponses: evaluationData.noteReponses,
            commentaire: evaluationData.commentaire,
          });
          this.contributions = {
            note_clarte: evaluationData.coefClarte ?? 1,
            note_contenu: evaluationData.coefContenu ?? 1,
            note_pertinence: evaluationData.coefPertinence ?? 1,
            note_presentation: evaluationData.coefPresentation ?? 1,
            note_reponses: evaluationData.coefReponses ?? 1,
          };
          this.initialFormValue = this.evaluationForm.getRawValue();
          this.calculerNoteFinale(); // Recalculate if data loaded
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

  calculerNoteFinale(): void {
    const f = this.evaluationForm.value;
    const notes = [
      { val: f.note_clarte, coef: this.contributions['note_clarte'] ?? 1 },
      { val: f.note_contenu, coef: this.contributions['note_contenu'] ?? 1 },
      { val: f.note_pertinence, coef: this.contributions['note_pertinence'] ?? 1 },
      { val: f.note_presentation, coef: this.contributions['note_presentation'] ?? 1 },
      { val: f.note_reponses, coef: this.contributions['note_reponses'] ?? 1 },
    ];

    let total = 0, totalCoef = 0;
    for (const { val, coef } of notes) {
      if (typeof val === 'number' && val >= 0 && val <= 20) {
        total += val * coef;
        totalCoef += coef;
      }
    }
    this.noteFinale = totalCoef > 0 ? parseFloat((total / totalCoef).toFixed(1)) : 0;
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
      this.modeVoir = true;
      this.evaluationForm.disable();
      this.snackBar.open('Édition annulée.', undefined, {
        duration: 2000,
        panelClass: 'snackbar-error'
      });
    }
  });
}



  validerEvaluation(): void {
    if (this.evaluationForm.invalid) {
      // Marque tous les champs comme touchés pour afficher les erreurs
      Object.values(this.evaluationForm.controls).forEach(c => c.markAsTouched());
      this.snackBar.dismiss();
      this.snackBar.open('Veuillez remplir tous les champs obligatoires et corriger les erreurs.', undefined, {
        duration: 3000,
        panelClass: 'snackbar-error'
      });
      return;
    }

    const values = this.evaluationForm.getRawValue();

    // Vérification : toutes les notes sont-elles à 0 ?
    const notes = [
      values.note_clarte,
      values.note_contenu,
      values.note_pertinence,
      values.note_presentation,
      values.note_reponses
    ];
    if (notes.every(n => Number(n) === 0)) {
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
          this.evaluationForm.patchValue({ commentaire: 'Absent' });
          // puis continue la validation ici (appelle la suite de validerEvaluation)
          // Submit the evaluation as in the normal flow
          // Ensure jury and candidat IDs are available
          if (!this.juryId || !this.candidatId) {
            this.snackBar.open('Erreur: Impossible d\'enregistrer l\'évaluation sans ID du jury ou du candidat.', undefined, { duration: 3000, panelClass: 'snackbar-error' });
            return;
          }

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
        // sinon, ne rien faire
      });
      return;
    }

    // Ensure jury and candidat IDs are available
    if (!this.juryId || !this.candidatId) {
      this.snackBar.open('Erreur: Impossible d\'enregistrer l\'évaluation sans ID du jury ou du candidat.', undefined, { duration: 3000, panelClass: 'snackbar-error' });
      return;
    }

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
      // Ensure these are passed from loaded data, or set defaults if not available
      sujet: this.candidat.sujet || this.evaluationLoadedData?.sujet,
      dateHeure: this.candidat.dateHeure || this.evaluationLoadedData?.dateHeure,
      salle: this.candidat.salle || this.evaluationLoadedData?.salle
    };

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
        // Appel à addOrUpdateDecision pour mettre à jour la décision du candidat
        if (this.candidatId && this.juryId) {
          this.evaluationService.addOrUpdateDecision(
            this.candidatId,
            this.juryId,
            'Ajout ou modification d\'évaluation'
          ).subscribe({
            next: () => this.retourListe(),
            error: (err) => {
              console.error('Erreur lors de la mise à jour de la décision:', err);
              this.retourListe();
            }
          });
        } else {
          this.retourListe();
        }
      },
      error: (err) => {
        console.error("Error saving evaluation:", err);
        this.snackBar.dismiss(); // Dismiss previous snackbar if any
        this.snackBar.open('Erreur lors de l\'enregistrement de l\'évaluation.', undefined, {
          duration: 2000,
          panelClass: 'snackbar-error'
        });
      }
    });
  }

  

  modifierEvaluation(): void {
    this.modeVoir = false;
    this.evaluationForm.enable();
    console.log('Mode set to Modifier. Form enabled.');
  }

  voirEvaluation(): void {
    this.modeVoir = true;
    this.evaluationForm.disable();
    console.log('Mode set to Voir. Form disabled.');
  }

public isDeleting = false;
private deleteTimeout: any = null;

supprimerEvaluation(): void {
   console.log('ID évaluation actuel:', this.evaluationId, 
              'Source:', this.route.snapshot.params, 
              'Service:', this.evaluationService.getSelectedEvaluationId());
  // Debug explicite
  console.log('Appel à supprimerEvaluation', {
    isDeleting: this.isDeleting,
    evaluationId: this.evaluationId
  });

  if( this.isDeleting) {
    console.log('Blocage: suppression déjà en cours');
    return;
  }

  // Protection double-clic
  this.isDeleting = true;
  this.deleteTimeout = setTimeout(() => {
    this.isDeleting = false;
  }, 3000); // Réinitialise après 3s même en cas d'erreur

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

private executeDelete(): void {
  this.evaluationService.resetEvaluation(this.evaluationId!).pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: () => this.handleDeleteSuccess(),
    error: (err) => this.handleDeleteError(err)
  });
}

private handleDeleteSuccess(): void {
  this.resetDeleteState();
  this.snackBar.open('Évaluation supprimée.', undefined, { duration: 10000, panelClass: 'snackbar-success' });

  // Appel à addOrUpdateDecision pour mettre à jour la décision du candidat
  if (this.candidatId && this.juryId) {
    this.evaluationService.addOrUpdateDecision(this.candidatId, this.juryId, 'Suppression ou modification d\'évaluation').subscribe({
      next: () => console.log('Décision mise à jour après suppression'),
      error: (err) => console.error('Erreur lors de la mise à jour de la décision:', err)
    });
  }

  this.retourListe(true);
}

private handleDeleteError(err: any): void {
  console.error('Erreur suppression:', err);
  this.resetDeleteState();
  this.snackBar.open('Échec de la suppression', 'OK', { duration: 3000 });
}

private resetDeleteState(): void {
  clearTimeout(this.deleteTimeout);
  this.isDeleting = false;
  console.log('État suppression réinitialisé');
}
  retourListe(suppressionSuccess: boolean = false): void {
    console.log('Navigating back to list...');
    if (this.setSousMenu) {
      this.setSousMenu('liste');
    } else {
      // Passe suppressionSuccess dans les queryParams
      this.router.navigate(
        ['/dashboard'],
        { queryParams: { menu: 'soutenances', suppressionSuccess: suppressionSuccess ? 1 : 0 } }
      );
    }
  }
}