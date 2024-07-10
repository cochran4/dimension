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

  name         = this.stringGen(4);
  study        = "DELETE_MTURKTEST_022924";
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
    await this.registerUser();
  }

  sendEmail() {
    /* send password to parent email */
    console.log(this.name);
    this.sent = true;
  }

  async validate() {
    // password is correct
    if (this.enteredCode == this.name) {
      console.log(await this.storage?.get("token"));
      console.log(await this.storage?.get("gift_url"));

      const jwt = await this.storage?.get("token");
      this.router.navigate(['/consent']);
    }

  }

  async registerUser(){
    this.authService.login({name: this.name, study: this.study}).subscribe(async response => {
      if (!response) {
        const alert = await this.alertCtrl.create({
          header: "No more space :(",
          message: "Sorry, we've run out of space in our study. Please try again later.",
          backdropDismiss: false
        });
        await alert.present();
      }
    }) 

    // temp code until backend is connected; random jwt value
    // this.storage?.set('jwt', `eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcxOTQxMjEyNSwiaWF0IjoxNzE5NDEyMTI1fQ.Ab6Ehz0yMboUwMysB2h0wT_DKd9xwlWUrTfyViKwnIo`)

    // // Register user
    // this.http.post('https://lorevimo.com/seqer/register.php',{
    //   "name":     this.name,
    //   "password": this.password,
    //   "consent":  "na",
    //   "study":    this.study,
    // }, {responseType: 'text'}).subscribe( 
    // response => {
    //   console.log('success!!')
    //   // Save token
    //   this.storage?.set('jwt', JSON.parse(response).jwt);
      
    //   // Save username to local storage
    //   this.storage?.set('name', this.name);

    //   // // Navigate to play page
    //   // this.router.navigate(['play']);

    // });
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
