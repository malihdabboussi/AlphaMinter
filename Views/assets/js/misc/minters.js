// const { ipcRenderer } = require("electron");



//minters
$('#minter').on('click', () => {
    $('#minter-template').load('./../html/minter.html', async () => {
        ipcRenderer.invoke('get_minters').then((result) => {
            $('#minter_content').append(result['full_ui']);
            $('#minters_groups').append(result['group_minters']);
            let wallets = result['wallets'];
            let group_wallets = result['group_wallets'];
            if (group_wallets.length == 0) {
                $.each(wallets, function () {
                    if (this.network == 'ethereum') {
                        $('#minter_wallets').append($("<option />").val(this.address).text(this.walletName + '(' + this.balance + ')').attr('private_key', this.privateKey).
                            attr('id', this._id).attr('data-address', this.address).attr('data-network', this.network).attr('data-name', this.walletName));
                    }
                });
            }
            $.each(group_wallets, function () {
                group_id = this._id;
                group_name = this.group_name;
                console.log("" + group_id);
                $('#minter_wallets').append($("<optgroup />").val(this._id).attr('label', this.group_name));
                $.each(wallets, function () {
                    if (this.network == 'ethereum' && this.group_id == group_id) {
                        $('#minter_wallets').append($("<option />").val(this.address).text(this.walletName + '(' + this.balance + ')').attr('private_key', this.privateKey).
                            attr('id', this._id).attr('data-address', this.address).attr('data-network', this.network).attr('data-name', this.walletName));
                    }
                    if (this.network == 'polygon' && this.group_id == group_id) {
                        $('#minter_wallets').append($("<option />").val(this.address).text(this.walletName + '(' + this.balance + ')').attr('private_key', this.privateKey).
                            attr('id', this._id).attr('data-address', this.address).attr('data-network', this.network).attr('data-name', this.walletName));
                    }
                });
            });
            $('#minter_wallets').multiselect({
                disableIfEmpty: true,
                enableClickableOptGroups: true,
                enableCollapsibleOptGroups: true,
                enableFiltering: true,
                includeSelectAllOption: true,
                maxHeight: 150
            });

            handle_minters_actions();
            fill_minter_group_stats(result['stats']);
        });
        create_minter();
        edit_minter();
        start_stop_minter();
        create_group_minter();
        // $('#flip').on("click", function () {
        //     $('#flip_function').attr("disabled", false);
        // })
        $('#flip').on("change", function (e) {
            if (e.target.checked) {
                // flip = true
                $('#flip_function').attr("disabled", false);
            } else if (!e.target.checked) {
                $('#flip_function').attr("disabled", true);
                // flip = false
            }

        })
    });
});

function create_group_minter() {
    $('#create-group-mint').on('click', async function () {
        groupname = $('#group_name').val();
        type = 'minter';
        network = $('#minter-select_network_group').val()
        rpc = $('#Group_RPC').val()
        ipcRenderer.invoke('create_group', { 'group_name': groupname, 'type': type, 'network': network, group_rpc: rpc }).then((result) => {
            console.log(result);
            $('#minters_groups').append(result['ui']['ui']);
            group_ui();

            $('#' + result['id']).click();
            // $('#selected_minter_group').val(result['_id']);
        });

    });
}


function group_ui() {
    /* Switch between tools */
    let groupButtons = $('.group');
    $('.group').on('click', function () {
        for (var i = 0; i < groupButtons.length; i++) {
            if (groupButtons[i] != $(this)[0]) {
                groupButtons[i].className = 'align-items-center justify-content-between  group';
            } else {
                groupButtons[i].className = 'align-items-center justify-content-between  group active';
                // get related minters
                $('#selected_minter_group').val($(this).attr('id'));
                ipcRenderer.invoke('get_minters_bygroup', { 'id': $(this).attr('id') }).then((result) => {
                    // $('#group_minter_name').html('Eth Minters test ( ' + result['count'] + ' Tasks )');
                    $('#minter_content').html(result['full_ui']);
                    handle_minters_actions();
                });

            }
        }

    });
    $('.edit-group').on('click', function () {
        $('#edit_group_minter').modal('show');
        $('#save_edit_group').attr('data-id', $(this).attr('data-id'))
    });
    $('.delete-group').on('click', function () {
        ipcRenderer.invoke('delete_group', { 'group_id': $(this).attr('data-id'), 'type': 'minter' }).then((result) => {
            if (result == 'yes') {
                $('#' + $(this).attr('data-id')).remove();
                $('#minter_content').html('&nbsp;');
                $('#selected_minter_group').val('');
            }
        });
    });
    $('#save_edit_group').on('click', async function () {
        //minter_group_function
        // let minter_function = $('#minter_function').val();
        let minter_function = $('#minter_group_function').val();
        let minter_params_split = $('#minter_group_functionparams').val();
        let minter_params = minter_params_split.split(',');
        let price = $('#minter_group_price').val();
        let gascost = $('#mintergroup_gas_cost').val();
        let gas_fees = $("#minter_group_gas_fees").val()
        let obj = {}// { 'function': minter_function, 'functionparams': minter_params, "price": price, "gascost": gascost , 'gas_fees':gas_fees}
        if (minter_function != '')
            obj['function'] = minter_function
        if (minter_params != "")
            obj['functionparams'] = minter_params
        if (price != "")
            obj['price'] = price
        if (gascost != "")
            obj['gascost'] = gascost
        if (gas_fees != "")
            obj.gasfees = gas_fees
        let dataobj = { 'obj': obj, 'id': $(this).attr('data-id') };
        console.log(dataobj)
        ipcRenderer.invoke('edit_group_minter', dataobj).then((result) => {
            $('#minter_content').html(result['full_ui']);
            $('#edit_group_minter').modal('toggle');
            handle_minters_actions();
        });
    });
}

function fill_minter_group_stats(stats) {
    if (stats) {
        for (const [key, value] of Object.entries(stats)) {
            $('#' + key + '_total').html(value['count']);
            $('#' + key + '_minted').html(value['minted']);
        }
    }
}

function create_minter() {
    $('#open_createminter').on('click', async () => {
        let group_id = $('#selected_minter_group').val();
        if (group_id == "") {
            iziToast.error({
                title: 'Error',
                message: 'Make sure you have a group selected first',
            });
            return;
        }
        $('#create-minter').removeClass('hide');
        $('#edit-minter').addClass('hide');
        $('#create_minter').modal('show');
    });
    $('#create-minter').on('click', async () => {
        let data = get_minter_data();
        if (data['address'] == '' || data['minter_function'] == "" || data['price'] == "" || data['wallets'] == "" || data['gasmode'] == "") {
            iziToast.error({
                title: 'Error',
                message: 'Make sure all fields are added',
            });
            return;
        }
        ipcRenderer.invoke('add_minter', data).then((result) => {
            $('#minter_content').append(result['minter_ui']);
            handle_minters_actions();
        });
    });
}

function edit_minter() {
    $('#edit-minter').on('click', async function () {
        let dataobj = { 'obj': get_minter_data(), 'id': $('#edit-minter').attr('data-id') };
        ipcRenderer.invoke('edit_minter', dataobj).then((result) => {
            $('#minterobject_' + $('#edit-minter').attr('data-id')).html(result);
            handle_minters_actions()
        });
    });
}

function start_stop_minter() {
    $('#delete_all_minters').on('click', async () => {
        let group_id = $('#selected_minter_group').val();
        ipcRenderer.invoke('delete_all_minters', { 'group_id': group_id }).then((result) => {
            $('#minter_content').html('');
        });
    });
    $('#start_all_minters').on('click', async () => {
        let group_id = $('#selected_minter_group').val();
        ipcRenderer.invoke('start_all_minters', { 'group_id': group_id });
    });
    $('#stop_all_minters').on('click', async () => {
        let group_id = $('#selected_minter_group').val();
        ipcRenderer.invoke('stop_all_minters', { 'group_id': group_id });
    });
}

function get_minter_data(ServerData = null) {

    let address = $('#minter_address').val();
    let minter_function = $('#minter_function').val();
    let minter_params_split = $('#minter_functionparams').val();
    let minter_params = minter_params_split.split(',')
    console.log('minter _ params : ', minter_params)
    let price = $('#minter_price').val();
    //let customABI = $('#minter_customeABI').val();
    let wallets = [];
    $('#minter_wallets option:selected').each(function () {
        let wallet = {
            '_id': $(this).attr("id"), 'walletName': $(this).attr("data-name"), 'privateKey': $(this).attr("private_key"),
            'address': $(this).attr("data-address")
        };
        wallets.push(wallet);
    });
    let gas_cost = $('#gas_cost').val();
    let group_id = $('#selected_minter_group').val();
    let gas_fees = $('#gas_fees').val();
    let rpc_node = $('#rpc_node').val();
    let flip = $('#flip').is(':checked')
    let flip_function = $('#flip_function').val()
    let timer = $('#timer').val();
    let minter_data = {
        'address': address, 'minter_function': minter_function, 'minter_params': minter_params, 'wallets': wallets, 'gascost': gas_cost,
        'price': price, 'group_id': group_id, 'gas_fees': gas_fees, "rpc_node": rpc_node, 'flip': flip, "flip_function": flip_function, 'timer': timer
    };
    return minter_data;
}

// function get_minter_data() {
//     let address = $('#minter_address').val();
//     let minter_function = $('#minter_function').val();
//     let minter_params_split = $('#minter_functionparams').val();
//     let minter_params = minter_params_split.split(',')
//     console.log('minter _ params : ', minter_params)
//     let price = $('#minter_price').val();
//     //let customABI = $('#minter_customeABI').val();
//     let wallets = [];
//     $('#minter_wallets option:selected').each(function () {
//         let wallet = {
//             '_id': $(this).attr("id"), 'walletName': $(this).attr("data-name"), 'privateKey': $(this).attr("private_key"),
//             'address': $(this).attr("data-address")
//         };
//         wallets.push(wallet);
//     });
//     let gas_cost = $('#gas_cost').val();
//     let group_id = $('#selected_minter_group').val();
//     let gas_fees = $('#gas_fees').val();
//     let rpc_node = $('#rpc_node').val();
//     let flip = $('#flip').is(':checked')
//     let flip_function = $('#flip_function').val()
//     let timer = $('#timer').val();
//     let minter_data = {
//         'address': address, 'minter_function': minter_function, 'minter_params': minter_params, 'wallets': wallets, 'gascost': gas_cost,
//         'price': price, 'group_id': group_id, 'gas_fees': gas_fees, "rpc_node": rpc_node, 'flip': flip, "flip_function": flip_function, 'timer': timer
//     };
//     return minter_data;
// }

function handle_minters_actions() {
    group_ui();
    $('.start_minter').on('click', async function () {
        minter_id = $(this).attr('data-minter');
        // console.log(minter_id)
        ipcRenderer.invoke('start_minter', { 'id': minter_id });
        // check_status(sniper_id);
    });
    $('.stop_minter').on('click', async function () {
        minter_id = $(this).attr('data-minter');
        ipcRenderer.invoke('stop_minter', { 'id': minter_id });
    });
    $('.edit_minter').on('click', async function () {
        minter_id = $(this).attr('data-minter'); console.log(minter_id)
        ipcRenderer.invoke('fetch_minter', { 'id': minter_id }).then((result) => {
            console.log(result);
            $('#minter_address').val(result['address']);
            $('#minter_function').val(result['function']);
            let minter_params = ''
            for (const param in result['functionparams']) {
                minter_params = param + ',';
            }
            $('#minter_functionparams').val(minter_params);
            $('#minter_price').val(result['price']);
            $('#minter_customABI').val(result['customABI']);
            $('#minter_gasmode option[value="' + result['gasmode'] + '"]').prop('selected', true);
            $("#minter_wallets option[value='" + result['wallet']['address'] + "']").attr('selected', 'selected');
            $("#minter_wallets").multiselect("refresh");
            $('#edit-minter').removeClass('hide');
            $('#create-minter').addClass('hide');
            $('#edit-minter').attr('data-id', minter_id);
            $('#create_minter').modal('show');
        });
    });

    $('.delete_minter').on('click', async function () {
        minter_id = $(this).attr('data-minter');
        ipcRenderer.invoke('delete_minter', { 'id': minter_id }).then((result) => {
            // console.log(result)
            $('#minterobject_' + minter_id).remove();
        });
    });
}

function check_minter_status(id) {
    ipcRenderer.invoke('minter_status_check', { 'id': id }).then((result) => {
        $('#minter_status_' + id).html(result);
    });
}

ipcRenderer.on('minter_status_change', (event, message) => {
    check_minter_status(message);
});

ipcRenderer.on('stats_minter_change', (event, message) => {
    console.log(message);
    check_minter_stats(message);
});

function check_minter_stats(message) {
    ipcRenderer.invoke('stats_minter_change', message).then((result) => {
        fill_minter_group_stats(result);
    });
}


ipcRenderer.on('Append_mintersGroup', (e, result) => {
    $('#minters_groups').append(result['ui']['ui']);
    group_ui();
    $('#' + result['id']).click();
})

ipcRenderer.on('Append_mintersTasks', (e, result) => {
    $('#minter_content').append(result['minter_ui']);
    handle_minters_actions();
})

ipcRenderer.on('MempoolError', (e, result) => {
    iziToast.error({
        title: 'Error',
        message: result

    })
})


