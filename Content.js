
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

setInterval(get_current_time, 1000)