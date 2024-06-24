import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';

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

  name         = "DELETE_MTURKTEST_022924_" + this.stringGen(6);
  password     = this.stringGen(4);
  study        = "DELETE_MTURKTEST_022924";
  private storage: Storage | null = null;

  constructor(public storageService: Storage, 
              private router: Router, 
              private http: HttpClient) {}

  // Things to initialize while loading page
  async ngOnInit() {
    await this.init(); // Ensure storage is initialized
  }

  async init() {
    // Create the storage instance
    this.storage = await this.storageService.create();
  }

  sendEmail() {
    /* send password to parent email */
    console.log(this.password);
    this.sent = true;
  }

  validate() {
    // password is correct
    if (this.enteredCode == this.password) {
      // this.registerUser();
      this.router.navigate(['consent']);
    }

  }

  // Navigate to play page
  navigatePlay() {
    // UPDATE !!!! Register user and then navigate
    //this.registerUser();

    // UPDATE !!!!
    this.storage?.set('jwt', "temporary_jwt"); 
    this.storage?.set('name', this.name);
    this.router.navigate(['consent']);

  }

  registerUser(){
        // Register user
        this.http.post('https://lorevimo.com/seqer/register.php',{
          "name":     this.name,
          "password": this.password,
          "consent":  "na",
          "study":    this.study,
        },{responseType: 'text'}).subscribe( 
        response => {
          console.log('success!!')
          // Save token
          this.storage?.set('jwt',JSON.parse(response).jwt);
          
          // Save username to local storage
          this.storage?.set('name',this.name);
    
          // // Navigate to play page
          // this.router.navigate(['play']);
    
        });
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
