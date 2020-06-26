var f = 2;
var f_min =0;
var f_max = 100;

var freq = 1;
var freq_min = 0;
var freq_max = 1;

var contact = false;
var touch_point_start;
var touch_point;
var touch_start_time;
var touch_end_time;

var grow_rate = 400;
var decay_rate = 800;
var beta_decay = 0.05;
var amp = 2;

var contact_data = [];

var W;
var H;


//var interaction_variables = [touch_point];


const enable_interaction = true;
var get_mouse_pos = false;
var get_touch_pos = false;


const record_animation = false;
var stop_animation = false;

const pure_time_mode = true;
const t_purerate = .01;

var F = 1;
const fps = 30;
const total_frames = 1000;
const t_max = F*2*Math.PI;
const t_rate = t_max/total_frames;

var t = 0;
var frame = 0;
var loop = 0;

var fpsInterval, startTime, now, then, elapsed;



var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');


startAnimating(fps);


function draw() {
    
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;

    
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(0, 0, W, H);

    let k = 1;
    let w = 2;
    
    f = 1; 
    freq = .5*Math.cos(t/F) + .25*Math.sin(t/F);
    
    let breaks = contact_data.length;
    let whisp_height = Math.min(H, 10 + Math.floor(400*t));


    for (let i = 0; i < whisp_height; i++) {

        let alpha_i = 0.15*(1 - 1*(i/H)**(1));
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
        
        let y = wave(i, k, W, H, freq, f, t);
        let h = 2 + 0.2*H*(i/H)**4;
        whisp(i, alpha_i, H,k, h, w, y);
    }


    if ((Math.floor(window.performance.now()/1000))%5) {
        for (let j = breaks - 2; j >= 0; j--) {
            let data = contact_data[j];
            let start = data[1][0] + 400*(t - data[1][1]);
            if (start > H) {
                contact_data.splice(j,1);
            }
        }
    }
    
 
    if(!pure_time_mode) {
        frame = (frame+1)%total_frames;
        t = t_rate*frame;
    }
    else {
        t += t_purerate;
    }
        
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
    
    draw();
        
    if(record_animation) {
        if (frame + 1 === total_frames) {
            loop += 1;
        }

        if (loop === 1) { 
            let frame_number = frame.toString().padStart(total_frames.toString().length, '0');
            download('image_'+frame_number+'.png', canvas);
        }

        if (loop === 2) { stop_animation = true }
    }
        
    
    }

    if (stop_animation) {
        return;
    }

    if(enable_interaction) {

        canvas.addEventListener('mousedown', mousedown_action);
            
        canvas.addEventListener('mouseup', mouseup_action);

        if (get_mouse_pos) {
            canvas.addEventListener('mousemove', mousemove_action);
        }
        if (!get_mouse_pos) {
            canvas.removeEventListener('mousemove', mousemove_action);
        }

        canvas.addEventListener('touchstart', function(event) {
            event = event.touches[0];
            //event.preventDefault();
            get_touch_pos = true;
           // mousedown_action(event);
        }, false);
            
        canvas.addEventListener('touchend', function(event) {
            event = event.touches[0];
            //event.preventDefault();
            mouseup_action(event);
        }, false);
        
        if (get_touch_pos) {
        canvas.addEventListener('touchmove', function(event) {
            event = event.touches[0];
            //event.preventDefault();
            mousemove_action(event);
        }, false);
        }
    }

}

function whisp(i, alpha_i, H,k, h, w, y) {
        ctx.fillStyle = `rgba(255,255,255,${alpha_i})`;
        ctx.fillRect( y, H - i*k, h, w);
        ctx.fillRect( y, H - i*k, w, h);
        ctx.fillRect( y + h, H - i*k, w, h);
}

function decay_factor(i, start, end, beta, base, amp) {
    return base+ amp*0.5*(Math.exp(-beta*(i - start)) + Math.exp(-beta*(end - i)));
}



function contact_test(event) {
    point_x = event.clientX;
    point_y = canvas.height - event.clientY;
    y = wave(point_y, 1, W, H, freq, f, t);
    d = Math.max(10,2 + 0.2*H*(point_y/H)**4);
    if (Math.abs(y - point_x) < 2*d) {
        return true;
    }
    else {
        return false;
    }
}

function setTouchPoint(canvas, event) {   
    touch_start_time = t;
    touch_point_start = canvas.height - event.clientY;
    touch_point = touch_point_start;
    contact_data.push([[touch_point_start, touch_start_time]]);
}

function getTouchPosition(canvas, event) {
    var event = event.touches[0];
    interaction(canvas,event, ...interaction_variables)
}

function contact_action(e) {
    contact = true;
    get_mouse_pos = true;
    get_touch_pos = true;
    setTouchPoint(canvas, e);
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



function stwave1(x, A, L, f, t) {

    return A*0.5*(Math.sin(f*2*Math.PI*x/L + t) + Math.sin(f*2*Math.PI*x/L - t));

}

function stwave2(x, A, L, f, t) {

    return A*Math.sin(f*2*Math.PI*x/L)*Math.cos(t);

}

function wave(i, k, W, H, freq, f, t) {

     y = W/2 + stwave2(i*k, W/32 + W/8*(i/W)**1 , H, 1.5*(i/H), t) + stwave2(i*k, W/2*freq*(i/H)**4, H, freq*10, f*t);
    return y;

}



function download(filename, canvas) {
    dataURL = canvas.toDataURL();
    var element = document.createElement('a');
    element.setAttribute('href', dataURL);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);

    console.log('Downloaded ' + filename);
}
