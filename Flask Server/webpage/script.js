const video = document.getElementById("video");
const outputCanvas = document.getElementById("input-canvas");
const outputCanvasCTX = outputCanvas.getContext("2d");

let previousState = {
  x: undefined,
  y: undefined,
};

let currentState = {
  x: undefined,
  y: undefined,
};

let currentLetterQuery = [];
let letterBuffer = [];
const dictionary = {
  CCC: "Let us go",
};

document.body.onkeydown = function (e) {
  if (e.key == " " || e.code == "Space" || e.keyCode == 32) {
    e.preventDefault();
    letterBuffer = [];
    const phrase = document.getElementById("phrase");
    phrase.innerText = "";
  }
};

// function declaration
function openWebCam() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      // Changing the source of video to current stream.
      video.srcObject = stream;
      video.addEventListener("loadedmetadata", () => {
        video.play();
      });
    })
    .catch(alert);
}

function putFrame() {
  // setting canvas

  // turn frame into a blob to be send to server
  outputCanvas.toBlob((blob) => {
    //This code runs AFTER the Blob is extracted
    let fd = new FormData();
    fd.append("field-name", blob, "image-filename.png");
    // making request
    let req = new Request("http://127.0.0.1:5000/Rx_frame", {
      method: "POST",
      body: fd,
      mode: "cors",
    });

    // Sending request
    fetch(req).then((res) => {
      res.json().then((json) => {
        // check if res is not empyt
        currentState = json;
        currentLetterQuery.push(json.value);
      });
    });
  });
}

requestAnimationFrame(drawRect);

function drawRect() {
  outputCanvas.width = video.videoWidth;
  outputCanvas.height = video.videoHeight;

  // draw webcam frames on canvas
  outputCanvasCTX.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  const { coordinates } = currentState;

  let xDelta = Math.abs(coordinates?.x_min || 0 - previousState.x || 0);
  let yDelta = Math.abs(coordinates?.y_min || 0 - previousState.y || 0);
  let stepSize = (xDelta + yDelta) / 20;

  let xTrace = xDelta / stepSize;
  let yTrace = yDelta / stepSize;

  outputCanvasCTX.lineWidth = "2";
  outputCanvasCTX.strokeStyle = "red";
  outputCanvasCTX.rect(
    previousState.x - 10 + xTrace,
    previousState.y - 5 + yTrace,
    Math.abs(coordinates?.x_max - coordinates?.x_min) + 10,
    Math.abs(coordinates?.y_max - coordinates?.y_min) + 5
  );
  outputCanvasCTX.stroke();

  previousState = {
    x: coordinates?.x_min,
    y: coordinates?.y_min,
  };

  requestAnimationFrame(drawRect);
}

const getDurationAverageLetter = () => {
  //Finding the most frequent character in an array javascript using filter
  const averageLetter = currentLetterQuery
    .sort(
      (a, b) =>
        currentLetterQuery.filter((v) => v === a).length -
        currentLetterQuery.filter((v) => v === b).length
    )
    .pop();

  if (averageLetter) {
    letterBuffer.push(averageLetter);

    const letter = document.getElementById("letter");
    letter.innerText = letterBuffer.join(" - ");
  }
  currentLetterQuery = [];
};

const parseLetterBuffer = () => {
  if (letterBuffer.length === 3) {
    const dictionaryParse = dictionary[letterBuffer.join("")];
    letterBuffer = [];

    if (dictionaryParse) {
      const phrase = document.getElementById("phrase");
      phrase.innerText = dictionaryParse;
    } else {
      const phrase = document.getElementById("phrase");
      phrase.innerText = "No Translation???";
    }
  }
};

// main code
openWebCam();
setInterval(putFrame, 150);
setInterval(getDurationAverageLetter, 2000);
setInterval(parseLetterBuffer, 2000);
