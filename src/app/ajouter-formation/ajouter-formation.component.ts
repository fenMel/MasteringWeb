import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormationService } from '../services/formation.service';
import { Formation } from '../ajouter-formation/formation.model';

@Component({
  selector: 'app-ajouter-formation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ajouter-formation.component.html',
  styleUrl: './ajouter-formation.component.scss'
})
export class AjouterFormationComponent {
  @Input() setSousMenu!: (menu: string) => void;

  formation: Formation = {
    nom: '',
    niveau: 'Master',
    codeRncp: '',
    description: '',
    duree: '',
    prerequis: '',
    objectifs: ''
  };

  constructor(private formationService: FormationService) {}

  ajouterFormation() {
    this.formationService.ajouterFormation(this.formation).subscribe({
      next: (res) => {
        alert(' Formation créée avec succès');
        this.retourListe();
      },
      error: (err) => {
        alert(' Erreur lors de la création : ' + err.message);
      }
    });
  }

  retourListe() {
    if (this.setSousMenu) {
      this.setSousMenu('liste');
    }
  }
}
