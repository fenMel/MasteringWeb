import { Component, OnInit } from '@angular/core';
import { FormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { GestionFormationService, Formation } from '../services/gestion-formation.service';
import { Input } from '@angular/core';

@Component({
  selector: 'app-gestion-formations',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './gestion-formations.component.html',
  styleUrls: ['./gestion-formations.component.scss']
})


export class GestionFormationsComponent implements OnInit {
  @Input() setSousMenu: any;
  
  formations: Formation[] = [];
  formationSelectionnee: Formation | null = null;
  searchText: string = '';
  form: FormGroup;

  constructor(
    private formationService: GestionFormationService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      nom: [''],
    });
  }

  ngOnInit(): void {
    this.chargerFormations();
  }

  chargerFormations() {
    this.formationService.getFormations().subscribe((data) => {
      this.formations = data;
    });
  }

  ajouterFormation() {
    if (this.formationSelectionnee) {
      this.formationService.ajouterFormation(this.formationSelectionnee).subscribe(() => {
        this.chargerFormations();
        this.formationSelectionnee = null;
      });
    }
  }

  modifierFormation(id: number) {
    const formationToSend = { ...this.formationSelectionnee };
    delete (formationToSend as any).sessionsFormation;
    delete (formationToSend as any).id;

    console.log('Payload envoyé :', formationToSend);

    this.formationService.modifierFormation(id, formationToSend).subscribe({
      next: (res) => {
        this.chargerFormations();
        this.formationSelectionnee = null;
      },
      error: (err) => {
        console.error('Erreur backend :', err);
      }
    });
  }

  // supprimerFormation(id?: number) {
  //   if (id && confirm('Voulez-vous vraiment supprimer cette formation ?')) {
  //     this.formationService.supprimerFormation(id).subscribe(() => {
  //       this.chargerFormations();
  //     });
  //   }
  // }

 supprimerFormation(id: number) {
    this.formationService.supprimerFormation(id).subscribe({
      next: (message) => {
        alert('Formation supprimée avec succès : ' );
        this.chargerFormations();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression :', err);
        alert('Erreur : ' + (err.error?.message || 'Action non autorisée'));
      }
    });
  }

  selectionnerFormation(formation: Formation) {
    this.formationSelectionnee = { ...formation };
  }

  filtrerFormations(): Formation[] {
    return this.formations.filter(f =>
      f.nom.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }
  goToAjout() {
    if (this.setSousMenu) {
      this.setSousMenu('ajouter');
      console.log('Clique détecté !');
    }
  }
}
