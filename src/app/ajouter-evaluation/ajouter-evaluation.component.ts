// ajouter-evaluation.component.ts
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EvaluationService } from '../services/evaluation.service';
import { AuthService } from '../services/auth.service';
import { Subject, forkJoin, Observable } from 'rxjs'; // <-- Added Observable here!
import { takeUntil } from 'rxjs/operators';

interface Critere {
  id: number;
  nom: string;
  description: string;
  coefficient: number;
}

@Component({
  selector: 'app-ajouter-evaluation',
  templateUrl: './ajouter-evaluation.component.html',
  styleUrls: ['./ajouter-evaluation.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class AjouterEvaluationComponent implements OnInit, OnDestroy {
  evaluationForm: FormGroup;
  criteres: Critere[] = []; // This doesn't seem to be used in the template yet
  candidat: any = {};
  loading: boolean = true;
  error: string | null = null;
  noteFinale: number = 0;
  evaluationId: number | null = null;
  candidatId: number | null = null;
  juryId: number | null = null;
  isViewMode: boolean = false;

  @Input() setSousMenu!: (val: string) => void;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private evaluationService: EvaluationService,
    private authService: AuthService
  ) {
    this.evaluationForm = this.fb.group({
      note_clarte: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      note_contenu: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      note_pertinence: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      note_presentation: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      note_reponses: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      commentaire: ['']
    });
  }

  ngOnInit(): void {
    // 1. Get Jury ID
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

    // 2. Get data passed from EvaluationComponent (if any)
    this.evaluationId = this.evaluationService.getSelectedEvaluationId();
    this.candidatId = this.evaluationService.getSelectedCandidatId();
    this.isViewMode = this.evaluationService.getViewMode();

    if (this.isViewMode) {
      this.evaluationForm.disable(); // Disable form if in view mode
    }

    // 3. Load data based on available IDs
    // Pass 'null' explicitly for candidatId if it's null, as chargerDonnees now accepts it.
    if (this.candidatId) {
      this.chargerDonnees(this.candidatId, this.evaluationId);
    } else {
      // Fallback for direct URL access without service data (e.g., if refreshed)
      this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
        if (params['id']) {
          this.evaluationId = +params['id'];
          // If only evaluationId is available, fetch the evaluation to get candidatId
          this.evaluationService.getEvaluation(this.evaluationId).pipe(takeUntil(this.destroy$)).subscribe({
            next: (evaluation: any) => {
              this.candidatId = evaluation.candidatId;
              // Call chargerDonnees with the newly found candidatId
              this.chargerDonnees(this.candidatId, this.evaluationId);
            },
            error: (err) => {
              console.error("Erreur lors de la récupération de l'évaluation:", err);
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

    // Subscribe to form value changes to update the final note
    this.evaluationForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculerNoteFinale();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.evaluationService.resetSelectedEvaluationId();
    this.evaluationService.resetSelection();
    this.evaluationService.setSelectedCandidatDetails(null);
  }

  // Changed candidatId parameter type to number | null
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
      console.log('Résultats forkJoin:', results);

      const [candidat, evaluation] = results;
      this.candidat = candidat; // Assign the base candidate object

      if (evaluation) {
        // Assign properties from evaluation if they exist, or keep candidate's
        this.candidat.sujet = evaluation.sujet || this.candidat.sujet;
        this.candidat.dateSoutenance = evaluation.dateHeure || this.candidat.dateSoutenance;
        // **ADD THIS LINE:** Assign salle from evaluation if available
        this.candidat.salle = evaluation.salle || this.candidat.salle;
      }

      console.log("Informations du candidat chargées:", this.candidat);

      if (evaluationId && results[1]) {
        const evaluationData = results[1];
        console.log("Données d'évaluation existantes chargées:", evaluationData);

        this.evaluationForm.patchValue({
          note_clarte: evaluationData.noteClarte,
          note_contenu: evaluationData.noteContenu,
          note_pertinence: evaluationData.notePertinence,
          note_presentation: evaluationData.notePresentation,
          note_reponses: evaluationData.noteReponses,
          commentaire: evaluationData.commentaire
        });
        this.calculerNoteFinale();
      } else if (evaluationId && !results[1]) {
        console.warn(`Aucune évaluation trouvée pour l'ID: ${evaluationId}. Traitement comme nouvelle évaluation.`);
      } else {
        console.log("Pas d'évaluation existante, formulaire vide pour nouvelle évaluation.");
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

    const validNotes = notes.filter(note => typeof note === 'number' && note >= 0 && note <= 20);

    if (validNotes.length > 0) {
      const sum = validNotes.reduce((a, b) => a + b, 0);
      this.noteFinale = parseFloat((sum / validNotes.length).toFixed(1));
    } else {
      this.noteFinale = 0;
    }
  }

  mettreAJourNote(): void {
    // This method is called on (input) event from the template.
    // valueChanges subscription already handles re-calculating the noteFinale.
    // You can remove this method if the valueChanges subscription is sufficient,
    // or keep it if you need specific logic on each input.
  }

  annuler(): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette évaluation ? Toutes les modifications non sauvegardées seront perdues.')) {
      this.retourListe();
    }
  }

  retourListe(): void {
    if (this.setSousMenu) {
      this.setSousMenu('liste');
    } else {
      this.router.navigate(['/dashboard'], { queryParams: { menu: 'soutenances' } });
    }
  }

  validerEvaluation(): void {
    if (this.evaluationForm.valid) {
      if (this.isViewMode) {
        alert("Vous êtes en mode consultation. L'évaluation ne peut pas être modifiée.");
        return;
      }

      const formValues = this.evaluationForm.value;

      if (this.candidatId === null) { // Use strict equality check
        alert("Erreur: ID du candidat non disponible.");
        return;
      }
      if (this.juryId === null) { // Use strict equality check
        alert("Erreur: ID du jury non disponible. Veuillez vous reconnecter.");
        return;
      }

      const evaluationPayload = {
        candidatId: this.candidatId,
        juryId: this.juryId,
        noteClarte: formValues.note_clarte,
        noteContenu: formValues.note_contenu,
        notePertinence: formValues.note_pertinence,
        notePresentation: formValues.note_presentation,
        noteReponses: formValues.note_reponses,
        commentaire: formValues.commentaire,
        moyenne: this.noteFinale
      };

      if (this.evaluationId) {
        // Update existing evaluation
        this.evaluationService.updateEvaluation(this.evaluationId, evaluationPayload).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            alert('Évaluation mise à jour avec succès!');
            this.retourListe();
          },
          error: (err) => {
            console.error("Erreur lors de la mise à jour de l'évaluation:", err);
            alert("Erreur lors de la mise à jour de l'évaluation.");
          }
        });
      } else {
        // Create new evaluation
        this.evaluationService.createEvaluation(evaluationPayload).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            alert('Évaluation enregistrée avec succès!');
            this.retourListe();
          },
          error: (err) => {
            console.error("Erreur lors de l'enregistrement de l'évaluation:", err);
            alert("Erreur lors de l'enregistrement de l'évaluation.");
          }
        });
      }

    } else {
      Object.keys(this.evaluationForm.controls).forEach(key => {
        this.evaluationForm.get(key)?.markAsTouched();
      });
      alert('Veuillez remplir tous les champs obligatoires et corriger les erreurs.');
    }
  }
}