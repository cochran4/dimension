import { Component , OnInit} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { AlertController } from '@ionic/angular';

interface Point {
  x: number;
  y: number;
}


@Component({
  selector: 'app-home',
  templateUrl: 'play.page.html',
  styleUrls: ['play.page.scss'],
})
export class PlayPage {

  //--------------------------------------------------------------------------
  // Set up constructor
  //--------------------------------------------------------------------------

  constructor(public storageService: Storage, 
              private router: Router, 
              private http: HttpClient,
              private alertCtrl: AlertController) {}
  //--------------------------------------------------------------------------
  // Life cycle events
  //--------------------------------------------------------------------------

  async init() {
    // Create the storage instance
    this.storage = await this.storageService.create();
  }


  // Things to initialize while loading page
  async ngOnInit() {


    await this.init(); // Ensure storage is initialized

    // Randomly shuffle rewards
    this.task.reward_success = this.shuffleArray(this.task.reward_success); 

    // Get current jwt from storage
    this.storage?.get('jwt').then((val: string | null) => {
      if (val){
        // jwt is available
        this.jwt = val;
      }
    });

    // Get user name from storage
    this.storage?.get('name').then((val: string | null) => {
      if (val){
        // name is available
        this.name = val;
      }
    });
  }

  ngAfterViewInit() {
    this.presentAlert();
  }

  async presentAlert() {
    const alert = await this.alertCtrl.create({
      header: "Instructions",
      message: "Instructions go here.",
      buttons: [
        {
          text: "begin",
          role: 'confirm',
          handler: () => {
            this.agent.start_time = performance.now();
            console.log("timer started at ", this.agent.start_time);
          }
        }
      ]
    });

    await alert.present();
  }

  //--------------------------------------------------------------------------
  // Game parameters
  //--------------------------------------------------------------------------

  // Initialize variables
  private storage: Storage | null = null;
  targetPoints   = 0;
  current_reward = 0;
  current_image  = 0;
  name           = "";
  jwt            = "";

  // Images
  imageUrls = [[
                '/assets/shapes/shape1.jpg',
                '/assets/shapes/shape2.jpg',
                '/assets/shapes/shape3.jpg',
                '/assets/shapes/shape4.jpg',
                '/assets/shapes/shape5.jpg',
                '/assets/shapes/shape6.jpg',
                '/assets/shapes/shape7.jpg',
                ],
                [
                '/assets/textures/state0.jpg',
                '/assets/textures/state1.jpg',
                '/assets/textures/state2.jpg',
                '/assets/textures/state3.jpg',
                '/assets/textures/state4.jpg',
                '/assets/textures/state5.jpg',
                '/assets/textures/state6.jpg',
                '/assets/textures/state7.jpg',
                ],                 
                [
                '/assets/light/light1.jpg',
                '/assets/light/light2.jpg',
                '/assets/light/light3.jpg',
                '/assets/light/light4.jpg',
                '/assets/light/light5.jpg',
                '/assets/light/light6.jpg',
                '/assets/light/light7.jpg',
                '/assets/light/light8.jpg',
                '/assets/light/light9.jpg',
                ], 
                [
                '/assets/dark/dark1.jpg',
                '/assets/dark/dark2.jpg',
                '/assets/dark/dark3.jpg',
                '/assets/dark/dark4.jpg',
                '/assets/dark/dark5.jpg',
                '/assets/dark/dark6.jpg',
                '/assets/dark/dark7.jpg',
                '/assets/dark/dark8.jpg',
                '/assets/dark/dark9.jpg',
                '/assets/dark/dark10.jpg',
                ], 
                [
                  '/assets/negative/Car accident 1.jpg',
                  '/assets/negative/Car accident 2.jpg',
                  '/assets/negative/Car accident 3.jpg',
                  '/assets/negative/Car accident 4.jpg',
                ],
                ];

  //--------------------------------------------------------------------------
  // Set up game
  //--------------------------------------------------------------------------

  // Generate task
  task = {
      reward_success    : [0.1, 0.7, 0.9],    // Success probability for Binomial random variable
      reward_max        : 10,                 // Reward max (Parameter n in binomial distribution)
      n_trials          : 20,                 // Number of trials
      images            : this.imageUrls[4],  // Negative images for outcome
  }
  
  // Initialize agent
  agent  = {
      pts            : 0,
      image_id       : 0,
      start_time     : 0,
      end_time       : 0,
      choices_left   : this.task.n_trials,
      rewards        : new Array(),
      images         : new Array(),
      threats        : new Array(),
      actions        : new Array(),
      reaction_times : new Array(),
  };

  //--------------------------------------------------------------------------
  // Functionality
  //--------------------------------------------------------------------------

  onSvgClick(event: MouseEvent): void {
    const svgElement = event.target as SVGSVGElement;
    const svg  = svgElement.closest('svg'); // Finds the closest ancestor <svg> element
    if (svg) {
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
  
      // Transform to SVG coordinates
      const ctm = svg.getScreenCTM();
      if (ctm) {
        
        // Selected point transformed to svg coordinates
        const svgPoint = pt.matrixTransform(ctm.inverse());

        // Verify that selected point lies in triangle
        const A = { x: 50, y: 75 };  // Bottom vertex
        const B = { x: 83, y: 22.5 }; // Right vertex
        const C = { x: 17, y: 22.5 }; // Left vertex

        if (this.pointInTriangle(svgPoint, A, B, C)) {
          
          // Create the "X" text element
          const newText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          newText.setAttribute("x", svgPoint.x.toString());
          newText.setAttribute("y", svgPoint.y.toString());
          newText.setAttribute("fill", "var(--ion-color-danger)"); // Set the text color
          newText.setAttribute("font-size", "12"); // Set the font size
          newText.setAttribute("text-anchor", "middle"); // Center the text horizontally on the point
          newText.setAttribute("dominant-baseline", "middle"); // Attempt to center the text vertically
          newText.textContent = "x";
          newText.classList.add('selected-point'); // Add a class to the "X" text element

          // Append new text to the svg
          svg.appendChild(newText);   
          
          // Introduce a pause using setTimeout
          setTimeout(() => {
            this.executeAction(svgPoint, A, B, C);
          }, 2000); // Pause for 2000 milliseconds (2 seconds)

        }
    
      }
    }
  }

  executeAction(svgPoint: Point, A: Point, B: Point, C: Point): void {

     // Stop clock and store reaction time
     this.agent.end_time = performance.now();
     this.agent.reaction_times.push(this.agent.end_time-this.agent.start_time);
     
     // Determine barycentric coordinates
     const lambda = this.barycentricCoordinates(svgPoint, A, B, C);

     // Store action
     this.agent.actions.push(lambda);

     // Determine success probability
     const reward_success = this.task.reward_success[0]*lambda[0] + 
                            this.task.reward_success[1]*lambda[1] + 
                            this.task.reward_success[2]*lambda[2];

    // Determine image probability
    const image_success =   this.task.reward_success[0]*lambda[0] + 
                            this.task.reward_success[1]*lambda[1] + 
                            this.task.reward_success[2]*lambda[2];
    const probabilities = new Array(this.task.images.length+1).fill(image_success/this.task.images.length); 
    probabilities[0]    = 1-image_success;

     // Generate reward, push to array
     this.current_reward = this.binomialRandomVariable(this.task.reward_max, reward_success);
     this.agent.rewards.push(this.current_reward);

     // Generate image, push to array
     const current_image_id = this.generateCategoricalRandomVariable(probabilities);
     this.agent.images.push(current_image_id);
     
     // Hide the SVG and the instructions
     document.getElementById('action_triangle')?.classList.add('hidden');
     document.getElementById('instructions')?.classList.add('hidden');

     // Reveal image if image is success
     if (current_image_id) {
      this.current_image = current_image_id-1;
      document.getElementById('neg_image')?.classList.remove('hidden');      
     }

     // Reveal point bubble
     document.getElementById('point_bubble')?.classList.add('visible');

     // Wait another 2 second, fade point bubble
     // Then wait another 3 seconds, hide the image, show the SVG and the first fab
    setTimeout(() => {

        // Hide point bubble
       document.getElementById('point_bubble')?.classList.remove('visible');

       setTimeout(() => {

        // Update and animate point total
        this.targetPoints = this.agent.pts + this.current_reward;
        this.animatePointIncrement();

        // Decrement choices left
        this.agent.choices_left--;

        // Start clock again
        this.agent.start_time = performance.now();

        // Check if there are any choices left
        if (this.agent.choices_left){

          // Hide outcome
          document.getElementById('neg_image')?.classList.add('hidden');

          // Reveal triangle and instructions again
          document.getElementById('action_triangle')?.classList.remove('hidden');
          document.getElementById('instructions')?.classList.remove('hidden');

          // Remove the "X" text element
          document.querySelectorAll('.selected-point').forEach(el => el.remove());

        } else {


          // UPDATE!!! Navigate to thank you page
          this.router.navigate(['thank-you']);


          // UPDATE!!!! Send data to lorevimo.com
          // this.sendData()

        }
      }, 3000); 

    }, 2000); 

  }


  //--------------------------------------------------------------------------
  // Helper functions
  //--------------------------------------------------------------------------

  // Send data to 
  private sendData(): void {

    this.http.post('https://lorevimo.com/seqer/game.php', {
      
      // Data to be sent to http
      "jwt":   this.jwt,
      "token": "K7tKmqMM4Pse:1pmNQuF3r/xpK$C6$",
      "name":  this.name,
      "level": "na",
      "stage": "na",
      "mdp":   JSON.stringify(this.task),
      "agent": JSON.stringify(this.agent),
      "completed": "na",
        
    }, {responseType: 'text'})
    .subscribe({
      next: (response) => {
        
        console.log('Data sent successfully', response);

        // Navigate to thank you page
        this.storageService.set("finished", "true");
        this.router.navigate(['thank-you']);

      },
      error: (error) => {
        console.error('Error sending data', error);
      },
      complete: () => console.log('Request completed')
    });

  }

  // Helper function to calculate the sign of an area defined by three points
  private sign(p1: Point, p2: Point, p3: Point): number {
     return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  }

  // Function to determine if a point is inside a triangle
  private pointInTriangle(pt: Point, v1: Point, v2: Point, v3: Point): boolean {
    const d1 = this.sign(pt, v1, v2);
    const d2 = this.sign(pt, v2, v3);
    const d3 = this.sign(pt, v3, v1);

    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    return !(hasNeg && hasPos);
  }

  // Finds barycentric coordinates of a point in a triangle
  private barycentricCoordinates(pt: Point, A: Point, B: Point, C: Point): [number, number, number] {
    const area = (vertex1: Point, vertex2: Point, vertex3: Point): number => 
        Math.abs((vertex1.x - vertex3.x) * (vertex2.y - vertex1.y) - (vertex1.x - vertex2.x) * (vertex3.y - vertex1.y)) / 2;

    const areaABC = area(A, B, C);
    const areaPBC = area(pt, B, C);
    const areaPCA = area(pt, C, A);
    const lambda1 = areaPBC / areaABC;
    const lambda2 = areaPCA / areaABC;
    const lambda3 = 1 - lambda1 - lambda2;

    return [lambda1, lambda2, lambda3];
}

// Shuffles array
private shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1)); // Generate a random index
      let tmp = array[i]; // Swap elements at indices i and j
      array[i] = array[j];
      array[j] = tmp;
  }
  return array;
}

// Randomly sample from binomial distribution with parameters n and p
private binomialRandomVariable(n: number, p: number): number {
    let successes = 0;
    for (let i = 0; i < n; i++) {
        if (Math.random() < p) { // Simulate a Bernoulli trial with success probability p
            successes += 1;
        }
    }
    return successes;
}

// Animates the point increment
private animatePointIncrement() {
  if (this.agent.pts < this.targetPoints) {
    // Increment points one by one
    this.agent.pts++;
    // Use requestAnimationFrame for smooth animation
    requestAnimationFrame(() => this.animatePointIncrement());
  }
}

// Randomly samples from a categorical distribution
private generateCategoricalRandomVariable(probabilities: number[]): number {
  const randomValue = Math.random(); // Generate a random value between 0 and 1
  let sum = 0;
  let category = 0;

  for (let i = 0; i < probabilities.length; i++) {
      sum += probabilities[i];
      if (randomValue <= sum) {
          category = i;
          break;
      }
  }

  return category; // The index of the chosen category


}

}

//@Component({
//  selector: 'app-play',
//  templateUrl: './play.page.html',
//  styleUrls: ['./play.page.scss'],
//})
//export class PlayPage implements OnInit {

//   //--------------------------------------------------------------------------
//   // Game parameters
//   //--------------------------------------------------------------------------

//   // Initial set up of game 
//   random    = new Random();
//   maxSwipes = 20;
//   timeMax   = 180;
//   level     = 1;
//   stage     = 1;
//   total     = 0;   // Total points for game
//   completed = 0;
//   maxStages = 8;
//   jwt       = "";
//   name      = "";
//   sign      = "+";
//   currentR  = 0;
//   study     = "";
//   session   = 1;
//   progress  = [-1,0,0,1,1,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6,7,7,7,7,8,8,8,8];
//   imagePauseDur = 1;  // Pause to allow for reload
//   pointCountDur0 = 120; //60;
//   pointCountDur  = this.pointCountDur0; // Pause
//   best   = { level : "1.1",
//              score : 0,
//              grow  :  ["0","0","0","0","0","0","0","0","0"],
//              animate: -1,
//              levels: ["1.1"]};
//   blockDate = new Date();

//   // Images
//   imageUrls = [[
//                 '/assets/shapes/shape1.jpg',
//                 '/assets/shapes/shape2.jpg',
//                 '/assets/shapes/shape3.jpg',
//                 '/assets/shapes/shape4.jpg',
//                 '/assets/shapes/shape5.jpg',
//                 '/assets/shapes/shape6.jpg',
//                 '/assets/shapes/shape7.jpg',
//                 ],
//                 [
//                 '/assets/textures/state0.jpg',
//                 '/assets/textures/state1.jpg',
//                 '/assets/textures/state2.jpg',
//                 '/assets/textures/state3.jpg',
//                 '/assets/textures/state4.jpg',
//                 '/assets/textures/state5.jpg',
//                 '/assets/textures/state6.jpg',
//                 '/assets/textures/state7.jpg',
//                 ],                 
//                 [
//                 '/assets/light/light1.jpg',
//                 '/assets/light/light2.jpg',
//                 '/assets/light/light3.jpg',
//                 '/assets/light/light4.jpg',
//                 '/assets/light/light5.jpg',
//                 '/assets/light/light6.jpg',
//                 '/assets/light/light7.jpg',
//                 '/assets/light/light8.jpg',
//                 '/assets/light/light9.jpg',
//                 ], 
//                 [
//                 '/assets/dark/dark1.jpg',
//                 '/assets/dark/dark2.jpg',
//                 '/assets/dark/dark3.jpg',
//                 '/assets/dark/dark4.jpg',
//                 '/assets/dark/dark5.jpg',
//                 '/assets/dark/dark6.jpg',
//                 '/assets/dark/dark7.jpg',
//                 '/assets/dark/dark8.jpg',
//                 '/assets/dark/dark9.jpg',
//                 '/assets/dark/dark10.jpg',
//                 ], 
//                 ];

//    // Motifs for UIC study
//    motifP1_3state =  [  [ [0,1,0],       [1,0,0],        [0,1,0]     ],  [ [0,0,1],      [0,0,1],        [0,1,0]     ]  ];
//    motifP2_3state =  [  [ [0,1,0],       [0,0,1],        [1,0,0]     ],  [ [0,0,1],      [1,0,0],        [0,1,0]     ]  ];
//    motifP3_3state =  [  [ [0,0.8,0.2],   [0.8,0,0.2],    [0.2,0.8,0] ],  [ [0,0.2,0.8],  [0.2,0,0.8],    [0.2,0.8,0] ]  ];
//    motifP4_3state =  [  [ [0,0.8,0.2],   [0.2,0,0.8],    [0.8,0.2,0] ],  [ [0,0.2,0.8],  [0.8,0,0.2],    [0.2,0.8,0] ]  ];
//    motifR1_3state =  [0.8, 0.2, 0.2];
//    motifR2_3state =  [0.666, 0.167, 0.167];
//    motifP1_4state =  [  [ [0,1,0,0], [1,0,0,0], [0,1,0,0],[0,0,1,0] ], [ [0,0,0,1], [0,0,1,0], [0,1,0,0],[0,0,1,0] ]  ];
//    motifP2_4state =  [  [ [0,1,0,0], [0,0,1,0], [0,0,0,1],[1,0,0,0] ], [ [0,0,0,1], [1,0,0,0], [0,1,0,0],[0,0,1,0] ]  ];
//    motifP3_4state =  [  [ [0,0.8,0.1,0.1], [0.8,0,0.1,0.1], [0.1,0.8,0,0.1],[0.1,0.1,0.8,0] ], [ [0,0.1,0.1,0.8], [0.1,0,0.8,0.1], [0.1,0.8,0,0.1],[0.1,0.1,0.8,0] ]  ];
//    motifP4_4state =  [  [ [0,0.8,0.1,0.1], [0.1,0,0.8,0.1], [0.1,0.1,0,0.8],[0.8,0.1,0.1,0] ], [ [0,0.1,0.1,0.8], [0.8,0,0.1,0.1], [0.1,0.8,0,0.1],[0.1,0.1,0.8,0] ]  ];
//    motifR1_4state = [0.727,0.091,0.091,0.091];
//    motifR2_4state = [0.571,0.143,0.143,0.143]; 
//    motifs = [ [ [ { P :     this.motifP1_3state, 
//                     R :     this.motifR1_3state,
//                     norm :  0.256 },  // type 3b
//                 {   P :     this.motifP2_3state, 
//                     R :     this.motifR1_3state,
//                     norm :  0.333 }  // type 1b                
//              ], // Level 1, Stage 1
//              [ {    P :     this.motifP1_3state, 
//                     R :     this.motifR1_3state,
//                     norm :  0.256 },  // type 3b
//                {    P :     this.motifP2_3state, 
//                     R :     this.motifR1_3state,
//                     norm :  0.333 }  // type 1b                
//              ], // Level 1, Stage 2
//              [ {    P :     this.motifP1_3state, 
//                     R :     this.motifR2_3state, 
//                     norm :  0.278 },  // type 3b
//                {    P :     this.motifP2_3state, 
//                     R :     this.motifR2_3state,
//                     norm :  0.333 }  // type 1b                
//              ], // Level 1, Stage 3
//              [ {    P :     this.motifP1_3state, 
//                     R :     this.motifR2_3state,
//                     norm :  0.278 },  // type 3b
//                {    P :     this.motifP2_3state, 
//                     R :     this.motifR2_3state,
//                     norm :  0.333 }  // type 1b                
//              ], // Level 1, Stage 4
//              [ {    P :     this.motifP3_3state, 
//                     R :     this.motifR1_3state, 
//                     norm :  0.287 },  // type 3b
//                {    P :     this.motifP4_3state, 
//                     R :     this.motifR1_3state, 
//                     norm :  0.333 }  // type 1b                
//              ], // Level 1, Stage 5
//              [ {    P :     this.motifP3_3state, 
//                     R :     this.motifR1_3state, 
//                     norm :  0.287 },  // type 3b
//                {    P :     this.motifP4_3state, 
//                     R :     this.motifR1_3state,
//                     norm :  0.333 }  // type 1b                
//              ], // Level 1, Stage 6
//              [ {    P :     this.motifP3_3state, 
//                     R :     this.motifR2_3state,
//                     norm :  0.300 },  // type 3b
//                {    P :     this.motifP4_3state, 
//                     R :     this.motifR2_3state,
//                     norm :  0.333 }  // type 1b                
//              ], // Level 1, Stage 7
//              [ {    P :     this.motifP3_3state, 
//                     R :     this.motifR2_3state, 
//                     norm :  0.300 },  // type 3b
//                {    P :     this.motifP4_3state, 
//                     R :     this.motifR2_3state,
//                     norm :  0.333 }  // type 1b                
//              ] // Level 1, Stage 8
//              ], // END LEVEL 1 
//              [ 
//              [ {    P :     this.motifP1_4state, 
//                     R :     this.motifR1_4state, 
//                     norm :  0.218 },  // type 3b
//                 {   P :     this.motifP2_4state,
//                     R :     this.motifR1_4state,
//                     norm :  0.25 }  // type 1b                
//              ], // Level 2, Stage 1
//              [ {    P :     this.motifP1_4state, 
//                     R :     this.motifR1_4state,
//                     norm :  0.218 },  // type 3b
//                {    P :     this.motifP2_4state,
//                     R :     this.motifR1_4state,
//                     norm :  0.25 }  // type 1b                
//              ], // Level 2, Stage 2
//              [ {    P :     this.motifP1_4state,  
//                     R :     this.motifR2_4state,
//                     norm :  0.229 },  // type 3b
//                {    P :     this.motifP2_4state,
//                     R :     this.motifR2_4state,
//                     norm :  0.25 }  // type 1b                
//              ], // Level 2, Stage 3
//              [ {    P :     this.motifP1_4state, 
//                     R :     this.motifR2_4state,
//                     norm :  0.229 },  // type 3b
//                {    P :     this.motifP2_4state,
//                     R :     this.motifR2_4state,
//                     norm :  0.25 }  // type 1b                
//              ], // Level 2, Stage 4
//              [ {    P :     this.motifP3_4state,
//                     R :     this.motifR1_4state, 
//                     norm :  0.219 },  // type 3b
//                {    P :     this.motifP4_4state,
//                     R :     this.motifR1_4state, 
//                     norm :  0.25 }  // type 1b                
//              ], // Level 2, Stage 5
//              [ {    P :     this.motifP3_4state,  
//                     R :     this.motifR1_4state,
//                     norm :  0.219 },  // type 3b
//                {    P :     this.motifP4_4state,  
//                     R :     this.motifR1_4state,
//                     norm :  0.25 }  // type 1b                
//              ], // Level 2, Stage 6
//              [ {    P :     this.motifP3_4state,  
//                     R :     this.motifR2_4state,
//                     norm : 0.229 },  // type 3b
//                {    P :     this.motifP4_4state, 
//                     R :     this.motifR2_4state,
//                     norm :  0.25 }  // type 1b                
//              ], // Level 2, Stage 7
//              [ {    P :     this.motifP3_4state,  
//                     R :     this.motifR2_4state,
//                     norm :  0.229 },  // type 3b
//                {    P :     this.motifP4_4state, 
//                     R :     this.motifR2_4state, 
//                     norm :  0.25 }  // type 1b                
//              ] // Level 2, Stage 8
//              ]
//              ]
//   //--------------------------------------------------------------------------
//   // Set up constructor
//   //--------------------------------------------------------------------------

//  constructor(public storage: Storage, 
//              private menuCtrl: MenuController, 
//              private alertCtrl: AlertController, 
//              private router: Router, 
//              private http: HttpClient,
//              private imageLoader: ImageLoaderService) {
             
//              }


//   //--------------------------------------------------------------------------
//   // Set up game
//   //--------------------------------------------------------------------------

//   // Initialize
//   mdp : any; 

//   // Images
//   images = []; 
  
//   // Initialize agent
//   initialstate = 1; 
//   agent  = {
//       state    : this.initialstate, 
//       pts      : 0,
//       swipes   : this.maxSwipes + (this.level-1)*10,  
//       states   : new Array(this.initialstate),
//       rewards  : new Array(),
//       actions  : new Array(),
//       times    : new Array(),
//   };

//   async reInitializeGame(){  

//     // Initialize mdp
//     this.mdp = new MDP(this.level,this.stage,this.random);


//     // Initialize random seed if in UIC study and still working through first 4 sessions
//     if (this.study == "SeqerUIC" && this.session < 5) {
        
//          // Set up random number generator with user*stage*level specific seed
//          this.random    = new Random( (this.name.toLowerCase().charCodeAt(0)-97)+
//                                       (this.name.toLowerCase().charCodeAt(1)-97)*30+
//                                       (this.name.toLowerCase().charCodeAt(2)-97)*30*30+
//                                       (this.name.toLowerCase().charCodeAt(3)-97)*30*30*30+
//                                       (this.name.toLowerCase().charCodeAt(4)-97)*30*30*30*30+
//                                       (this.name.toLowerCase().charCodeAt(5)-97)*30*30*30*30*30+
//                                       this.level*30*30*30*30*30*30+
//                                       this.stage*30*30*30*30*30*30*10);


        

//          // Shuffle states
//         var states = [0,1,2,3,4,5];
//         for (var i = this.level + 2 - 1; i > 0; i--) {
//             var u = this.random.uniform(0,1);
//             var j = Math.floor(u*(i+1));
//             var temp = states[i];
//             states[i] = states[j];
//             states[j] = temp;
//         }

//         // Randomly select Motifs
//          var m = 0; // <- FOCUS ON TYPE 3B; Math.floor(this.random.uniform(0,1)*2);
//          var a = Math.floor(this.random.uniform(0,1)*2);
//          this.mdp.norm = this.motifs[this.level-1][this.stage-1][m].norm;
//          for (var i=0; i<this.level+2; i++){
//             for (var j=0; j<this.level+2; j++){
//                 this.mdp.P[0][i][j] = this.motifs[this.level-1][this.stage-1][m].P[a][states[i]][states[j]];
//                 this.mdp.P[1][i][j] = this.motifs[this.level-1][this.stage-1][m].P[1-a][states[i]][states[j]];
//              }
//             this.mdp.R[i]    = this.motifs[this.level-1][this.stage-1][m].R[states[i]];
//          }


// 	}



//     // Shuffle images
//     this.images = this.imageUrls[this.level-1];
//     for (var i = this.images.length - 1; i > 0; i--) {
//         var u = this.random.uniform(0,1);
//         var j = Math.floor(u*(i+1));
//         var tmp = this.images[i];
//         this.images[i] = this.images[j];
//         this.images[j] = tmp;
//     }

//     // Pre-load Images
//     for (var i=0; i<this.images.length; i++){
//          await this.imageLoader.preload(this.images[i]);
// 	}

//     // Initialize agent
//     this.initialstate = Math.floor(this.random.uniform(0,1)*this.mdp.nstates);
   
//     this.agent = {
//       state    : this.initialstate, 
//       pts      : this.mdp.initialPts,
//       swipes   : this.maxSwipes + (this.level-1)*10,
//       states   : [this.initialstate],
//       rewards  : [],
//       actions  : [],
//       times    : [],
//     }
 

//     // Initialize signage for points
//     this.sign                 = (this.stage % 2) == 1 ? "+" : "";
//     this.fab.el.style.opacity = 0; 
//     this.pointCountDur        = 0; // Pause for 0.75 seconds to allow 

//     // Initialize completed note 
//     this.completed = 0;

//     // Initialize counter
//     this.timeLeft = this.timeMax;
//     this.interval = 0;
//     this.add      = 0;
//     this.count    = 9;

//     // Present start button
//     const alert = await this.alertCtrl.create({
//       header:    'Ready?',
//       buttons:   [{
//                 text: 'Yes',
//                 cssClass: 'dark',
//                 handler: () => {    
//                         // Change opacity of image
//                         this.stateImage.el.style.opacity = 1;
                        
//                         // Start timer
//                         this.startTimer();

//                 }
//                 }],
//       backdropDismiss: false
//     });
//     await alert.present();

//   }
  
//   //--------------------------------------------------------------------------
//   // Set up gestures
//   //--------------------------------------------------------------------------
  
// // Get relevant element on page
//   @ViewChild('stateImage', {static: false})
//   stateImage: any;

//   @ViewChild('fabfab', {static: false})
//   fab: any;
  
//   // First time page is initialized 
//   ngAfterViewInit(){

//      // Turn off fab to start
//     this.fab.el.style.opacity = 0;

//     // Get info for swipes
//     var style          = this.stateImage.el.style;
//     const currentSrc   = this.stateImage.el.currentSrc;
//     const windowWidth  = window.innerWidth;
//     const windowHeight = window.innerHeight;

//     // Swipe right gesture config
//     const options: GestureConfig = {
       
//        // Swiped element
//        el: this.stateImage.el,
//        gestureName: "swipes",
//        threshold: 0,

//        // On Move
//        onMove: (ev) => {
//          style.transform = `translate(${1.8*ev.deltaX}px,${1.4*ev.deltaY}px)`;
// 	   },
       
//        // End of gesture
//        onEnd: (ev) => {
//          // Ease out of screen
//          style.transition       = "0.2s ease-in-out";
//          if (ev.deltaX > windowWidth/5){
//            this.action(0);
//            style.transform       = '';
//          } else if (ev.deltaX < -windowWidth/5){
//            this.action(1);   
//            style.transform  = '';
//          } else {
//            style.transform = '';
//          }        
//        },
    
//     }

//     // create swipe gesture
//     const swipe: Gesture = createGesture(options);
    
//     // Enable swipe
//     swipe.enable(true);

//   }


//   // Left action
//   action(a: number) {

//       // Check if any swipes are left and image is not currently paused
//       if (this.agent.swipes > 0 && this.imagePause == 0){
//         // Update state and points
//         this.agent.state     = this.mdp.transition(this.agent.state,a);
      
//         // Pause to update points and swipes
//         this.imagePause      = this.imagePauseDur; // Pause to allow for transition before points are added
//         this.currentR        = this.mdp.reward(this.agent.state);
//         this.add             = this.add + this.currentR;
//         this.agent.swipes    = this.agent.swipes - 1;
//         this.pointCountDur   = this.pointCountDur0;

//         // Update history
//         this.agent.states.push(this.agent.state);
//         this.agent.rewards.push(this.currentR);
//         this.agent.actions.push(a);
//         this.agent.times.push(this.timeMax-this.timeLeft + this.count/20);
//       }

//   }
  
//  //----------------------------------------------------------------------------
//  // Countdown timer and point tally
//  //----------------------------------------------------------------------------
    
//   // Initialize counter
//   timeLeft   = this.timeMax;
//   interval   = 0;
//   add        = 0;
//   count      = 39;
//   imagePause = 0;
  
//   // Function for timer and point tally
//   startTimer() {

//     this.interval = setInterval(() => {

//       // Check menu
//       this.pauseTimer();
//       // Check if menu is open
//       if (!this.pause){

//         // Display fab for certain amount of time
//         if (this.pointCountDur>0){
//           // Fade in opacity for new seqer plant
//           this.pointCountDur--;
//           this.fab.el.style.opacity = this.agent.states.length == 1 ? 0 : (this.pointCountDur-1)/this.pointCountDur0;
// 		}

//         // Check if allowing image to reload
//         if (this.imagePause>0){
//           //this.imagePause--;
// 		} else if (this.add > 0 ){ // Check if points need to be added
//           this.add--;
//           this.agent.pts = this.agent.pts+1;
//         } else if (this.add < 0){
//           this.add++;
//           this.agent.pts = this.agent.pts-1;
// 		} else {
//           if(this.agent.swipes > 0 && this.timeLeft > 0 && this.count == 0) {
//             this.timeLeft=this.timeLeft-1;
//             this.count   = 39;
//           } else if (this.agent.swipes > 0 && this.timeLeft > 0 ){
//             this.count--;
//           } else {
//             clearInterval(this.interval);
//             this.presentAlert();
//           }
//         }
//       }
//     },25);
//   };

//   // Pause functionality for when menu is open
//   pause       = false;
//   openPromise = this.checkMenuOpen();
//   pauseTimer() { //you can use this function if you want restart timer
//     this.openPromise = this.checkMenuOpen();
//     this.openPromise.then(value => {this.pause=value});
//   }

//   // Check whether menu is open
//   checkMenuOpen(){
//       return this.menuCtrl.isOpen("first");
//   }

//   // Pause reloading
//   onImageLoad(){
//     this.imagePause = 0;
//   }

//  //----------------------------------------------------------------------------
//  // Leveling
//  //----------------------------------------------------------------------------

//  // Initialize variables
//  mssg  = 'Well sought, Seqer. Onward?';
//  bttns : any;

//   async presentAlert() {

//      // Out of time
//      if (this.agent.swipes > 0){
//         this.agent.pts = 0;
//         this.mssg      = 'Out of time. Try again?'

//         // Update buttons
//         this.bttns = [{
//                 text: 'No.',
//                 cssClass: 'secondary',
//                 handler: () => {


//                   // Quit
//                   this.router.navigate(['/home']);
//                  }
//                 },
//                {
//                 text: 'Yes.',
//                 handler: () => {

//                 // Navigate to next game
//                 this.router.navigate(['/play']);

//                 // Update game
//                 this.reInitializeGame();
//                 }
//                }];

//      // Did not pass or force pass because of specific study
// 	 } else if (this.agent.pts < this.mdp.avgtotal && (this.study=="SeqerUIC" && this.session > 4.5) ) {
     
//         this.mssg      = "Not quite. Need " + Math.round(this.mdp.avgtotal).toString() + " pts to continue. Try again?";

//         // Update buttons
//         this.bttns = [{
//                 text: 'No.',
//                 cssClass: 'secondary',
//                 handler: () => {

//                   // Quit
//                   this.router.navigate(['/home']);
//                  }
//                 },
//                {
//                 text: 'Yes.',
//                 handler: () => {

//                 // Navigate to next game
//                 this.router.navigate(['/play']);

//                 // Update game
//                 this.reInitializeGame();
//                 }
//                }];

//      // Passed last stage
// 	 } else if (this.stage == this.maxStages){

//         // Update message
//         this.mssg = 'Level complete.';

//         // Possible study specific message
//         if (this.study == "SeqerUIC" && this.session==2.5){
//             var token1 = (Math.floor(Math.random()*1000) * 29).toString();
//             this.storage.set('UICtoken1',token1);
//             this.mssg = "Level complete. You have now completed your first session of Seqer. Course credit can be obtained with the following unique code: " + 
//                          token1;
//         } else if ( this.study == "SeqerUIC" && this.session==4.5){
//             var token2 = (Math.floor(Math.random()*1000) * 37).toString();
//             this.storage.set('UICtoken2',token2);
//             this.mssg = "Level complete. You have now completed your second session of Seqer. Course credit can be obtained with the following unique code: " + 
//                         token2;  
// 		}

//         // Update buttons
//         this.bttns = [{
//               text: 'Ok',
//               cssClass: 'secondary',
//               handler: () => {
//                 // Update levels and stage
//                 this.level = Math.min(this.level+1,4);
//                 this.stage = 1;

//                 // Navigate to next page (depending on study and level)
//                 if (this.study == "SeqerUIC" && this.session < 5){    
                
//                     //if (this.level == 2){
//                     //    // Navigate to play page
//                     //    this.router.navigate(['/play']);
                        
//                         // Update game
//                     //    this.reInitializeGame();
//                     //} else {
         
//                         // Update session
//                         this.session = this.session+0.5;

//                         if (this.session != 3){
//                             // Re-set             
//                             this.level   = 1;
//                             this.stage   = 1;
//                             this.best.levels = ["1.1"];

//                             // Navigate to play page
//                             this.router.navigate(['/play']);

//                             // Update game
//                             this.reInitializeGame();

                            
// 						} else if (this.session == 3){
          
//                             // Re-set             
//                             this.level   = 1;
//                             this.stage   = 1;
//                             this.best.levels = ["1.1"];

//                              // Set block time
//                             this.storage.set("blockDate", Date());

//                             // Navigate to block page
//                             this.router.navigate(['/block']);
          
// 						} else {

//                             // Navigate to block page
//                             this.router.navigate(['/home']);
          
// 						}


// 					//}

//                 } else {
//                     this.router.navigate(['/home']);    
// 				}

//               }
//          }];

//          // Unlock next level and mark progress
//          if (this.level < 4 && this.best.levels.length<this.maxStages*(this.level-1)+this.stage+1){
//             this.best.levels.push((this.level+1).toString()+".1");
//          }
     
//      // Passed stage
// 	 } else {
     
//        // Initialize variables
//        this.mssg  = 'Well sought, Seqer. Onward?';
//        this.bttns = [{
//                 text: 'No.',
//                 cssClass: 'secondary',
//                 handler: () => {

//                   // Quit
//                   this.router.navigate(['/home']);
//                  }
//                 },
//                {
//                 text: 'Yes.',
//                 handler: () => {

//                 // Navigate to next game
//                 this.router.navigate(['/play']);

//                 // Update game and stage
//                 this.stage = this.stage+1;                // Increment stage
//                 this.reInitializeGame();
//                 }
//                }];

//        // Unlock next stage and mark progress
//        if (this.best.levels.length < this.maxStages*(this.level-1)+this.stage+1){
//           this.best.levels.push(this.level.toString()+"."+(this.stage+1).toString());
//        }


// 	 }

//     // Send game results
//     this.completed = 1;
//     this.sendGameResults();
    
//     const alert = await this.alertCtrl.create({
//       subHeader:    'Best: '   + this.best.score.toString(),
//       header:       'Latest: ' + this.agent.pts.toString(),
//       message:   this.mssg,
//       buttons:   this.bttns,
//       backdropDismiss: false
//     });

//     await alert.present();
//   }

  
// // Send game results
//  sendGameResults() {

//      // Update total if better
//      if (this.completed == 1 && this.agent.pts > this.best.score) {         
//         this.best.score = this.agent.pts;
//         this.best.level = this.level.toString() + "." + this.stage.toString(); 
// 	 }


//     // Store data
//      this.best.animate = this.progress[this.best.levels.length-1];
//      this.storage.set('best',this.best);
//      this.storage.set('stage',this.stage);
//      this.storage.set('level',this.level);
 
  //  // post to lorevimo.com 
  //  this.http.post('https://lorevimo.com/seqer/game.php',{
  //           "jwt":       this.jwt,
  //           "token":     "K7tKmqMM4Pse:1pmNQuF3r/xpK$C6$",
  //           "name":      this.name,
  //           "level":     JSON.stringify(this.level),
  //           "stage":     JSON.stringify(this.stage),
  //           "mdp":       JSON.stringify({"P" : this.mdp.P, "R" : this.mdp.R, "normalization" : this.mdp.norm} ),
  //           "agent":     JSON.stringify(this.agent),
  //           "completed": JSON.stringify(this.completed),
  //   },{responseType: 'text'}).subscribe();


     

//   }


//  //----------------------------------------------------------------------------
//  // Life cycle event
//  //----------------------------------------------------------------------------

//  async ionViewWillEnter(){

//     // Change opacity of image
//     this.stateImage.el.style.opacity = 0;

//     // Get information from local storage
//     this.level   = await this.storage.get('level');
//     this.stage   = await this.storage.get('stage');
//     this.name    = await this.storage.get('name');
//     this.jwt     = await this.storage.get('jwt');
//     this.best    = await this.storage.get('best');
//     this.study   = await this.storage.get('study');
//     this.session = await this.storage.get('session');
    
//     // Update level and stage for specific study
//     if ( this.study == "SeqerUIC" && this.session < 5){
//         this.level = parseInt( this.best.levels[this.best.levels.length-1].substr(0,1) );
//         this.stage = parseInt( this.best.levels[this.best.levels.length-1].substr(2,3) );    
// 	}


//     // Reinitialize game
//     clearInterval(this.interval);
//     this.imageLoader.clearCache();
//     this.reInitializeGame();
 
//   }

//   ionViewWillLeave(){

//      // Clear interval and image cache
//      clearInterval(this.interval);
//      this.imageLoader.clearCache();

//      // Save data
//      this.saveData();

//   }

//   saveData(){
  
//   // Send incomplete results if game not completed
//      if (this.completed == 0){
//        // Send game results
//        this.sendGameResults();

// 	 } else {
//           // Update total if better
//          if (this.agent.pts > this.best.score) {         
//             this.best.score = this.agent.pts;
//             this.best.level = this.level.toString() + "." + this.stage.toString(); 
//         }

//         // Update storage
//         this.best.animate = this.progress[this.best.levels.length-1];
//         this.storage.set('best',this.best);
//         this.storage.set('stage',this.stage);
//         this.storage.set('level',this.level); 
//      }
//      this.storage.set('session',this.session);
//   }


//   // Dummy action
//   ngOnInit(){
//   }


//}
