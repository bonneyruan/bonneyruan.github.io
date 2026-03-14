$(document).ready(function() {
  function flashTryAgain($message) {
    $message.removeClass('hidden tryagainfade');
    void $message.width();
    $message.addClass('tryagainfade');
  }

  if ($('#spotpark').length) {
    $('#spotpark').on('click', function() {
      $('#arrow').removeClass('hidden');
      $('#tryagaintext').text('OVER HERE');
      $('#tryagain').removeClass('hidden tryagainfade');
      $('#clicktoguess').addClass('hidden');
    });

    $('#spotbg').on('click', function(event) {
      $('#clicktoguess').addClass('hidden');
      if ($('#arrow').hasClass('hidden')) {
        event.preventDefault();
        flashTryAgain($('#tryagain'));
      }
    });
  }

  if ($('#millendsbutton').length) {
    let score = 0;
    let answeredCurrentQuestion = false;

    function revealAnswer(isCorrect) {
      if (answeredCurrentQuestion) {
        return;
      }

      answeredCurrentQuestion = true;

      if ($('#correct').hasClass('hidden') && $('#incorrect').hasClass('hidden') && isCorrect) {
        score += 1;
      }

      $('#correct').toggleClass('hidden', !isCorrect);
      $('#incorrect').toggleClass('hidden', isCorrect);
      $('#nextbutton').removeClass('hidden');
    }

    $('#millendsbutton').on('click', function() {
      if ($('#doorbutton').hasClass('hidden')) {
        $('#scoretext').text(score + ' out of 3');
        $('#scoreresults').removeClass('hidden');
      }
      revealAnswer(false);
    });

    $('#whalebutton').on('click', function() {
      revealAnswer(true);
    });

    $('#doorbutton').on('click', function() {
      revealAnswer(true);
    });

    $('#greatdanebutton').on('click', function() {
      revealAnswer(true);
      $('#scoretext').text(score + ' out of 3');
      $('#scoreresults').removeClass('hidden');
    });

    $('#nextbutton').on('click', function() {
      answeredCurrentQuestion = false;
      $('#incorrect, #correct, #nextbutton').addClass('hidden');

      if (!$('#whalebutton').hasClass('hidden')) {
        $('#whalebutton').addClass('hidden');
      } else if (!$('#doorbutton').hasClass('hidden')) {
        $('#doorbutton').addClass('hidden');
      }
    });
  }

  if ($('#maplocation').length) {
    $('#maplocation').on('click', function() {
      $('#mappin, #address').removeClass('hidden');
      $('#placepin, #tryagain').addClass('hidden');
    });

    $('#wherebg').on('click', function(event) {
      $('#placepin').addClass('hidden');
      $('#tryagain').removeClass('tryagainfade');

      if ($('#mappin').hasClass('hidden')) {
        event.preventDefault();
        flashTryAgain($('#tryagain'));
      }
    });
  }

  if ($('#morebutton').length) {
    let greenFillSection = -1;
    let numberMillion = 0;

    $('.greenfill').addClass('hidden');

    $('#morebutton').on('click', function() {
      $('#lessbuttonbg').css('opacity', '1');
      numberMillion += 100;

      if (numberMillion > 900) {
        $('#answertext').removeClass('hidden');
      }

      $('#hundredmillion').text(numberMillion + ' MILLION');
      $('.greenfill').eq(greenFillSection + 1).removeClass('hidden');

      if (greenFillSection === -1) {
        $('#zeromillion').addClass('hidden');
        $('#hundredmillion').removeClass('hidden');
      }

      if (greenFillSection < 9) {
        greenFillSection += 1;
      }
    });

    $('#lessbutton').on('click', function() {
      if (greenFillSection === 0) {
        $('#lessbuttonbg').css('opacity', '0.3');
        $('#zeromillion').removeClass('hidden');
        $('#hundredmillion').addClass('hidden');
      }

      numberMillion = numberMillion === 990 ? numberMillion - 90 : numberMillion - 100;
      if (numberMillion < 0) {
        numberMillion = 0;
      }

      $('#hundredmillion').text(numberMillion + ' MILLION');
      $('.greenfill').eq(greenFillSection).addClass('hidden');

      if (greenFillSection > -1) {
        greenFillSection -= 1;
      }
    });
  }
});
