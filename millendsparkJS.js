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
    });

$('#spotbg').click(function(event) {
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
  });
});