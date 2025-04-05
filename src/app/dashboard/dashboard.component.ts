import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  activeMenu: string = 'tableau';

  constructor(public authService: AuthService) { }

  ngOnInit(): void {
    console.log("Rôle JURY:", this.authService.isJury()); // Ajoutez ceci pour déboguer
    console.log("Utilisateur connecté:", this.authService.isConnected());
  }
  
  setActiveMenu(menu: string): void {
    this.activeMenu = menu;
  }
}