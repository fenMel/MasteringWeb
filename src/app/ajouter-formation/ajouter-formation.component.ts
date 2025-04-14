import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ajouter-formation',
  imports: [CommonModule],
  templateUrl: './ajouter-formation.component.html',
  styleUrl: './ajouter-formation.component.scss'
})
export class AjouterFormationComponent {
  @Input() setSousMenu!: (menu: string) => void;
  retourListe() {
    if (this.setSousMenu) {
      this.setSousMenu('liste');
    }
  }

}
