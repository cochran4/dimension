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
      this.title = 'Consent not provided';
      this.message = 'We are grateful for your interest in our study. However, without your consent, participation is not possible.'; 
    }
    if (error == 'no gifts') {
      this.title = 'Study currently full';
      this.message = "We're sorry, but we cannot accept more participants at this time. Please check back later.";
    }
  }

  async init() {
    await this.storage.create()
  }

}
