import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GoodbyePageRoutingModule } from './goodbye-routing.module';

import { GoodbyePage } from './goodbye.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GoodbyePageRoutingModule
  ],
  declarations: [GoodbyePage]
})
export class GoodbyePageModule {}
