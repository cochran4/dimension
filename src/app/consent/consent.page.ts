import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-consent',
  templateUrl: './consent.page.html',
  styleUrls: ['./consent.page.scss'],
})
export class ConsentPage {
  consentGiven: boolean = false;

  constructor(private router: Router,
              private alertCtrl: AlertController,
              private storage: Storage) {}

  async ngOnInit() {
    await this.storage.create()
  }

  async submitConsent() {
    if (this.consentGiven) {
      this.router.navigate(['/demography']); // Navigate to the Demography page
    } else {
      const alert = await this.alertCtrl.create({
        header: 'Warning!',
        subHeader: 'You did not check the box indicating your agreement to participation.',
        message: 'If this is not what you meant to do, please click "Cancel" and check the box before submitting again. Otherwise, please click "Continue" to skip to the end.',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: 'Continue',
            handler: () => {
              this.storage.set('error', 'no consent');
              this.router.navigate(['/goodbye']);
            }
          }
        ]
      });

      await alert.present();
    }
  }
}
