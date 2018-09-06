$(document).ready(function() { 
    $(".comming-soon").hover(
        function() {
            $(this).children('.text-wrapper').css('opacity','0.2');
            $(this).append(
                "<div class='comming-soon-message'>Comming Soon...</div>"
            );
            $(".comming-soon-message").fadeIn(200);
        }, function() {
            $(this).children('.text-wrapper').css('opacity','1');
            $(".comming-soon-message").remove();
        }
    );
    $(".select-game").click(
        function() {
            var index = $(".select-game").index(this);
            if(index == 0) {
                window.location.href = "speed_draw";
            } else if(index == 1) {
                window.location.href = "guess_draw";
            } else if(index == 2) {
                window.location.href = "draw_together";
            } else if(index == 3) {
                window.location.href = "about";
            }
        }
    );
    $("#return-home").click(
        function() {
            window.location.href = "../";
        }
    );
});

function startLoading(){
    document.getElementsByClassName("animationload")[0].style.display = "block";
}

function stopLoading(){
    document.getElementsByClassName("animationload")[0].style.display = "none";
}