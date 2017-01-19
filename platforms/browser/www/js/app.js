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
    var $monkey = $('#monkey');
    var monkey_width = $monkey.width();
    var half_monkey_width = monkey_width / 2;
    var monkey_height = $monkey.height();
    var start_event = 'ontouchend' in document ? 'touchstart' : 'mousedown';
    var end_event = 'ontouchend' in document ? 'touchend' : 'mouseup';
    var window_width = $window.width();
    var window_height = $window.height();
    var half_window_width = window_width / 2;
    var jump_x = Math.round(window_width / 2); // set amount a jump moves left/right dependant on screen size
    var jump_y = Math.round(window_height / 5); // set amount a jump moves up dependant on screen size
    var jump_x_half = jump_x / 2;
    var jump_descent;
    var monkey_default_y = 200;
    var monkey_new_top;
    var collision_checker;
    var time_until_descent;
    var min_left = -(half_window_width - half_monkey_width);
    var max_left = half_window_width - half_monkey_width;
    var remove_rotate;

    // jump listener
    $body.on(start_event, jump);

    function jump(event) {
        // collision loop
        if (!collision_checker)
            collision_checker = setInterval(check_collision, 20);

        // clear the fall
        clearTimeout(jump_descent);
        clearTimeout(remove_rotate);

        // check coordinate of tap. was it left side or right side? jump that direction accordingly
        var x_pos = event.originalEvent.touches[0].pageX;

        var matrix = $monkey.css('-webkit-transform').replace(/[^0-9\-.,]/g, '').split(',');
        var cur_top = parseInt(matrix[5]);
        var cur_left = parseInt(matrix[4]);
        var new_top = cur_top - jump_y;
        monkey_new_top = new_top;

        // down multipler
        var x_down_multiplier = (((monkey_default_y - new_top) / jump_y) * jump_x_half) * 0.85;
        // (((total distance to bottom) / jump_y) * jump_x_half) *0.85
        // as in: monkey moves jump_x_half pixels along x axis for every jump_y pixels on the y axis.
        // multiple by 0.85 as wont fall exactly the same as it jumps


        // jump left
        if (x_pos <= half_window_width) {
            var new_left_on_up = Math.round(cur_left - jump_x_half);
            var new_left_on_down = Math.round(new_left_on_up - x_down_multiplier);
            if (cur_left <= min_left) {
                new_left_on_up = min_left;
                new_left_on_down = min_left
            }
        }
        // jump right
        else {
            var new_left_on_up = Math.round(cur_left + jump_x_half);
            var new_left_on_down = Math.round(new_left_on_up + x_down_multiplier);
            if (cur_left >= max_left) {
                new_left_on_up = max_left;
                new_left_on_down = max_left
            }
        }

        $monkey.removeClass('rotate').addClass('rotate').css({
            '-webkit-transform': 'translate3d(' + new_left_on_up + 'px,' + new_top + 'px,0)',
            '-webkit-transition': 'all 0.15s ease-out'
        });

        // work out animation time for down. 0.3s for every jump_y
        var to_bottom_ani_time = ((monkey_default_y - new_top) / jump_y) * 0.3;
        time_until_descent = 150;
        jump_descent = setTimeout(function() {
            $monkey.addClass('down')
                .css({
                    '-webkit-transform': 'translate3d(' + new_left_on_down + 'px,' + monkey_default_y + 'px,0)',
                    '-webkit-transition': 'all ' + to_bottom_ani_time +'s ease-in'
                });
        }, 150);

        remove_rotate = setTimeout(function() {
            $monkey.removeClass('rotate');
        }, 400);
    }

    function check_collision() {
        var offset = $monkey.offset();
        if (time_until_descent > 0)
            time_until_descent = ((time_until_descent - 20) < 0) ? 0 : time_until_descent - 20;


        // have we hit a branch ??
        // TODO: the check
        // TODO: has_hit_branch(); (show animation, sound seffectcs etc)
        // TODO: then show_gameover();

        // then check if we have hit the sides - dont allow to go off the sides
        // LEFT side hit
        if (offset.left <= 0) {
            // on the way down
            if ($monkey.hasClass('down')) {
                // work out animation time for down. 0.3s for every jump_y
                var distance_from_top = window_height - offset.top;
                var to_bottom_ani_time = ((distance_from_top - monkey_height) / jump_y) * 0.3;
                clearTimeout(jump_descent);
                $monkey.css({
                        '-webkit-transform': 'translate3d(-' + min_left + 'px,' + monkey_default_y + 'px,0)',
                        '-webkit-transition': 'all ' + to_bottom_ani_time +'s linear'
                    });
            }
            // on the way up
            else {
                // set to max left and the original destined top
                // set animation time to however much time is left until we start falling
                $monkey.css({
                        '-webkit-transform': 'translate3d(-' + min_left + 'px,' + monkey_new_top + 'px,0)',
                        '-webkit-transition': 'all ' + (time_until_descent / 1000) +'s linear'
                    });
            }
        }
        // RIGHT side hit
        else if (offset.left >= (window_width - monkey_width)){
            // on the way down
            if ($monkey.hasClass('down')) {
                // work out animation time for down. 0.3s for every jump_y
                var distance_from_top = window_height - offset.top;
                var to_bottom_ani_time = ((distance_from_top - monkey_height) / jump_y) * 0.3;
                clearTimeout(jump_descent);
                $monkey.css({
                        '-webkit-transform': 'translate3d(' + max_left + 'px,' + monkey_default_y + 'px,0)',
                        '-webkit-transition': 'all ' + to_bottom_ani_time +'s linear'
                    });
            }
            // on the way up
            else {
                // set to max right and the original destined top
                // set animation time to however much time is left until we start falling
                $monkey.css({
                        '-webkit-transform': 'translate3d(' + max_left + 'px,' + monkey_new_top + 'px,0)',
                        '-webkit-transition': 'all ' + (time_until_descent / 1000) +'s linear'
                    });
            }
        }
    }
}