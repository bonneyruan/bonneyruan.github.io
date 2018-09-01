// background not maintained when too many tasks added onto screen
// button click on redo should prepend task to to do list without strikethrough
// add media queries
// add blurb for how to use

$(document).ready(
    $("#button").on('click', function() {
        // once the document loads, create new item with this function
        var user_input = $('#todo-item-input').val();
        // alert(user_input);

        // clear input field upon adding task
        $("#todo-item-input").val(function() {
            this.value = '';
        });

        $('#list_todo').prepend("<li> <button id=startButton>start</button>" + user_input + "</li>");
    })
);

$("#list_todo").on('click', "button", function() {
        // move from list_todo container to list_doing container
        // console.log($(this).parent());

        $(this).html("done");

        var completedItem = $(this).parent();
        $("#list_doing").prepend(completedItem);
});

$("#list_doing").on('click', "button", function() {
        // move back from list_doing container to list_todo container
        $(this).html("done");

        var completedItem = $(this).parent();
        // strikethrough completed items
        completedItem.attr("id", "strikethrough");
        // move completed items to bottom of doing list
        $('#list_doing').append($(completedItem))

});

// trigger +task button by pressing enter key
$('#todo-item-input').keyup(function(event) {
    if (event.keyCode === 13) {
        $('#button').click();
    }
});






