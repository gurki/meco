//  contexts
var cvsInputAudio = document.getElementById('cvsInAudio');
var ctxInputAudio = cvsInputAudio.getContext('2d');

var cvsInAnalysis = document.getElementById('cvsInAnalysis');
var ctxInAnalysis = cvsInAnalysis.getContext('2d');

var cvsInputVisual = document.getElementById('cvsInPitch');
var ctxInputVisual = cvsInputVisual.getContext('2d');

//  audio context
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContext();

// shim layer with setTimeout fallback
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
    };
})();

//  analyser node
var analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0.25;

//  audio variables
var freqDomain = new Uint8Array(analyser.frequencyBinCount);
var timeDomain = new Uint8Array(2048);

var f0 = 13.5; // C0 = 13.5
var f1 = 3951.07; // B7 = 3951.07, B8 = 7902.13
var df = f1 - f0;

var b0 = Math.max(0, getIndexFromFrequency(f0));
var b1 = getIndexFromFrequency(f1);
var nBins = b1 - b0;

//  audio setup
var audioNode;

// //  load sound
// var sound = new Sound("audio/audio1.mp3", didLoadAudio);

//  microphone
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
navigator.getUserMedia({
    audio: true
}, streamSuccess, streamError);

function streamError(error) {
    alert("can not access microphone");
}

function streamSuccess(stream) {
    audioNode = audioContext.createMediaStreamSource(stream);
    audioNode.connect(analyser);
    // audioNode.connect(audioContext.destination);
    processAudio();
    // findFundamentalFrequency();   
}

function didLoadAudio() {
    connectNodes();
    processAudio();
    // findFundamentalFrequency();   
}

function connectNodes() {
    audioNode = audioContext.createBufferSource();
    audioNode.buffer = sound.buffer;
    audioNode.connect(analyser);
    audioNode.playbackRate.value = 1;
    audioNode.connect(audioContext.destination);
    audioNode.loop = true;
}

window.addEventListener("keydown", didPressKey);
var isAudioPlaying = false;

function didPressKey(event) {
    if (event.keyCode == 'P'.charCodeAt(0)) {
        if (isAudioPlaying) {
            audioNode.stop(0);
            isAudioPlaying = false;
        } else {
            connectNodes();
            audioNode.start(0);
            isAudioPlaying = true;
        }
    }
}


//  conversions
function getIndexFromFrequency(frequency) {
    var nyquist = audioContext.sampleRate / 2.0;
    return Math.round(frequency / nyquist * freqDomain.length);
}


function getFrequencyFromIndex(index) {
    var nyquist = audioContext.sampleRate / 2.0;
    return index / freqDomain.length * nyquist;
}


function getNotesBetweenFrequencies(f0, f1) {
    return Math.round(12 * Math.log(f1 / f0) / Math.log(2));
}


function frequencyToNote(f, f0) {
    var f0 = (typeof f0 == 'undefined') ? 16.35 : f0;
    var notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    var df = getNotesBetweenFrequencies(f0, f);
    var octaves = Math.floor(df / 12);
    var note = Math.round(df) % 12;

    return notes[note] + octaves;
}


//  process and render audio
var peak = -1;
var baseFreq = 55;
var lastPeak = Date.now();
var listening = false;
var sequence = null;

var txtInput = document.getElementById('textInput');
var txtDebug = document.getElementById('textDescription');


function processAudio() {
    ctxInputAudio.save();

    // draw background
    var w = cvsInputAudio.width;
    var h = cvsInputAudio.height;

    ctxInputAudio.fillStyle = '#333333';
    ctxInputAudio.roundRect(0, 0, w, h, 20, true);
    ctxInputAudio.clip();


    // draw frequency domain
    analyser.getByteFrequencyData(freqDomain);

    var peakIndex = -1;
    var peakValue = -1;

    for (var i = b0; i < b1; i++) {
        var value = freqDomain[i];
        var percent = value / 256;
        var height = cvsInputAudio.height * percent;
        var offset = cvsInputAudio.height - height - 1;
        var barWidth = cvsInputAudio.width / nBins;
        var hue = i / nBins * 360;

        ctxInputAudio.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
        ctxInputAudio.fillRect((i - b0) * barWidth, offset, barWidth, height);

        if (percent > 0.6 && value > peakValue) {
            peakIndex = i;
            peakValue = value;
        }
    }

    // // activate listening if frequency is recognized
    // if (peakIndex >= 0) 
    // {
    //     var currPeak = getFrequencyFromIndex(peakIndex);

    //     if (!listening) 
    //     {
    //         listening = true;
    //         baseFreq = currPeak;
    //         sequence = new Array();
    //     }

    //     var currNote = getNotesBetweenFrequencies(baseFreq, currPeak);

    //     if (currNote != peak) 
    //     {
    //         peak = currNote;
    //         sequence.push(peak);
    //         txtInput.innerHTML = '[' + sequence + ']';

    //         var w = cvsInputVisual.width;
    //         var h = cvsInputVisual.height;
    //         ctxInputVisual.drawArray(sequence, 0, 0, w, h, 20, 20, true);
    //     }

    //     lastPeak = Date.now();
    // }    


    // draw time domain
    analyser.getByteTimeDomainData(timeDomain);

    var maxAmp = -1;

    for (var i = 0; i < analyser.frequencyBinCount; i++) {
        var value = timeDomain[i];
        var percent = value / 256.0;
        var height = cvsInputAudio.height * percent;
        var offset = cvsInputAudio.height - height - 1;
        var barWidth = cvsInputAudio.width / analyser.frequencyBinCount;

        if (percent > 0.5 && percent > maxAmp) {
            maxAmp = percent;
        }

        ctxInputAudio.fillStyle = 'hsla(360, 100%, 100%, 0.25)';
        ctxInputAudio.fillRect(i * barWidth, offset, 1, 1);
    }

    // stop and binset sequence after half a second of slience
    if (listening && Date.now() - lastPeak > 500 && maxAmp < 0) {
        peak = -1;
        lastPeak = Date.now();
        listening = false;

        match(sequence);
    }

    // also register new frequency after short silence
    // if (listening && Date.now() - lastPeak > 10 && maxAmp < 0 && peak >= 0) {
    // peak = -2;
    // lastPeak = Date.now();
    // }


    //  compute dominant frequency
    var res = weightedAutocorrelation(timeDomain, 1000, 1000, audioContext.sampleRate);
    var fdom = res[0];
    var confCorr = res[1];
    var confTime = RMS(timeDomain, 0, 256);

    var conf = confCorr * confTime;

    // if (confTime >= 0.5) {
    txtInput.innerHTML = frequencyToNote(fdom);
    // } else {
    // txtInput.innerHTML = '-';
    // }

    // txtDebug.innerHTML = [Math.round(100 * confCorr) / 100, Math.round(100 * confTime) / 100];
    txtDebug.innerHTML = 'comming soon: simon sings';


    // schedule next processing call
    requestAnimFrame(processAudio);

    ctxInputAudio.restore();
}


function RMS(series, min, max) {
    var rms = 0;
    var range = max - min;

    for (var x = 0; x < series.length; x++) {
        var y = (series[x] - min) / range;
        rms += y * y;
    }

    return Math.sqrt(rms / series.length);
}


function firstOrderRMS(series, min, max) {
    var noise = 0;
    var range = max - min;

    for (var i = 1; i < series.length; i++) {
        var grad = (series[i] - series[i - 1]) / range;
        noise += grad * grad;
    }

    return Math.sqrt(noise / (series.length - 1));
}


function computeIntegralArray(array) {
    var acc = new Array(array.length);

    if (array.length == 0) {
        return acc;
    }

    acc[0] = array[0];

    for (var i = 1; i < array.length; i++) {
        acc[i] = acc[i - 1] + array[i];
    }

    return acc;
}


function findFirstPeriodicMaxima(array, windowSize) {
    var acc = computeIntegralArray(array);
    var half = Math.floor(windowSize / 2);
    var size = half * 2 + 1;

    //  find min, max
    var minVal = Infinity;
    var maxVal = -Infinity;

    for (var i = 0; i < array.length; i++) {
        if (array[i] > maxVal) maxVal = array[i];
        if (array[i] < minVal) minVal = array[i];
    }

    var range = maxVal - minVal;


    //  find maxima
    var max = -1;
    var maxId = -1;
    var maxId0 = -1;

    for (var i = 2 * half + 1; i < array.length - 2 * half; i += half) {
        //  compute averages
        var mean0 = (acc[i] - acc[i - (2 * half + 1)]) / size;
        var mean1 = (acc[i + half] - acc[i - (half + 1)]) / size;
        var mean2 = (acc[i + 2 * half] - acc[i - 1]) / size;

        var grad1 = mean1 - mean0;
        var grad2 = mean2 - mean1;

        //  found maxima
        if (grad1 > 0 && grad2 < 0) {
            //  larger than current and gradient vanishes
            if (mean1 * 0.9 > max) {
                //  register the first maxima
                if (maxId0 < 0) {
                    maxId0 = i;
                }

                //  update largest maxima
                max = mean1;
                maxId = i;
            }
        }
    }

    return maxId;
}


function weightedAutocorrelation(series, shifts, size, srate) {
    if (size + shifts > series.length) {
        return;
    }

    var bestCorrelation = -1;
    var bestShift = -1;

    var corrs = new Array(shifts);
    var maxCorr = -Infinity;
    var minCorr = Infinity;

    for (var shift = 0; shift < shifts; shift += 1) {
        var ac = 0; //  auto correlation
        var amd = 0; //  average magnitude difference

        for (var t = 0; t < size; t += 1) {
            var val1 = (series[t] - 128) / 128;
            var val2 = (series[t + shift] - 128) / 128;
            var dval = val1 - val2;

            ac += val1 * val2;
            amd += dval * dval;
        }

        ac /= size;
        amd /= size;

        var correlation = ac / (amd + 1);

        corrs[shift] = correlation;

        if (correlation > maxCorr) maxCorr = correlation;
        if (correlation < minCorr) minCorr = correlation;

        if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestShift = shift;
        }
    }

    var maxId = findFirstPeriodicMaxima(corrs, 7);
    var fdom = srate / maxId;
    var conf = (corrs[maxId] - minCorr) / (maxCorr - minCorr);

    //  draw results
    var w = cvsInAnalysis.width;
    var h = cvsInAnalysis.height;

    drawAutocorrelation(corrs, minCorr, maxCorr, maxId, ctxInAnalysis, w, h);

    return [fdom, conf];
}


function drawAutocorrelation(corrs, minCorr, maxCorr, maxId, context, w, h) {
    //  get context and store its state for clipping
    var ctx = context;
    ctx.save();

    //  draw background
    ctx.fillStyle = '#333333';
    ctx.roundRect(0, 0, w, h, 20, true);
    ctx.clip();

    //  draw shift-correlation diagram
    var barWidth = w / corrs.length;
    var range = maxCorr - minCorr;

    for (var i = 0; i < corrs.length; i++) {
        var value = (corrs[i] - minCorr) / range;
        var height = h * value;
        var offset = h - height - 1;
        var hue = i / corrs.length * 360;

        ctx.fillStyle = 'hsl(' + hue + ', 100%, 25%)';
        ctx.fillRect(i * barWidth, offset, barWidth, height);
    }

    //  draw maxCorr marker
    var hue = maxId / corrs.length * 360;

    ctx.fillStyle = 'hsla(' + hue + ', 100%, 50%, 0.5)';
    ctx.fillRect(maxId * barWidth - 5, 1, 10, h);

    ctx.restore();
}



function match(array) {
    keys = [
        [
            [0], 'too easy ;)'
        ],
        [
            [0, 2, 4, 5, 7], 'durrrrr'
        ],
        [
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'rising'
        ],
        [
            [0, 4, 7], 'threekläng'
        ],
        [
            [0, 4, 7, 12], 'very nice, very nice'
        ],
        [
            [0, 12, 0], 'up and down'
        ],
        [
            [0, 12, 3, 5], 'welcome'
        ],
        [
            [0, 5, 9, 7, 5, 12, 10, 7], 'HARRY POTTER!!11einself'
        ],
        [
            [0, -4, 3, 0, -4, 3, 0], 'may the force be with you!'
        ],
        [
            [0, 7, 5, 4, 2, 12, 7], 'aaaw, the good one'
        ],
        [
            [0, 3, 5, 6, 5, 3, 0], 'ja so a wiener würstchen'
        ],
        [
            [0, -6, -4, -3, -4, -6, -8, -4, 0], 'tetris, bitches'
        ],
        [
            [0, -7, -3, 0, -3, -6, -12, -7, -3, 0, -3, -2], 'asterix <3'
        ],
        [
            [0, -2, -6, -2, 0], 'lord of the rings'
        ],
        [
            [0, 2, 4, 7, 4, 2, 0], 'hobbingen'
        ],
        [
            [0, 4, 3, 6, 5, 8], 'CUUUUBE'
        ]
    ];

    var bestMatchId = -1;
    var bestDistance = Infinity;

    for (var i = 0; i < keys.length; i++) {
        var distance = levenshtein(keys[i][0], array);

        if (distance < bestDistance) {
            bestMatchId = i;
            bestDistance = distance;
        }
    }

    var bestMatch = keys[bestMatchId];

    if (bestDistance < 2 * bestMatch[0].length) {
        txtInput.innerHTML = '[' + array + '] -> [' + bestMatch[0] + ']';
        txtDebug.innerHTML = bestMatch[1];
    } else {
        txtInput.innerHTML = '[' + array + ']';
        txtDebug.innerHTML = 'undefined. try again :)';
    }
}