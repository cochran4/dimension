import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ConsentGuard } from './guards/consent.guard';
import { FinishGuard } from './guards/finish.guard';
import { HomePageModule } from './home/home.module';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'consent',
    loadChildren: () => import('./consent/consent.module').then( m => m.ConsentPageModule),
    canActivate: [ConsentGuard]
  },
  {
    path: 'demography',
    loadChildren: () => import('./demography/demography.module').then( m => m.DemographyPageModule),
    canActivate: [ConsentGuard]
  },
  {
    path: 'play',
    loadChildren: () => import('./play/play.module').then( m => m.PlayPageModule),
    //canActivate: [ConsentGuard]
  },
  {
    path: 'thank-you',
    loadChildren: () => import('./thank-you/thank-you.module').then( m => m.ThankYouPageModule),
    canActivate: [ConsentGuard, FinishGuard]
  },
  {
    path: 'goodbye',
    loadChildren: () => import('./goodbye/goodbye.module').then( m => m.GoodbyePageModule)
  },
  {
    path: "**",
    redirectTo: '/home'
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
