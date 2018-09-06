var wordVec;

var model;
var canvas;
var classNames = [];
var coords = [];
var mousePressed = false;
var help_text = document.getElementById("guess-text");
var confirm_button = document.getElementById("confirm-help");
var model_raw_data;
var guess_word;

function getRawData(className) {
    startLoading();
    console.log("ajax called");
    $.ajax({
        dataType: "json",
        url: "https://s3.ap-northeast-2.amazonaws.com/elice-project-drawsomething/"+ className +".vae.json",
    }).done(function(data){
        model_raw_data = JSON.stringify(data);
        console.log("Data obtained");
        setup();
    });
}

$.get("https://s3.ap-northeast-2.amazonaws.com/elice-project-drawsomething/word2vec.json", function(data, status){
  wordVec = data;
});

function word2vec(word){
    var idx = wordVec.findIndex((item,idx) => {return item[0] === word});
    var random = Math.floor((Math.random() * 10)) % 3;
    if(typeof wordVec[idx+random] == 'undefined') {
        help_text.textContent = "Sorry... I'm not catching you. Could you draw again?";
        confirm_button.style.display = "none";
    } else {
        console.log(wordVec[idx+random][1]);
        guess_word = wordVec[idx+random][1];
        confirm_button.style.display = "inline-block";
    }
}

$(document).ready(function() {
    $(".reset-canvas").click(
        function() {
            erase();
            text.textContent = "";
            confirm_button.style.display = "none";
        }
    );
    $("#confirm-help").click(
        function() {
            getRawData(guess_word);
        }
    );
    $(function() {
        canvas = window._canvas = new fabric.Canvas('user-canvas');
        canvas.backgroundColor = '#ffffff';
        canvas.isDrawingMode = 1;
        canvas.freeDrawingBrush.color = "black";
        canvas.freeDrawingBrush.width = 6;
        canvas.renderAll();
        //setup listeners 
        canvas.on('mouse:up', function(e) {
            getFrame();
            mousePressed = false
        });
        canvas.on('mouse:down', function(e) {
            mousePressed = true
        });
        canvas.on('mouse:move', function(e) {
            recordCoor(e)
        });
    })
});

/*
record the current drawing coordinates
*/
function recordCoor(event) {
    var pointer = canvas.getPointer(event.e);
    var posX = pointer.x;
    var posY = pointer.y;

    if (posX >= 0 && posY >= 0 && mousePressed) {
        coords.push(pointer)
    }
}

/*
get the best bounding box by trimming around the drawing
*/
function getMinBox() {
    //get coordinates 
    var coorX = coords.map(function(p) {
        return p.x
    });
    var coorY = coords.map(function(p) {
        return p.y
    });

    //find top left and bottom right corners 
    var min_coords = {
        x: Math.min.apply(null, coorX),
        y: Math.min.apply(null, coorY)
    }
    var max_coords = {
        x: Math.max.apply(null, coorX),
        y: Math.max.apply(null, coorY)
    }

    //return as strucut 
    return {
        min: min_coords,
        max: max_coords
    }
}

/*
get the current image data 
*/
function getImageData() {
        //get the minimum bounding box around the drawing 
        const mbb = getMinBox()

        //get image data according to dpi 
        const dpi = window.devicePixelRatio
        const imgData = canvas.contextContainer.getImageData(mbb.min.x * dpi, mbb.min.y * dpi,
                                                      (mbb.max.x - mbb.min.x) * dpi, (mbb.max.y - mbb.min.y) * dpi);
        return imgData
    }

/*
get the prediction 
*/
function getFrame() {
    //make sure we have at least two recorded coordinates 
    if (coords.length >= 2) {

        //get the image data from the canvas 
        const imgData = getImageData()

        //get the prediction 
        const pred = model.predict(preprocess(imgData)).dataSync()

        //find the top prediction 
        const indices = findIndicesOfMax(pred, 1)
        const name = getClassNames(indices)
        setTable(name[0]);
        word2vec(name[0]);
    }
}

function setTable(name) {
    if(name.includes("_")) {
        name = name.replace("_"," ");
    }
    help_text.textContent = "Well.. I think you're trying to draw " + name + ". Can I draw with you?"; 
}
/*
get the the class names 
*/
function getClassNames(indices) {
    var outp = []
    for (var i = 0; i < indices.length; i++)
        outp[i] = classNames[indices[i]]
    return outp
}

/*
load the class names 
*/
async function loadDict() {
    await $.ajax({
        url: '../static/model_cnn/class_names.txt',
        dataType: 'text',
    }).done(success);
}

/*
load the class names
*/
function success(data) {
    const lst = data.split(/\n/)
    for (var i = 0; i < lst.length - 1; i++) {
        let symbol = lst[i]
        classNames[i] = symbol
    }
}

/*
get indices of the top probs
*/
function findIndicesOfMax(inp, count) {
    var outp = [];
    for (var i = 0; i < inp.length; i++) {
        outp.push(i); // add index to output array
        if (outp.length > count) {
            outp.sort(function(a, b) {
                return inp[b] - inp[a];
            }); // descending sort the output array
            outp.pop(); // remove the last index (index of smallest element in output array)
        }
    }
    return outp;
}

function findTopValue(inp, count) {
    var outp = [];
    let indices = findIndicesOfMax(inp, count)
    // show 5 greatest scores
    for (var i = 0; i < indices.length; i++)
        outp[i] = inp[indices[i]]
    console.log(outp)
    return outp
}

/*
preprocess the data
*/
function preprocess(imgData) {
    return tf.tidy(() => {
        //convert to a tensor 
        let tensor = tf.fromPixels(imgData, numChannels = 1)
        
        //resize 
        const resized = tf.image.resizeBilinear(tensor, [28, 28]).toFloat()
        
        //normalize 
        const offset = tf.scalar(255.0);
        const normalized = tf.scalar(1.0).sub(resized.div(offset));

        //We add a dimension to get a batch shape 
        const batched = normalized.expandDims(0)
        return batched
    })
}

/*
load the model
*/
async function start(cur_mode) {
    //arabic or english
    mode = cur_mode
    
    //load the model 
    model = await tf.loadModel('../static/model_cnn/model.json')
    
    //warm up 
    model.predict(tf.zeros([1, 28, 28, 1]))
    
    //load the class names
    await loadDict()
}

function erase() {
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    coords = [];
}
start();