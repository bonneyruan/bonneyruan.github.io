$(window).scroll(function() {
  
  // selectors
  var $window = $(window),
      $body = $('body'),
      $panel = $('.panel');
      $location = $('.location')
      $recommend = $('.recommend-button')
  
  // Change 33% earlier than scroll position so colour is there when you arrive.
  var scroll = $window.scrollTop() + ($window.height() / 3);
 
  $panel.each(function () {
    var $this = $(this);
    
    // if position is within range of this panel.
    // So position of (position of top of div <= scroll position) && (position of bottom of div > scroll position).
    // Remember we set the scroll to 33% earlier in scroll var.
    if ($this.position().top <= scroll && $this.position().top + $this.height() > scroll) {
          
      // Remove all classes on body with color-
      $body.removeClass(function (index, css) {
        return (css.match (/(^|\s)color-\S+/g) || []).join(' ');
      });

      // Add class of currently active div
      $location.removeClass(function (index, css) {
        return (css.match (/(^|\s)location-color-\S+/g) || []).join(' ');
      });

      $recommend.removeClass(function (index, css) {
        return (css.match (/(^|\s)recommend-color-\S+/g) || []).join(' ');
      });
       
      $body.addClass('color-' + $(this).data('color'));
      $location.addClass('location-color-' + $(this).data('color'));
      $recommend.addClass('recommend-color-' + $(this).data('color'));
    }
  });    
  
}).scroll();


window.smoothScroll = function(target) {
    var scrollContainer = target;
    do { //find scroll container
        scrollContainer = scrollContainer.parentNode;
        if (!scrollContainer) return;
        scrollContainer.scrollTop += 1;
    } while (scrollContainer.scrollTop == 0);

    var targetY = 0;
    do { //find the top of target relatively to the container
        if (target == scrollContainer) break;
        targetY += target.offsetTop;
    } while (target = target.offsetParent);

    scroll = function(c, a, b, i) {
        i++; if (i > 30) return;
        c.scrollTop = a + (b - a) / 30 * i;
        setTimeout(function(){ scroll(c, a, b, i); }, 15);
    }
    // start scrolling
    scroll(scrollContainer, scrollContainer.scrollTop, targetY, 0);
}


// $(function() {
//   $('.location-restaurants').hover(function() {
//     $('.side-description').css('visibility', 'visible');
//   }, function() {
//     // on mouseout, reset the background colour
//     // $('.side-description').css('visibility', 'hidden');
//   });
// });

$(function() {
  $('#atelier-crenn').hover(function() {
    $('#restaurant-name').html('hellooooo');
    $('#snippet').html('Arguably the worlds only restaurant where, in place of a standard menu, guests receive an original poem, with specific lines of the poem loosely corresponding to the experimental dishes.');
  }, function() {
  });
});

$(function() {
  $('#bellota').hover(function() {
    $('#restaurant-name').html('Bellota');
    $('#snippet').html('You can find tapas restaurants all over SF, but Bellota is one that you cannot miss. Be sure to grab to octopus dish before you leave.');
  }, function() {
  });
});


$(function() {
  $('.restaurant-line').hover(function() {
    $('.sidebar').not('sustain-white').css('display', 'none');
    $('.side-description').css('display', 'block');
    
  })
});

// $(function() {
//   $('body').children().not('location-restaurants, side-description, sidebar').select().hover(function() {
//     $('.sidebar').css('display', 'flex');
//     $('.side-description').css('display', 'none');
    
//   })
// });

$(function() {
  $('.hover-hidden').hover(function() {
    $('.sidebar').css('display', 'flex');
    $('.side-description').css('display', 'none');
    
  })
});

