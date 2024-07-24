import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-demography',
  templateUrl: './demography.page.html',
  styleUrls: ['./demography.page.scss'],
})
export class DemographyPage {

  //--------------------------------------------------------------------------
  // Initialize variables
  //--------------------------------------------------------------------------

  private storage: Storage | null = null;
  name = "";
  jwt = "";
  items: any[] = [];
  stage = 1;  // Keep track of the survey stage
  allResponses: any[] = [];  // Store all responses across different surveys
  instructions: string = '';
  table_name: string = '';

  //--------------------------------------------------------------------------
  // Constructor
  //--------------------------------------------------------------------------


  constructor(
    public storageService: Storage,
    private alertCtrl: AlertController,
    private router: Router,
    private http: HttpClient
  ) {}


  //--------------------------------------------------------------------------
  // Lifecycle events
  //--------------------------------------------------------------------------


  async init() {
    this.storage = await this.storageService.create();
  }

  async ionViewWillEnter() {
    await this.init()

    // Get JWT and username from storage
    this.storage?.get('jwt').then((val: string | null) => {
      if (val) this.jwt = val;
    });
    this.storage?.get('name').then((val: string | null) => {
      if (val) this.name = val;
    });

    this.stage = await this.storage?.get('survey stage') || 1;
    console.log(this.stage)

    this.loadSurvey()
  }

  //--------------------------------------------------------------------------
  // Helper events
  //--------------------------------------------------------------------------

  // loads survey based on what stage we're on
  loadSurvey() {
    let survey_map: { [key: number]: string } = {
      [1]: 'demography-survey.json',
      [2]: 'affect-survey.json',
      [3]: 'usability-survey.json'
    };

    const fileName = survey_map[this.stage];
    console.log("file name: " + fileName);

    this.http.get(`/assets/${fileName}`).subscribe({
      next: (data: any) => {
        this.items = data.questions;
        this.instructions = data.instructions; // Assuming 'instructions' is a top-level field in your JSON
        this.table_name = data.table_name;
      },
      error: (error) => console.error('Could not load survey data:', error)
    });
  }

  changeValue(event: any, index: number) {
    this.items[index].value = event.detail.value;
  }

  async submit() {
    const isComplete = this.items.every(item => item.value !== -1);

    // If not all questions are answered, show an alert with options to continue or cancel
    if (!isComplete) {
      const alert = await this.alertCtrl.create({
        header: 'Incomplete Survey',
        message: 'Some questions are unanswered. Do you still want to continue?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary',
            handler: () => {
              console.log('Submission canceled');
            }
          },
          {
            text: 'Continue',
            handler: () => {
              this.submitData();
            }
          }
        ]
      });

      await alert.present();
    } else {
      // If all questions are answered, proceed with submission
      this.submitData();
    }
  }

  // submits data for each stage
  submitData() {
    const responses = this.items.reduce((acc, item) => {
      acc[item.label] = item.value;
      return acc;
    }, {} as Record<string, string>);

    console.log(responses)
    let table_name = this.table_name

    // submit responses based on survey type
    const submissionData = { jwt: this.jwt, name: this.name, table_name: table_name, data: responses };
    this.http.post('https://www.lorevimo.com/dimension/survey.php', submissionData, { responseType: 'text' })
      .subscribe({
        next: (response) => {
          console.log(`${table_name} data submitted successfully:`, response);
        },
        error: (error) => console.error(`Error submitting ${this.table_name} data:`, error)
    });

    this.stage++;
    this.storage?.set('survey stage', this.stage);
    console.log('next stage: ' + this.stage)

    if (this.stage == 2) { // finished first survey, go to second
      this.loadSurvey();
    } else if (this.stage == 3) { // finished second stage, go to play
      this.router.navigate(['/play']);
    } else if (this.stage == 4) { // finished everything, go to thank you
      this.storage?.set('finished', true)
      this.router.navigate(['/thank-you']);
    }

    // if (this.stage === 1) {
    //   // Load the second survey if it's the first stage
    //   this.stage++;
    //   this.storage?.set('survey stage', this.stage);
    //   this.loadSurvey();  // Adjust this as needed for your second survey file
    // } 
    // else if (this.stage === 2) {
    //   this.stage++;
    //   this.storage?.set('survey stage', this.stage)
    //   this.router.navigate(['/play']);
    // }
    // else if (this.stage === 3) {
    //   this.stage++;
    //   this.storage?.set('survey stage', this.stage)
    //   this.loadSurvey();
    // } else {
    //   this.router.navigate(['/thank-you']);
    // }
  }

  // submitAllData() {
  //   // Here you might include additional data, such as JWT or user name
  //   const table_name = this.stage === 1 ? "demography" : "affect";
  //   const submissionData = { jwt: this.jwt, name: this.name, responses: this.allResponses, table: table_name };
  //   this.http.post('https://example.com/submit', submissionData, { responseType: 'text' })
  //     .subscribe({
  //       next: (response) => {
  //         console.log('All survey data submitted successfully:', response);
  //         this.router.navigate(['/play']);  // Redirect to a thank you page or similar
  //       },
  //       error: (error) => console.error('Error submitting all survey data:', error)
  //   });

  //   // !!! navigate to play page anyway for now, delete later once data submission is set up
  //   this.router.navigate(['/play']);
  // }
}
