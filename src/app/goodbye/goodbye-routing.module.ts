import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GoodbyePage } from './goodbye.page';

const routes: Routes = [
  {
    path: '',
    component: GoodbyePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GoodbyePageRoutingModule {}
