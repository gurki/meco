//  harmonic product spectrum
function findFundamentalFrequency()
{
    var nHarmonics = 1;

    //  compute integral frequency
    var nUp = (nBins + nHarmonics + 1) * (nHarmonics + 1);
    var integral = new Array(nBins * (nHarmonics + 1));
    integral[0] = 0;

    for (var i = 1; i < nUp; i++) {
        integral[i] = integral[i - 1] + freqDomain[b0 + i - 1];
    }

    //  init downsampling
    var bins = new Array(nBins);

    for (var i = 0; i < nBins; i++) {
        bins[i] = 1;
    }

    //  compute harmonic product spectrum
    for (var harmonic = 0; harmonic <= nHarmonics; harmonic++) 
    {
        for (var i = 1; i < nBins; i++) 
        {
            var int1 = integral[(i - 1) * (harmonic + 1)];
            var int2 = integral[(i + harmonic + 1) * (harmonic + 1)];
            var mean = (int2 - int1) / (harmonic + 1);

            bins[i] *= mean / 256;
        }
    }

    //  post process and find peak
    var fundFreqBin = -1;
    var fundFreqVal = -1;

    // var dbins = new Array(nBins);
    // dbins[0] = 0;
    // dbins[nBins] = 0;

    // for (var i = 1; i < nBins - 1; i++) {
    //     dbins[i] = freqDomain[i] * ((bins[i+1] - bins[i]) + (bins[i] - bins[i-1])) / 2;
    // }

    for (var i = 0; i < nBins; i++) {
        if (bins[i] > fundFreqVal) {
            fundFreqVal = bins[i];
            fundFreqBin = i;
        }
    }

    fundFreq = getFrequencyFromIndex(b0 + fundFreqBin);

    // get context and store its state for clipping
    var ctx = ctxInAnalysis;
    var w = cvsInAnalysis.width;
    var h = cvsInAnalysis.height;

    ctx.save();

    // draw background
    ctx.fillStyle = '#333333';
    ctx.roundRect(0, 0, w, h, 20, true);
    ctx.clip();

    // draw histogram
    var maxValue = fundFreqVal;

    for (var i = 0; i < nBins; i++) 
    {
        if (i == fundFreqBin) 
        {
            var value = bins[i];
            var percent = value / maxValue;
            var height = h * percent;
            var offset = h - height - 1;
            var barWidth = w / nBins;
            var hue = i / nBins * 360;

            ctx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
            ctx.fillRect(i * barWidth, offset, barWidth, height);
        }
    }

    ctx.restore();

    // schedule next call
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = window.webkitRequestAnimationFrame;

    window.requestAnimationFrame(findFundamentalFrequency);
}
