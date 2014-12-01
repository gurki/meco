var audioContext = null;


function Sound(source, didLoad) 
{
    if (!window.audioContext) 
    {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
        }
        catch(e) {
            alert('Web Audio API is not supported in this browser');
        }           
    }

    this.source = source;
    this.buffer = null;
    this.isLoaded = false;

    var sound = new XMLHttpRequest();
    sound.open("GET", this.source, true);
    sound.responseType = "arraybuffer";

    var instance = this;

    sound.onload = function() 
    {
        audioContext.decodeAudioData(sound.response, function(buffer) {
            instance.buffer = buffer;
            instance.isLoaded = true;
            didLoad();
        });
    }

    sound.send();
}


Sound.prototype.play = function() 
{
    if (this.isLoaded === true) 
    {
        var node = audioContext.createBufferSource();
        node.buffer = this.buffer;
        node.connect(audioContext.destination);
        node.start(0);
    }
}