//Settings
$('#settings').on('click', () => {
    var user_proxies = {};
    $('#settings-template').load('./../html/Settings.html', async () => {
        ipcRenderer.invoke('get_settings').then((result) => {
            if ('errordelay' in result['user_data'])
                $('#errordelay').val(result['user_data']['errordelay']);
            if ('websocket' in result['user_data'])
                $('#websocket').val(result['user_data']['websocket']);
            if ('webhook' in result['user_data'])
                $('#webhook').val(result['user_data']['webhook']);
            if ('rpc' in result['user_data'])
                $('#rpc').val(result['user_data']['rpc']);
            if ('poly_rpc' in result['user_data'])
                $('#poly_rpc').val(result['user_data']['poly_rpc']);
            if ('proxies' in result['user_data']) {
                //$('#proxiesobj').val(result['user_data']['proxies']);
                for (const key in result['user_data']['proxies']) {
                    user_proxies = result['user_data']['proxies'];
                    console.log(`${key} -> ${result['user_data']['proxies'][key]}`);
                    div = '<div class="d-flex align-items-center gap-8 wallet-transfer proxies-list button-cursor active" style="margin-top:10px" >' +
                        '<span class="font-12">' + key + '</span>' +
                        '</div>';
                    $('#proxies-lists').append(div);

                }
                //Display proxies first object
                var arrayLength = result['user_data']['proxies']['List 1'].length;
                var proxies = '';
                for (var i = 0; i < arrayLength; i++) {
                    proxies = result['user_data']['proxies']['List 1'][i] + '\n' + proxies;
                }
                $('#proxies').val(proxies);
                $('#selected_list_group').val('List 1');
            }
            proxies_group(user_proxies);
            $('#proxies-group').on('click', () => {
                let groupButtons = $('.proxies-list');
                let nb = groupButtons.length + 1;
                div = '<div class="d-flex align-items-center gap-8 wallet-transfer proxies-list button-cursor active" style="margin-top:10px" >' +
                    ' <span class="font-12">List ' + nb + '</span>' +
                    '</div>';
                $('#proxies-lists').append(div);
                $('#selected_list_group').val('List ' + nb);
                proxies_group(user_proxies);
                $(div).click();

            });
        });
        $('#save_errordelay').on('click', () => {
            data = { 'errordelay': $('#errordelay').val() };
            ipcRenderer.invoke('save_settings', data);
        });
        $('#save_websocket').on('click', () => {
            data = { 'websocket': $('#websocket').val() };
            ipcRenderer.invoke('save_settings', data);
        });
        $('#save_webhook').on('click', () => {
            data = { 'webhook': $('#webhook').val() };
            ipcRenderer.invoke('save_settings', data);
        });
        $('#save_rpc').on('click', () => {
            data = { 'rpc': $('#rpc').val() };
            ipcRenderer.invoke('save_settings', data);
        });
        $('#save_poly_rpc').on('click', () => {//save_poly_rpc
            data = { 'poly_rpc': $('#poly_rpc').val() };
            ipcRenderer.invoke('save_settings', data);
        });
        $('#save_proxies').on('click', () => {
            var lines = $('#proxies').val().split('\n');
            var listnb = $('#selected_list_group').val();

            user_proxies[listnb] = lines;
            console.log(lines); console.log(listnb)
            data = { 'proxies': user_proxies };
            console.log(data);
            //$('#proxiesobj').val(JSON.stringify(proxiesobj));
            ipcRenderer.invoke('save_settings', data);
        });


    });
});

function proxies_group(user_proxies) {
    $('.proxies-list').on('click', function () {
        let groupButtons = $('.proxies-list');
        for (var i = 0; i < groupButtons.length; i++) {
            console.log(i)
            if (groupButtons[i] != $(this)[0]) {
                groupButtons[i].className = 'align-items-center justify-content-between wallet-transfer grey button-cursor proxies-list';
            } else {
                groupButtons[i].className = 'align-items-center justify-content-between wallet-transfer proxies-list button-cursor active';
                // get related proxies
                $('#selected_list_group').val('List ' + (i + 1));
                console.log(user_proxies)
                selected_proxies = user_proxies['List ' + (i + 1)];
                console.log(selected_proxies)

                var proxies = '';
                if (selected_proxies) {
                    for (var j = 0; j < selected_proxies.length; j++) {
                        proxies = proxies + '\n' + selected_proxies[j];
                    }
                }
                console.log(proxies);
                $('#proxies').val(proxies);
            }
        }
    });
}
