import { Component} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { AlertController } from '@ionic/angular';
import * as yaml from 'js-yaml';


// Image pre-load
import { ImagePreloaderService } from '../services/image-preloader.service';


// Interfaces
import { BlockTemplate } from './block.interface';
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
              private alertCtrl: AlertController,
              private imagePreloader: ImagePreloaderService) {}
  //--------------------------------------------------------------------------
  // Life cycle events
  //--------------------------------------------------------------------------

  async ngOnInit() {

    // Pre-load images
    const imagesToPreload = [
      "/assets/negative/HF01_AO.jpg",
      "/assets/negative/BM08_SO.jpg",
      "/assets/negative/BF20_SC.jpg",
      "/assets/negative/HF09_AO.jpg",
      "/assets/negative/AM04_SC.jpg",
      "/assets/negative/BM16_FO.jpg",
      "/assets/negative/AM10_AO.jpg",
      "/assets/negative/BF09_AC.jpg",
      "/assets/negative/BM01_FC.jpg",
      "/assets/negative/BF14_SO.jpg",
      "/assets/negative/BF16_AO.jpg",
      "/assets/negative/BM03_AC.jpg",
      "/assets/negative/AM09_SC.jpg",
      "/assets/negative/BM08_SC.jpg",
      "/assets/negative/AF03_FO.jpg",
      "/assets/negative/HF04_AO.jpg",
      "/assets/negative/BM05_SO.jpg",
      "/assets/negative/BF18_FO.jpg",
      "/assets/negative/HF08_FO.jpg",
      "/assets/negative/BF03_FC.jpg",
      "/assets/negative/BF15_SC.jpg",
      "/assets/negative/AF03_AC.jpg",
      "/assets/negative/BM16_AC.jpg",
      "/assets/negative/AF08_AO.jpg",
      "/assets/negative/BF02_SC.jpg",
      "/assets/negative/AM08_SO.jpg",
      "/assets/negative/BF20_FO.jpg",
      "/assets/negative/AF10_AC.jpg",
      "/assets/negative/HF02_FC.jpg",
      "/assets/negative/HF7_SO.jpg"
    ];
    this.imagePreloader.preloadImages(imagesToPreload);

    // Load data
    await this.initStorage();
    this.loadJWT();
    this.loadUserName();
    this.current_block = 1;
    this.choices_left  = 0;
    this.loadBlockTemplate(this.current_block); // Load the first block template
  
    // Initialize colors
    this.primaryColor = this.convertToRgba(getComputedStyle(document.documentElement).getPropertyValue('--ion-color-primary'), 0.4);
    this.primaryShadeColor = this.convertToRgba(getComputedStyle(document.documentElement).getPropertyValue('--ion-color-primary-shade'), 0.4);

    // Update choice in negative image
    setTimeout(() => {
      this.updateImageRandomly()
    }, 2000)
    
  }
  

  //--------------------------------------------------------------------------
  // Initialize variables
  //--------------------------------------------------------------------------

  // Data storage
  private storage: Storage | null = null;
  name           = "";
  jwt            = "";

  // Colors for visualization
  primaryColor = "";
  primaryShadeColor = "";
  
  // Game template
  game = {
    number_actions: 3,
    number_states: 1,
    trial_start_number: 1,
    trial_end_number:   1, 
    state_transition: (current_state: number, action: [number, number, number], params: { [key: string]: any }) => 0,
    reward_transition: (current_state: number, next_state: number, action: [number, number, number], params: { [key: string]: any }) => 0,
    image_transition: (current_state: number, next_state: number, action: [number, number, number], params: { [key: string]: any }) => 0,
    background_images: [] as string[],
    negative_images: [] as string[],
    additional_params: {} as { [key: string]: any },
    instructions: [] as string[],
    shuffle_states: [] as number[],
    shuffle_actions: [] as number[],
  }
  
  // Current state of agent
  pts = 0;
  images = 0;
  start_time = 0;
  end_time = 0;
  choices_left = 0;
  current_state = 0;
  next_state = 0;
  current_reward = 0;
  current_image = 0;
  current_image_dummy = 0;
  target_pts = 0;
  current_image_url = '';

  // Agent information for storage
  agent  = {
    rewards        : new Array(),
    images         : new Array(),
    threats        : new Array(),
    actions        : new Array(),
    reaction_times : new Array(),
    states         : new Array(),
  };

  // Between block information
  total_blocks: number = 1; //UPDATE: 12;
  current_block  = 1;
  
  //--------------------------------------------------------------------------
  // Dynamic functions
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
          }, 1000); // Pause for 1000 milliseconds (1 second)

        }
    
      }
    }
  }

  executeAction(svgPoint: Point, A: Point, B: Point, C: Point): void {

     // Stop clock and store reaction time
     this.end_time = performance.now();
     this.agent.reaction_times.push(parseFloat((this.end_time - this.start_time).toFixed(3)));

     // Update negative image
     //this.updateImageRandomly();
     
    // Generate barycentric coordinates
    var lambda: [number, number, number] = this.barycentricCoordinates(svgPoint, A, B, C);

    // Use the shuffled actions, ensuring the result is still a tuple of length 3
    lambda = [
      parseFloat(lambda[this.game.shuffle_actions[0]].toFixed(3)),
      parseFloat(lambda[this.game.shuffle_actions[1]].toFixed(3)),
      parseFloat(lambda[this.game.shuffle_actions[2]].toFixed(3))
    ];

     // Store action
     this.agent.actions.push(lambda);

     // Determine the next state using the state transition function
     this.next_state = this.game.state_transition(this.current_state, lambda, this.game.additional_params);

     // Generate reward, push to array
     this.current_reward = this.game.reward_transition(this.current_state, this.next_state, lambda, this.game.additional_params);
     this.agent.rewards.push(this.current_reward);

     // Generate image, push to array
     this.current_image = this.game.image_transition(this.current_state, this.next_state, lambda, this.game.additional_params);
     this.agent.images.push(this.current_image);

     // Store state and update state
     this.agent.states.push(this.next_state);
     this.current_state = this.next_state;
     
     // Hide the SVG and the instructions
     document.getElementById('action_triangle')?.classList.add('hidden');
     document.getElementById('instructions')?.classList.add('hidden');

     // Reveal image if image is success
     if (this.current_image) {
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

        // Update image total
        this.images = this.images + this.current_image;

        // Update and animate point total
        this.target_pts = this.pts + this.current_reward;
        this.animatePointIncrement();


        // Decrement choices left
        this.choices_left--;

        // Start clock again
        this.start_time = performance.now();

        // Check if there are any choices left
        if (this.choices_left >= this.game.trial_end_number){

          // Hide outcome
          document.getElementById('neg_image')?.classList.add('hidden');

          // Reveal triangle and instructions again
          document.getElementById('action_triangle')?.classList.remove('hidden');
          document.getElementById('instructions')?.classList.remove('hidden');

          // Remove the "X" text element
          document.querySelectorAll('.selected-point').forEach(el => el.remove());

          // Update choice in negative image
          this.updateImageRandomly();
 
        } else {

          // Hide outcome
          document.getElementById('neg_image')?.classList.add('hidden');

          // Load next block
          this.loadNextBlock();

        }
      }, 2000); 

    }, 1000); 

  }
  //--------------------------------------------------------------------------
  // Loading files
  //--------------------------------------------------------------------------

  // Load storage service
  private async initStorage() {
    this.storage = await this.storageService.create();
  }

  // Load JWT
  private loadJWT() {
    this.storage?.get('jwt').then((val: string | null) => {
      if (val) {
        this.jwt = val;
      }
    });
  }

  // Load user name
  private loadUserName() {
    this.storage?.get('name').then((val: string | null) => {
      if (val) {
        this.name = val;
      }
    });
  }

  // Load and parse the YAML file
  private loadBlockTemplate(blockNumber: number) {
    this.http.get(`/assets/block${blockNumber}.yaml`, { responseType: 'text' }).subscribe(yamlText => {
      // Block template
      const template = yaml.load(yamlText) as unknown as BlockTemplate;

      // Store block template in "game"
      this.game.number_actions = template.number_actions;
      this.game.number_states = template.number_states;
      this.game.trial_start_number = template.trial_start_number;
      this.game.trial_end_number   = template.trial_end_number;
      this.game.additional_params = template.additional_params;
      this.game.state_transition  = new Function('current_state', 'action', 'params', `return (${template.state_transition})(current_state, action, params);`) as (current_state: number, action: [number, number, number], params: { [key: string]: any }) => number;
      this.game.reward_transition = new Function('current_state', 'next_state', 'action', 'params', `return (${template.reward_transition})(current_state, next_state, action, params);`) as (current_state: number, next_state: number, action: [number, number, number], params: { [key: string]: any }) => number;
      this.game.image_transition  = new Function('current_state', 'next_state', 'action', 'params', `return (${template.image_transition})(current_state, next_state, action, params);`) as (current_state: number, next_state: number, action: [number, number, number], params: { [key: string]: any }) => number;
      this.game.negative_images   = template.negative_images;
      this.game.background_images = template.background_images;
      this.game.instructions = template.instructions;

      // Check if we reset block
      if (this.choices_left == 0){

        // Shuffle states and actions
        this.game.shuffle_states  = this.shuffleArray(Array.from({ length: template.number_states }, (_, i) => i)); // Random shuffle
        this.game.shuffle_actions = this.shuffleArray(Array.from({ length: template.number_actions }, (_, i) => i)); // Random shuffle

        // Set choices left to trial start number
        this.choices_left = template.trial_start_number;

        // Update current state of the game
        this.pts = 0;
        this.images = 0;
        this.target_pts = 0;
        this.current_state = 0;
        this.agent.states.push(this.current_state);

      }

      // Load instructions
      this.loadInstructions();

    });

  }

  // Load instructions for given block
  async loadInstructions() {
    let currentInstructionIndex = 0;
  
    const showNextInstruction = async () => {
      if (currentInstructionIndex >= this.game.instructions.length) {
        // Show the final alert with the "Begin" button
        const finalAlert = await this.alertCtrl.create({
          cssClass: 'custom-alert',
          message: "Ready?",
          backdropDismiss: false,
          buttons: [
            {
              text: "Yes",
              role: 'confirm',
              handler: () => {
                this.start_time = performance.now();
              }
            }
          ]
        });
  
        await finalAlert.present();
        return;
      }
  
      // Show the current instruction
      const alert = await this.alertCtrl.create({
        cssClass: 'custom-alert',
        message: this.game.instructions[currentInstructionIndex],
        backdropDismiss: false,
      });
  
      await alert.present();
  
      // Dismiss the alert and show the next instruction after 3 seconds
      setTimeout(async () => {
        await alert.dismiss();
        currentInstructionIndex++;
        await showNextInstruction();
      }, 4000); // Transition time in milliseconds (4 seconds)
    };
  
    await showNextInstruction();  

    // Reveal triangle and instructions again
    document.getElementById('action_triangle')?.classList.remove('hidden');
    document.getElementById('instructions')?.classList.remove('hidden');

    // Remove the "X" text element
    document.querySelectorAll('.selected-point').forEach(el => el.remove());
    
  }

  // Load and parse the YAML file
  loadNextBlock() {

    // Send data
    this.sendData();

    // Increment the block index
    this.current_block++;
  
    if (this.current_block <= this.total_blocks) {

      // Update choice in negative image
      this.updateImageRandomly()
 
      // Reset agent information
      this.agent  = {
        rewards        : new Array(),
        images         : new Array(),
        threats        : new Array(),
        actions        : new Array(),
        reaction_times : new Array(),
        states         : new Array(),
      };

      // Load next block template
      this.loadBlockTemplate(this.current_block);

  
    } else {
      // All blocks completed
      this.router.navigate(['demography']);
    }

  }
  

  //--------------------------------------------------------------------------
  // Helper functions
  //--------------------------------------------------------------------------

  // Update image randomly
  updateImageRandomly() {
      const randomIndex = Math.floor(Math.random() * this.game.negative_images.length);
      this.current_image_dummy = randomIndex;
      setTimeout( () => {
      this.current_image_url   = this.game.negative_images[this.current_image_dummy];
      }, 500);
  }

  private sendData(): void {
    // Prepare data to send
    const data = {
      block: this.current_block,
      game: JSON.stringify(this.game),
      agent: JSON.stringify(this.agent),
    };
  
    const postData = {
      jwt: this.jwt, 
      name: this.name,
      table_name: "games",
      data: data,
    };
  
    this.http.post('https://lorevimo.com/dimension/survey.php', postData, { responseType: 'text' })
      .subscribe({
        next: (response) => {
          console.log('Data sent successfully', response);
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

// Animates the point increment
private animatePointIncrement() {
  if (this.pts < this.target_pts) {
    // Increment points one by one
    this.pts++;
    // Use requestAnimationFrame for smooth animation
    requestAnimationFrame(() => this.animatePointIncrement());
  }
}

// Covert colors to rgb
convertToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

}

