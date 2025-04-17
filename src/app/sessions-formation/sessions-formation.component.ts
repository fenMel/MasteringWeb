import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sessions-formation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sessions-formation.component.html',
  styleUrls: ['./sessions-formation.component.scss']
})
export class SessionsFormationComponent {
  @Input() setSousMenu!: (menu: string) => void;
  selectedFilter: string = 'title';
  searchTerm: string = '';

  sessions = [
    {
      title: 'Java Avancé',
      formation: 'Développement',
      description: 'Maîtrise avancée de Java',
      start: '2025-05-01',
      end: '2025-06-01'
    },
    {
      title: 'Angular Débutant',
      formation: 'Web',
      description: 'Introduction à Angular',
      start: '2025-04-15',
      end: '2025-05-15'
    },
    {
      title: 'Angular Débutant',
      formation: 'Web',
      description: 'Introduction à Angular',
      start: '2025-04-15',
      end: '2025-05-15'
    },
    {
      title: 'Angular Débutant',
      formation: 'Web',
      description: 'Introduction à Angular',
      start: '2025-04-15',
      end: '2025-05-15'
    }
    // Tu peux en ajouter d'autres ici
  ];
authService: any;
activeMenu: any;

  filteredSessions() {
    if (!this.searchTerm) return this.sessions;

    return this.sessions.filter(session =>
      session.title.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    if (!this.searchTerm) return this.sessions;

    return this.sessions.filter(session =>
      session.description.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    if (!this.searchTerm) return this.sessions;

    return this.sessions.filter(session =>
      session.formation.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  voirSession(session: any) {
    console.log('Voir session:', session);
    // Tu peux aussi naviguer ou ouvrir un modal ici
  }
  modifierSession(session: any) {
    console.log('Modifier session:', session);
    // Tu peux aussi naviguer ou ouvrir un modal ici
  }
}
