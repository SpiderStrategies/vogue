/* TODO
  - When zooming, keep same center point
  - pinch zoom
  - TESTS!
  - hide image until it is loaded and zoomed correctly
*/
(function (root) {
  function pxToNum (px) {
    return parseInt(px.replace('px', ''))
  }

  var Vogue = Backbone.View.extend({
    className: 'vogue',

    events: {
      'mousedown': 'startMove',
      'touchstart': 'startMove',
      'click': 'click'
    },

    initialize: function () {
      _.bindAll(this, 'move', 'endMove')
      this.cropState = {
        offsetX: 0,
        offsetY: 0
      }
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

      var preview = this.$el.append('<div class="vogue-preview"><div class="vogue-preview-box"></div></div>')

      this.$('.vogue-preview').append(img).css({
        height: this.options.preview.height + 'px',
        width: this.options.preview.width + 'px'
      })

      $img.load(function () {
        self.original = {
          width: $img.width(),
          height: $img.height(),
          left: pxToNum($img.css('left')),
          top: pxToNum($img.css('top'))
        }

        var widthZoom = self.options.preview.width / self.original.width
          , heightZoom = self.options.preview.height / self.original.height
          , initialZoom = Math.min(widthZoom, heightZoom)
          , initialX = (self.options.preview.width - (self.original.width * initialZoom)) / 2
          , initialY = (self.options.preview.height - (self.original.height * initialZoom)) / 2

        self.cropState.offsetY = initialY
        self.cropState.offsetX = initialX
        self.zoom(initialZoom)

        var slider = new Slider({percentage: initialZoom})

        slider.on('change', function (percentage) {
          self.zoom(percentage)
        })

        self.$el.append(slider.render().el)
      })

      return this
    },

    zoom: function (zoom) {
      var $img = this.$('img')

      function zoomLocation (dimension, offset, zoom) {
        return (((dimension * (1-zoom)) / 2) - offset) * -1
      }

      $img.css({
        'transform': 'scale(' + (zoom) + ')',
        '-ms-transform': 'scale(' + (zoom) + ')',
        '-webkit-transform': 'scale(' + (zoom) + ')',
        left: zoomLocation(this.original.width, this.cropState.offsetX, zoom) + 'px',
        top: zoomLocation(this.original.height, this.cropState.offsetY, zoom)  + 'px'
      })

      this.cropState.zoom = zoom
    },

    startMove: function (e) {
      e.preventDefault()
      e.stopPropagation()

      $(document).on('mousemove touchmove', this.move)
      $(document).on('mouseup touchend', this.endMove)

      var $img  = this.$('img')
      this.dragStartLoc = {
        top: Number($img.css('top').replace('px', '')),
        left: Number($img.css('left').replace('px', '')),
        mouseX: pageX(e),
        mouseY: pageY(e)
      }
    },

    move: function (e) {
      // alert('move: ' + this.dragStartLoc.top + ' ' + this.dragStartLoc.left + ' ' + this.dragStartLoc.mouseY + ' ' + this.dragStartLoc.mouseX)

      e.stopPropagation()

      this.$('img').css({
        top: (this.dragStartLoc.top + pageY(e) - this.dragStartLoc.mouseY) + 'px',
        left: (this.dragStartLoc.left + pageX(e) - this.dragStartLoc.mouseX) + 'px'
      })
    },

    endMove: function (e) {
      e.preventDefault()
      $(document).off('mousemove touchmove', this.move)
      $(document).off('mouseup touchend', this.end)

      this.cropState.offsetX = this.cropState.offsetX + pageX(e) - this.dragStartLoc.mouseX
      this.cropState.offsetY = this.cropState.offsetY + pageY(e) - this.dragStartLoc.mouseY
    },

    click: function (e) {
      e.preventDefault()
    }
  })

  var Handle = Backbone.View.extend({
    className: 'slider-handle',

    events: {
      'mousedown': 'start',
      'touchstart': 'start',
      'click': 'click'
    },

    initialize: function () {
      _.bindAll(this, 'move', 'end')
    },

    start: function (e) {
      e.preventDefault()
      e.stopPropagation()

      $(document).on('mousemove touchmove', this.move)
      $(document).on('mouseup touchend', this.end)
    },

    move: function (e) {
      e.stopPropagation()
      var percentage = (pageX(e) - this.$el.parent().offset().left) / this.$el.parent().width()
      if (percentage > 0 && percentage < 1) {
        this.$el.css('left', parseInt(percentage * 100, 10) + '%')
        this.trigger('change', percentage)
      }
    },

    end: function (e) {
      e.preventDefault()
      $(document).off('mousemove touchmove gesturechange', this.move)
      $(document).off('mouseup touchend gestureend', this.end)
    },

    click: function (e) {
      e.preventDefault()
    }

  })

  var Slider = Backbone.View.extend({
    className: 'slider',

    template: '<div class="slider-bar"></div>',

    maxPercentage: 2,

    render: function () {
      this.$el.html(this.template)
      var handle = new Handle()

      handle.on('change', function (percentage) {
        this.trigger('change', percentage * this.maxPercentage)
      }, this)

      this.$('.slider-bar').append(handle.el)
      if (this.options.percentage) {
        handle.$el.css('left', (this.options.percentage * 100 / this.maxPercentage + '%'))
      }
      return this
    }
  })

  function pageX(e) {
    return e.type === 'touchmove' || e.type == 'touchstart' ? e.originalEvent.touches[0].pageX : e.pageX
  }

  function pageY(e) {
    return e.type === 'touchmove'|| e.type == 'touchstart' ? e.originalEvent.touches[0].pageY : e.pageY
  }

  root.Vogue = Vogue

})(window)