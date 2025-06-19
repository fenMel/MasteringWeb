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

import { ActivatedRoute } from '@angular/router';
import {AjoutUtilisateurs, } from '../ajout-utilisateurs/ajout-utilisateurs.component';
import { AjoutSessionFormationComponent } from "../ajout-session-formation/ajout-session-formation.component";
import { DetailSessionFormationComponent } from "../detail-session-formation/detail-session-formation.component";
import { EditSessionFormationComponent } from "../edit-session-formation/edit-session-formation.component";

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
    AjoutSessionFormationComponent,
    DetailSessionFormationComponent,
    EditSessionFormationComponent
],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  activeMenu: string = 'tableau';
  sousMenu: string = 'liste'; // 'liste' ou 'ajouter'
  evaluationId?: number; // Ajout d'une propriété pour stocker l'ID d'évaluation

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    private evaluationService: EvaluationService

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

    // Si l'utilisateur n'est pas connecté, le authService.logout() dans votre service
    // devrait déjà gérer la redirection vers la page de connexion
    if (!this.authService.isConnected()) {
      console.log("L'utilisateur n'est pas connecté, redirection en cours...");
    }

    // Récupérer les paramètres de la route pour définir le menu actif et le sous-menu
    this.route.queryParams.subscribe((params: any) => {
      if (params['menu']) {
        this.activeMenu = params['menu'];
        console.log("Menu actif (via URL) :", this.activeMenu);
      }

      // Vérifiez si le sous-menu est spécifié dans les paramètres de la requête
      if (params['sousMenu']) {
        this.sousMenu = params['sousMenu'];
        console.log("Sous-menu actif (via URL) :", this.sousMenu);
      }

      // Récupérer l'ID d'évaluation si présent
      if (params['id']) {
        this.evaluationId = +params['id']; // Le + convertit en nombre
        console.log("ID d'évaluation (via URL) :", this.evaluationId);
      }
    });
  }
  evaluer(evaluation: any) {
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

changerSousMenu(nouveau: string): void {
  this.sousMenu = nouveau;
}

  

  setSousMenu = (menu: string): void => {
    this.sousMenu = menu;
    console.log("Sous-menu changé à:", menu);
  };

  // Dans votre dashboard.component.ts
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
function changerSousMenu(nouveau: any, string: any) {
  throw new Error('Function not implemented.');
}

