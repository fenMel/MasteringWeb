import { Component, OnInit } from '@angular/core';
import { ArchiveDecisionService } from '../services/archive-decision.service';
import { ArchiveDecision } from '../archive-decision/archive-decision.model'; // Import du modèle
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-archive-decision',
  templateUrl: './archive-decision.component.html',
  styleUrls: ['./archive-decision.component.scss'],
  imports: [CommonModule]
})
export class ArchiveDecisionComponent implements OnInit {
  archives: ArchiveDecision[] = [];
  sousMenu: string = 'liste'; // valeur par défaut

  constructor(private archiveService: ArchiveDecisionService) {}

  ngOnInit(): void {
    this.loadArchives();
  }

  /**
   * Charge toutes les décisions archivées
   */
  loadArchives(): void {
    this.archiveService.getAll().subscribe({
      next: (data) => {
        this.archives = data;
        console.log('Archives chargées:', this.archives);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des archives:', error);
      }
    });
  }

  /**
   * Définit le sous-menu actif
   */
  setSousMenu(nom: string): void {
    this.sousMenu = nom;
  }
}