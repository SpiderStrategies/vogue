/* TODO
  - add non-webkit stuff
  - When zooming, keep same center point
  - get rid of hardcoded 400x400 logic
  - initial offset for non-square images
  - touch events
  - TESTS!
*/
(function (root) {
  function pxToNum (px) {
    return parseInt(px.replace('px', ''))
  }

  var Vogue = Backbone.View.extend({
    className: 'vogue',

    events: {
      'mousedown': 'startMove',
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

      img.src = this.options.img

      var preview = this.$el.append('<div class="vogue-preview"><div class="vogue-preview-box"></div></div>')

      this.$('.vogue-preview-box').append(img).css({
        'height': '400px',
        'width': '400px'
      })

      $img.load(function () {
        self.original = {
          width: $img.width(),
          height: $img.height(),
          left: pxToNum($img.css('left')),
          top: pxToNum($img.css('top'))
        }

        var widthZoom = 400 / self.original.width
          , heightZoom = 400 / self.original.height
          , initialZoom = Math.min(widthZoom, heightZoom)

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
        '-webkit-transform': 'scale(' + (zoom) + ')',
        left: zoomLocation(this.original.width, this.cropState.offsetX, zoom) + 'px',
        top: zoomLocation(this.original.height, this.cropState.offsetY, zoom)  + 'px'
      })

      this.cropState.zoom = zoom
    },

    startMove: function (e) {
      e.preventDefault()
      e.stopPropagation()

      $(document).mousemove(this.move)
      $(document).mouseup(this.endMove)

      var $img  = this.$('img')
      this.dragStartLoc = {
        // TODO is this substring safe?
        top: Number($img.css('top').replace('px', '')),
        left: Number($img.css('left').replace('px', '')),
        mouseX: e.pageX,
        mouseY: e.pageY
      }
    },

    move: function (e) {
      e.stopPropagation()

      this.$('img').css({
        top: (this.dragStartLoc.top + e.pageY - this.dragStartLoc.mouseY) + 'px',
        left: (this.dragStartLoc.left + e.pageX - this.dragStartLoc.mouseX) + 'px'
      })
    },

    endMove: function (e) {
      e.preventDefault()
      $(document).unbind('mousemove', this.move)
      $(document).unbind('mouseup', this.end)

      this.cropState.offsetX = this.cropState.offsetX + e.pageX - this.dragStartLoc.mouseX
      this.cropState.offsetY = this.cropState.offsetY + e.pageY - this.dragStartLoc.mouseY
    },

    click: function (e) {
      e.preventDefault()
    }
  })

  var Handle = Backbone.View.extend({
    tagName: 'a',

    className: 'slider-handle',

    events: {
      'mousedown': 'start',
      'click': 'click'
    },

    initialize: function () {
      _.bindAll(this, 'move', 'end')
      this.$el.attr('href', '#')
    },

    start: function (e) {
      e.preventDefault()
      e.stopPropagation()

      $(document).mousemove(this.move)
      $(document).mouseup(this.end)
    },

    move: function (e) {
      e.stopPropagation()
      var percentage = (e.clientX - this.$el.parent().offset().left) / this.$el.parent().width()
      if (percentage > 0 && percentage < 1) {
        this.$el.css('left', parseInt(percentage * 100, 10) + '%')
        this.trigger('change', percentage)
      }
    },

    end: function (e) {
      e.preventDefault()
      $(document).unbind('mousemove', this.move)
      $(document).unbind('mouseup', this.end)
    },

    click: function (e) {
      e.preventDefault()
    }

  })

  var Slider = Backbone.View.extend({
    className: 'slider',

    template: '<div class="slider-bar"></div>',

    render: function () {
      this.$el.html(this.template)
      var handle = new Handle()

      handle.on('change', function (percentage) {
        this.trigger('change', percentage * 2)
      }, this)

      this.$('.slider-bar').append(handle.el)
      if (this.options.percentage) {
        handle.$el.css('left', (this.options.percentage * 100 / 2 + '%'))
      }
      return this
    }
  })


  root.Vogue = Vogue

})(window)