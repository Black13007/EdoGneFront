import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AccueilComponent } from './components/pages/accueil/accueil.component';
import { CarteComponent } from './components/pages/carte/carte.component';
import { NotificationsComponent } from './components/pages/notifications/notifications.component';
import { EmploisComponent } from './components/pages/emplois/emplois.component';
import { MessagesComponent } from './components/pages/messages/messages.component';

// Composants d'authentification
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CreerCompteComponent } from './components/auth/creer-compte/creer-compte.component';
import { SeConnecterComponent } from './components/auth/se-connecter/se-connecter.component';
import { JwtInterceptor } from './security/interceptors/jwt.interceptor';
import { ProfilComponent } from './components/pages/profil/profil.component';
import { MesPostulationsComponent } from './components/pages/mes-postulations/mes-postulations.component';
import { ProfilEmployeurComponent } from './employeur/pages/profil-employeur/profil-employeur.component';

// Composants recruteur

@NgModule({
  declarations: [
    AppComponent,
    FooterComponent,
    HeaderComponent,
    SidebarComponent,
    AccueilComponent,
    CarteComponent,
    NotificationsComponent,
    EmploisComponent,
    MessagesComponent,
    SeConnecterComponent,
    CreerCompteComponent,
    ProfilComponent,
    MesPostulationsComponent,
    ProfilEmployeurComponent,
    // Composants d'authentification
    // Composants recruteur
    // RecruiterDashboardComponent,
    // RecruiterNavComponent,
    // CandidaturesManagementComponent,
    // RecruiterHomeComponent,
    // RecruiterLayoutComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule

  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    }
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }