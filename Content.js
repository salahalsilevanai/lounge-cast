
function check_video() {

    if (!document.querySelector("video")) {
        setTimeout(check_video, 500); // Wait for 1 second before checking again
    } else {
        console.log("Video element found!");
    }
}
check_video();



// current time = document.querySelector("video").currentTime
// duration = document.querySelector("video").duration
// You can use these properties to get the current time and duration of the video. For example:
// other properiteis
// video.play() - to play the video
// video.pause() - to pause the video
// video.currentTime = 10 - to set the current time to 10 seconds
// You can also add event listeners to the video element to track when the video is played, paused, or ended. For example:
// video.addEventListener("play", function() {
//     console.log("Video is playing");
// });
// video.addEventListener("pause", function() {
//     console.log("Video is paused");
// });
// video.addEventListener("ended", function() {
//     console.log("Video has ended");
// });


function get_current_time(){
    console.log(document.querySelector("video").currentTime)
    console.log(document.querySelector("video").duration)
}
// if key is press "p" then pause the video
document.addEventListener("keydown", function(event) {
    if (event.key === "p") {
        document.querySelector("video").pause();
    }
});

// if key is press "s" then play the video
document.addEventListener("keydown", function(event) {
    if (event.key === "s") {
        document.querySelector("video").play();
    }
});


// if key is press "r" then reset the video
document.addEventListener("keydown", function(event) {
    if (event.key === "r") {
        document.querySelector("video").currentTime = 0;
    }
});
setInterval(get_current_time, 1000)

// get current url and id of the video

// const result = document.URL.split("/watch")
// const video_id = result[0].split("-")[result[0].split("-").length - 1]

const body = document.querySelector("body")
body.style.width = "calc(100vw - 320px)"
// add an iframe to the right of the video
const div = document.createElement("div")
// when this div is in focus or clicked it stop every other event listener on the page and only listen to the events on this div
div.addEventListener("click", function(event) {
    event.stopPropagation();

});
// stop api calls when the div is in focus
div.addEventListener("focus", function(event) {
    event.stopPropagation();
});
// stop keydown events when the div is in focus
div.addEventListener("keydown", function(event) {
    event.stopPropagation();
});
// stop keyup events when the div is in focus
div.addEventListener("keyup", function(event) {
    event.stopPropagation();
});
// stop keypress events when the div is in focus
div.addEventListener("keypress", function(event) {
    event.stopPropagation();
});
// stop mouse events when the div is in focus
div.addEventListener("mousedown", function(event) {
    event.stopPropagation();
});

// stop mouse events when the div is in focus
div.addEventListener("mouseup", function(event) {
    event.stopPropagation();
});

// stop mouse events when the div is in focus
div.addEventListener("mousemove", function(event) {
    event.stopPropagation();
});




div.style.height = "100vh"
div.style.width = "320px"
div.style.position = "fixed"
div.style.top = "0"
div.style.right = "0"

body.appendChild(div)

const chat = document.createElement("div")
chat.style.height = "calc(100vh - 100px)"
chat.style.width = "100%"
chat.style.overflowY = "scroll"
chat.style.padding = "10px"
div.appendChild(chat) // chat is the div where the messages will be displayed

h1 = document.createElement("h1")
h1.innerText = "Chat"
// color
h1.style.color = "#FAFAFA"
h1.style.ZIndex = "1000"
h1.style.textAlign = "center"

chat.appendChild(h1) // h1 is the heading of the chat

for (let i = 0; i < 10; i++) {
    const message = document.createElement("div")
    message.style.padding = "10px"
    message.style.marginBottom = "10px"
    message.style.fontSize = "15px"
    message.style.backgroundColor = "#f1f1f1"
    message.style.borderRadius = "20px"
    message.style.width = "fit-content"        
    //message.style.maxWidth = "80%"
    message.style.wordWrap = "break-word"
    message.style.alignContent = "flex-start"
    message.innerText = "hello how are you my friend?"
    chat.appendChild(message) // message is the div where the message will be displayed
}



input = document.createElement("input")
input.style.width = "calc(100% - 20px)"
input.style.height = "50px"
input.style.fontSize = "15px"
input.style.padding = "10px"
input.style.boxSizing = "border-box"
input.style.margin = "0 10px "
input.style.borderRadius = "20px"
input.placeholder = "Type your message here..."

div.appendChild(input) // input is the input field where the user will type their message


const controls = document.createElement("div")
controls.style.height = "50px"
controls.style.width = "100%"
controls.style.display = "flex"
controls.style.justifyContent = "center"
controls.style.alignItems = "center"
controls.style.justifyContent = "space-around"
div.appendChild(controls) // controls is the div where the play and pause buttons will be displayed




// key down enter to send the message
input.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        const message = document.createElement("div")

    message.style.padding = "10px"
    message.style.marginBottom = "10px"
    message.style.fontSize = "15px"
    message.style.backgroundColor = "#f1f1f1"
    message.style.borderRadius = "20px"
    message.style.width = "fit-content"        
    //message.style.maxWidth = "80%"
    message.style.wordWrap = "break-word"
    message.style.alignContent = "flex-start"
    message.innerText = input.value
    chat.appendChild(message) // message is the div where the message will be displayed
    input.value = "" // clear the input field
    // scroll to the bottom of the chat
    chat.scrollTop = chat.scrollHeight
    }
});

