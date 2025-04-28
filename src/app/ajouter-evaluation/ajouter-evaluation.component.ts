import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EvaluationService } from '../services/evaluation.service';
import { AuthService } from '../services/auth.service';

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
export class AjouterEvaluationComponent implements OnInit {
  evaluationForm: FormGroup;
  criteres: Critere[] = [];
  candidat: any = {};
  loading: boolean = true;
  error: string | null = null;
  noteFinale: number = 0;
  evaluationId!: number;
  candidatId!: number;

  @Input() setSousMenu!: (val: string) => void;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private evaluationService: EvaluationService,
    private authService: AuthService
  ) {
    // Créer directement les contrôles pour chaque note
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
    const selectedEvaluationId = this.evaluationService.getSelectedEvaluationId();
    const selectedCandidatId = this.evaluationService.getSelectedCandidatId();
    const viewMode = this.evaluationService.getViewMode();

    if (selectedEvaluationId && selectedCandidatId) {
      this.evaluationId = selectedEvaluationId;
      this.candidatId = selectedCandidatId;

      if (viewMode) {
        this.evaluationForm.disable();
      }

      this.chargerDonnees(this.candidatId);
     
    } else {
      // Cas navigation directe via URL
      this.route.params.subscribe(params => {
        if (params['id']) {
          this.evaluationId = +params['id'];
          this.evaluationService.getEvaluation(this.evaluationId).subscribe({
            next: (evaluation: any) => {
              this.candidatId = evaluation.candidatId;
              this.chargerDonnees(this.candidatId);
            },
            error: () => {
              this.error = "Impossible de charger l'évaluation.";
              this.loading = false;
            }
          });
        } else {
          this.error = "Aucun ID fourni.";
          this.loading = false;
        }
      });
    }
  }

  private chargerDonnees(candidatId: number): void {
    this.loading = true;
  
    // Récupérer les informations du candidat
    this.evaluationService.getCandidatId(candidatId).subscribe({
      next: (candidatData: any) => {
        this.candidat = candidatData;
        
        // Si on a un ID d'évaluation, charger les données d'évaluation
        if (this.evaluationId) {
          this.evaluationService.getEvaluation(this.evaluationId).subscribe({
            next: (evaluationData: any) => {
              console.log("Données d'évaluation reçues:", evaluationData);

              // Remplir le formulaire avec les valeurs existantes
              this.evaluationForm.patchValue({
                note_clarte: evaluationData.noteClarte,
                note_contenu: evaluationData.noteContenu,
                note_pertinence: evaluationData.notePertinence,
                note_presentation: evaluationData.notePresentation,
                note_reponses: evaluationData.noteReponses,
                commentaire: evaluationData.commentaire
              });
              
              this.calculerNoteFinale();
              this.loading = false;
              this.evaluationService.resetSelection();
            },
            error: (err) => {
              console.warn("Pas d'évaluation existante pour ce candidat:", err);
              this.loading = false;
              this.evaluationService.resetSelection();
            }
          });
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error("Erreur lors du chargement du candidat:", err);
        this.error = "Impossible de charger les informations du candidat.";
        this.loading = false;
      }
    });
  }
  

  goToAjout(): void {
    if (this.setSousMenu) {
      this.setSousMenu('ajouter');
    }
  }

  calculerNoteFinale(): void {
    const notes = [
      this.evaluationForm.get('note_clarte')?.value || 0,
      this.evaluationForm.get('note_contenu')?.value || 0,
      this.evaluationForm.get('note_pertinence')?.value || 0,
      this.evaluationForm.get('note_presentation')?.value || 0,
      this.evaluationForm.get('note_reponses')?.value || 0
    ];
    
    const notesValides = notes.filter(note => note > 0);
    
    if (notesValides.length > 0) {
      const somme = notesValides.reduce((a, b) => a + b, 0);
      this.noteFinale = parseFloat((somme / notesValides.length).toFixed(1));
    } else {
      this.noteFinale = 0;
    }
  }

  mettreAJourNote(): void {
    this.calculerNoteFinale();
  }

  annuler(): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette évaluation ?')) {
      this.router.navigate(['/dashboard'], { queryParams: { menu: 'soutenances' } });
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
      const formValues = this.evaluationForm.value;
      const currentUser = this.authService.getCurrentUser();
  
      if (!currentUser || !currentUser.id) {
        alert("Erreur: Impossible de récupérer l'ID du jury. Veuillez vous reconnecter.");
        return;
      }
  
      const evaluation = {
        candidatId: this.candidatId,
        juryId: currentUser.id,
        noteClarte: formValues.note_clarte,
        noteContenu: formValues.note_contenu,
        notePertinence: formValues.note_pertinence,
        notePresentation: formValues.note_presentation,
        noteReponses: formValues.note_reponses,
        commentaire: formValues.commentaire,
        moyenne: this.noteFinale
      };
  
      // 🔥 CORRECT : UN SEUL IF / ELSE 🔥
      if (this.evaluationId) {
        // Mise à jour d'une évaluation existante
        this.evaluationService.updateEvaluation(this.evaluationId, evaluation).subscribe({
          next: () => {
            alert('Évaluation mise à jour avec succès!');
            this.router.navigate(['/dashboard'], { queryParams: { menu: 'soutenances' } });
          },
          error: (err) => {
            console.error("Erreur lors de la mise à jour de l'évaluation:", err);
            alert("Erreur lors de la mise à jour de l'évaluation.");
          }
        });
      } else {
        // Création d'une nouvelle évaluation
        this.evaluationService.createEvaluation(evaluation).subscribe({
          next: () => {
            alert('Évaluation enregistrée avec succès!');
            this.router.navigate(['/dashboard'], { queryParams: { menu: 'soutenances' } });
          },
          error: (err) => {
            console.error("Erreur lors de l'enregistrement de l'évaluation:", err);
            alert("Erreur lors de l'enregistrement de l'évaluation.");
          }
        });
      }
  
    } else {
      // Marquer tous les champs invalides
      Object.keys(this.evaluationForm.controls).forEach(key => {
        this.evaluationForm.get(key)?.markAsTouched();
      });
      alert('Veuillez remplir tous les champs correctement.');
    }
  }
  
}