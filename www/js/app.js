//speed 3, ani speed 2000, create speed 1700
//speed 2, ani speed 1700, create speed 1400
//speed 1, ani speed 1400, create speed 1100

var is_device = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;

if(is_device)
    document.addEventListener('deviceReady', onDeviceReady);
else
    $(document).ready(init);

function onDeviceReady(){
    init();

    setTimeout(function() {
        StatusBar.hide();
        navigator.splashscreen.hide();
    }, 4000);
}

function init(){
    // admob banners on ipad appear taller than on iphone. make the floor higher
    if (is_device)
        if (device.model.match(/ipad/i))
            $('#container').addClass('ipad');

    var $window = $(window);
    var $body = $('body');
    var $face = $('#face');
    var start_event = 'ontouchend' in document ? 'touchstart' : 'mousedown';
    var end_event = 'ontouchend' in document ? 'touchend' : 'mouseup';
    var window_width = $window.width();
    var window_height = $window.height();
    var half_window_width = window_width / 2;
    var jump_x = Math.round(window_width / 4.5); // set amount a jump moves left/right dependant on screen size
    var jump_y = Math.round(window_height / 5); // set amount a jump moves up dependant on screen size
    var jump_x_half = jump_x / 2;
    var jump_descent;
    var face_default_y = 200;

    $body.on(start_event, face_jump);

    function face_jump(event) {
        // clear the fall
        clearTimeout(jump_descent);
        $face.removeClass('up').removeClass('down');

        // check coordinate of tap. was it left side or right side? jump that direction accordingly
        var x_pos = event.originalEvent.touches[0].pageX;

        var matrix = $face.css('-webkit-transform').replace(/[^0-9\-.,]/g, '').split(',');
        var cur_top = parseInt(matrix[5]);
        var cur_left = parseInt(matrix[4]);
        var new_top = cur_top - jump_y;

        // down multipler
        var x_down_multiplier = (((face_default_y - new_top) / jump_y) * jump_x_half) * 0.85;
        // (((total distance to bottom) / jump_y) * jump_x_half) *0.85
        // as in: face moves jump_x_half pixels along x axis for every jump_y pixels on the y axis.
        // multiple by 0.85 as wont fall exactly the same as it jumps

        $face.addClass('up');

        // jump left
        if (x_pos <= half_window_width) {
            var new_left_on_up = Math.round(cur_left - jump_x_half);
            var new_left_on_down = Math.round(new_left_on_up - x_down_multiplier);
        }
        // jump right
        else {
            var new_left_on_up = Math.round(cur_left + jump_x_half);
            var new_left_on_down = Math.round(new_left_on_up + x_down_multiplier);
        }

        $face.css('-webkit-transform', 'translate3d(' + new_left_on_up + 'px,' + new_top + 'px,0)');

        jump_descent = setTimeout(function() {
            $face.removeClass('up')
                .addClass('down')
                .css('-webkit-transform', 'translate3d(' + new_left_on_down + 'px,' + face_default_y + 'px,0)');
        });
    }
}