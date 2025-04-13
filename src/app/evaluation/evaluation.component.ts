
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  filtres: FiltresEvaluation = {
    dateRange: 'Toutes les dates',
    statut: 'Tout les statuts', 
    candidat: ''
  };

  optionsDate = ['Toutes les dates', 'Aujourd\'hui', 'Cette semaine', 'Ce mois'];
  optionsStatut = ['Tout les statuts', 'Évalué', 'Non Évalué'];

  constructor(private evaluationService: EvaluationService) {}

  ngOnInit(): void {
    this.chargerEvaluations();
  }

  chargerEvaluations(): void {
    this.evaluationService.getEvaluationsFiltered(
      this.filtres.dateRange,
      this.filtres.statut,
      this.filtres.candidat
    ).subscribe(
      (data: Evaluation[]) => {
        this.evaluations = data;
        this.totalEvaluations = data.length;
      },
      error => {
        console.error('Erreur lors du chargement des évaluations', error);
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
}