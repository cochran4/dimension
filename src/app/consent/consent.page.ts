import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-consent',
  templateUrl: './consent.page.html',
  styleUrls: ['./consent.page.scss'],
})
export class ConsentPage {
  consentGiven: boolean = false;

  constructor(private router: Router) {}

  submitConsent() {
    if (this.consentGiven) {
      this.router.navigate(['/demography']); // Navigate to the Demography page
    } else {
      // Optionally handle the case where consent is not given (already handled by button being disabled)
      console.log('Consent not given');
    }
  }
}
