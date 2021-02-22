/**************************************************************
* VAAST implementation in jsPsych. 
* (fixation trial)
*
*
*                   (cedric.batailler@univ-grenoble-alpes.fr)
***************************************************************/


 jsPsych.plugins['vaast-fixation'] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('vaast-image', 'background_image', 'image');

  plugin.info = {
    name: 'vaast-fixation',
    description: '',
    parameters: {
      fixation: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Stimulus',
        default: '+',
        description: 'The string to be displayed as fixation.'
      },
      font_size: {
        type: jsPsych.plugins.parameterType.INTEGER,
        pretty_name: 'Font size',
        default: 200,
        description: 'Font size of the text stimulus.'
      },
      min_duration: {
        type: jsPsych.plugins.parameterType.INTEGER,
        pretty_name: 'Minimal duration',
        default: 800,
        description: 'Minimal duration (in ms).'
      },
      max_duration: {
        type: jsPsych.plugins.parameterType.INTEGER,
        pretty_name: 'Maximal duration',
        default: 2000,
        description: 'Maximal duration (in ms).'
      },
      position: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Initial position',
        default: 3,
        description: 'The position in the "background_images" array which will be used to set the background.'
      },
      background_images: {
        type: jsPsych.plugins.parameterType.ARRAY,
        pretty_name: 'Background',
        default: undefined,
        description: 'Array with the images displayed as background as function of the position.'
      }
    }
  }


  plugin.trial = function(display_element, trial) {
    // Randomly selecting duration 
    var duration_range = trial.max_duration- trial.min_duration;
    var duration = Math.random() * duration_range + trial.min_duration;

    // Affichage du stimulus
    var html_str = "";
    
    html_str += "<div style='position:absolute;right:0;top:0;width:100%; height:100%;background:url("+trial.background_images[trial.position]+") center no-repeat;z-index:-1; background-color:#000000'></div>";
    html_str += "<div style='height: 100vh; display: flex; justify-content: center; align-items: center;z-index:1; color: #ffffff; font-size: "+trial.font_size+"px' id='jspsych-iat-stim'>"+trial.fixation+"</div>";

    display_element.innerHTML = html_str;


    // function to end trial when it is time
    var end_trial = function() {


      // gather the data to store for the trial
      var trial_data = {
        "duration": duration,
      };

      // clears the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

    // end trial if time limit is set
    jsPsych.pluginAPI.setTimeout(function() {
      end_trial();
    }, duration);

  };

  return plugin;
})();
