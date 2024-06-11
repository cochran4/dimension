import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PlayPageRoutingModule } from './play-routing.module';

import { PlayPage } from './play.page';

//import { IonicImageLoaderModule } from 'ionic-image-loader-v7';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PlayPageRoutingModule,
    //IonicImageLoaderModule
  ],
  declarations: [PlayPage]
})
export class PlayPageModule {}
