const APP_ID = "1e645d3fc3054680a1c24579490d4b0d"
const TOKEN = "007eJxTYNhZzPrV5OYRhWmRtQevSmll2ie3nzvwPLQmKuuN55Mg8UUKDIapZiamKcZpycYGpiZmFgaJhslGJqbmliaWBikmSQYpR0tbUhsCGRn2ymxhZWSAQBCfhSE3MTOPgQEAYK0fjg=="
const CHANNEL = "main"

const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})

let localTracks = []
let remoteUsers = {}
let UID; // Variable to store the local user's UID
let joinAndDisplayLocalStream = async () => {

    client.on('user-published', handleUserJoined)
    
    client.on('user-left', handleUserLeft)
    
    UID = await client.join(APP_ID, CHANNEL, TOKEN, null)

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks() 

    let player = `<div class="video-container" id="user-container-${UID}">
                        <div class="video-player" id="user-${UID}"></div>
                  </div>`
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

    localTracks[1].play(`user-${UID}`)
    
    await client.publish([localTracks[0], localTracks[1]])
}


let toggleScreenSharing = async (e) => {
    if (!localTracks[2]) {
        // Create screen-sharing track
        localTracks[2] = await AgoraRTC.createScreenVideoTrack();

        // Stop publishing camera video track if it's already being published
        if (localTracks[1]) {
            await client.unpublish(localTracks[1]);
            localTracks[1].close();
            localTracks[1] = null;
        }

        // Publish the screen-sharing track
        await client.publish(localTracks[2]);

        e.target.innerText = 'Stop Sharing';
        e.target.style.backgroundColor = 'cadetblue';
    } else {
        // Unpublish the screen-sharing track
        await client.unpublish(localTracks[2]);
        localTracks[2].close();
        localTracks[2] = null;

        // Recreate and republish the camera video track
        localTracks[1] = await AgoraRTC.createCameraVideoTrack();
        await client.publish(localTracks[1]);

        // Reattach the camera video track to the local player

        localTracks[1].play(`user-${UID}`);  // Use the local user's UID

        e.target.innerText = 'Share Screen';
        e.target.style.backgroundColor = '#4CAF50';
    }
};




let joinStream = async () => {
    await joinAndDisplayLocalStream()
    document.getElementById('join-btn').style.display = 'none'
    document.getElementById('stream-controls').style.display = 'flex'
}

let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user 
    await client.subscribe(user, mediaType)

    if (mediaType === 'video'){
        let player = document.getElementById(`user-container-${user.uid}`)
        if (player != null){
            player.remove()
        }

        player = `<div class="video-container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}"></div> 
                 </div>`
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

	  if (user.videoTrack) {
            user.videoTrack.play(`user-${user.uid}`);
        }
    }

    if (mediaType === 'audio'){
        user.audioTrack.play()
    }


	if (mediaType === 'video' && user.videoTrack && user.videoTrack.getMediaStreamTrack().kind === 'video') {
        let player = document.getElementById(`user-container-${user.uid}`);
        if (player != null) {
            player.remove();
        }

        player = `<div class="video-container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}" onclick="toggleFullscreen('user-${user.uid}')"></div> 
                 </div>`;
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);

        user.videoTrack.play(`user-${user.uid}`);
    }




}

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async () => {
    for(let i = 0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.leave()
    document.getElementById('join-btn').style.display = 'block'
    document.getElementById('stream-controls').style.display = 'none'
    document.getElementById('video-streams').innerHTML = ''
}

let toggleMic = async (e) => {
    if (localTracks[0].muted){
        await localTracks[0].setMuted(false)
        e.target.innerText = 'Mic on'
        e.target.style.backgroundColor = 'cadetblue'
    }else{
        await localTracks[0].setMuted(true)
        e.target.innerText = 'Mic off'
        e.target.style.backgroundColor = '#EE4B2B'
    }
}

let toggleCamera = async (e) => {
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        e.target.innerText = 'Camera on'
        e.target.style.backgroundColor = 'cadetblue'
    }else{
        await localTracks[1].setMuted(true)
        e.target.innerText = 'Camera off'
        e.target.style.backgroundColor = '#EE4B2B'
    }
}

function toggleFullscreen(elementId) {
    const element = document.getElementById(elementId);

    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('screen-share-btn').addEventListener('click', toggleScreenSharing);


document.getElementById('open-whiteboard-btn').addEventListener('click', function() {
    openWhiteboard();
});

function openWhiteboard() {
    // You can replace the URL with the URL of your preferred online whiteboard service
    window.open('https://excalidraw.com/', '_blank');
}
