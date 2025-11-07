import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { AccueilComponent } from './components/pages/accueil/accueil.component';
import { CarteComponent } from './components/pages/carte/carte.component';
import { NotificationsComponent } from './components/pages/notifications/notifications.component';
import { EmploisComponent } from './components/pages/emplois/emplois.component';
import { MessagesComponent } from './components/pages/messages/messages.component';
import { SeConnecterComponent } from './components/auth/se-connecter/se-connecter.component';
import { CreerCompteComponent } from './components/auth/creer-compte/creer-compte.component';
import { AuthGuard } from './security/guards/auth.guard';
import { ProfilComponent } from './components/pages/profil/profil.component';
import { MesPostulationsComponent } from './components/pages/mes-postulations/mes-postulations.component';
import { ProfilEmployeurComponent } from './employeur/pages/profil-employeur/profil-employeur.component';

// Imports pour les composants d'authentification



const routes: Routes = [
  {path: '', redirectTo: '/accueil', pathMatch: 'full'}, // Redirection vers accueil par défaut
  {path: 'accueil', component:AccueilComponent},
  {path: 'carte', component:CarteComponent, canActivate: [AuthGuard]},
  {path: 'notifications', component:NotificationsComponent, canActivate: [AuthGuard]}, 
  {path: 'emplois', component:EmploisComponent, canActivate: [AuthGuard]},
  {path: 'messages', component:MessagesComponent, canActivate: [AuthGuard]},
  {path: 'profil', component: ProfilComponent, canActivate: [AuthGuard]},
  {path: 'profil-employeur', component: ProfilEmployeurComponent, canActivate: [AuthGuard]},
  {path: 'mes-postulations', component: MesPostulationsComponent, canActivate: [AuthGuard]},
  {path: 'connexion', component: SeConnecterComponent},
  {path: 'creer-compte', component: CreerCompteComponent},
  {path: 'recruteur/login', component: SeConnecterComponent},
  {path: 'recruteur/register', component: CreerCompteComponent},
  
   
  { path: '**', redirectTo: '/accueil' } // Redirection vers accueil pour les routes non définies
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

