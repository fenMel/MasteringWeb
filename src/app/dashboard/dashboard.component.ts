import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
// Importez votre composant d'évaluation
import { EvaluationComponent } from '../evaluation/evaluation.component';
import { AjouterFormationComponent } from '../ajouter-formation/ajouter-formation.component';
import { GestionFormationsComponent } from '../gestion-formations/gestion-formations.component';
import { AjouterEvaluationComponent} from '../ajouter-evaluation/ajouter-evaluation.component';
import { SessionsFormationComponent } from '../sessions-formation/sessions-formation.component';
import { EvaluationService } from '../services/evaluation.service';
import { GestionEvaluationComponent } from '../gestion-evaluation/gestion-evaluation.component';
import { ActivatedRoute } from '@angular/router';
import {AjoutUtilisateurs, } from '../ajout-utilisateurs/ajout-utilisateurs.component';
import { DecisionComponent } from '../decision/decision.component';
import { VoirDecisionComponent } from '../voir-decision/voir-decision.component';
import { Decision } from '../decision/decision.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    EvaluationComponent,
    GestionFormationsComponent,
    AjouterFormationComponent,
    SessionsFormationComponent,
    AjouterEvaluationComponent,
    AjoutUtilisateurs,
    GestionEvaluationComponent,
    DecisionComponent,
    VoirDecisionComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  activeMenu: string = 'tableau';
  sousMenu: string = 'liste'; // 'liste' ou 'ajouter'
  evaluationId?: number; // Ajout d'une propriété pour stocker l'ID d'évaluation
  evaluationResults: any = null; // Stocker les résultats d'évaluation
  decisionSelectionnee: Decision | null = null;

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    private evaluationService: EvaluationService
  ) {}

  ngOnInit(): void {
    // Décoder le token pour accéder aux rôles et au nom d'utilisateur
    this.authService.decodeMyToken();

    // Affichage des informations de débogage
    console.log("Rôle JURY:", this.authService.isJury());
    console.log("Rôle CANDIDAT:", this.authService.isCandidat());
    console.log("Rôle COORDINATEUR:", this.authService.isCoordinateur());
    console.log("Utilisateur connecté:", this.authService.isConnected());
    console.log("Nom d'utilisateur:", this.authService.username);

    // Redirection si l'utilisateur n'est pas connecté
    if (!this.authService.isConnected()) {
      console.log("L'utilisateur n'est pas connecté, redirection en cours...");
    }

    // Récupérer les paramètres de la route pour définir le menu actif et le sous-menu
    this.route.queryParams.subscribe((params: any) => {
      if (params['menu']) {
        this.activeMenu = params['menu'];
        console.log("Menu actif (via URL) :", this.activeMenu);
      }

      if (params['sousMenu']) {
        this.sousMenu = params['sousMenu'];
        console.log("Sous-menu actif (via URL) :", this.sousMenu);
      }

      if (params['id']) {
        this.evaluationId = +params['id']; // Convertir en nombre
        console.log("ID d'évaluation (via URL) :", this.evaluationId);
      }
    });

    // Récupérer les résultats d'évaluation si l'utilisateur est un candidat
    if (this.authService.isCandidat()) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && currentUser.id) {
        this.evaluationService.getEvaluationForCandidat(currentUser.id).subscribe({
          next: (results: any[]) => { // Explicitly type 'results'
            console.log("Résultats récupérés :", results);
            this.evaluationResults = results;
          },
          error: (err: Error) => { // Explicitly type 'err'
            console.error("Erreur lors de la récupération des résultats d'évaluation:", err);
          }
        });
      }
    }
  }

  evaluer(evaluation: any): void {
    console.log('Évaluer cette évaluation:', evaluation);

    this.evaluationService.setSelectedEvaluationId(evaluation.id);
    this.evaluationService.setSelectedCandidatId(evaluation.candidatId);

    this.activeMenu = 'soutenances';
    this.sousMenu = 'ajouter-evaluation';
  }

  setActiveMenu = (menu: string): void => {
    this.activeMenu = menu;
    if (menu === 'ListeFormations' || menu === 'ListeSessionsFormation') {
      this.sousMenu = 'liste';
    }
  };

  setSousMenu = (menu: string, decision?: Decision): void => {
    this.sousMenu = menu;
    if (decision) {
      this.decisionSelectionnee = decision;
    }
  };

  getRoleTitle(): string {
    if (this.authService.isJury()) {
      return "Espace Jury";
    } else if (this.authService.isCoordinateur()) {
      return "Espace Coordinateur";
    } else if (this.authService.isCandidat()) {
      return "Espace Candidat";
    } else if (this.authService.isApprenant()) {
      return "Espace Apprenant";
    } else if (this.authService.isSupervisor()) {
      return "Espace Superviseur";
    } else if (this.authService.isSupportStaff()) {
      return "Espace Support";
    } else {
      return "Espace Utilisateur";
    }
  }
}
