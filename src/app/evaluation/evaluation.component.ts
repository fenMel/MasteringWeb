
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Evaluation, FiltresEvaluation } from './evaluation.model';
import { EvaluationService } from '../services/evaluation.service';

@Component({
  standalone: true,

  selector: 'app-evaluation',
  imports: [ CommonModule,
    FormsModule],
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.scss']
})
export class EvaluationComponent implements OnInit {
  evaluations: Evaluation[] = [];
  totalEvaluations: number = 0;
  pageActuelle: number = 1;
  evaluationsParPage: number = 5;
  @Input() setSousMenu!: (menu: string) => void;
  filtres: FiltresEvaluation = {
    dateRange: 'Toutes les dates',
    statut: 'Tout les statuts', 
    candidat: ''
  };

  optionsDate = ['Toutes les dates', 'Aujourd\'hui', 'Cette semaine', 'Ce mois'];
  optionsStatut = ['Tout les statuts', 'Évalué', 'Non Évalué'];
Math: Math = Math; // Pour utiliser Math dans le template
  

  constructor(private evaluationService: EvaluationService , private router: Router) {
    console.log('Router:', this.router);  // Ajoute ce log

  }

  ngOnInit(): void {
    this.chargerEvaluations();
  }

  chargerEvaluations(): void {
    this.evaluationService.getEvaluationsFiltered(
      this.filtres.dateRange,
      this.filtres.statut,
      this.filtres.candidat
    ).subscribe(
      (data: any[]) => {
        console.log('Données d\'évaluations reçues:', data);
        
        // Extraire tous les IDs de candidats uniques
        const candidatIds = [...new Set(data.map(evaluation => evaluation.candidatId))];
        
        if (candidatIds.length > 0) {
          // Récupérer les informations pour tous les candidats
          this.evaluationService.getCandidatsParIds(candidatIds).subscribe(
            (candidats: any[]) => {
              console.log('Données de candidats reçues:', candidats);
              
              // Mapper les évaluations avec les informations des candidats
              this.evaluations = data.map(evaluation => {
                const candidatInfo = candidats.find(c => c.id === evaluation.candidatId);
                
                return {
                  id: evaluation.id,
                  candidat: candidatInfo ? candidatInfo.nom + ' ' + candidatInfo.prenom : 'Candidat #' + evaluation.candidatId,
                  sujet: candidatInfo ? candidatInfo.sujet : 'Sujet non spécifié',
                  dateHeure: candidatInfo ? new Date(candidatInfo.dateSoutenance) : new Date(),
                  statut: evaluation.moyenne ? 'Évalué' : 'Non Évalué'
                };
              });
              
              this.totalEvaluations = this.evaluations.length;
            },
            error => {
              console.error('Erreur lors de la récupération des candidats:', error);
            }
          );
        } else {
          this.evaluations = [];
          this.totalEvaluations = 0;
        }
      },
      error => {
        console.error('Erreur lors du chargement des évaluations:', error);
      }
    );
  }

  appliquerFiltres(): void {
    this.pageActuelle = 1;
    this.chargerEvaluations();
  }

  evaluer(id: number): void {
    this.evaluationService.evaluer(id).subscribe(
      () => {
        // Mettre à jour le statut localement pour éviter de recharger toutes les données
        const evaluation = this.evaluations.find(e => e.id === id);
        if (evaluation) {
          evaluation.statut = 'Évalué';
        }
      },
      error => {
        console.error('Erreur lors de l\'évaluation', error);
      }
    );
  }

  changerPage(page: number): void {
    this.pageActuelle = page;
  }

  get evaluationsAffichees(): Evaluation[] {
    const debut = (this.pageActuelle - 1) * this.evaluationsParPage;
    const fin = debut + this.evaluationsParPage;
    return this.evaluations.slice(debut, fin);
  }

  get pages(): number[] {
    const totalPages = Math.ceil(this.totalEvaluations / this.evaluationsParPage);
    return Array(totalPages).fill(0).map((_, index) => index + 1);
  }

  nettoyerRecherche(): void {
    this.filtres.candidat = '';
    this.appliquerFiltres();
  }
  voirEvaluation(evaluation: any): void {
    console.log('Evaluation:', evaluation);
    
    if (evaluation && evaluation.id) {
      // utilisez le système de menu du dashboard
      this.setSousMenu('ajouter-evaluation');
      
      // Vous pouvez stocker l'ID d'évaluation dans un service
      // ou le passer via des paramètres de route
      this.router.navigate(['/dashboard'], {
        queryParams: { 
          menu: 'soutenances',
          sousMenu: 'ajouter-evaluation', 
          id: evaluation.id 
        }
      });
    } else {
      console.error('L\'évaluation ne contient pas d\'ID valide');
    }
  }
  
}