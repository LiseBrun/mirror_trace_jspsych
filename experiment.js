// OVERVIEW -----------------------------------------------------------------------------
//
//
// dirty hack to lock scrolling ---------------------------------------------------------
// note that jquery needs to be loaded.
$('body').css({'overflow':'hidden'});
  $(document).bind('scroll',function () {
       window.scrollTo(0,0);
  });

var is_prolific = true;

// safari & ie exclusion ----------------------------------------------------------------
var is_safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var is_ie = /*@cc_on!@*/false || !!document.documentMode;

var is_compatible = !(is_safari || is_ie);


if(!is_compatible) {

    var safari_exclusion = {
        type: "html-keyboard-response",
        stimulus:
      "<p>Sorry, this study is not compatible with your browser.</p>" +
      "<p>Please try again with a compatible browser (e.g., Chrome or Firefox).</p>",
        choices: jsPsych.NO_KEYS
    };

    var timeline_safari = [];

    timeline_safari.push(safari_exclusion);
    jsPsych.init({timeline: timeline_safari});

}

// firebase initialization ---------------------------------------------------------------
  var firebase_config = {
    apiKey: "AIzaSyCXKGqJpbHaIoE_muaG1TSnKLunbF95eLg",
    databaseURL: "https://line-tracing-task-default-rtdb.firebaseio.com/"
  };

  firebase.initializeApp(firebase_config);
  var database = firebase.database();

  // id variables of 15 characters
  var jspsych_id = jsPsych.randomization.randomID(15)

  // Preload images
  var preloadimages = ['figures/p1e.png',
                       'media/vaast-background.png',
                       'media/keyboard-vaast-tgb3.png',
                       'stimuli/diamond_instructions.png',
                       'stimuli/square_instructions.png',
                       'background/1.jpg',
                       'background/2.jpg',
                       'background/3.jpg',
                       'stimuli/diamond.png',
                       'stimuli/square.png'];

  // connection status ---------------------------------------------------------------------
  // This section ensure that we don't lose data. Anytime the
  // client is disconnected, an alert appears onscreen
  var connectedRef = firebase.database().ref(".info/connected");
  var connection   = firebase.database().ref("VAAST_incidente/" + jspsych_id + "/")
  var dialog = undefined;
  var first_connection = true;

  connectedRef.on("value", function(snap) {
    if (snap.val() === true) {
      connection
        .push()
        .set({status: "connection",
              timestamp: firebase.database.ServerValue.TIMESTAMP})

      connection
        .push()
        .onDisconnect()
        .set({status: "disconnection",
              timestamp: firebase.database.ServerValue.TIMESTAMP})

    if(!first_connection) {
      dialog.modal('hide');
    }
    first_connection = false;
    } else {
      if(!first_connection) {
      dialog = bootbox.dialog({
          title: 'Connection lost',
          message: '<p><i class="fa fa-spin fa-spinner"></i> Please wait while we try to reconnect.</p>',
          closeButton: false
          });
    }
    }
  });

  // identifiation --------------------------------------------------------------
  // * prolific_pid: id from Prolific. By default, it is read from url.
  //                Participant can confirm this id or specify it during the
  //                experiment.
  var prolific_id = null;

  prolific_id = jsPsych.data.getURLVariable("PROLIFIC_PID") ?? jsPsych.data.getURLVariable("PROLIFIC_ID");
  // if (debug) {
  //   prolific_id = debug_pid;
  // }

  // abort experiment if prolific id does not exist.
  if (prolific_id == null) {

    var is_prolific = false;

    var error = {
      type: "html-keyboard-response",
      stimulus:
        "We cannot fetch your prolific id." +
        "<br>Please make sure you started the experiment from prolific." +
        "<br>If the error persists, please contact the person in charge of the study.",
      choices: jsPsych.NO_KEYS
      };

    var timeline_error = [error];
    jsPsych.init({timeline: timeline_error});
    }

// Define experimental conditions
var vaast_condition_approach = jsPsych.randomization.sampleWithoutReplacement(["approach_diamond", "approach_square"], 1)[0];


// counter variables
  var vaast_trial_n    = 1;
  var browser_events_n = 1;

// Variable input -----------------------------------------------------------------------
// Variable used to define experimental condition : approached geometric shape
// DEPRECATED: we now either retrive or define the experimental condition above
// var vaast_condition_approach = jsPsych.randomization.sampleWithoutReplacement(["approach_diamond", "approach_square"], 1)[0];

 // cursor helper functions
var hide_cursor = function() {
	document.querySelector('head').insertAdjacentHTML('beforeend', '<style id="cursor-toggle"> html { cursor: none; } </style>');
}
var show_cursor = function() {
	document.querySelector('#cursor-toggle').remove();
}

var hiding_cursor = {
    type: 'call-function',
    func: hide_cursor
}

var showing_cursor = {
    type: 'call-function',
    func: show_cursor
}

// Preload images in the VAAST
// Preload faces
  var stim_shapes = [
      "stimuli/diamond.png",
      "stimuli/square.png"
  ];

 preloadimages.push(stim_shapes);

// VAAST --------------------------------------------------------------------------------
// VAAST variables ----------------------------------------------------------------------
// Duplicate each variable to correspond to block 1 and block 2

var movement_diamond    = undefined;
var movement_square    = undefined;
var shape_to_approach = undefined;
var shape_to_avoid    = undefined;
var shapeimage_to_approach = undefined;
var shapeimage_to_avoid    = undefined;

switch(vaast_condition_approach) {
  case "approach_diamond":
    movement_diamond    = "approach";
    movement_square    = "avoidance";
    shape_to_approach = "diamonds";
    shape_to_avoid    = "squares";
    shapeimage_to_approach = 'stimuli/diamond_instructions.png';
    shapeimage_to_avoid    = 'stimuli/square_instructions.png';
    break;

  case "approach_square":
    movement_diamond    = "avoidance";
    movement_square    = "approach";
    shape_to_approach = "squares";
    shape_to_avoid   = "diamonds";
    shapeimage_to_approach = 'stimuli/square_instructions.png';
    shapeimage_to_avoid    = 'stimuli/diamond_instructions.png';
    break;
}

// VAAST stimuli ------------------------------------------------------------------------
// vaast prime and target stimuli -------------------------------------------------------

// training stimuli
var vaast_stim_training = [
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "crime"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "evil"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "slavery"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "punishment"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "terror"},

  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "pos", prime: "delirium"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "pos", prime: "glory"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "pos", prime: "honor"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "pos", prime: "reward"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "pos", prime: "success"},

  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neu", prime: "neutral_word1"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neu", prime: "neutral_word2"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neu", prime: "neutral_word3"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neu", prime: "neutral_word4"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neu", prime: "neutral_word5"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neu", prime: "neutral_word6"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neu", prime: "neutral_word7"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neu", prime: "neutral_word8"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neu", prime: "neutral_word9"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neu", prime: "neutral_word10"},


  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neg", prime: "crime"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neg", prime: "evil"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neg", prime: "slavery"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neg", prime: "punishment"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neg", prime: "terror"},

  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "delirium"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "glory"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "honor"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "reward"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "success"},

  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word1"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word2"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word3"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word4"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word5"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word6"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word7"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word8"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word9"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word10"}

]

// test stimuli
var vaast_stim_test = [
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "death"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "accident"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "attack"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "bomb"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "cancer"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "coffin"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "danger"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "divorce"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "pain"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "failure"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "war"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "disease"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "lost"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "murder"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "misery"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "dead"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "poison"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "suicide"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "tomb"},
  {movement: movement_diamond, shape: "diamonds", stimulus: 'stimuli/diamond.png', valence: "neg", prime: "torture"},

  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "birthday"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "baby"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "hapiness"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "gift"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "hug"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "party"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "humor"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "joy"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "peace"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "share"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "passion"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "beach"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "pleasure"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "relax"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "laugh"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "health"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "sun"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "smile"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "triumph"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "pos", prime: "holidays"},

  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word11"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word12"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word13"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word14"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word15"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word..."},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_diamond,  shape: "diamonds",  stimulus: 'stimuli/diamond.png',  valence: "neu", prime: "neutral_word"},


  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "death"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "accident"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "attack"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "bomb"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "cancer"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "coffin"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "danger"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "divorce"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "pain"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "failure"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "war"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "disease"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "lost"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "murder"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "misery"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "dead"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "poison"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "suicide"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "tomb"},
  {movement: movement_square, shape: "squares", stimulus: 'stimuli/square.png', valence: "neg", prime: "torture"},

  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "birthday"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "baby"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "hapiness"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "gift"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "hug"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "party"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "humor"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "joy"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "peace"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "share"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "passion"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "beach"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "pleasure"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "relax"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "laugh"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "health"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "sun"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "smile"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "triumph"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "pos", prime: "holidays"},

  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word11"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word12"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word13"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word14"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word15"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word..."},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"},
  {movement: movement_square,  shape: "squares",  stimulus: 'stimuli/square.png',  valence: "neu", prime: "neutral_word"}

]

// vaast background images --------------------------------------------------------------
var background = [
    "background/1.jpg",
    "background/2.jpg",
    "background/3.jpg",
    "background/4.jpg",
    "background/5.jpg",
    "background/6.jpg",
    "background/7.jpg"
];


// vaast stimuli sizes -------------------------------------------------------------------
 var stim_sizes = [
    34,
    38,
    42,
    46,
    52,
    60,
    70
  ];

  var resize_factor = 7;
  var image_sizes = stim_sizes.map(function(x) { return x * resize_factor; });

// Helper functions ---------------------------------------------------------------------
  // next_position():
  // Compute next position as function of current position and correct movement. Because
  // participant have to press the correct response key, it always shows the correct
  // position.
var next_position_training = function(){
  var current_position = jsPsych.data.getLastTrialData().values()[0].position;
  var current_movement = jsPsych.data.getLastTrialData().values()[0].movement;
  var position = current_position;

  if(current_movement == "approach") {
    position = position + 1;
  }

  if(current_movement == "avoidance") {
    position = position - 1;
  }

  return(position)
}

// Saving blocks ------------------------------------------------------------------------
// Every function here send the data to firebase.io. Because data sent is different
// according to trial type, there are differents function definition.

// init ---------------------------------------------------------------------------------
  var saving_id = function(){
     database
        .ref("participant_id_VAAST_incidente/")
        .push()
        .set({jspsych_id: jspsych_id,
              prolific_id: prolific_id,
               vaast_condition_approach: vaast_condition_approach,
               timestamp: firebase.database.ServerValue.TIMESTAMP})
  }

// vaast trial --------------------------------------------------------------------------
  var saving_vaast_trial = function(){
    database
      .ref("vaast_trial_incidente/").
      push()
        .set({jspsych_id: jspsych_id,
          prolific_id: prolific_id,
          vaast_condition_approach: vaast_condition_approach,
          timestamp: firebase.database.ServerValue.TIMESTAMP,
          vaast_trial_data: jsPsych.data.get().last(3).json()})
  }

// browser events -----------------------------------------------------------------------
  var saving_browser_events = function(completion) {
    database
     .ref("browser_event_VAAST_incidente/")
     .push()
     .set({jspsych_id: jspsych_id,
       prolific_id: prolific_id,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      vaast_condition_approach: vaast_condition_approach,
      completion: completion,
      event_data: jsPsych.data.getInteractionData().json()})
  }

// attentional check logging ------------------------------------------------------------
  var saving_attention = function() {
    database
     .ref("attention_info_VAAST_incidente/")
     .push()
     .set({jspsych_id: jspsych_id,
         prolific_id: prolific_id,
         timestamp: firebase.database.ServerValue.TIMESTAMP,
         attention_data: jsPsych.data.get().last(1).json(),
        })
  }


// demographic logging ------------------------------------------------------------------
  var saving_extra = function() {
    database
     .ref("extra_info_VAAST_incidente/")
     .push()
     .set({jspsych_id: jspsych_id,
         prolific_id: prolific_id,
         timestamp: firebase.database.ServerValue.TIMESTAMP,
         // edit last(1) if you have to save several extra informations
         extra_data: jsPsych.data.get().last(4).json(),
        })
  }


// saving blocks ------------------------------------------------------------------------
var save_id = {
    type: 'call-function',
    func: saving_id
}

var save_vaast_trial = {
    type: 'call-function',
    func: saving_vaast_trial
}

var save_attention = {
    type: 'call-function',
    func: saving_attention
}

var save_extra = {
    type: 'call-function',
    func: saving_extra
}


// EXPERIMENT ---------------------------------------------------------------------------

// initial instructions -----------------------------------------------------------------
var welcome = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Welcome </h1>" +
    "<ul class='instructions'>" +
    "In this study, you will <b>complete a task named the 'Video Game task'</b>. Note that we " +
    "will not collect any personally identifying information and that you can leave the experiment " +
    "at any moment. If you complete the experiment until the end, you will be retributed as stated on Prolific. " +
    "<b>If you decide to start this study, it means that you give your free and informed consent to participate. </b>" +
    "<br>" +
    "<br>" +
    "Because we rely on third party services to gather data, ad-blocking " +
    "software might interfere with data collection. Therefore, please  " +
    "disable your ad-blocking software during this study. " +
    "<b>If we are unable to record your data, we will not be able to reward you for " +
    "your participation</b>. " +
    "<br>If you have any question related to this research, please " +
    "e-mail yoannjulliard38@gmail.com. </ul>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to start the study.</p>",
  choices: [32]
};

// Switching to fullscreen --------------------------------------------------------------
var fullscreen_trial = {
  type: 'fullscreen',
  message: 'To start the study, please switch to fullscreen </br></br>',
  button_label: 'Switch to fullscreen',
  fullscreen_mode: true
};


// VAAST --------------------------------------------------------------------------------
var vaast_instructions_1 = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>In this task, just like in a video game, you " +
    "will find yourself in the environment presented below." +
    "<p class='instructions'> You will be able to move forward and backward " +
    "using your keyboard keys.</p>" +
    "<p class='instructions'>Note that your complete attention is critical for this task " +
    "(to ensure this, we may have added attentional check during the experiment)." +
    "<br>Note also that we monitor the time spent during the experiment and that " +
    "we will not accept submission for which the time to complete the study is unrealistic.</p>" +
    "<img src = 'media/vaast-background.png'>" +
    "<br><br>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to " +
    "continue.</p>",
  choices: [32]
};

var attention_check = {
  type: 'survey-text',
  data: {trial: "attention_check"},
  preamble: "<p class ='instructions'>When asked for your favorite color, please enter the word baguette in the box below.</p>",
  questions: [{
    prompt: "<p class='instructions'>Based on the text above, what is your favorite color?</p>"
  }],
  button_label: "Submit",
};

var vaast_instructions_2 = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>A series of geometric shapes (squares or diamonds) will be displayed in this environment.</p>" +
    "<p class='instructions'>Your task will be to move forward or backward according to these geometric shapes as fast as possible.</p>" +
    "<p class='instructions'>More precise instructions will follow.</p>" +
    "<img src = 'media/vaast-background.png'>" +
    "<br><br>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to" +
    " continue.</p>",
  choices: [32]
};

var vaast_instructions_2_bis_vaast = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>To move forward or backward, you will use the following keys of your keyboard:" +
    "<br>" +
    "<img src = 'media/keyboard-vaast-tgb3.png'>" +
    "<br></p>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to " +
    "continue.</p>",
  choices: [32]
};

var vaast_instructions_3 = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>At the beginning of each trial, you will see the 'O' symbol. " +
    "This symbol indicates that you have to press the START key (namely, the <b>G key</b>) to start the trial. </p>" +
    "<p class='instructions'>Then, you will see a fixation cross (+) at the center of the screen, followed by a word, and then by a geometric shape. </p>" +
    "<p class='instructions'><b>Your task is to ignore the word and to move forward or backward depending on the geometric shape</b>." +
    "<br>To move forward or backward, use the MOVE FORWARD key (namely, the <b>T key</b>) " +
    "or the MOVE BACKWARD key (namely, the <b>B key</b>)." +
    "<br> Once the geometric shape has disappeared, press again the START key (namely, the <b>G key</b>). " +
    "<p class='instructions'>Please <b>use only the index of your preferred hand</b> for all these actions. </p>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to" +
    " continue.</p>",
  choices: [32]
};

var vaast_instructions_4 = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>More precise instructions are displayed below. Your task is to:" +
    "<ul class='instructions'>" +
        "<table>" +
      "<tr>" +
      "</tr>" +
      "<tr>" +
        "<td><img src = "+ shapeimage_to_approach + "   ></td>" +
        "<td align='left'>APPROACH " + shape_to_approach + " by pressing the MOVE FORWARD key (namely, the <b>T key</b>)</td>" +
      "</tr>" +
      "<tr>" +
        "<td><img src = "+ shapeimage_to_avoid + "   ></td>" +
        "<td align='left'>AVOID " + shape_to_avoid + " by pressing the MOVE BACKWARD key (namely, the <b>B key</b>)</td>" +
      "</tr>" +
    "</table>" +
    "<br>" +
    "<p class='instructions'>Please read carefully and make sure that you memorize the instructions above. </p>" +
    "<p class='instructions'><strong>Also, note that it is EXTREMELY IMPORTANT THAT YOU TRY TO BE AS FAST AND ACCURATE AS YOU CAN. </strong>" +
    "<br>A red cross will appear if your response is incorrect.</p>" +
    "<p class='instructions'><b>Now, let's start with a training!</b></p>"+
    "<p class = 'continue-instructions'>Press <strong>ENTER</strong> to " +
    "start the training.</p>",
  choices: [13]
};

var vaast_instructions_5 = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>The training is over. Now, you will start the real task " +
    "(note that this task will take about <b>10 minutes</b> to complete).</p>" +
    "<p class='instructions'>Instructions stay the same:" +
    "<ul class='instructions'>" +
        "<table>" +
      "<tr>" +
      "</tr>" +
      "<tr>" +
        "<td><img src = "+ shapeimage_to_approach + "   ></td>" +
        "<td align='left'>APPROACH " + shape_to_approach + " by pressing the MOVE FORWARD key (namely, the <b>T key</b>)</td>" +
      "</tr>" +
      "<tr>" +
        "<td><img src = "+ shapeimage_to_avoid + "   ></td>" +
        "<td align='left'>AVOID " + shape_to_avoid + " by pressing the MOVE BACKWARD key (namely, the <b>B key</b>)</td>" +
      "</tr>" +
    "</table>" +
    "<br>" +
    "<p class='instructions'>Do not forget to be <b>as fast and accurate as you can</b> and to <b>use only the index of your preferred hand</b>.</p>" +
    "<p class = 'continue-instructions'>Press <strong>ENTER</strong> to " +
    "start the task.</p>",
  choices: [13]
};

var vaast_instructions_end = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game Task</h1>" +
    "<p class='instructions'>The Video Game task is now completed.</p>" +
    "<p class='instructions'>We will now ask you some demographic questions.</p>" +
    "<p class='instructions'>Please exit the fullscreen mode by pressing <b>space</b> to continue.</p>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to " +
    "continue.</p>",
  choices: [32]
};

var fullscreen_exit_trial = {
  type: 'fullscreen',
  fullscreen_mode: false
};

var extra_information_1 = {
 timeline: [{
   type: 'survey-text',
   questions: [{prompt: "How old are you?"}],
   button_label: "confirm",
 }],
 loop_function: function(data) {
   var extra_information_2 = data.values()[0].responses;
   var extra_information_2 = JSON.parse(extra_information_2).Q0;
   if (extra_information_2 == "") {
     alert("Please indicate your age!");
     return true;
   }
 },
 on_finish: function(data) {
   jsPsych.data.addProperties({
     extra_information_2: JSON.parse(data.responses)["Q0"],
   });
 }
}

var extra_information_2 = {
 type: 'survey-multi-choice',
 questions: [{prompt: "Please indicate your sex:", options: ["&nbspMale", "&nbspFemale", "&nbspOther"], required: true, horizontal: true}],
 button_label: "confirm"
}

var extra_information_3 = {
 type: 'survey-multi-choice',
 questions: [{prompt: "How well do you speak english?",
              options: ["&nbspFluently", "&nbspVery well", "&nbspWell", "&nbspAverage", "&nbspBadly", "&nbspVery badly"],
              required: true, horizontal: false}],
 button_label: "confirm"
}

  var extra_information_4 = {
    type: 'survey-text',
    questions: [{prompt: "Do you have comments regarding this study? [Optional]"}],
    button_label: "confirm"
  }

  var ending = {
    type: "html-keyboard-response",
    stimulus:
      "<h1 class ='custom-title'>This study is over.</h1>" +
      "<p class='instructions'>We thank you for participating in this study.</p>" +
      "<p class='instructions'>In this study, we were interested in how fast individuals perform approach and avoidance actions when primed with a pleasant or an unpleasant word. " +
      "Specifically, you had to approach/avoid geometric shapes but before it appeared, we briefly displayed a pleasant/unpleasant word. " +
      "We expected this word to impact the latency of you responses: You should have been faster to make an approach action after a pleasant word and an avoidance action after an unpleasant word (rather than the other way around). </p>" +
      "<p class='instructions'> If you have any questions / remarks regarding this experiment, please contact us at: </br>yoannjulliard38@gmail.com</br></p>" +
      "<p class='instructions'>You can now press <b>SPACE</b> to be redirected to Prolific</p>",
    choices: [32]
  };


// Creating a trial ---------------------------------------------------------------------
// Note: vaast_start trial is a dirty hack which uses a regular vaast trial. The correct
// movement is approach and the key corresponding to approach is "d", thus making the
// participant press "d" to start the trial.
// vaast-prime and vaast-blank are also dirty hacks, which uses a regular vaas trial.
// There is no correct answer, just a display time with no response expected.

// Once again, everything is duplicated, to correspond to the two blocks of the
// vaast, trials and procedures, training comprised.

var vaast_start = {
  type: 'vaast-text',
  stimulus: "o",
  position: 2,
  background_images: background,
  font_sizes:  stim_sizes,
  approach_key: "g",
  stim_movement: "approach",
  html_when_wrong: '<span style="color: red; font-size: 80px">&times;</span>',
  force_correct_key_press: true,
  display_feedback: true,
  response_ends_trial: true
}

var vaast_fixation = {
  type: 'vaast-fixation',
  fixation: "+",
  font_size: 46,
  position: 2,
  background_images: background
}

var vaast_prime = {
  type: 'vaast-text',
  stimulus: "prime",
  stimulus: jsPsych.timelineVariable('prime'),
  position: 2,
  background_images: background,
  font_sizes:  stim_sizes,
  //stim_movement: jsPsych.timelineVariable('movement'),
  response_ends_trial: false,
  trial_duration: 200
}

var vaast_blank = {
  type: 'vaast-text',
  stimulus: " ",
  stimulus: jsPsych.timelineVariable('prime'),
  position: 2,
  background_images: background,
  font_sizes:  stim_sizes,
  //stim_movement: jsPsych.timelineVariable('movement'),
  response_ends_trial: false,
  trial_duration: 100
}

var vaast_first_step_training_1 = {
  type: 'vaast-image',
  stimulus: jsPsych.timelineVariable('stimulus'),
  position: 2,
  background_images: background,
  font_sizes:  image_sizes,
  approach_key: "t",
  avoidance_key: "b",
  stim_movement: jsPsych.timelineVariable('movement'),
  html_when_wrong: '<span style="color: red; font-size: 80px">&times;</span>',
  force_correct_key_press: true,
  display_feedback: true,
  response_ends_trial: true
}

var vaast_second_step_training_1 = {
  type: 'vaast-image',
  stimulus: jsPsych.timelineVariable('stimulus'),
  position: next_position_training,
  background_images: background,
  font_sizes:  image_sizes,
  stim_movement: jsPsych.timelineVariable('movement'),
  response_ends_trial: false,
  trial_duration: 650
}


// VAAST training block -----------------------------------------------------------------

var vaast_training_block = {
  timeline: [
    vaast_start,
    vaast_fixation,
    vaast_prime,
    vaast_blank,
    vaast_first_step_training_1,
    vaast_second_step_training_1,
    save_vaast_trial
  ],
  timeline_variables: vaast_stim_training,
  repetitions: 1, //1 = 40 trials,
  randomize_order: true,
  data: {
    phase:    "training",
    valence: jsPsych.timelineVariable('valence'),
    prime: jsPsych.timelineVariable('prime'),
    shape: jsPsych.timelineVariable('shape'),
    stimulus: jsPsych.timelineVariable('stimulus'),
    movement: jsPsych.timelineVariable('movement'),
  }
};

var vaast_test_block = {
  timeline: [
    vaast_start,
    vaast_fixation,
    vaast_prime,
    vaast_blank,
    vaast_first_step_training_1,
    vaast_second_step_training_1,
    save_vaast_trial
  ],
  timeline_variables: vaast_stim_test,
  repetitions: 1, //1 = 160 trials
  randomize_order: true,
  data: {
    phase:    "test",
    valence: jsPsych.timelineVariable('valence'),
    prime: jsPsych.timelineVariable('prime'),
    shape: jsPsych.timelineVariable('shape'),
    stimulus: jsPsych.timelineVariable('stimulus'),
    movement: jsPsych.timelineVariable('movement'),
  }
};


// end fullscreen -----------------------------------------------------------------------
var fullscreen_trial_exit = {
  type: 'fullscreen',
  fullscreen_mode: false
}


// procedure ----------------------------------------------------------------------------
// Initialize timeline ------------------------------------------------------------------

var timeline = [];

// fullscreen
timeline.push(welcome,
              fullscreen_trial,
          		hiding_cursor);

// prolific verification
timeline.push(save_id);

// vaast
    timeline.push(vaast_instructions_1,
                  vaast_instructions_2,
                  vaast_instructions_2_bis_vaast,
                  vaast_instructions_3,
                  showing_cursor,
                  attention_check,
                  save_attention,
                  hiding_cursor,
                  vaast_instructions_4,
                  vaast_training_block,
                  vaast_instructions_5,
                  vaast_test_block,
                  vaast_instructions_end,
                  fullscreen_exit_trial);

 // demographic questions
  timeline.push(showing_cursor,
                extra_information_1,
                extra_information_2,
                extra_information_3,
                extra_information_4,
                save_extra);

  // ending
  timeline.push(ending);

// Launch experiment --------------------------------------------------------------------
// preloading ---------------------------------------------------------------------------
// Preloading. For some reason, it appears auto-preloading fails, so using it manually.
// In principle, it should have ended when participants starts VAAST procedure (which)
// contains most of the image that have to be pre-loaded.
var loading_gif               = ["media/loading.gif"]
var vaast_instructions_images = ["media/vaast-background.png", "media/keyboard-vaastt.png"];
var vaast_bg_filename         = background;

jsPsych.pluginAPI.preloadImages(loading_gif);
jsPsych.pluginAPI.preloadImages(vaast_instructions_images);
jsPsych.pluginAPI.preloadImages(vaast_bg_filename);

// timeline initiaization ---------------------------------------------------------------

if(is_compatible & is_prolific) {
  jsPsych.init({
      timeline: timeline,
      preload_images: preloadimages,
      max_load_time: 1000 * 500,
      exclusions: {
            min_width: 800,
            min_height: 600,
        },
      on_interaction_data_update: function() {
        saving_browser_events(completion = false);
      },
    on_finish: function() {
        saving_browser_events(completion = true);
        window.location.href = "https://app.prolific.co/submissions/complete?cc=your-completion-code";
    }
  });
}
