//for this script, mirror = false
//for this script, tracing = color

var materials = {
		'mirror' : [false],
		'file_names' : [
			  "https://raw.githubusercontent.com/LiseBrun/mirror_trace/master/figures/s0e.png",
			],

			//							 0												5												 10												15											  20											25											 30												35											 40
		 			'xstarts' : [57],
		 			'ystarts' : [146],
		 			'xends' :   [358],
		 			'yends' :   [146]
		 	}


	//image dimensions
	var mywidth = 393;
	var myheight = 295;

	var score = 0;
	var timeDiff = 0;
	var trialnumber = 0;
	var MID = 0;
	var drawing = false;
	var finished = false;
	var timeFinished = 0;
	var canvas;
	var ctx;
	var canvas_mirror;
	var ctx_mirror;
	var crossings = 0;
	var distance_total = 0;
	var distance_current = 0;
	var distance_inline = 0;
	var distance_offline = 0;
	var startTime = 0;
	var endTime = 0;
	var lastRefresh = 0;
	var currentRefresh = 0;

function line_tracing() {
	//load materials
	var imagePath = materials.file_names[trialnumber];
	mirror = materials.mirror[trialnumber];
	var xstart = materials.xstarts[trialnumber];
	var ystart = materials.ystarts[trialnumber];;
	var startRadius = 15;
	var xend = materials.xends[trialnumber];
	var yend = materials.yends[trialnumber];
	var endRadius = 10;


	//states to track
	drawing = false;
	finished = false;
	score = 0;
	timeDiff = 0;
	timeFinished = 0;
	var inline = false;
	crossings = 0;
	distance_total = 0;
	distance_current = 0;
	distance_inline = 0;
	distance_offline = 0;
	startTime = 0;
	endTime = 0;
	lastRefresh = 0;
	currentRefresh = 0;

	//drawing contexts for cursor area and mirrored area
	canvas = document.querySelector('#paint');
	ctx = canvas.getContext('2d');
	canvas_mirror = document.querySelector('#mirror');
	ctx_mirror = canvas_mirror.getContext('2d');


  //remove the mouse cursor display
	//canvas.style.cursor = 'none';

	//load the image to trace
	var imageObj = new Image();
      imageObj.onload = function() {
     ctx_mirror.drawImage(imageObj, 0, 0, mywidth, myheight);
	   ctx_mirror.globalAlpha=0.4;
	   ctx.globalAlpha=0.4;

  //Beginning of trial
	   ctx.beginPath();
	    if (mirror) {
			ctx.arc(xstart, ystart, startRadius, 0, 2 * Math.PI, false);
		} else {
			ctx.arc(xstart, ystart, startRadius, 0, 2 * Math.PI, false);
		}
	   ctx.fillStyle = 'green';
	   ctx.fill();
	   ctx_mirror.globalAlpha=1;
	   ctx.globalAlpha=1;
	   document.getElementById("status").innerHTML = "Cliquez sur le cercle vert pour commencer cet essai";
    };
	imageObj.crossOrigin="anonymous";
    imageObj.src=imagePath;


	//defines data structure for mouse movement
	var mouse = {x: 0, y: 0};
  var mouseold = {x: 0, y: 0};

	/* Drawing on Paint App */
	// Width (largeur) of line
	ctx_mirror.lineWidth = 0.5;
	ctx_mirror.lineJoin = 'round';
	ctx_mirror.lineCap = 'round';
	ctx_mirror.strokeStyle = 'blue';

	/* Mouse Capturing Work */
	canvas.addEventListener('mousemove', function(e) {
	    //get mouse coordinates
		mouse.x = e.pageX - this.offsetLeft;
		mouse.y = e.pageY - this.offsetTop;

		//update status
		var pos = betterPos(canvas, e);
		//var pos = findPos(this);
                //var x = e.pageX - pos.x;
                //var y = e.pageY - pos.y;
		var x = pos.x;
		var y = pos.y;
		mouse.x = x;
		mouse.y = y;

		//document.getElementById("status").innerHTML = "x = " + x + " y = " + y + " mousex = " + mouse.x + " mousey = " + mouse.y;

		 if (mirror) {
			var coord = "x=" +  (mywidth-x) + ", y=" + (myheight-y);
		} else {
			var coord = "x=" +  (x) + ", y=" + (y);
		}

		if (mirror) {
                      var p = ctx_mirror.getImageData(mywidth-mouse.x, myheight-mouse.y, 1, 1).data;
		} else {
		      var p = ctx_mirror.getImageData(mouse.x, mouse.y, 1, 1).data;
		}
                var hex = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6);

		 var cendRadius = Math.sqrt(Math.pow(mouse.x - xend, 2) + Math.pow(mouse.y-yend, 2));

		 if (cendRadius < endRadius) {
		  if (drawing) {
			drawing = false;
			finished = true;
			if (saveTrace) {
				saveCanvas();
				//call save function
			}
		  }
		}


		 //do drawing if in drawing mode
		 if(drawing) {

		    if (mouseold.x - mouse.x + mouseold.y - mouse.y != 0) {
				distance_current = Math.sqrt(  Math.pow(mouseold.x - mouse.x, 2) + Math.pow(mouseold.y - mouse.y, 2) )
			} else {
				distance_current = 0;
			}

			//check to see where we are drawing
			if (p[0]+p[1]+p[2] < 200) {
				if(inline) {
					distance_inline = distance_inline + distance_current;
				} else {
					inline = true;
					crossings = crossings+ 1;
					distance_inline = distance_inline + (0.5*distance_current);
					distance_offline = distance_offline + (0.5*distance_current);
					ctx_mirror.beginPath();
					if(mirror) {
						ctx_mirror.moveTo(mywidth-mouse.x, myheight-mouse.y);
					} else {
						ctx_mirror.moveTo(mouse.x, mouse.y);
					}
				}
			}  else {
				if(inline) {
					inline = false;
					crossings = crossings + 1;
					distance_inline = distance_inline + (0.5*distance_current);
					distance_offline = distance_offline + (0.5*distance_current);
					ctx_mirror.beginPath();
					if(mirror) {
						ctx_mirror.moveTo(mywidth-mouse.x, myheight-mouse.y);
					} else {
						ctx_mirror.moveTo(mouse.x, mouse.y);
					}
				} else {
					distance_offline = distance_offline + distance_current;
				}
			}

			//distance_total = distance_total + distance_current;
			// old score calculation
			// score = distance_inline / distance_total;
			//
			score = distance_inline / (distance_offline + distance_inline);
			// score = distance_current;
			endTime = new Date();
			timeDiff = (endTime - startTime)/1000;

			// //trace in transparent
			// if (inline) {
			// 	ctx_mirror.strokeStyle = '#ffffff00';
			// } else {
			// 	ctx_mirror.strokeStyle = '#ffffff00';
			// }

			//trace in color
			if (inline) {
				ctx_mirror.strokeStyle = 'red';
			} else {
				ctx_mirror.strokeStyle = 'red';
			}

			if (mirror) {
				ctx_mirror.lineTo(mywidth-mouse.x, myheight-mouse.y);
			} else {
				ctx_mirror.lineTo(mouse.x, mouse.y);
			}
			ctx_mirror.stroke();
			//remove score display during task :
			//document.getElementById("status").innerHTML = "Score = " + Math.round(score *100) +"% ";
			//document.getElementById("status").innerHTML = "Rejoignez le cercle rouge en restant le plus possible sur les lignes de la figure."
			//document.getElementByID("status").innerHTML = p[0]+p[1]+p[2];

		} else {
		    if(!finished) {
			currentRefresh = new Date();
			if (currentRefresh - lastRefresh > (1000/30) ) {
				ctx_mirror.drawImage(imageObj, 0, 0, mywidth, myheight);

				ctx_mirror.fillStyle = 'green';
				ctx_mirror.globalAlpha=0.4;
				//ctx_mirror.beginPath();
	            if (mirror) {
				//	ctx_mirror.arc(mywidth - xstart, myheight - ystart, startRadius, 0, 2 * Math.PI, false);
				} else {
				//	ctx_mirror.arc(xstart, ystart, startRadius, 0, 2 * Math.PI, false);
				}
	           // ctx_mirror.fill();
				ctx_mirror.globalAlpha=1

				ctx_mirror.beginPath();
				if (mirror) {
					ctx_mirror.arc(mywidth-mouse.x, myheight-mouse.y, 4, 0, 2 * Math.PI, false);
				} else {
					ctx_mirror.arc(mouse.x, mouse.y, 4, 0, 2 * Math.PI, false);
				}
				ctx_mirror.fillStyle = 'green';
				ctx_mirror.fill();
				lastRefresh = currentRefresh
				document.getElementById("status").innerHTML = "Cliquez sur le cercle vert pour commencer";
			}
			} else {
				//remove score display at the end of the task:
				//document.getElementById("status").innerHTML = "Finished with score = " + Math.round(score *100) + "%<BR> Click next to continue.";
				//display "you have finished the task"
				document.getElementById("status").innerHTML = "Vous avez terminé cet essai. Cliquez sur la flèche bleue en bas à droite pour continuer.";
			}
		}


		 //store current coordinates
		 mouseold.x = mouse.x;
		 mouseold.y = mouse.y;

	}, false);



	canvas.addEventListener('mousedown', function(e) {
	        var currentRadius = Math.sqrt(Math.pow(mouse.x - xstart, 2) + Math.pow(mouse.y-ystart, 2));

	      if(!finished) {
				if (drawing) {
					//drawing = false;
					//finished = true;
					//if (saveTrace) {
					//	saveCanvas();
						//call save function
						//savecanvas(canvas_mirror.toDataURL())
					//}

				} else {
				    if (currentRadius < startRadius) {
					    ctx.clearRect(0, 0, canvas.width, canvas.height);
						ctx_mirror.drawImage(imageObj, 0, 0, mywidth, myheight);
						ctx_mirror.fillStyle = 'red';
						ctx_mirror.globalAlpha=0.4;
						ctx_mirror.beginPath();
						if (mirror) {
							ctx_mirror.arc(mywidth - xend, myheight - yend, endRadius, 0, 2 * Math.PI, false);
						} else {
							ctx_mirror.arc(xend, yend, endRadius, 0, 2 * Math.PI, false);
						}
						 ctx_mirror.fill();
						ctx_mirror.globalAlpha=1

						drawing = true;
						finished = false;
						startTime = new Date();
						ctx_mirror.beginPath();
						canvas.style.cursor = 'none';
						document.getElementById("status").innerHTML = "Rejoignez le cercle rouge en restant le plus possible sur les lignes de la figure."
						if (mirror) {
							ctx_mirror.moveTo(mywidth-mouse.x, myheight-mouse.y);
						} else {
							ctx_mirror.moveTo(mouse.x, mouse.y);
						}
					}
				}
			}

	}, false);

	var onPaint = function() {
			if(mirror) {
			ctx_mirror.lineTo(mywidth-mouse.x, myheight-mouse.y);
			} else {
			ctx_mirror.lineTo(mouse.x, mouse.y);
			}
			ctx_mirror.stroke();
	};

function betterPos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

function findPos(obj) {
    var curleft = 0, curtop = 0;
    //document.getElementById("status").innerHTML = "Find pos: ";

    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
            document.getElementById("status").innerHTML += obj.id + " Left: " + obj.offsetLeft + "Top: " + obj.offsetTop + " / ";
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop };
    }
    return undefined;
}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

}
