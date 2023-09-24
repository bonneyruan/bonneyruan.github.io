$(document).ready(function(){
  if(sessionStorage.getItem('save') != '1' && sessionStorage.getItem('save') != '2'){
    alert('empty');
    sessionStorage.setItem('save', '1');
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
    console.log(val);
    sessionStorage.setItem('save', val);
    alert(sessionStorage.getItem('save'));
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
});