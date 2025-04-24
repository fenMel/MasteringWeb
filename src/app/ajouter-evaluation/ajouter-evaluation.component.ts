import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EvaluationService } from '../services/evaluation.service';

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
  candidatId!: number;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private evaluationService: EvaluationService
  ) {
    // Initialisation du formulaire avec seulement le champ commentaires
    this.evaluationForm = this.fb.group({
      commentaires: [''],
    });
  }

  ngOnInit(): void {
    // Récupérer l'ID du candidat depuis l'URL si disponible
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.candidatId = +params['id'];
        this.chargerDonnees(this.candidatId);
      } else {
        this.error = "Aucun candidat spécifié";
        this.loading = false;
      }
    });
  }
  
  private chargerDonnees(candidatId: number): void {
    this.loading = true;
    
    // Charger les informations du candidat
    this.evaluationService.getCandidat(candidatId).subscribe({
      next: (data: any) => {
        this.candidat = data;
        
        // Après avoir chargé le candidat, charger les critères d'évaluation
        this.chargerCriteres();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement du candidat:', error);
        this.error = "Impossible de charger les informations du candidat";
        this.loading = false;
      }
    });
  }
  
  private chargerCriteres(): void {
    this.evaluationService.getCriteres().subscribe({
      next: (data: any) => {
        this.criteres = data;
        
        // Ajout dynamique des contrôles de formulaire pour chaque critère après le chargement
        this.criteres.forEach(critere => {
          this.evaluationForm.addControl(
            `note_${critere.id}`, 
            this.fb.control('', [Validators.required, Validators.min(0), Validators.max(20)])
          );
        });
        
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des critères:', error);
        this.error = "Impossible de charger les critères d'évaluation";
        this.loading = false;
      }
    });
  }

  calculerContribution(critere: Critere): number {
    const noteControl = this.evaluationForm.get(`note_${critere.id}`);
    if (noteControl && noteControl.valid) {
      const note = noteControl.value;
      return parseFloat((note * critere.coefficient).toFixed(1));
    }
    return 0;
  }

  calculerNoteFinale(): void {
    let somme = 0;
    let coefficientTotal = 0;
    
    this.criteres.forEach(critere => {
      const noteControl = this.evaluationForm.get(`note_${critere.id}`);
      if (noteControl && noteControl.valid) {
        somme += noteControl.value * critere.coefficient;
        coefficientTotal += critere.coefficient;
      }
    });
    
    this.noteFinale = coefficientTotal > 0 ? parseFloat((somme / coefficientTotal).toFixed(1)) : 0;
  }

  mettreAJourNote(): void {
    this.calculerNoteFinale();
  }

  annuler(): void {
    // Redirection vers la liste des évaluations ou nettoyage du formulaire
    if (confirm('Êtes-vous sûr de vouloir annuler cette évaluation?')) {
      this.router.navigate(['/dashboard'], { queryParams: { menu: 'soutenances' } });
    }
  }
  
  retourListe(): void {
    // Redirection vers le tableau de bord et vers la section "soutenances"
    this.router.navigate(['/dashboard'], { queryParams: { menu: 'soutenances' } });
  }
  

  validerEvaluation(): void {
    if (this.evaluationForm.valid) {
      // Préparation des données pour l'envoi au backend
      const evaluation = {
        candidatId: this.candidatId,
        notes: this.criteres.map(critere => ({
          critereId: critere.id,
          note: this.evaluationForm.get(`note_${critere.id}`)?.value
        })),
        commentaires: this.evaluationForm.get('commentaires')?.value,
        noteFinale: this.noteFinale
      };
      
      // Envoi des données au backend Spring Boot
      this.evaluationService.createEvaluation(evaluation).subscribe({
        next: (response: any) => {
          alert('Évaluation enregistrée avec succès!');
          this.router.navigate(['/evaluations']);
        },
        error: (error: any) => {
          console.error('Erreur lors de l\'enregistrement:', error);
          alert('Une erreur est survenue lors de l\'enregistrement de l\'évaluation.');
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.evaluationForm.controls).forEach(key => {
        this.evaluationForm.get(key)?.markAsTouched();
      });
      alert('Veuillez remplir correctement tous les champs obligatoires.');
    }
  }
  
}