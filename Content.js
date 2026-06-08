
while (!document.querySelector("video")) {
    console.log("Waiting for video element to load...");
}
const video = document.querySelector("video");



function get_current_time(){
    console.log(video.currentTime)
}



setInterval(get_current_time, 1000)