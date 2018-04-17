$(document).ready(function() {

  $(".chaffle").chaffle();
  $('#typed').typed({
    strings: ['designer.','visual communicator.', 'pizza enthusiast.', 'typography junkie.'],
    showCursor: true,
    typeSpeed: 40,
    backSpeed: 20,
    shuffle: true,
    startDelay: 1000,
    backDelay: 1000,
    loop: true,
  });

  // $(".link").click(function() {
  //   $('html,body').animate({
  //       scrollTop: $(".work").offset().top},
  //       'slow');
  // });
});


