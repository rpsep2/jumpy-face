//speed 3, ani speed 2000, create speed 1700
//speed 2, ani speed 1700, create speed 1400
//speed 1, ani speed 1400, create speed 1100

var is_device = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;

if(is_device)
    document.addEventListener('deviceReady', onDeviceReady);
else
    $(document).ready(onDeviceReady);

var config;

function onDeviceReady(){
    // load the config first
    load_config().done(function(data) {
        config = data;
        init();
    });

}

function load_config() {
    var d = $.Deferred();

    $.ajax({
        'url': "/js/config.json",
        'dataType': "json",
        success: function(data) {
            d.resolve(data);
        }
    });

    return d.promise();
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
    var $level = $('#level');
    var branch_row_distance = window_height * 0.8;
    var animation_time_per_branch = 3; // seconds
    var level_data;
    var time_since_level_start = 0;
    var total_level_height;
    var pixels_per_ms;

    // jump listener
    $body.on(start_event, jump);

    // build and start level
    build_level(1);
    start_level();

    function jump(event) {
        // clear the fall
        clearTimeout(jump_descent);
        clearTimeout(remove_rotate);
        $monkey.removeClass('rotate-left rotate-right');

        // check coordinate of tap. was it left side or right side? jump that direction accordingly
        var x_pos = event.originalEvent.touches[0].pageX;

        var matrix = $monkey.css('-webkit-transform').replace(/[^0-9\-.,]/g, '').split(',');
        var cur_top = parseInt(matrix[5]);
        var cur_left = parseInt(matrix[4]);
        var new_top = cur_top - jump_y;
        monkey_new_top = new_top;
        var dir = 'left';
        var new_left_on_up;
        var new_left_on_down;

        // down multipler
        var x_down_multiplier = (((monkey_default_y - new_top) / jump_y) * jump_x_half) * 0.85;
        // (((total distance to bottom) / jump_y) * jump_x_half) *0.85
        // as in: monkey moves jump_x_half pixels along x axis for every jump_y pixels on the y axis.
        // multiple by 0.85 as wont fall exactly the same as it jumps

        // jump left
        if (x_pos <= half_window_width) {
            if (cur_left <= min_left) {
                new_left_on_up = min_left;
                new_left_on_down = min_left;
            }
            else {
                new_left_on_up = Math.round(cur_left - jump_x_half);
                new_left_on_down = Math.round(new_left_on_up - x_down_multiplier);
            }
        }
        // jump right
        else {
            if (cur_left >= max_left) {
                new_left_on_up = max_left;
                new_left_on_down = max_left
            }
            else {
                new_left_on_up = Math.round(cur_left + jump_x_half);
                new_left_on_down = Math.round(new_left_on_up + x_down_multiplier);
            }
            dir = 'right';
        }

        $monkey.attr('class', 'rotate-' + dir).css({
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
            $monkey.removeClass('rotate-left rotate-right');
        }, 400);
    }

    function check_collision() {
        var offset = $monkey.offset();
        if (time_until_descent > 0)
            time_until_descent = ((time_until_descent - 20) < 0) ? 0 : time_until_descent - 20;

        time_since_level_start += 20;

        // have we hit a branch ?? what branches are currently on the view
        // TODO: the check
        var branch_no = Math.floor(time_since_level_start / (animation_time_per_branch * 1000)) - 1;
        // 2 branches can be on the page at any time
        if (branch_no < 0)
            var branch_nos = [0];
        else
            var branch_nos = [branch_no, branch_no + 1];

        // what is the current position of these branches?
        // work out number of px level has scrolled:
        // 100% = $level.height() : (branches.length + 1) * branch_row_distance
        // pixels per ms = above result, divided by (level_data.total_ani_time / 1000)
        // work outabove at level_start, then here:
        // pixels moved = time_since_level_start * pixels per ms
        // then, position top now = branch start_top + pixels moved.
        // so now we know the top pos, and we have level data for the width, and we know the height is 25
        // so is the monkey in any of these?

        // do this in level start
        //total_level_height created on level creation
        //pixels_per_ms created on level creation

        var pixels_moved = Math.round(time_since_level_start * pixels_per_ms);
        var hit = false;
        $.each(branch_nos, function(i, branch) {
            // say bottom start was 1000px. weve moved 500 px. bottom pos now is 500

            var branch_bottom_pos_now = level_data.branch_start_pos[branch] - pixels_moved;
            var branch_top_pos_now = branch_bottom_pos_now + 25;

            var branch_top_offset_now = window_height - branch_top_pos_now;
            var branch_bottom_offset_now = branch_top_offset_now + 25;


            // is the monkey within the branch row?
            if (offset.top <= branch_bottom_offset_now && offset.top >= branch_top_offset_now) {
                // uh oh - is it in the gap?

                // TODO: fix below
                var offset_left_percent = (100 / window_width) * offset.left;
                var offset_right_percent = (100 / window_width) * (offset.left + monkey_width);
                if (offset_left_percent <= level_data.structure.branches[branch].left || offset_right_percent >= (100 - level_data.structure.branches[branch].right))
                    // is in the gap! all okay
                    console.log('ok');
                else {
                    hit = true;
                    return false;
                }

            }
        });

        if (hit) {
            console.log('hit!!!!');
            show_has_hit_branch();
            return false;
        }

        // then check if we have hit the sides - dont allow to go off the sides
        // LEFT side hit
        if (offset.left <= 0) {
            // on the way down
            if ($monkey.hasClass('down')) {
                // work out animation time for down. 0.3s for every jump_y
                var distance_from_bottom = window_height - offset.top;
                var to_bottom_ani_time = ((distance_from_bottom - monkey_height) / jump_y) * 0.3;
                clearTimeout(jump_descent);
                $monkey.css({
                        '-webkit-transform': 'translate3d(' + min_left + 'px,' + monkey_default_y + 'px,0)',
                        '-webkit-transition': 'all ' + to_bottom_ani_time +'s linear'
                    });
            }
            // on the way up
            else {
                // set to max left and the original destined top
                // set animation time to however much time is left until we start falling
                $monkey.css({
                        '-webkit-transform': 'translate3d(' + min_left + 'px,' + monkey_new_top + 'px,0)',
                        '-webkit-transition': 'all ' + (time_until_descent / 1000) +'s linear'
                    });
            }
        }
        // RIGHT side hit
        else if (offset.left >= (window_width - monkey_width)){
            // on the way down
            if ($monkey.hasClass('down')) {
                // work out animation time for down. 0.3s for every jump_y
                var distance_from_bottom = window_height - offset.top;
                var to_bottom_ani_time = ((distance_from_bottom - monkey_height) / jump_y) * 0.3;
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

    function build_level(level) {
        level_data = config.levels[level];

        var branches = [];
        level_data['branch_start_pos'] = [];
        $.each(level_data.structure.branches, function(i, branch_set) {
            branches.push(create_branch_row(branch_set, i));
        });

        var bananas = [];

        $.each(level_data.structure.bananas, function(i, banana) {
            bananas.push(create_banana(banana));
        });

        // 3s per branch
        level_data['total_animation_time'] = (branches.length + 1) * animation_time_per_branch;
        total_level_height = (branches.length + 1) * branch_row_distance;
        pixels_per_ms = total_level_height / (level_data.total_animation_time * 1000);
        $level.append(branches, bananas).css({
            '-webkit-transition': 'all ' + level_data.total_animation_time + 's linear',
            height: total_level_height + 'px'
        });
    }

    function create_branch_row(data, i) {
        level_data['branch_start_pos'].push((i + 1) * branch_row_distance);
        var $row = $(document.createElement('div')).addClass('branch-row').css('bottom', (i + 1) * branch_row_distance);
        var $bl = $(document.createElement('div')).addClass('branch left').css('width', data.left + '%');
        var $br = $(document.createElement('div')).addClass('branch right').css('width', data.right + '%');
        $row.append($bl, $br);
        return $row;
    }

    function create_banana(data) {
        var $b = $(document.createElement('span')).addClass('banana').css({
            bottom: (data.position * branch_row_distance) - (branch_row_distance / 2),
            left: data.left
        });
        return $b;
    }

    function start_level(){
        time_since_level_start = 0;

        $level.css('-webkit-transform', 'translate3d(0,100%,0)');
        // collision loop
        collision_checker = setInterval(check_collision, 20);
    }

    function show_has_hit_branch() {
        // clear intervals, timeouts etc
        clearinterval(collision_checker);
        clearTimeout(jump_descent);
        clearTimeout(remove_rotate);

        // stop the level
        var l_matrix = $level.css('-webkit-transform').replace(/[^0-9\-.,]/g, '').split(',');
        var l_cur_top = parseInt(matrix[5]);
        $level.css('-webkit-transform', 'translate3d(0,' + l_cur_top + ',0)');

        // stop the monkey
        var m_matrix = $monkey.css('-webkit-transform').replace(/[^0-9\-.,]/g, '').split(',');
        var m_cur_top = parseInt(matrix[5]);
        var m_cur_left = parseInt(matrix[4]);
        $monkey.css('-webkit-transform', 'translate3d(' + m_cur_left + ',' + m_cur_top + ',0)');

        // animate monkey dieing (zoom, dead monkey bg, up then to the bottom)
        // TODO:

        // play sound effects (SMACK, monkey sound, gameover game sound effect)
        // TODO:

        // after x time animating/ playing sounds, show_gameover
        setTimeout(function() {
            show_gameover();
        }, 3000);
    }

    function show_gameover() {
        // show end score, gameover text etc
        // TODO:
    }
}