import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { AuthenticationService } from '../services/authentication.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  // Initialize
  ageConfirmed: boolean = false;
  email: string = "";
  sent: boolean = false;
  enteredCode: string = "";
  validCode: boolean = false;

  name         = 'TestUser2'; // this.stringGen(4);
  study        = "TestStudy2";
  private storage: Storage | null = null;

  constructor(public storageService: Storage, 
              private router: Router, 
              private http: HttpClient,
              private authService: AuthenticationService,
              private alertCtrl: AlertController) {}

  // Things to initialize while loading page
  async ngOnInit() {
    await this.init(); // Ensure storage is initialized
  }

  async init() {
    // Create the storage instance
    this.storage = await this.storageService.create();

    // clear storage
    await this.storage.clear();

    this.storage.set('parent_consent', 0);
    await this.registerUser();
  }

  sendEmail() {
    const jwt = this.storage?.get('jwt');
    const info = {
      email: this.email,
      name: this.name,
      jwt: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb3Jldmltby5jb20iLCJhdWQiOiJodHRwOlwvXC9zZXFlcjIud2ViLmFwcCIsImlhdCI6MTcyMTk1MzUzOSwiZXhwIjoxNzIzNzY3OTM5LCJkYXRhIjp7Im5hbWUiOiJUZXN0VXNlcjQiLCJzdHVkeSI6IlRlc3RTdHVkeTQiLCJnaWZ0X3VybCI6Imh0dHBzOlwvXC9leGFtcGxlLmNvbVwvZ2lmdDEtMTUifX0.2qXMd5-FLatmV5T_hjaDWlv-mScop0fxxtwLuSCwt1g"
    } // change above to the variable jwt later

    this.http.post('https://www.lorevimo.com/dimension/send_email.php', info, {responseType: 'text'}).subscribe({
      next: (response) => {
        console.log(`Email submitted successfully:`, response);
      },
      error: (error) => console.error(`Error submitting email to server:`, error)
    })

    this.sent = true;
  }

  async validate() {
    // password is correct
    if (this.enteredCode == this.name) {
      console.log(await this.storage?.get("jwt"));
      console.log(await this.storage?.get("gift_url"));

      this.storage?.set('parent_consent', 1);
      this.authService.login();
      this.router.navigate(['/consent']);
    }

  }

  async registerUser(){
    this.authService.register({ name: this.name, study: this.study }).subscribe(response => {
      console.log('response: ' + response);
      // no more gift urls
      // if (!response) {
      //   this.storage?.set('error', 'no gifts')
      //   this.router.navigate(['/goodbye']);
      // }
    }) 
  }

  //--------------------------------------------
  // Helper functions
  //---------------------------------------------
  // Random string generator
  stringGen(len: number): string {
    let text = "";
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
    for (let i = 0; i < len; i++)
      text += charset.charAt(Math.floor(Math.random() * charset.length));
    
    return text;
  }
}
