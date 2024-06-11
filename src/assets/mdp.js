// Build an mdp model
var MDP = function(level,stage,random) {
	
	//---------------------------------------------------
	// Initialize mpd
	this.level      = level;
	this.stage      = stage;
	this.random     = random; 
	this.nstates    = this.level+2;
	this.avgtotal   = 10*(10 + this.level*10);
    this.initialPts = ( (this.stage-1) % 2)*(10+this.level*10)*40;   
    this.rewardA    = ( (this.stage-1) % 4) > 1 ?  5    : 1;
	this.transA     = this.stage > 4 ?             0.3  : 0.05;
	
	//---------------------------------------------------
	// Reward probabilities

	// Initialize
	this.R     = [];

	// Generate gamma distributed variables
	normR = 0;
    for (var i=0; i<this.nstates; i++) {
	   // Initialize reward probabilities
	   this.R[i] = random.gamma(this.rewardA,1);
	   normR     = this.R[i] + normR;
	}
	// Normalize
    for (var i=0; i<this.nstates; i++) {
		this.R[i] = this.R[i]/normR;
	    this.R[i] = Math.round(this.R[i]*1000)/1000; // Round to 3 decimal places
    }	

	//---------------------------------------------------
	// Probability transition matrix and reward probabilities
	
	// Add transition matrix
    function addP(nstates,transA,random) {

       // Initialize probability transition matrix
	   P0 = [];
       // Loop through rows
       for (var i=0; i<nstates; i++) {
		   
	      // Initialize array
	      P0[i] = [];

   	      // Initialize normalizing constant
	      var runsum = 0;
	   
	      // Generate transition probabilities
	      for (var j=0; j<nstates; j++){
	      
		     // Initialize probaiblity transition
		     P0[i][j] = 0;

		     // Don't allow for self loops
		     if (i !== j ){
  	            P0[i][j] = random.gamma(transA,1);
	            runsum   = runsum + P0[i][j];
		     }
	      }

	      // Normalize
	      for (var j=0; j<nstates; j++){
	          P0[i][j] = P0[i][j]/runsum;
			  P0[i][j] = Math.round(P0[i][j]*1000)/1000; // Round to 3 decimal places

	      }
       }	
	   return  P0;
    }


	// Initialize probability transition matrices
	this.P      = [];
	checkvar    = {"avgpi" : [], "connected" : 0};
	while (checkvar.connected !== 1){
	   this.P[0]     = addP(this.nstates,this.transA,this.random);
       this.P[1]     = addP(this.nstates,this.transA,this.random);
	   checkvar      = this.check(this.P);
	}

	// Calculate normalization constant
	this.norm = 0;
	for (var i=0; i<this.nstates; i++) {
	  // Initialize reward probabilities
	   this.norm = this.norm + checkvar.avgpi[i]*this.R[i];
	}
	this.norm = Math.round(this.norm*1000)/1000; // Round to 3 decimal places
};

// Generate a new reward (binomial distribution)
MDP.prototype.reward = function(state) {

    // Binomial
	r = 0;
	for (i = 0; i < 10; i++){
		r = r + (this.random.uniform(0,1) < this.R[state] ? 1 : 0);
	}

	// Normalize
    r = Math.round(r/this.norm);

	if ((this.stage % 2) == 0){
		r = r - 40;
	}

   return  r;
};


// Generate a new state
MDP.prototype.transition = function(state,action) {

    // Running sum of probabilities
    runsum   = 0;

	// Generate random number
	u        = this.random.uniform(0,1);
	
	// Initialize new state
	newstate = -1;

	// Loop through possible new states
	for (i=0; i<this.nstates;i++) {

	  // Update cumulative probability
	  runsum = runsum+this.P[action][state][i];

	  // Set new state
	  if (newstate==-1 && u <= runsum) {
	     newstate = i;
	  }
	}
   return  newstate;
};


// Check connectedness of probabilty transition matrix
MDP.prototype.check = function(P) {
    // Threshold for connectedness
	var thresh    = 0.5/this.nstates;
	var steps     = 100;

	// Initialize
	var checkvar = { "avgpi" : [], "connected" : 1 };
	for (var j=0; j<this.nstates;j++){
	   checkvar.avgpi[j] = 0;
	}

    // Loop through rows
    for (var i=0; i<this.nstates; i++) {

	   // Initialize an array
	   pi = [];
	   for (var j=0; j<this.nstates;j++){
	      pi[j] = 0;
	   }
	   newpi = [];
	   pi[i] = 1;

	   // Apply matrix
	   for (var j=0; j<steps;j++){
	      // Initialize
		  newpi = [];
	      // Matrix multiply
	      for (var k=0; k<this.nstates;k++){
		     newpi[k] = 0;
		     for (var l=0; l<this.nstates;l++){
		        newpi[k] = newpi[k] + pi[l]*(P[0][l][k]*0.5 + P[1][l][k]*0.5);
			 }
		  }
		  pi = newpi;
	   }
	   
	   // Check for staes with small probability
	   for (var j=0; j<this.nstates;j++){
	      checkvar.avgpi[j] = checkvar.avgpi[j] + pi[j]/this.nstates;
	      if (pi[j] <= thresh){
		     checkvar.connected = 0;
	      }
	   }
	}

	return checkvar;
}

