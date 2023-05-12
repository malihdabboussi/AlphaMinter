const { net, ipcRenderer } = require('electron');


/**
 * Clock of the application
 */
let listing = []
setInterval(() => {
    const date = new Date();
    const [hours, minutes, seconds] =
        [date.getHours(), date.getMinutes(), date.getSeconds()]
            .map(e => e.toString().padStart(2, '0'));
    const timezone = hours > 12 ? 'PM' : 'AM';
    $('#app-clock').html(`${hours}:${minutes}:${seconds} ${timezone}`);

}, 1000);

setInterval(async () => {
    ipcRenderer.invoke('refresh_gas').then(result => {
        $('.base-price').html(result['gas_prices']['low']);
        $('.rapid-price').html(result['gas_prices']['fast']);
    })
}, 5000)

/* Switch between tools */
let toolButtons = $('.tool');
let tools = $('.tool-element');
let main_text = $('.main_text');
$('.tool').on('click', function () {
    var list = tools.querySelectorAll;
    for (var i = 0; i < toolButtons.length; i++) {
        if (toolButtons[i] != $(this)[0]) {
            toolButtons[i].className = 'align-items-center justify-content-between tool';
            if (tools[i]) {
                $(tools[i]).fadeOut(500);
                tools[i].display = 'none';
            }
        } else {
            toolButtons[i].className = 'align-items-center justify-content-between tool active';
            if (tools[i]) {
                if (tools[i].className.includes('discord-tools') && !store.get('disclaimerDisplay')) {
                    $('#disclaimer').fadeIn(1000);
                }

                $(tools[i]).fadeIn(500);

                tools[i].display = '';
            }
            let className;
        }
    }
});


$('img').each((_, e) => $(e).attr('draggable', false));



//Activation

$('#activate_key').on('click', () => {
    key = $('#license_key').val();
    if(key == ''){
        iziToast.error({
            title: 'Error',
            message: 'Enter a key',
        });
        return
    }
    ipcRenderer.invoke('activate_key', { 'key': key }).then((result) => {

    })
});

$('.close').on('click', () => {
    ipcRenderer.send('close');
});
$('.maximize').on('click', () => {
    ipcRenderer.send('maximize');
});
$('.minimize').on('click', () => {
    ipcRenderer.send('minimize');
});

ipcRenderer.on('izi_toast', (event, message) => {
    if (message['title'] == 'Error'){
        iziToast.error({
            title: 'Error',
            message: message['message'],
        });
    }
    if (message['title'] == 'Success'){
        iziToast.success({
            title: 'Success',
            message: message['message'],
        });
    }

})



//click_dashboard();