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
export class DemographyPage implements OnInit {

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

  async ngOnInit() {
    await this.init(); // Ensure storage is initialized

    // Get JWT and username from storage
    this.storage?.get('jwt').then((val: string | null) => {
      if (val) this.jwt = val;
    });
    this.storage?.get('name').then((val: string | null) => {
      if (val) this.name = val;
    });

    // Load the first survey stage
    this.loadSurvey('demography-survey.json');  // Adjust this as needed for your first survey file
  }

  //--------------------------------------------------------------------------
  // Helper events
  //--------------------------------------------------------------------------


  loadSurvey(fileName: string) {
    this.http.get(`/assets/${fileName}`).subscribe({
      next: (data: any) => {
        this.items = data.questions;
        this.instructions = data.instructions; // Assuming 'instructions' is a top-level field in your JSON
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
    // // Save current responses
    // this.allResponses.push(...this.items.map(item => ({
    //   question: item.name,
    //   answer: item.value
    // })));

    // get responses for this stage
    const responses = this.items.map(item => ({
      question: item.name,
      answer: item.value
    }))

    // submit responses based on survey type
    const table_name = this.stage === 1 ? "demography" : "affect"; // figure out which table
    const submissionData = { jwt: this.jwt, name: this.name, table: table_name, responses: responses };
    this.http.post('https://example.com/submit', submissionData, { responseType: 'text' })
      .subscribe({
        next: (response) => {
          console.log(`${table_name} data submitted successfully:`, response);
        },
        error: (error) => console.error(`Error submitting ${table_name} data:`, error)
    });

    if (this.stage === 1) {
      // Load the second survey if it's the first stage
      this.loadSurvey('affect-survey.json');  // Adjust this as needed for your second survey file
      this.stage++;
    } else {
      this.router.navigate(['/play']);
    }
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
