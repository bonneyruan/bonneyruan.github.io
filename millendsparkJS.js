$(document).ready(function(){
  if(sessionStorage.getItem('save') != '1' && sessionStorage.getItem('save') != '2'){
    sessionStorage.setItem('save', '2');
  }
  if(sessionStorage.getItem('save') == '1'){
    $('.mini-site-container').toggleClass("zoomed");
    $('h2').text(function(i,v){
        return v === 'zoom in' ? 'zoom out' : 'zoom in'
    })
  }
  $('#zoom-button').click(function() {
    $('.mini-site-container').toggleClass("zoomed");
    $('h2').text(function(i,v){
        return v === 'zoom in' ? 'zoom out' : 'zoom in'
    })
    let val = $('.mini-site-container').hasClass("zoomed") ? '1' : '2';
    sessionStorage.setItem('save', val);
    });

  $('#spotpark').click(function() {
    $('#arrow').removeClass("hidden");
    $("#tryagaintext").text("OVER HERE");
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
  $('.otherlabel').addClass("hidden");
  });

$('#whalebutton').click(function() {
  $('#correct').removeClass("hidden");
  $('#nextbutton').removeClass("hidden");
  $('#millendslabel').addClass("hidden");
  score += 1;
  });

$('#doorbutton').click(function() {
  $('#correct').removeClass("hidden");
  $('#nextbutton').removeClass("hidden");
  $('#millendslabel').addClass("hidden");
  score += 1;
  });

$('#greatdanebutton').click(function() {
  $('#correct').removeClass("hidden");
  $('#nextbutton').removeClass("hidden");
  $('#millendslabel').addClass("hidden");
  score += 1;
  $('#scoretext').text(score+" out of 3");
  $('#scoreresults').removeClass("hidden");
  });

$('#nextbutton').click(function() {
  $('#incorrect').addClass("hidden");
  $('#correct').addClass("hidden");
  $('.otherlabel').removeClass("hidden");
  $('#millendslabel').removeClass("hidden");
  if($('#whalebutton').hasClass("hidden") && $('#doorbutton').not("hidden")){
    $('#doorbutton').addClass("hidden");
  }
  if($('#whalebutton').not("hidden")){
    $('#whalebutton').addClass("hidden");
  }
  });
});