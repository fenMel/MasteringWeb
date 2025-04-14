import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-gestion-formations',
  imports: [CommonModule],
  templateUrl: './gestion-formations.component.html',
  styleUrls: ['./gestion-formations.component.scss']
})
export class GestionFormationsComponent {
  @Input() setSousMenu!: (menu: string) => void;

  formations = [
    { nom: 'Master IA & Big Data', niveau: 'Bac +5', rncp: 'RNCP34512', duree: '2 ans' },
    { nom: 'Master Cloud Computing', niveau: 'Bac +5', rncp: 'RNCP34987', duree: '2 ans' },
    { nom: 'Master Cybersécurité', niveau: 'Bac +5', rncp: 'RNCP35678', duree: '2 ans' },
    { nom: 'Master Data Science', niveau: 'Bac +5', rncp: 'RNCP31234', duree: '2 ans' },
    { nom: 'Master Gestion de Projet IT', niveau: 'Bac +5', rncp: 'RNCP36790', duree: '2 ans' },
  ];

  goToAjout() {
    if (this.setSousMenu) {
      this.setSousMenu('ajouter');
      console.log('Clique détecté !');
    }
  }

  voir(formation: any) {
    console.log('Voir formation :', formation);
  }

  modifier(formation: any) {
    console.log('Modifier formation :', formation);
  }

  supprimer(formation: any) {
    console.log('Supprimer formation :', formation);
  }
}
