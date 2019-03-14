$(window).on('resize', function() {
  if($(window).width() >= 683){
    $('.locations').css('display', 'block');
    $('.sidebar').css('height', '100%');
  }
  if($(window).width() < 683){
    $('.locations').css('display', 'none');
    $('.sidebar').css('height', 'auto');
  }
});

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

// if($(".side-description").is(':visible')){
//       $(".sidebar").css('display', 'flex'); 
//       $(".side-description").css('display', 'none'); 
//     }  

// $(".sidebar").css('height', 'auto');

// if($(".locations").is(':visible')){ 
//   console.log('asdfasdf')
//   $(".locations").addClass("fadeOut");
//   setTimeout( function(){
//     $(".locations").css("display"), "none"},1000);
//   // $(".locations").css("display", "none");
//     }  
  if($('.sidebar').height() != $(window).height()){
    $('.side-description').css('display', 'none'); 
    $(".sidebar").css('height', 'auto');
    if($('.locations').is(':visible')){
      $(".locations").css('display', 'none');   
    }
    // $('.restaurant-name').unbind('mouseenter mouseleave');
  }
  
  
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
    $('.side-description').animate({
      scrollTop: "0px"
    });
  }, function() {
  });
});

$(function() {
  $('#bellota').hover(function() {
    $('#restaurant-name').html('Bellota');
    $('#snippet').html('You can find tapas restaurants all over SF, but Bellota is one that you cannot miss. Be sure to grab to octopus dish before you leave.');
    $('.side-description').animate({
      scrollTop: "0px"
    });
  }, function() {
  });
});




// $(function() {
//   $('body').children().not('location-restaurants, side-description, sidebar').select().hover(function() {
//     $('.sidebar').css('display', 'flex');
//     $('.side-description').css('display', 'none');
    
//   })
// });
// $(function() {
//   $('.restaurant-name').hover(function() {
//     //hide sidebar on desktop
//     if($('.sidebar').height != (window).height){
//       $('.side-description').css('display', 'block');
//     }
//     $('.side-description').css('display', 'block');
//   })
// });

$(function() {
  $("#icon-toggle-container").click(function () {
    if($(".sidebar").height() != $(window).height()){
      if($(".side-description").is(':visible') && $('.locations').is(':hidden')){
        $(".locations").toggle('active'); 
        $(".sidebar").css('height', '70%');   
      }
      else{
        $(".locations").toggle('active'); 
        $(".sidebar").css('height', 'auto');
      }
      
    }
    
    // if($(".locations").height() > 0){
    //   $("locations").addClass("fadeOut"); 
    // }
    
    // $("locations").removeClass("fadeOut"); 
  });
});


//hover restaurant name, show side description
$(function() {
  $('.restaurant-name').hover(function() {
    //hide sidebar on desktop
    if($('.sidebar').height() == $(window).height()){
      // $('.sidebar').animate({
      //   opacity: 0
      // }, 5000, function() {
      $('.sidebar').not('sustain-white').css('display', 'none');
      // })

      // setTimeout(function(){
      //   $('.sidebar').not('sustain-white').css('display', 'none');
      //   $('.side-description').css('display', 'block');
      //   $('.intro').removeClass('fadeOut', 'fast').addClass('fadeIn');
      // }, 500);
      
    }
    $('.side-description').css('display', 'block');
  })
});

//mobile hover
$(function() {
  $('.restaurant-name').click(function() {
    //hide sidebar on desktop
    if($('.sidebar').height() != $(window).height()){
      $('.side-description').css('display', 'block');
    }
    
  })
});

//hide side description
$(function() {
  $('.hover-hidden').hover(function() {
    //show sidebar on desktop
    if($('.sidebar').height() == $(window).height()){
      $('.sidebar').css('display', 'flex'); 
      $('.side-description').css('display', 'none'); 
    }
  })
});

