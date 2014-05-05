var Backbone = require('backbone')
  , _ = require('lodash')
  , Slider = require('nano-slider')
  , $ = require('jquery')

Backbone.$ = $

/* TODO
  - pinch zoom
  - hide image until it is loaded and zoomed correctly
  - currently assumes the window is cropping out 30px on each side; figure out a way to determine that from the CSS
  - decide if I want to make this usable by AMD, too
*/
var Vogue = Backbone.View.extend({
  className: 'vogue',

  events: {
    'mousedown .vogue-preview': 'startMove',
    'touchstart .vogue-preview': 'startMove',
    'click': 'click'
  },

  initialize: function (options) {
    _.bindAll(this, 'move', 'endMove')

    this.options = options

    this.frameWidth = 30
  },

  render: function () {
    var self = this
      , img = new Image()
      , $img = $(img)

    this.$el.css({
      // Don't restrain main container's height, just width
      width: this.options.preview.width + 'px'
    })

    img.src = this.options.img

    var preview = this.$el.append('<div class="vogue-preview"><span class="vogue-preview-shade"></span></div>')

    this.$('.vogue-preview').css({
      height: this.options.preview.height + 'px',
      width: this.options.preview.width + 'px'
    })

    $img.load(function () {
      self.original = {
        width: img.width,
        height: img.height
      }

      $img.css({
        width: img.width,
        height: img.height,
        'max-width': img.width,
        'max-height': img.height
      })

      self.$('.vogue-preview').append(img)

      var widthZoom = (self.options.preview.width - self.frameWidth) / self.original.width
        , heightZoom = (self.options.preview.height - self.frameWidth) / self.original.height
        , initialZoom = Math.max(widthZoom, heightZoom)
        , initialX = (self.options.preview.width - self.original.width) / 2
        , initialY = (self.options.preview.height - self.original.height) / 2

      // Minimum zoom is the smallest zoom that still allows the image to completely fill the window;
      // maximum zoom is 3x the minimum
      self._minZoom = Math.max((self.options.preview.width - (self.frameWidth * 2)) / self.original.width,
        (self.options.preview.height - (self.frameWidth * 2)) / self.original.height)
      self._maxZoom = self._minZoom * 3

      $img.css({
        left: initialX + 'px',
        top: initialY + 'px'
      })

      self.zoom(initialZoom)

      var slider = new Slider({ value: self._sliderPercent(initialZoom) * 100, step: null})

      slider.on('change', function (e, value) {
        self.zoom(self._realPercent(value / 100))
      })

      self.$el.append(slider.render().$el)

      self.trigger('load')
    })

    return this
  },

  // Turn the zoom number (between _minZoom and _maxZoom) into a slider percentage (0 - 1.0)
  _sliderPercent: function (zoom) {
    return (zoom - this._minZoom) / (this._maxZoom - this._minZoom)
  },

  // Turn the slider percentage into the corresponding zoom
  _realPercent: function (slider) {
    return (slider * (this._maxZoom - this._minZoom)) + this._minZoom
  },

  window: function () {
    var coords = this._currentCoords();
    return {
      zoom: this._zoom,
      x: -(coords.scaled.left) + this.frameWidth,
      y:  -(coords.scaled.top) + this.frameWidth,
      width: this.options.preview.width - (this.frameWidth*2),
      height: this.options.preview.height - (this.frameWidth*2)
    }
  },

  _currentCoords: function () {
    var $img = this.$('img:first')

    return calcCoords({
      scale: this._zoom,
      unscaled: {
        // $img.css('left') is slightly off in Chrome 26.0.1410.65 (stable), but works in 28.0.1492.0 canary
        // Using the native style.left seems to work in all browsers, so we'll do that for now
        left: parseInt($img[0].style.left),
        top: parseInt($img[0].style.top),
        width: this.original.width,
        height: this.original.height
      }
    })
  },

  zoom: function (zoom) {
    var $img = this.$('img')

    var oldCoords = this._currentCoords()

    var zoomedCoords = calcCoords({
      scale: zoom,
      unscaled: oldCoords.unscaled
    })

    var constrained = this._constrain(oldCoords.unscaled.left - zoomedCoords.unscaled.left + zoomedCoords.unscaled.left,
      oldCoords.unscaled.top - zoomedCoords.unscaled.top + zoomedCoords.unscaled.top,
      zoom)

    $img.css({
      'transform': 'scale(' + (zoom) + ')',
      '-ms-transform': 'scale(' + (zoom) + ')',
      '-webkit-transform': 'scale(' + (zoom) + ')',
      left: constrained.left + 'px',
      top: constrained.top + 'px',
    })

    this._zoom = zoom
    this.trigger('zoom')
  },

  startMove: function (e) {
    e.preventDefault()
    e.stopPropagation()

    $(document).on('mousemove touchmove', this.move)
    $(document).on('mouseup touchend', this.endMove)

    var $img  = this.$('img:first')
    this.dragStartLoc = {
      left: parseInt($img[0].style.left),
      top: parseInt($img[0].style.top),
      mouseX: pageX(e),
      mouseY: pageY(e)
    }
  },

  _constrain: function (left, top, zoom) {
    var newCoords = calcCoords({
      scale: zoom,
      unscaled: {
        left: left,
        top: top,
        width: this.original.width,
        height: this.original.height
      }
    })

    function newScaled(source, scaledChanges) {
      return {
        scale: source.scale,
        scaled: _.extend(_.clone(source.scaled), scaledChanges)
      }
    }

    var minScaledLeft = this.options.preview.width - this.frameWidth - newCoords.scaled.width
      , minScaledTop = this.options.preview.height - this.frameWidth - newCoords.scaled.height
      , maxScaledLeft = this.frameWidth
      , maxScaledTop = this.frameWidth

    // Make sure top and left don't stray inside the window
    if(newCoords.scaled.left > maxScaledLeft) {
      left = calcCoords(newScaled(newCoords, {left: maxScaledLeft})).unscaled.left
    }

    if(newCoords.scaled.top > this.frameWidth) {
      top = calcCoords(newScaled(newCoords, {top: maxScaledTop})).unscaled.top
    }

    // Make sure bottom and right don't stray inside the window
    if(newCoords.scaled.left < minScaledLeft) {
      left = calcCoords(newScaled(newCoords, {left: minScaledLeft})).unscaled.left
    }

    if(newCoords.scaled.top < minScaledTop) {
      top = calcCoords(newScaled(newCoords, {top: minScaledTop})).unscaled.top
    }

    return {
      top: top,
      left: left
    }
  },

  move: function (e) {
    e.stopPropagation()

    var left = this.dragStartLoc.left + pageX(e) - this.dragStartLoc.mouseX
      , top = this.dragStartLoc.top + pageY(e) - this.dragStartLoc.mouseY
      , constrained = this._constrain(left, top, this._zoom)

    this.$('img').css({
      top: constrained.top + 'px',
      left: constrained.left + 'px'
    })
  },

  endMove: function (e) {
    e.preventDefault()
    $(document).off('mousemove touchmove', this.move)
    $(document).off('mouseup touchend', this.end)

    this.trigger('moveEnd')
  },

  click: function (e) {
    e.preventDefault()
  }
})

function calcCoords (coords) {
  if(coords.unscaled) {
    return {
      scale: coords.scale,
      unscaled: coords.unscaled,
      scaled: {
        left: coords.unscaled.left + (coords.unscaled.width * (1-coords.scale) / 2),
        top: coords.unscaled.top + (coords.unscaled.height * (1-coords.scale) / 2),
        width: coords.unscaled.width * coords.scale,
        height: coords.unscaled.height * coords.scale
      }
   }
 } else if(coords.scaled) {
    return {
      scale: coords.scale,
      unscaled: {
        left: coords.scaled.left - ((coords.scaled.width / coords.scale) * (1-coords.scale) / 2),
        top: coords.scaled.top - ((coords.scaled.height / coords.scale) * (1-coords.scale) / 2),
        width: coords.scaled.width / coords.scale,
        height: coords.scaled.height / coords.scale
      },
      scaled: coords.scaled
    }
   } else {
    throw new Error('need either scaled or unscaled coords')
   }
}

function pageX(e) {
  return e.type === 'touchmove' || e.type == 'touchstart' ? e.originalEvent.touches[0].pageX : e.pageX
}

function pageY(e) {
  return e.type === 'touchmove'|| e.type == 'touchstart' ? e.originalEvent.touches[0].pageY : e.pageY
}

module.exports = Vogue
