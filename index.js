var Preview = Backbone.View.extend({
  className: 'preview-box'

})

var Handle = Backbone.View.extend({
  tagName: 'a',

  className: 'slider-handle',

  events: {
    'mousedown': 'start'
  },

  initialize: function () {
    _.bindAll(this, 'move', 'end')
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
    }
  },

  end: function () {
    $(document).unbind('mousemove', this.move)
    $(document).unbind('mouseup', this.end)
  }

})

var Slider = Backbone.View.extend({
  className: 'slider',

  template: '<div class="slider-bar"></div>',

  render: function () {
    this.$el.html(this.template)
    var handle = new Handle

    this.$('.slider-bar').append(handle.el)
    return this
  }

})
