import { Component, OnInit } from '@angular/core';
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
import { ActivatedRoute } from '@angular/router'; 

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EvaluationComponent, GestionFormationsComponent, AjouterFormationComponent, SessionsFormationComponent, AjouterEvaluationComponent],

  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  activeMenu: string = 'tableau';
  sousMenu: string = 'liste'; // 'liste' ou 'ajouter'


  constructor(public authService: AuthService  , private route: ActivatedRoute 
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
    // Autres initialisations si nécessaire
    // Récupérer les paramètres de la route pour définir le menu actif et le sous-menu
    this.route.queryParams.subscribe(params => {
      if (params['menu']) {
        this.activeMenu = params['menu'];
        console.log("Menu actif (via URL) :", this.activeMenu);
      }
      // Vérifiez si le sous-menu est spécifié dans les paramètres de la requête
      // et mettez à jour le sous-menu en conséquence
      if (params['sousMenu']) {
        this.sousMenu = params['sousMenu'];
        console.log("Sous-menu actif (via URL) :", this.sousMenu);
      }
    });
  }
  

  setActiveMenu = (menu: string) => {
    this.activeMenu = menu;
    if (menu === 'ListeFormations') {
      this.sousMenu = 'liste';
    }
    this.activeMenu = menu;
    if (menu === 'ListeSessionsFormation') {
      this.sousMenu = 'liste';
    }
  };

  setSousMenu = (menu: string) => {
    this.sousMenu = menu;
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