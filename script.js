var f = 0.5;
var F = 1.9;
var freq;

var brightness = 0.15;
var beta_decay = 0.05;
var amp = 2;

var t = 0;
const t_rate = .01;
const fps = 30;

var whisp_height;
var max_whisp_height = 800;

var contact = false;
var touch_point_start;
var touch_point;
var touch_start_time;
var touch_end_time;

var contact_data = [];

const enable_interaction = true;
var get_mouse_pos = false;
var get_touch_pos = false;

var fpsInterval, startTime, now, then, elapsed;
var stop_animation = false;

var W;
var H;

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var scale = window.devicePixelRatio;
var re_scale = scale;

var grow_rate = 400/re_scale;
var decay_rate = 600/re_scale;

startAnimating(fps);


function draw() {
    
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;

    ctx.save();
    ctx.translate(-W/2*(scale-1), -H*(scale-1) )
    ctx.scale(scale, scale);
       
    freq = .5*Math.cos(t/F) + .25*Math.sin(.1*t/F);
    
    let breaks = contact_data.length;

    whisp_height = Math.floor(Math.min(0.8*H/re_scale, 10 + Math.floor(grow_rate*t)));

    for (let i = 0; i < whisp_height; i++) {

        let alpha_i = brightness*(1 - 1*(i/whisp_height)**(1));
        if (breaks > 0) {
        for (let j = breaks - 1; j >= 0; j--) {
            let data = contact_data[j];
            if ( j === breaks - 1) {
                if (contact) {
                    dt_start = 0;       
                }
                else {
                    dt_start = grow_rate*(t - touch_end_time);
                }
                
                dt_end = decay_rate*(t - touch_start_time);
                

                start = touch_point + dt_start;

                end = touch_point_start + dt_end;

                if (start < i && i < end) {
                    alpha_i *= decay_factor(i, start, end, beta_decay, 0.01, amp);
                }
            }
            else {
                dt_start = grow_rate*(t - data[1][1]);
                dt_end = decay_rate*(t - data[0][1]);

                start = data[1][0] + dt_start;
                end = data[0][0] + dt_end;
                if (start < i && i < end) {
                    alpha_i *= decay_factor(i, start, end, beta_decay, 0.01, amp);
                }    
            }    
        }
        }
        
        let y = wave(i, 1, 1, W, whisp_height, freq, f, t);
        let h = 2 + 0.2*whisp_height*(i/whisp_height)**4;
        whisp(i, alpha_i, H, 1, h, 2, W/2, y);
    }

    //(Math.floor(window.performance.now()/1000))%5
    if (breaks > 5) {
        for (let j = breaks - 2; j > 0; j--) {
            let data = contact_data[j];
            let start = data[1][0] + grow_rate*(t - data[1][1]);
            if (start > H/re_scale) {
                contact_data.splice(j,1);
            }
        }
    }
      
    t += t_rate;

    ctx.restore();
           
}

function startAnimating(fps) {
    
    fpsInterval = 1000/fps;
    then = window.performance.now();
    startTime = then;
    
    animate();
 }


function animate(newtime) {

    requestAnimationFrame(animate);
 
    now = newtime;
    elapsed = now - then;

    if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);
        if(!stop_animation) {
        draw();
        }    
    }

    
    if(enable_interaction) {
        
        canvas.addEventListener('mousedown', mousedown_action);
            
        canvas.addEventListener('mouseup', mouseup_action);

        canvas.addEventListener('mouseleave', mouseup_action);

        if (get_mouse_pos) {
            canvas.addEventListener('mousemove', mousemove_action);
        }
        if (!get_mouse_pos) {
            canvas.removeEventListener('mousemove', mousemove_action);
        }

        canvas.addEventListener('touchstart', function(event) {
            event.preventDefault();  
            var event = event.touches[0];
            get_touch_pos = true;
        }, false);
            
        canvas.addEventListener('touchend', function(event) {
            event.preventDefault();  
            var event = event.touches[0];
            mouseup_action(event);
        }, false);
        
        if (get_touch_pos) {
        canvas.addEventListener('touchmove', function(event) {
            event.preventDefault();
            var event = event.touches[0];
            mousemove_action(event);
        }, false);
        }
    }

}

function mousedown_action(e) {
    get_mouse_pos = true;
    get_touch_pos = true;
    if (contact_test(e)) {
        contact_action(e);
    }
}

function mouseup_action(e) {
    get_mouse_pos = false;
    get_touch_pos = false;
    if (contact) {
        contact = false;
        touch_end_time = t;
        contact_data[contact_data.length - 1].push([touch_point, touch_end_time]);
    }   
}

function mousemove_action(e) {
    if(contact) {
        if (contact_test(e)) {
            p = canvas.height - e.clientY;
            if( p < touch_point) {
                touch_point = p;
            }
        }
        else {
            contact = false;
            touch_end_time = t;
            contact_data[contact_data.length - 1].push([touch_point, touch_end_time]);
        }
    }  
    if(!contact) {
        if(contact_test(e)) {
            contact_action(e);     
        }
    }
    
}

function contact_test(event) {
    point_x = event.clientX;
    point_y = (canvas.height - event.clientY)/re_scale;
    y = W/2 + wave(point_y, re_scale, 1, W, whisp_height, freq, f, t);
    d = Math.max(10,2 + 0.2*whisp_height*(point_y/whisp_height)**4);
    if (Math.abs(y - point_x) < 2*d) {
        return true;
    }
    else {
        return false;
    }
}

function contact_action(e) {
    contact = true;
    get_mouse_pos = true;
    get_touch_pos = true;
    setTouchPoint(canvas, e);
}

function setTouchPoint(canvas, event) {   
    touch_start_time = t;
    touch_point_start = (canvas.height - event.clientY)/re_scale;
    touch_point = touch_point_start;
    contact_data.push([[touch_point_start, touch_start_time]]);
}


function wave(i, scale, k, W, H, freq, f, t) {

    y = scale*Math.cos(f*t)*((W/32 + W/8*(i*k/W)**1)*Math.sin(1.5*(i*k/H)*2*Math.PI*i*k/H) + (W/2*freq*(i*k/H)**4)*Math.sin(freq*10*2*Math.PI*i*k/H));
   return y;
}

function whisp(i, alpha, H,k, h, w, pos, y) {
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect( pos + y, H - i*k, h, w);
    ctx.fillRect( pos + y, H - i*k, w, h);
    ctx.fillRect( pos + y + h, H - i*k, w, h);
}

function decay_factor(i, start, end, beta, base, amp) {
    return base+ amp*0.5*(Math.exp(-beta*(i - start)) + Math.exp(-beta*(end - i)));
}