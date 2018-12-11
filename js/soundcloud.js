// Event hander for calling the SoundCloud API using the user's search query
$(document).ready(function(){
    $("#searchbutton").click(function(){
    var user_input = $('#song').val();
    callAPI(user_input);
   });

    //PLAY SONG
    $(document).on('click', '.play', function(){
        var url = $(this).attr('songUrl');
        changeTrack(url);
    })

    //ADD SONG TO TOP OF PLAYLIST
    //DON'T REMOVE FROM SEARCH RESULTS (JQUERY .CLONE())
    $(document).on('click', '.addSong', function(){
        var clone = $(this).parent().parent().clone().find('.addSong').remove().end();
        clone.prependTo($('#playlist')).append('<td><button class="removeSong">Remove</button></td><td><button class="moveUp">Move Up</button></td><td><button class="moveDown">Move Down</button></td>');
    })

    //REMOVE SONG FROM PLAYLIST
    //USE JQUERY.REMOVE()
    $(document).on('click', '.removeSong', function(){
        $(this).parent().parent().remove();
    })

    //MOVE SONG UP OR DOWN ONE SPOT
    $(document).on('click', '.moveUp', function(){
        var song = $(this).parent().parent();
        song.insertBefore(song.prev());
    })

    $(document).on('click', '.moveDown', function(){
        var song = $(this).parent().parent();
        song.insertAfter(song.next());
    })

});

function callAPI(query) {
    $.get("https://api.soundcloud.com/tracks?client_id=b3179c0738764e846066975c2571aebb",
        {'q': query,
        'limit': '20'},
        function(data) {
            // PUT IN YOUR CODE HERE TO PROCESS THE SOUNDCLOUD API'S RESPONSE OBJECT
            // HINT: CREATE A SEPARATE FUNCTION AND CALL IT HERE
            console.log(data);
            processData(data);
        },'json'
    );
}

//HELPER FUNCTION TO PROCESS THE SOUNDCLOUD API'S RESPONSE OBJECT
function processData(data) {
    for (i=0;i<data.length;i++) {
        var picture = data[i].artwork_url;
        var songTitle = data[i].title;
        var artist = data[i].user.username;
        var url = data[i].permalink_url;
        if (picture==null) {
            picture = 'placeholder.jpg'
        }
        $('#resultssongs').append('<tr><td><img class="picture" src="'+picture+'"</td><td>'+songTitle+'</td><td>'+artist+'</td><td><button class=play songUrl="'+url+'">Play</button></td><td><button class="addSong">Add to Playlist</button></td></tr>')
    }
}


// 'Play' button event handler - play the track in the Stratus player
function changeTrack(url) {
    // Remove any existing instances of the Stratus player
    $('#stratus').remove();

    // Create a new Stratus player using the clicked song's permalink URL
    $.stratus({
      key: "b3179c0738764e846066975c2571aebb",
      auto_play: true,
      align: "bottom",
      links: url
    });
}



