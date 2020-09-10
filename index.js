var PNG = require("pngjs").PNG;
var fs = require('fs-extra');

//TODO #1: Divide by 2.55 is kinda arbitrary to have values [0,100]
let pixelDepth = (r,g,b) => (r+g+b)/3/2.55
let fence = (min,x,max) => Math.min(max, Math.max(min, x))
let pixelIndex = (x, y, width, height) => {
  x = fence(x, 0, width - 1);
  y = fence(y, 0, height - 1);
  // bitshift used in pngjs docs
  return (width * y + x) << 2;
}

/**
 *   --- --- ---
 *  | a | b | c |
 *  | d | e | f |
 *  | g | h | i |
 *   --- --- ---
 *
 *  slope_dir_radians = ATAN( SQRT ( [dz/dx]^2 + [dz/dy]^2 ) )
 *
 *  dz/dx = ((c + 2f + i) - (a + 2d + g) / (8 * x_cellsize)
 *  dz/dy = ((g + 2h + i) - (a + 2b + c)) / (8 * y_cellsize)
 * 
 * TODO #1: Not sure what cell_size is, but makes a difference
 * 
 * From: http://www.gisagmaps.com/neighborhood-slope/
 */
let getSlope = (elevations, cell_size = 5) => {
  let [a, b, c, d, e, f, g, h, i] = elevations;
  let dzdx = (c + 2 * f + i - (a + 2 * d + g)) / (8 * cell_size);
  let dzdy = (g + 2 * h + i - (a + 2 * b + c)) / (8 * cell_size);
  let slope = Math.sqrt(Math.pow(dzdx, 2) + Math.pow(dzdy, 2));
  let dir = Math.atan(slope) * 57.29478;

  return {
    dx: dzdx,
    dy: dzdy,
    dir
  };
};



module.exports = function slopify(input, output, options){
  let { kernel } = {
    kernel: 3,
    ...options
  }

  let offset = Math.floor(kernel / 2);
  fs.createReadStream(input)
    .pipe(new PNG())
    .on("parsed", function(){

      let slopemap = new PNG({
        width: this.width,
        height: this.height
      });

      for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
          var idx = pixelIndex(x, y, this.width, this.height);

          let localElevations = [];
          // Iterate over neighbors
          for (var j = -offset; j <= offset; j++) {
            for (var i = -offset; i <= offset; i++) {
              let neighborIdx = pixelIndex(x + i, y + j, this.width, this.height);
              let localIdx = (j + offset) * kernel + (i + offset);
              // Slice buffer then convert to array
              let neighborRGB = [...this.data.slice(neighborIdx, neighborIdx + 3)];
              localElevations[localIdx] = pixelDepth.apply(null, neighborRGB);
            }
          }
          let { dx, dy } = getSlope(localElevations);
          // RED
          slopemap.data[idx+0] = 127 * (1 - dx)
          // GREEN
          slopemap.data[idx+1] = 127 * (1 + dy)
          // BLUE
          slopemap.data[idx+2] = 0
          // OPACITY
          slopemap.data[idx+3] = 255;
        }
      }

      slopemap.pack().pipe(fs.createWriteStream(output))
    })
}