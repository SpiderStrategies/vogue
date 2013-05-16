var Vogue = require('./vogue')
  , assert = chai.assert

describe('Vogue', function () {
  var inception

  describe('render', function () {
    it('square image, zoomed and positioned with half of border filled', function (done) {
      var vogue = initSquare(530, 530)

      vogue.loaded().then(function () {
        var vwin = vogue.window()
        assert.equal(vwin.zoom, 1)
        assert.equal(vwin.x, 15)
        assert.equal(vwin.y, 15)
        assert.equal(vwin.width, 470)
        assert.equal(vwin.height, 470)
        done()
      })
    })

    it('tall image, zoomed and positioned with half of left/right borders filled', function (done) {
      var vogue = initTall(230, 230)

      vogue.loaded().then(function () {
        var vwin = vogue.window()
        assert.equal(vwin.zoom, .5)
        assert.equal(vwin.x, 15)
        assert.equal(vwin.y, 65)
        assert.equal(vwin.width, 170)
        assert.equal(vwin.height, 170)
        done()
      })
    })

    it('wide image, zoomed and positioned with half of top/bottom borders filled', function (done) {
      var vogue = initWide(230, 230)

      vogue.loaded().then(function () {
        var vwin = vogue.window()
        assert.equal(vwin.zoom, .5)
        assert.equal(vwin.x, 65)
        assert.equal(vwin.y, 15)
        assert.equal(vwin.width, 170)
        assert.equal(vwin.height, 170)
        done()
      })
    })
  })

  describe('minZoom and maxZoom', function () {
    it('minZoom is smallest amount that will have no whitespace, max zoom is 3x that', function (done) {
      var vogue = initSquare(310, 310)

      vogue.loaded().then(function () {
        assert.equal(vogue._minZoom, .5)
        assert.equal(vogue._maxZoom, 1.5)
        done()
      })
    })

    it('minZoom/maxZoom for a wide image', function (done) {
      var vogue = initWide(260, 260)

      vogue.loaded().then(function () {
        assert.equal(vogue._minZoom, .5)
        assert.equal(vogue._maxZoom, 1.5)
        done()
      })
    })

    it('minZoom/maxZoom for a tall image', function (done) {
      var vogue = initTall(260, 260)

      vogue.loaded().then(function () {
        assert.equal(vogue._minZoom, .5)
        assert.equal(vogue._maxZoom, 1.5)
        done()
      })
    })
  })

  describe('zoom', function () {
    it('zooms in', function (done) {
      var vogue = initSquare(500, 500)

      vogue.loaded().then(function () {
        vogue.zoom(2)
        var vwin = vogue.window()
        assert.equal(vwin.zoom, 2)
        assert.equal(vwin.x, 280)
        assert.equal(vwin.y, 280)
        assert.equal(vwin.width, 440)
        assert.equal(vwin.height, 440)
        done()
      })
    })
  })

  describe('move', function () {
    it('drags on mouse click/move', function (done) {
      vogue = initSquare(500, 500)

      vogue.loaded().then(function () {
        var startX = vogue.$el.position().left + 10
          , startY = vogue.$el.position().top + 10
          , finishX = startX + 10
          , finishY = startY + 10
          , initWindow = vogue.window()

        vogue.$el.trigger($.Event('mousedown', {pageX: startX, pageY: startY}))
        vogue.$el.trigger($.Event('mousemove', {pageX: finishX, pageY: finishY}))
        vogue.$el.trigger($.Event('mouseup', {pageX: finishX, pageY: finishY}))

        var vwin = vogue.window()
        assert.equal(vwin.zoom, initWindow.zoom)
        // Moving image down/right moves the window corner up/left
        assert.equal(vwin.x, initWindow.x - 10)
        assert.equal(vwin.y, initWindow.y - 10)
        assert.equal(vwin.width, initWindow.width)
        assert.equal(vwin.height, initWindow.height)
        done()
      })
    })

    it('does not drag edge of image past the window frame (ie no whitespace in window)', function (done) {
      vogue = initSquare(530, 530)

      vogue.loaded().then(function () {
        var startX = vogue.$el.position().left + 15
          , startY = vogue.$el.position().top + 15
          , finishX = startX + 15
          , finishY = startY + 15
          , initWindow = vogue.window()

        vogue.$el.trigger($.Event('mousedown', {pageX: startX, pageY: startY}))
        vogue.$el.trigger($.Event('mousemove', {pageX: finishX, pageY: finishY}))
        vogue.$el.trigger($.Event('mouseup', {pageX: finishX, pageY: finishY}))

        var vwin = vogue.window()
        assert.equal(vwin.x, 0)
        assert.equal(vwin.y, 0)


        vogue.$el.trigger($.Event('mousedown', {pageX: finishX, pageY: finishY}))
        vogue.$el.trigger($.Event('mousemove', {pageX: finishX + 200, pageY: finishY + 200}))
        vogue.$el.trigger($.Event('mouseup', {pageX: finishX + 200, pageY: finishY + 200}))

        vwin = vogue.window()
        assert.equal(vwin.x, 0)
        assert.equal(vwin.y, 0)

        vogue.$el.trigger($.Event('mousedown', {pageX: finishX, pageY: finishY}))
        vogue.$el.trigger($.Event('mousemove', {pageX: finishX - 200, pageY: finishY - 200}))
        vogue.$el.trigger($.Event('mouseup', {pageX: finishX - 200, pageY: finishY - 200}))

        vwin = vogue.window()
        assert.equal(vwin.x, 30)
        assert.equal(vwin.y, 30)

        done()
      })
    })
  })

  function init (img, width, height) {
    vogue = new Vogue({
      img: img,
      preview: {
        width: width,
        height: height
      }
    })
    $('#vogue-container').append(vogue.render().el)
    return vogue
  }

  function initSquare (width, height) {
    return init('./open_key_notation.png', width, height)
  }

  function initTall (width, height) {
   return init('./voyager.jpg', width, height)
  }

  function initWide (width, height) {
   return init('./my-mail-server.jpg', width, height)
  }

  beforeEach(function () {
    $('body').append('<div id="vogue-container"></div>')
  })

  afterEach(function () {
    $('#vogue-container').remove()
  })
})