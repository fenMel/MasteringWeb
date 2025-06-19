import { Component, OnInit } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';

import {

  SessionFormation,

  SessionFormationDTO,

  SessionFormModel

} from '../sessions-formation/session-formation.model';

import { UserDTO } from '../sessions-formation/session-formation.model';

import { Formation } from '../services/gestion-formation.service';

import { SessionsFormationService } from '../services/sessions-formation.service';

import { GestionFormationService } from '../services/gestion-formation.service';

import { UserService } from '../services/user.service';

@Component({

  selector: 'app-ajout-session-formation',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './ajout-session-formation.component.html',

  styleUrls: ['./ajout-session-formation.component.scss']

})

export class AjoutSessionFormationComponent implements OnInit {

  session: SessionFormModel = {

    titre: '',

    description: '',

    dateDebut: '',

    dateFin: '',

    formation: undefined!,

    candidatsIds: []

  };

  candidats: UserDTO[] = [];

  formations: Formation[] = [];

  constructor(

    private sessionFormationService: SessionsFormationService,

    private formationService: GestionFormationService,

    private userService: UserService,

    private router: Router,

    private route: ActivatedRoute

  ) {}

  ngOnInit(): void {

    this.chargerFormations();

    this.chargerCandidats();

    const sessionId = this.route.snapshot.queryParamMap.get('id');

    if (sessionId) {

      this.sessionFormationService.getSessionById(+sessionId).subscribe({

        next: (session: SessionFormation) => {
this.session.id = session.id;

          this.session.titre = session.titre;

          this.session.description = session.description;

          this.session.dateDebut = session.dateDebut;

          this.session.dateFin = session.dateFin;

          this.session.formation = session.formation;

          this.session.candidatsIds = session.candidats.map(c => c.id);

        },

        error: (err) => console.error('Erreur chargement session :', err),

      });

    }

  }

  chargerFormations(): void {

    this.formationService.getFormations().subscribe({

      next: (data) => this.formations = data,

      error: (err) => console.error('Erreur chargement formations :', err),

    });

  }

  chargerCandidats(): void {

    this.userService.getAllCandidats().subscribe({

      next: (data) => {

        this.candidats = data;

        console.log('✅ Candidats récupérés avec succès :', data);

        if (data.length === 0) {

          console.warn('⚠️ Aucun candidat disponible pour sélection.');

        }

      },

      error: (err) => {

        console.error('❌ Erreur lors de la récupération des candidats :', err);

        alert('Erreur lors du chargement des candidats. Veuillez vérifier votre connexion ou vos autorisations.');

      }

    });

  }

  enregistrer(): void {

    if (!this.session.titre || !this.session.description || !this.session.dateDebut || !this.session.dateFin || !this.session.formation || this.session.candidatsIds.length === 0) {

      alert('Merci de remplir tous les champs obligatoires (*)');

      return;

    }

    const dto: SessionFormationDTO = {

      titre: this.session.titre,

      description: this.session.description,

      dateDebut: this.session.dateDebut,

      dateFin: this.session.dateFin,

      formationId: this.session.formation.id,

      candidatsIds: this.session.candidatsIds

    };

    this.sessionFormationService.CreateSessionFormation(dto).subscribe({

      next: () => {

        alert('✅ Session enregistrée avec succès.');

        this.retour();

      },

      error: (err) => {

        console.error('❌ Erreur enregistrement session :', err);

        alert('Erreur lors de la sauvegarde de la session.');

      }

    });

  }

  retour(): void {

    this.router.navigate(['/dashboard'], {

      queryParams: { menu: 'ListeSessionsFormation', sousMenu: 'liste' }

    });

  }

  annuler(): void {

    this.retour();

  }

}
 