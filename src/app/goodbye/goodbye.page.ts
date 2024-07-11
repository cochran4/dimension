import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-goodbye',
  templateUrl: './goodbye.page.html',
  styleUrls: ['./goodbye.page.scss'],
})
export class GoodbyePage implements OnInit {

  title = '';
  message = '';

  constructor(private storage: Storage) { }

  async ngOnInit() {
    await this.init();
    
    const error = await this.storage.get('error');
    if (error == 'no consent') {
      this.title = 'Thank you!';
      this.message = '(change later?) Thank you for checking out our study!';
    }
    if (error == 'no gifts') {
      this.title = 'Sorry! :(';
      this.message = "Sorry, we're out of space in this study. Please check back later.";
    }
  }

  async init() {
    await this.storage.create()
  }

}
