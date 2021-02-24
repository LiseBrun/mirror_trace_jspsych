// LINE TRACING TASK --------------------------------------------------------------------
//
// https://linetracingtask.netlify.app/?PROLIFIC_PID=test
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
  // var preloadimages = ['figures/s0e.png',
  //                      'figures/s0h.png'];

  // connection status ---------------------------------------------------------------------
  // This section ensure that we don't lose data. Anytime the
  // client is disconnected, an alert appears onscreen
  var connectedRef = firebase.database().ref(".info/connected");
  var connection   = firebase.database().ref("line_tracing/" + jspsych_id + "/")
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

    // counter variables
      var trial_n    = 1;
      var browser_events_n = 1;

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

// Saving blocks ------------------------------------------------------------------------
// Every function here send the data to firebase.io. Because data sent is different
// according to trial type, there are differents function definition.

// init ---------------------------------------------------------------------------------
  var saving_id = function(){
     database
        .ref("participant_id")
        .push()
        .set({jspsych_id: jspsych_id,
              prolific_id: prolific_id,
               timestamp: firebase.database.ServerValue.TIMESTAMP})
  }

// line tracing task trial --------------------------------------------------------------------------
  var saving_trial = function(){
    database
      .ref("trial").
      push()
        .set({jspsych_id: jspsych_id,
          prolific_id: prolific_id,
          timestamp: firebase.database.ServerValue.TIMESTAMP,
          trial: jsPsych.data.get().last(3).json()})
  }

// browser events -----------------------------------------------------------------------
  var saving_browser_events = function(completion) {
    database
     .ref("browser_event")
     .push()
     .set({jspsych_id: jspsych_id,
       prolific_id: prolific_id,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      completion: completion,
      event_data: jsPsych.data.getInteractionData().json()})
  }


// demographic logging ------------------------------------------------------------------
  var saving_extra = function() {
    database
     .ref("extra_info")
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

var save_trial = {
    type: 'call-function',
    func: saving_trial
}

var save_extra = {
    type: 'call-function',
    func: saving_extra
}


// EXPERIMENT ---------------------------------------------------------------------------

// Welcome -----------------------------------------------------------------
var welcome = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Welcome </h1>" +
    "<ul class='instructions'>" +
    "In this study, you will <b>complete a task named the 'Line tracing task'</b>. Note that we " +
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
    "e-mail brun.lise26@hotmail.fr. </ul>" +
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


// Instructions --------------------------------------------------------------------------------
var instructions_1 = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Line tracing task</h1>" +
    "<p class='instructions'>In this task, you will have to reproduce</p>" +
    "<p a figure with your mouse. In each trial, you will see two rectangular panels:</p>"+
    "<p the drawing panel is at the bottom; this is where you will move the mouse cursor;</p>" +
    "<p the mirror panel is at the top, this will record your mouse movements</p>" +
    "<p as you try to trace the figure.</p>" +
    "<p class='instructions'>Note that your complete attention is critical for this task " +
    "<br>Note also that we monitor the time spent during the experiment and that " +
    "we will not accept submission for which the time to complete the study is unrealistic.</p>" +
    "<br><br>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to " +
    "continue.</p>",
  choices: [32]
};

var instructions_2 = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Line Tracing task</h1>" +
    "<p class='instructions'>To begin a trial, move the mouse so that your</p>" +
    "<p cursor rests over the green circle in the drawing panel and</p>" +
    "<p then click the left mouse button to signal that you are ready to begin.</p>" +
    "<p Once the trial begins, a red target circle appears in the mirror panel.</p>" +
    "<p Trace the figure working from the starting point towards the red target circle.</p>" +
    "<p The trial ends automatically when you reach the red circle.</p>" +
    "<br><br>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to" +
    " continue.</p>",
  choices: [32]
};

var instructions_end = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Line Tracing Task</h1>" +
    "<p class='instructions'>The Line Tracing task is now completed.</p>" +
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
      "<p class='instructions'> If you have any questions / remarks regarding this experiment, please contact us at: </br>brun.lise26@hotmail.com</br></p>" +
      "<p class='instructions'>You can now press <b>SPACE</b> to be redirected to Prolific</p>",
    choices: [32]
  };


// end fullscreen -----------------------------------------------------------------------
var fullscreen_trial_exit = {
  type: 'fullscreen',
  fullscreen_mode: false
}

// Line tracing task -------------------------------------------------------------------------





// procedure ----------------------------------------------------------------------------
// Initialize timeline ------------------------------------------------------------------

var timeline = [];

// fullscreen
timeline.push(welcome,
              fullscreen_trial);

// prolific verification
timeline.push(save_id);

// line tracing task
timeline.push(instructions_1,
              instructions_2,
              // line_tracing,
              // save_trial,
              instructions_end,
              fullscreen_exit_trial);

 // demographic questions
  timeline.push(extra_information_1,
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

  jsPsych.pluginAPI.preloadImages(loading_gif);

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
