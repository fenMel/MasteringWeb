import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EvaluationService } from '../services/evaluation.service';
import { DecisionService } from '../services/decision.service';

import { EvaluationComponent } from '../evaluation/evaluation.component';
import { AjouterFormationComponent } from '../ajouter-formation/ajouter-formation.component';
import { GestionFormationsComponent } from '../gestion-formations/gestion-formations.component';
import { AjouterEvaluationComponent } from '../ajouter-evaluation/ajouter-evaluation.component';
import { SessionsFormationComponent } from '../sessions-formation/sessions-formation.component';
import { AjoutUtilisateurs } from '../ajout-utilisateurs/ajout-utilisateurs.component';
import { DecisionComponent } from '../decision/decision.component';
import { VoirDecisionComponent } from '../voir-decision/voir-decision.component';
import { Decision } from '../decision/decision.model';
import { UsersListComponent } from '../user-list/user-list.component';
import { GestionEvaluationComponent } from '../gestion-evaluation/gestion-evaluation.component';
import { CandidatDecisionComponent } from '../candidat-decision/candidat-decision.component';

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
    VoirDecisionComponent,
    UsersListComponent,
    CandidatDecisionComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  activeMenu: string = 'tableau';
  sousMenu: string = 'liste'; // 'liste' ou 'ajouter'
  evaluationId?: number;
  evaluationResults: any = null;
  decisionSelectionnee: Decision | null = null;
  sidebarOpen = false;

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    private evaluationService: EvaluationService,
    private decisionService: DecisionService
  ) { }

  ngOnInit(): void {
    // S'assurer que le token est décodé pour accéder aux rôles et au nom d'utilisateur
    this.authService.decodeMyToken();

    // Affichage des informations de débogage
    console.log("Rôle JURY:", this.authService.isJury());
    console.log("Rôle CANDIDAT:", this.authService.isCandidat());
    console.log("Rôle CORDINATEUR:", this.authService.isCoordinateur());
    console.log("Utilisateur connecté:", this.authService.isConnected());
    console.log("Nom d'utilisateur:", this.authService.username);

    if (!this.authService.isConnected()) {
      console.log("L'utilisateur n'est pas connecté, redirection en cours...");
    }

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
        this.evaluationId = +params['id'];
        console.log("ID d'évaluation (via URL) :", this.evaluationId);
      }
    });
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
    // Ajoute ici tous les menus qui doivent afficher la liste par défaut
    if (
      menu === 'ListeFormations' ||
      menu === 'ListeSessionsFormation' ||
      menu === 'resultats' ||
      menu === 'soutenances' ||
      menu === 'evaluations' ||
      menu === 'decision'
    ) {
      this.sousMenu = 'liste';
    }
  };

  setSousMenu = (menu: string, decision?: Decision): void => {
    this.sousMenu = menu;
    if (decision) {
      this.decisionSelectionnee = decision;
    }
  };

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

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
