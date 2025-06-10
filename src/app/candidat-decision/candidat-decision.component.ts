import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { EvaluationService } from '../services/evaluation.service';
import { DecisionService } from '../services/decision.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-candidat-decision',
  templateUrl: './candidat-decision.component.html',
  styleUrls: ['./candidat-decision.component.scss'],
  imports: [CommonModule]
})
export class CandidatDecisionComponent implements OnInit {
  evaluationResults: any[] = [];
@Input() setSousMenu: any;
  constructor(
    private authService: AuthService,
    private evaluationService: EvaluationService,
    private decisionService: DecisionService
  ) {}

  ngOnInit(): void {
    // Récupérer les résultats d'évaluation si l'utilisateur est un candidat
    if (this.authService.isCandidat()) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && currentUser.id) {
        // Récupérer les évaluations
        this.evaluationService.getEvaluationForCandidat(currentUser.id).subscribe({
          next: (results: any[]) => {
            // Récupérer les décisions associées à ce candidat
            this.decisionService.getDecisionsByCandidat(currentUser.id).subscribe({
              next: (decisions: any[]) => {
                // Pour chaque évaluation, ajoute le verdict correspondant (si trouvé)
                this.evaluationResults = results.map(evaluation => {
                  const decision = decisions.find(d => d.evaluationId === evaluation.id);
                  return {
                    ...evaluation,
                    verdict: decision ? decision.verdict : 'Non disponible'
                  };
                });
              },
              error: (err: Error) => {
                console.error("Erreur lors de la récupération des décisions:", err);
                // Si erreur, on garde les résultats sans verdict
                this.evaluationResults = results;
              }
            });
          },
          error: (err: Error) => {
            console.error("Erreur lors de la récupération des résultats d'évaluation:", err);
          }
        });
      }
    }
  }
}
