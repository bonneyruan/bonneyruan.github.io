$(document).ready(function() {
  $("h1").lettering();
  $(".chaffle").chaffle();
  $('#typed').typed({
    strings: ['designer.','problem solver.', 'pizza enthusiast.', 'good pupper.', 't-shirt collector.', 'packaging admirer.'],
    showCursor: true,
    typeSpeed: 40,
    backSpeed: 20,
    shuffle: true,
    startDelay: 1000,
    backDelay: 1000, 
    loop: true,  

  });
});
