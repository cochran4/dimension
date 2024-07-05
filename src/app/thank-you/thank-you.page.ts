import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-thank-you',
  templateUrl: './thank-you.page.html',
  styleUrls: ['./thank-you.page.scss'],
})
export class ThankYouPage implements OnInit {

  // Initialize variables
  private storage: Storage | null = null;
  gift_url = "";

  constructor(public storageService: Storage) {}

  async ngOnInit() {
    await this.init(); // Ensure storage is initialized
    this.getGift(); // Then load the name
  }

  async init() {
    // Directly assign to this.storage since create() returns the storage instance
    this.storage = await this.storageService.create();
  }

  getGift() {
    this.storage?.get('gift_url').then((val: string | null) => {
      if (val) {
        // Name value is available
        this.gift_url = val;
      }
    });
  }
}
