const { createCanvas, loadImage } = require('canvas');

// util vars
var TWO_PI = Math.PI * 2
var QUARTER_PI = Math.PI * 0.25

// utility functions
function isArray( obj ) {
  return Object.prototype.toString.call( obj ) === "[object Array]"
}

function isObject( obj ) {
  return Object.prototype.toString.call( obj ) === "[object Object]"
}

const renderClosePixels = function( opts, width, height, ctx, imgData ) {
  var w = width
  var h = height
  var ctx = ctx
  var imgData = imgData

  // option defaults
  var res = opts.resolution || 16
  var size = opts.size || res
  var alpha = opts.alpha || 1
  var offset = opts.offset || 0
  var offsetX = 0
  var offsetY = 0
  var cols = w / res + 1
  var rows = h / res + 1
  var halfSize = size / 2
  var diamondSize = size / Math.SQRT2
  var halfDiamondSize = diamondSize / 2

  if ( isObject( offset ) ){ 
    offsetX = offset.x || 0
    offsetY = offset.y || 0
  } else if ( isArray( offset) ){
    offsetX = offset[0] || 0
    offsetY = offset[1] || 0
  } else {
    offsetX = offsetY = offset
  }

  var row, col, x, y, pixelY, pixelX, pixelIndex, red, green, blue, pixelAlpha

  for ( row = 0; row < rows; row++ ) {
    y = ( row - 0.5 ) * res + offsetY
    // normalize y so shapes around edges get color
    pixelY = Math.max( Math.min( y, h-1), 0)

    for ( col = 0; col < cols; col++ ) {
      x = ( col - 0.5 ) * res + offsetX
      // normalize y so shapes around edges get color
      pixelX = Math.max( Math.min( x, w-1), 0)
      pixelIndex = ( pixelX + pixelY * w ) * 4
      red   = imgData[ pixelIndex + 0 ]
      green = imgData[ pixelIndex + 1 ]
      blue  = imgData[ pixelIndex + 2 ]
      pixelAlpha = alpha * ( imgData[ pixelIndex + 3 ] / 255)

      ctx.fillStyle = 'rgba(' + red +','+ green +','+ blue +','+ pixelAlpha + ')'

      switch ( opts.shape ) {
        case 'circle' :
          ctx.beginPath()
            ctx.arc ( x, y, halfSize, 0, TWO_PI, true )
            ctx.fill()
          ctx.closePath()
          break
        case 'diamond' :
          ctx.save()
            ctx.translate( x, y )
            ctx.rotate( QUARTER_PI )
            ctx.fillRect( -halfDiamondSize, -halfDiamondSize, diamondSize, diamondSize )
          ctx.restore()
          break
        default :
          // square
          ctx.fillRect( x - halfSize, y - halfSize, size, size )
      } // switch
    } // col
  } // row

};

const render = function( options, width, height, ctx, canvas, image ) {
  // set size
  var w = width = canvas.width = (image.width || image.naturalWidth);
  var h = height = canvas.height = (image.height || image.naturalHeight);
  // draw image on canvas
  ctx.drawImage( image, 0, 0 )
  // get imageData

  try {
    imgData = ctx.getImageData( 0, 0, w, h ).data
  } catch ( error ) {
    if ( console ) {
      console.error( error )
    }
    return
  }

  ctx.clearRect( 0, 0, w, h )

  for ( var i=0, len = options.length; i < len; i++ ) {
    renderClosePixels( options[i], width, height, ctx, imgData )
  }

}

exports.pixelate = async (req, res) => {
  const {
    height,
    width,
    image,
    resolution
  } = req.query;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const options = [
    { resolution }
  ];

  loadImage(image).then((image) => {
    render( options, width, height, ctx, canvas, image );

    canvas.toBuffer((err, buf) => {
      if (err) throw err // encoding failed
      res.send(buf);
    }, 'image/png');
  });
};
