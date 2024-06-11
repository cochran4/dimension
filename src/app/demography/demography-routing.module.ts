import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DemographyPage } from './demography.page';

const routes: Routes = [
  {
    path: '',
    component: DemographyPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DemographyPageRoutingModule {}
