$(document).ready(
    $("#button").on('click', function() {
        // once the document loads, create new item with this function
        var user_input = $('#todo-item-input').val();
        // alert(user_input);

        $('#list_todo').prepend("<li> <button id=startButton>start</button>" + user_input + "</li>");
    })
);

$("#list_todo").on('click', "button", function() {
        // move from list_todo container to list_doing container
        // console.log($(this).parent());

        $(this).html("later");

        var completedItem = $(this).parent();
        $("#list_doing").prepend(completedItem);
});

$("#list_doing").on('click', "button", function() {
        // move back from list_doing container to list_todo container

        $(this).html("start");

        var completedItem = $(this).parent()
        $("#list_todo").prepend(completedItem);
});
