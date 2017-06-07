// s1 = key, s2 = sequence. order important, as key may not be altered
function levenstein(s1, s2)
{
    var buffer1 = new Array(s2.length + 1);
    var buffer2 = new Array(s2.length + 1);
    var max = s1.length * s2.length;

    for (var i = 0; i < s2.length + 1; i++) {
        buffer1[i] = -1;
        buffer2[i] = -1;
    }

    var id0 = 0;

    for (var id1 = 0; id1 < s1.length; id1++)
    {
        for (var id2 = id0; id2 < s2.length; id2++)
        {
            var d = Math.abs(s1[id1] - s2[id2]);
            var b1 = Math.max(buffer1[id2], 0);
            var b2 = buffer2[id2];
            var b1n = buffer1[id2 + 1];
            var b2n = buffer2[id2 + 1];

            if (d == 0) {
                buffer1[id2 + 1] = (b1n == -1 ? b1 + 1 : Math.min(b1n, b1 + 1));
                buffer2[id2 + 1] = (b2n == -1 ? b1 : Math.min(b2n, b1));
                buffer2[id2] = (b2 == -1 ? b1 + 1 : Math.min(b2, b1 + 1));
            }
            else if (d == 1) {
                buffer1[id2 + 1] = (b1n == -1 ? b1 + 1 : Math.min(b1n, b1 + 1));
                buffer2[id2 + 1] = (b2n == -1 ? b1 + 1 : Math.min(b2n, b1 + 1));
                buffer2[id2] = (b2 == -1 ? b1 + 1 : Math.min(b2, b1 + 1));
            }
            else {
                buffer1[id2 + 1] = (b1n == -1 ? b1 + d : Math.min(b1n, b1 + d));
                buffer2[id2 + 1] = (b2n == -1 ? b1 + d : Math.min(b2n, b1 + d));
                buffer2[id2] = (b2 == -1 ? b1 + d : Math.min(b2, b1 + d));
            }
        }

        for (var i = 0; i < s2.length + 1; i++) {
            buffer1[i] = buffer2[i];
            buffer2[i] = -1;
        }
    }

    return buffer1[s2.length];
}


//  array extensions
Array.max = function(array){
    return Math.max.apply(Math, array);
}


Array.min = function(array){
    return Math.min.apply(Math, array);
}


//  canvas extensions
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r, inner)
{
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;

    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y,   x+w, y+h, r);
    this.arcTo(x+w, y+h, x,   y+h, r);
    this.arcTo(x,   y+h, x,   y,   r);
    this.arcTo(x,   y,   x+w, y,   r);
    this.closePath();
    this.fill();

    return this;
}


CanvasRenderingContext2D.prototype.drawArray = function(array, x, y, w, h, width, height, outer)
{
    // store context state for clipping
    this.save();

    // draw background
    this.fillStyle = '#333333';
    this.roundRect(x, y, w, h, 20, true);
    this.fill();
    this.clip();

    // draw array
    var min = Array.min(array);
    var range = Math.abs(Array.max(array) - min);
    var width = Math.min(width, (w - 2 * width) / array.length);
    var height = Math.min(height, (h - 2 * height) / range);
    var offsetX = (w - array.length * width) / 2 + x;
    var offsetY = (h - (range - 1) * height) / 2 + y;

    this.fillStyle = '#cccccc';

    if (outer)
    {
        this.shadowBlur = 10;
        this.shadowColor = 'black';
        this.shadowOffsetX = 0;
        this.shadowOffsetY = 0;
    }

    for (var i = 0; i < array.length; i++) {
        this.fillRect(i * width + offsetX, h - ((array[i] - min) * height + offsetY), width - 1, height - 1);
    }

    this.restore();
    return this;
}
