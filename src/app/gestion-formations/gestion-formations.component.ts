import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { GestionFormationService, Formation } from '../services/gestion-formation.service';
import { Input } from '@angular/core';

@Component({
  selector: 'app-gestion-formations',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './gestion-formations.component.html',
  styleUrls: ['./gestion-formations.component.scss'] // ✅ bon
})


export class GestionFormationsComponent implements OnInit {
  @Input() setSousMenu: any;
  
  formations: Formation[] = [];
  formationSelectionnee: Formation | null = null;
  searchText: string = '';

  constructor(private formationService: GestionFormationService) {}

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

  modifierFormation() {
    if (this.formationSelectionnee && this.formationSelectionnee.id) {
      this.formationService.modifierFormation(this.formationSelectionnee.id, this.formationSelectionnee).subscribe(() => {
        this.chargerFormations();
        this.formationSelectionnee = null;
      });
    }
  }

  supprimerFormation(id?: number) {
    if (id && confirm('Voulez-vous vraiment supprimer cette formation ?')) {
      this.formationService.supprimerFormation(id).subscribe(() => {
        this.chargerFormations();
      });
    }
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
