import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './guards/AuthGuard';
import { EvaluationComponent } from './evaluation/evaluation.component';
import { AjouterFormationComponent } from './ajouter-formation/ajouter-formation.component';
import { GestionFormationsComponent } from './gestion-formations/gestion-formations.component';
import { SessionsFormationComponent } from './sessions-formation/sessions-formation.component';


export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'evaluation', component: EvaluationComponent },
    { path: 'gestion-formations', component: GestionFormationsComponent },

    { path: 'ajouter-formation', component: AjouterFormationComponent },

    { path: 'sessions-formation', component: SessionsFormationComponent }
        // autres routes...

];







