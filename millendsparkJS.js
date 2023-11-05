$(document).ready(function(){

  if(sessionStorage.getItem('save') != '1' && sessionStorage.getItem('save') != '2'){
    sessionStorage.setItem('save', '2');
  }
  if(sessionStorage.getItem('save') == '1'){
    $('.mini-site-container').toggleClass("zoomed");
    $('h2').text(function(i,v){
        return v === 'zoom in' ? 'zoom out' : 'zoom in'
    })
    $('.historysite').toggleClass("labelborderhidden");
  }
  $('#zoom-button').click(function() {
    $('.mini-site-container').toggleClass("zoomed");
    $('h2').text(function(i,v){
        return v === 'zoom in' ? 'zoom out' : 'zoom in'
    })
    let val = $('.mini-site-container').hasClass("zoomed") ? '1' : '2';
    sessionStorage.setItem('save', val);
    $('.historysite').toggleClass("labelborderhidden");
    });

  $('#spotpark').click(function() {
    $('#arrow').removeClass("hidden");
    $("#tryagaintext").text("OVER HERE");
    $('#tryagain').removeClass("hidden");
    $('#tryagain').removeClass("tryagainfade");
    $('#clicktoguess').addClass("hidden");
    });

$('#spotbg').click(function(event) {
  $('#clicktoguess').addClass("hidden");
  if ($('#arrow').hasClass("hidden")) {
    $('#tryagain').removeClass("hidden");
    event.preventDefault();
    $('#tryagain').removeClass("tryagainfade");
    void $('#tryagain').width();
    $('#tryagain').addClass("tryagainfade");
  }
  });


var score = 0;
$('#millendsbutton').click(function() {
  if($('#doorbutton').hasClass("hidden")){
    $('#scoretext').text(score+" out of 3");
    $('#scoreresults').removeClass("hidden");
  }
  $('#incorrect').removeClass("hidden");
  $('#nextbutton').removeClass("hidden");
  });

$('#whalebutton').click(function() {
  if($('#correct').hasClass("hidden") && $('#incorrect').hasClass("hidden")){
    score += 1;
  }
  $('#correct').removeClass("hidden");
  $('#nextbutton').removeClass("hidden");
  });

$('#doorbutton').click(function() {
  if($('#correct').hasClass("hidden") && $('#incorrect').hasClass("hidden")){
    score += 1;
  }
  $('#correct').removeClass("hidden");
  $('#nextbutton').removeClass("hidden");
  });

$('#greatdanebutton').click(function() {
  if($('#correct').hasClass("hidden") && $('#incorrect').hasClass("hidden")){
    score += 1;
  }
  $('#correct').removeClass("hidden");
  $('#nextbutton').removeClass("hidden");
  $('#scoretext').text(score+" out of 3");
  $('#scoreresults').removeClass("hidden");
  });

$('#nextbutton').click(function() {
  $('#incorrect').addClass("hidden");
  $('#correct').addClass("hidden");
  if($('#whalebutton').hasClass("hidden") && $('#doorbutton').not("hidden")){
    $('#doorbutton').addClass("hidden");
  }
  if($('#whalebutton').not("hidden")){
    $('#whalebutton').addClass("hidden");
  }
  $('#nextbutton').addClass("hidden");
  });

$('#maplocation').click(function() {
  $('#mappin').removeClass("hidden");
  $('#address').removeClass("hidden");
  $('#placepin').addClass("hidden");
  $('#tryagain').addClass("hidden");
  });

$('#wherebg').click(function() {
  $('#placepin').addClass("hidden");
  $('#tryagain').removeClass("tryagainfade");
  if ($('#mappin').hasClass("hidden")) {
    $('#tryagain').removeClass("hidden");
    event.preventDefault();
    $('#tryagain').removeClass("tryagainfade");
    void $('#tryagain').width();
    $('#tryagain').addClass("tryagainfade");
  }
  });

// how many
var greenfillsection = -1
var numbermillion = 0
$('.greenfill').addClass("hidden");
$('#morebutton').click(function() {
  $('#lessbuttonbg').css('opacity', '1');
  numbermillion += 100;
  if (numbermillion > 900) {
    $('#answertext').removeClass("hidden");
  }
  $('#hundredmillion').text(numbermillion + " MILLION");
  $('.greenfill').eq(greenfillsection+1).removeClass("hidden");
    if (greenfillsection == -1) {
      $('#zeromillion').addClass("hidden");
      $('#hundredmillion').removeClass("hidden");
    }
    if (greenfillsection < 9) {
      greenfillsection += 1;
    }
  });
$('#lessbutton').click(function() {
  if (greenfillsection == 0) {
      $('#lessbuttonbg').css('opacity', '0.3');
      $('#zeromillion').removeClass("hidden");
      $('#hundredmillion').addClass("hidden");
    }
  if (numbermillion == 990) {
    numbermillion -= 90;
  }
  else{
    numbermillion -= 100;
  }
  if (numbermillion < 0) {
    numbermillion = 0;
  }
  $('#hundredmillion').text(numbermillion + " MILLION");
  $('.greenfill').eq(greenfillsection).addClass("hidden");
    if (greenfillsection > -1) {
      greenfillsection -= 1;
    }
  });


});