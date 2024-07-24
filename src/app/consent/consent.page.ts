import { HttpClient } from '@angular/common/http';
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
              private storage: Storage,
              private http: HttpClient) {}

  async ngOnInit() {
    await this.storage.create()
  }

  async submitConsent() {
    if (this.consentGiven) {
      this.storage.set('kid_consent', 1);
      await this.postConsentInfo();

      this.router.navigate(['/demography']); // Navigate to the Demography page
    } else {
      const alert = await this.alertCtrl.create({
        header: 'Notice',
        subHeader: 'The participation agreement box is not checked.',
        message: 'If you intended to agree, please click "Cancel" and check the box before submitting again. Otherwise, click "Continue" to proceed to the end',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: 'Continue',
            handler: async () => {
              this.storage.set('kid_consent', 0)
              this.storage.set('error', 'no consent');
              await this.postConsentInfo();
              
              this.router.navigate(['/goodbye']);
            }
          }
        ]
      });

      await alert.present();
    }
  }

  async postConsentInfo() {
    const name = await this.storage.get('name');
    const jwt = await this.storage.get('jwt')
    const parent_consent = await this.storage.get('parent_consent');
    const kid_consent = await this.storage.get('kid_consent')

    console.log([name, jwt, parent_consent, kid_consent].join(', '));

    this.http.post('https://www.lorevimo.com/dimension/update_consent.php', {
      name: name,
      parent_consent: parent_consent,
      kid_consent: kid_consent,
      jwt: jwt
    }).subscribe(response => {
      console.log(response);
    })
  }
}
