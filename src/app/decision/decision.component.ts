import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DecisionService } from '../services/decision.service';
import { Decision } from './decision.model';

/**
 * Composant standalone pour la gestion et l'affichage des décisions
 * Fonctionnalités : filtrage, pagination, recherche
 */
@Component({
  selector: 'app-decision',
  standalone: true, // Composant standalone (Angular 14+)
  imports: [
    CommonModule,   // Pour les directives Angular communes (*ngFor, *ngIf, etc.)
    FormsModule     // Pour la liaison bidirectionnelle [(ngModel)]
  ],
  templateUrl: './decision.component.html',
  styleUrls: ['./decision.component.scss']
})
export class DecisionComponent implements OnInit {
  
  // PROPRIÉTÉS D'ENTRÉE
  @Input() setSousMenu: any; // Fonction callback pour la navigation - type 'any' pourrait être typé plus précisément
  
  // DONNÉES
  decisions: Decision[] = []; // Toutes les décisions chargées depuis le service
  
  // CONFIGURATION DES FILTRES
  filtres = {
    statut: 'Tous les statuts',  // Filtre par statut de décision
    recherche: ''                // Filtre par recherche textuelle
  };
  
  // OPTIONS DISPONIBLES POUR LE FILTRE STATUT
  optionsStatut = ['Tous les statuts', 'ADMIS', 'NON_ADMIS', 'RATTRAPAGE'];
  
  // CONFIGURATION DE LA PAGINATION
  pageActuelle = 1;           // Page actuellement affichée
  decisionsParPage = 5;       // Nombre d'éléments par page
  totalDecisions = 0;         // Total après filtrage (pour calculer le nombre de pages)

  constructor(private decisionService: DecisionService) {}

  /**
   * Initialisation du composant
   * Charge automatiquement toutes les décisions au démarrage
   */
  ngOnInit(): void {
    this.chargerDecisions();
  }

  /**
   * Charge toutes les décisions depuis le service
   * Met à jour le total pour la pagination
   */
  chargerDecisions(): void {
    this.decisionService.getAllDecisions().subscribe({
      next: (data) => {
        this.decisions = data;
        this.totalDecisions = data.length;
      },
      error: () => {
        // TODO: Implémenter une gestion d'erreur plus robuste
        // (notification utilisateur, message d'erreur, etc.)
      }
    });
  }

  /**
   * Applique les filtres et remet la pagination à la première page
   * Appelée lors du changement des critères de filtrage
   */
  appliquerFiltres(): void {
    this.pageActuelle = 1; // Reset pagination après filtrage
  }

  /**
   * GETTER CALCULÉ - Retourne les décisions filtrées et paginées
   * Cette méthode est appelée à chaque cycle de détection de changement
   * 
   * ATTENTION: Cette approche peut être coûteuse en performance
   * Considérer l'utilisation de mémoisation ou de calcul manuel
   */
  get decisionsAffichees(): Decision[] {
    let filtered = [...this.decisions]; // Copie pour éviter la mutation

    // FILTRE PAR STATUT
    if (this.filtres.statut && this.filtres.statut !== 'Tous les statuts') {
      filtered = filtered.filter(d => d.verdict === this.filtres.statut);
    }

    // FILTRE PAR RECHERCHE TEXTUELLE
    // Recherche dans les noms/prénoms des candidats et jurys
    if (this.filtres.recherche?.trim()) {
      const search = this.filtres.recherche.trim().toLowerCase();
      filtered = filtered.filter(d => {
        // Extraction sécurisée des données avec fallback
        const candidatNom = d.candidat?.nom?.toLowerCase() || '';
        const candidatPrenom = d.candidat?.prenom?.toLowerCase() || '';
        const juryNom = d.jury?.nom?.toLowerCase() || '';
        const juryPrenom = d.jury?.prenom?.toLowerCase() || '';
        
        // Recherche flexible : nom+prénom ou prénom+nom
        return (
          (`${candidatNom} ${candidatPrenom}`.includes(search) ||
           `${candidatPrenom} ${candidatNom}`.includes(search) ||
           `${juryNom} ${juryPrenom}`.includes(search) ||
           `${juryPrenom} ${juryNom}`.includes(search))
        );
      });
    }

    // Mise à jour du total après filtrage (pour la pagination)
    this.totalDecisions = filtered.length;

    // APPLICATION DE LA PAGINATION
    const debut = (this.pageActuelle - 1) * this.decisionsParPage;
    const fin = debut + this.decisionsParPage;
    return filtered.slice(debut, fin);
  }

  /**
   * GETTER pour générer la liste des numéros de pages
   * Utilisé pour afficher les boutons de pagination
   */
  get pages(): number[] {
    const totalPages = Math.ceil(this.totalDecisions / this.decisionsParPage);
    return Array(totalPages).fill(0).map((_, i) => i + 1);
  }

  /**
   * Change la page active
   * @param page - Numéro de la page à afficher
   */
  changerPage(page: number): void {
    this.pageActuelle = page;
  }

  /**
   * Navigation vers le détail d'une décision
   * Utilise la fonction callback fournie par le composant parent
   * @param decision - La décision à consulter en détail
   */
  voirDecision(decision: Decision): void {
    if (this.setSousMenu) {
      this.setSousMenu('voir-decision', decision);
    }
  }

  /**
   * GETTER pour afficher le nombre minimum d'éléments sur la page actuelle
   * Utilisé pour l'affichage "Affichage de X à Y sur Z résultats"
   */
  get minPage(): number {
    return Math.min(this.pageActuelle * this.decisionsParPage, this.totalDecisions);
  }

  /**
   * Retourne la classe CSS appropriée selon le statut de la décision
   * Permet un affichage visuel différencié (couleurs)
   * @param decision - La décision dont on veut le style
   * @returns La classe CSS correspondante
   */
  getStatutClass(decision: Decision): string {
    switch ((decision.verdict || '').toUpperCase()) {
      case 'ADMIS':
        return 'status-green';    // Vert pour les admis
      case 'NON_ADMIS':
        return 'status-red';      // Rouge pour non admis
      case 'RATTRAPAGE':
        return 'status-blue';     // Bleu pour rattrapage
      default:
        return '';                // Pas de style par défaut
    }
  }
}

