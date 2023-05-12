

const clipboard = require('electron').clipboard
const fs= require('fs')

$('#wallet').on('click', (e) => {
    ipcRenderer.send('checking-for-update', {})
    $('#wallet-template').load('./../html/wallets.html', async () => {
        $('#wallet-content').html('./../img/loader.gif')
        await ipcRenderer.invoke('get_wallets').then((result) => {
            ui = result["full_ui"];
            $('#wallet-content').html(ui);
            //$('#group_wallet_name').html('Wallets ( ' + result['count'] + ' )');
            //render wallets list in transfer modal
            fill_wallets(result['wallets'])
            $('#wallets_groups').append(result['group_wallets']);
            fill_group_stats(result['group_stats']);
            group_wallets_ui();
            handle_actions_wallets();
            create_group_wallet();
        });
        // Create wallets management
        $('#open_createwallet').on('click', async () => {
            let group_id = $('#selected_wallet_group').val();
            if (group_id == "") {
                iziToast.error({
                    title: 'Error',
                    message: 'Make sure you have a group selected first',
                });
                return;
            }
            $('#generate_wallet').modal('toggle');
        });
        $('#create-wallet').on('click', async () => {

            // network = $("#select_network").val();
            network = $("#wallet-select_network_group").val()
            nb = $("#nb_wallet").val();
            walletname = $('#wallet_name').val();
            group_id = $('#selected_wallet_group').val();
            let groupDetails;
            await ipcRenderer.invoke('getGroupDetails', { id: group_id }).then(resolve => {
                network = resolve.network
            })
            if (network == '' || nb == "" || walletname == "") {
                iziToast.error({
                    title: 'Error',
                    message: 'Make sure all fields are added',
                });
                return;
            }
            await ipcRenderer.invoke('add_wallets', { "network": network, "nb": nb, "name": walletname, 'group_id': group_id }).then((result) => {
                ui = result["ui"];
                $('#wallet-content').append(ui);
                network = $('#' + group_id).attr('data-network');

                fill_wallets(result['all_wallets'], network)
                handle_actions_wallets();
                group_wallets_ui();
                create_group_wallet();
            });

        });
        // transfer wallets management
        $('#select_network_transfer').on('change', function () {
            filter_wallets_drowpdown(this.value)
        });
        $('#transfer-wallet').on('click', async () => {
            network = $('#select_network_transfer').val();
            from_wallet = { 'address': $('#from_wallet').val(), 'privateKey': $('#from_wallet').find(':selected').attr('private_key'), '_id': $('#from_wallet').find(':selected').attr('id') };
            to_wallet = { 'address': $('#to_wallet').val(), 'privateKey': $('#to_wallet').find(':selected').attr('private_key'), '_id': $('#to_wallet').find(':selected').attr('id') };
            amount = $('#amount').val();
            if (network == '' || amount == "" || from_wallet == "" || to_wallet == "") {
                iziToast.error({
                    title: 'Error',
                    message: 'Make sure all fields are selected',
                });
                return;
            }
            await ipcRenderer.invoke('transfer_wallet', { "network": network, "from": from_wallet, "to": to_wallet, "amount": amount }).then((result) => {
                // dismiss modal or show message
            });
        });
        $('#delete-all-wallets').on('click', async () => {
            group_id = $('#selected_wallet_group').val();
            await ipcRenderer.invoke('delete_all_wallets', { 'group_id': group_id }).then((result) => {
                $('#wallet-content').html('&nbsp;');
            })
        });
        $('#multisend_wallet_button').on('click', async () => {
            // network = $('#select_network_multisend').val();
            // network = $("#wallet-select_network_group").val()
            to_wallet = { 'address': $('#multisend_to_wallet').val(), 'privateKey': $('#multisend_to_wallet').find(':selected').attr('private_key'), '_id': $('#multisend_to_wallet').find(':selected').attr('id'), 'network': $('#multisend_to_wallet').find(':selected').attr('data-network') };
            let from_wallets = [];
            $('#multisend_from_wallet option:selected').each(function () {
                let wallet = {
                    'privateKey': $(this).attr("private_key"),
                    'address': $(this).attr("data-address"),
                    '_id': $(this).attr('id'),
                    network: $(this).attr("data-network")
                };
                from_wallets.push(wallet);
            });
            //amount = $('#multisend_amount').val();
            if (network == '' || from_wallet == [] || to_wallet['address'] == "") {
                iziToast.error({
                    title: 'Error',
                    message: 'Make sure all fields are selected',
                });
                return;
            }
            else {
                iziToast.info({
                    title: 'Sending to wallet',
                    message: 'This will take sometime',
                });
                await ipcRenderer.invoke("multisend", { 'network': network, 'from_wallets': from_wallets, 'to_wallet': to_wallet }).then(results => {

                    $('#balance-' + results[0].fromWallet_id).text(results[0].fromWallet);
                    $('#balance-' + results[0].toWallet_id).text(results[0].toWallet);
                });
            }
        });
        $('#import-wallet_button').on('click', async () => {
            network = $('#Import_select_network').val();
            if (network == "") {
                iziToast.error({
                    title: 'Error',
                    message: 'Please Select Network',
                });
                return;
            } else {
                group_id = $('#selected_wallet_group').val();
                let privateKey = $('#walletPrivateKey_name').val()
                // $('#importSingle').click();
                // $('#importSingle').attr('data-id', group_id)
                singleImport(group_id, privateKey)
            }
        });
        $('#distribute_wallet_button').on('click', async () => {
            network = $('#select_network_distribute').val();
            from_wallet = { 'address': $('#distribute_from_wallet').val(), 'privateKey': $('#distribute_from_wallet').find(':selected').attr('private_key'), '_id': $('#distribute_from_wallet').find(':selected').attr('id') };
            let to_wallets = [];
            $('#distribute_to_wallet option:selected').each(function () {
                let wallet = {
                    'privateKey': $(this).attr("private_key"),
                    'address': $(this).attr("data-address"),
                    '_id': $(this).attr('id')
                };
                to_wallets.push(wallet);
            });
            amount = $('#distribute_amount').val();
            if (network == '' || amount == "" || from_wallet == "" || to_wallet == "") {
                iziToast.error({
                    title: 'Error',
                    message: 'Make sure all fields are selected',
                });
                return;
            }
            iziToast.info({
                title: 'Distributing in progress',
                message: 'This will take sometime',
            });
            await ipcRenderer.invoke("distribute", { 'network': network, 'from_wallet': from_wallet, 'to_wallets': to_wallets, 'amount': amount }).then(results => {
                for (var i = 0; i < results.length; i++) {
                    $('#balance-' + results[i].fromWallet_id).text(results[i].fromWallet);
                    $('#balance-' + results[i].toWallet_id).text(results[i].toWallet);
                }

            });
        });
    });
    e.preventDefault()
});

function fill_group_stats(stats) {
    if (stats) {
        for (const [key, value] of Object.entries(stats)) {
            if (key != '') {
                $('#' + key + '_total').html(value['count']);
                $('#' + key + '_balance').html(value['balance']);
            }
        }
    }
}
function check_wallet_stats(message) {
    ipcRenderer.invoke('stats_wallet_change', message).then((result) => {
        fill_group_stats(result);
    });
}

function create_group_wallet() {
    $('#create-group-wallet').on('click', async function () {
        groupname = $('#wallet_group_name').val();
        network = $('#wallet-select_network_group').val()
        type = 'wallets';
        if (network == '' || type == "" || groupname == "") {
            iziToast.error({
                title: 'Error',
                message: 'Make sure all fields are added',
            });
            return;
        }
        ipcRenderer.invoke('create_group', { 'group_name': groupname, 'type': type, 'network': network }).then((result) => {
            console.log(result);
            $('#wallets_groups').append(result['ui']['ui']);
            group_wallets_ui();
            $('#' + result['id']).click();
        });

    });
}

function group_wallets_ui() {
    /* Switch between tools */
    let groupButtons = $('.wallets-group');
    $('.wallets-group').on('click', function () {
        for (var i = 0; i < groupButtons.length; i++) {
            if (groupButtons[i] != $(this)[0]) {
                groupButtons[i].className = 'align-items-center justify-content-between  wallets-group';
            } else {
                groupButtons[i].className = 'align-items-center justify-content-between  wallets-group active';
                // get related wallets
                $('#selected_wallet_group').val($(this).attr('id'));
                ipcRenderer.invoke('get_wallets_bygroup', { 'id': $(this).attr('id') }).then((result) => {
                    //$('#group_wallet_name').html('Wallets ( ' + result['count'] + ' )');
                    network = $(this).attr('data-network');
                    $('#wallet-content').html(result["full_ui"]);
                    fill_wallets(result["all_wallets"], network);

                    handle_actions_wallets();
                });

            }
        }
    });
    $('.delete-wallet-group').on('click', function () {
        iziToast.info({
            title: 'Deleting Group wallets',
            message: 'All wallets under this group will be deleted',
        });
        ipcRenderer.invoke('delete_group', { 'group_id': $(this).attr('data-id'), 'type': 'wallets' }).then((result) => {
            if (result == 'yes') {
                $('#' + $(this).attr('data-id')).remove();
                $('#wallet-content').html('&nbsp;');
                $('#selected_wallet_group').val('');
            }
        });
    });
    $('.wallet-balance-group-check').on('click', async function () {
        iziToast.info({
            title: 'Checking Balance',
            message: 'This will take sometime',
        });
        ipcRenderer.invoke('group_check_balance', { 'group_id': $(this).attr('data-id') }).then((result) => {
            $('#' + $(this).attr('data-id') + '_balance').html(result);
        });
    });
    $('.wallet-import-group').on('click', async function () {
        let importWallet = await ImportWallet()
        if (importWallet == "BulkWallets") {
            $('#import').trigger('click');
            console.log($(this).attr('data-id'));
            $('#import').attr('data-id', $(this).attr('data-id'))
        } else if (importWallet == "SingleWallet") {
            $('#SingleImport_wallet').modal('toggle');
        }

    });
    $('#importSingle').on('click', async function () {
        console.log($(this).attr('data-id'))
        await ipcRenderer.invoke("importSinglewallet", { 'group_id': $(this).attr('data-id') }).then((result) => {
            $('#' + result['id']).click();
            $('#import').val('')
        })
    })
    $('#import').on('change', async function () {
        console.log(document.getElementById("import").files[0].path)
        console.log($(this).attr('data-id'))
        await ipcRenderer.invoke("importwallets", { "file": document.getElementById("import").files[0].path, 'group_id': $(this).attr('data-id') }).then((result) => {
            $('#' + result['id']).click();
            $('#import').val('')
        })
    })
}

function handle_actions_wallets() {
    console.log('handle_actions_wallets')
    $('.balance-check').on('click', async function () {
        address = $(this).attr('data-address');
        network = $(this).attr('data-network');
        id = $(this).attr('data-id');
        iziToast.info({
            title: 'Checking Balance',
            message: 'This will take sometime balance will be displayed once fetched',
        });
        await ipcRenderer.invoke('check_balance', { 'address': address, 'network': network, 'id': id }).then((result) => {
            $('#balance-' + id).text(result);
        })
    });
    $('.delete-wallet').on('click', async function () {
        wallet_id = $(this).attr('data-id');
        ipcRenderer.invoke('delete_wallet', { 'id': wallet_id }).then((result) => {
            // console.log(result)
            $('#walletobject_' + wallet_id).remove();
        });

    });
    $('.copy-address').on('click', function () {
        address = $(this).attr('data-address');
        let group_id = $(this).attr('data-id')
        ipcRenderer.invoke('getWallets', { 'group_id': group_id }).then(resolve => {
            console.log(resolve)
            fs.writeFileSync('./ExportedWallets.json', JSON.stringify([resolve]))
        })
        singleExport({ publicKey: $(this).attr('data-address'), privateKey: $(this).attr('data-privateKey') })
        // clipboard.writeText(address);
        console.log(clipboard.readText())
    });
    $('.preferred').on('click', async function (e) {
        console.log('clicked')
        id = $(this).attr('data-id');
        await ipcRenderer.invoke('set_preferred', { 'id': id }).then((result) => {
            console.log(result)
            $('#walletobject_' + id).html(result);
            handle_actions_wallets()
        });
    });
}

function filter_wallets_drowpdown(network) {
    $('.wallets-list option').hide();
    $('.wallets-list').find('option').filter(function () {
        var address = $(this).attr('data-network');
        return address.indexOf(network) != -1;
    }).show();
}

function filter_network_select(id, network) {
    $('#' + id + ' option').hide();
    $('#' + id).find('option').filter(function () {
        var value = $(this).val();
        return value.indexOf(network) != -1;
    }).show();
}

//TODO: later on selecting network filter wallets
function fill_select_wallet(id, wallets, label = '', network = '') {
    var $dropdown = $("#" + id);
    $dropdown.empty();
    if (label != '')
        $dropdown.append($("<option />").text(label))

    $.each(wallets, function () {
        // console.log(this)
        if (network != '') {
            if (this.network == network)
                $dropdown.append($("<option />").val(this.address).text(this.walletName + '(' + this.balance + ')').attr('private_key', this.privateKey).
                    attr('id', this._id).attr('data-address', this.address).attr('data-network', this.network).attr('data-name', this.walletName));
        }
        else
            $dropdown.append($("<option />").val(this.address).text(this.walletName + '(' + this.balance + ')').attr('private_key', this.privateKey).
                attr('id', this._id).attr('data-address', this.address).attr('data-network', this.network).attr('data-name', this.walletName));
    });
}

function fill_wallets(wallets, network = '') {
    fill_select_wallet('from_wallet', wallets, 'send from wallet', network);
    fill_select_wallet('to_wallet', wallets, 'send to wallet', network);
    fill_select_wallet('multisend_from_wallet', wallets, '', network);
    fill_select_wallet('multisend_to_wallet', wallets, 'send to wallet', network);
    fill_select_wallet('distribute_from_wallet', wallets, 'send from wallet', network);
    fill_select_wallet('distribute_to_wallet', wallets, '', network);
    $('#multisend_from_wallet').multiselect('destroy');
    $('#multisend_from_wallet').multiselect({
        nonSelectedText: ' send from wallets',
        includeSelectAllOption: true,
        enableFiltering: true,
        maxHeight: 250
    });

    $('#distribute_to_wallet').multiselect('destroy');
    $('#distribute_to_wallet').multiselect({
        nonSelectedText: ' send to wallets',
        includeSelectAllOption: true,
        enableFiltering: true,
        maxHeight: 250
    });
    if (network != '') {
        filter_network_select('select_network', network);
        filter_network_select("select_network_transfer", network);
        filter_network_select("select_network_multisend", network);
        filter_network_select("select_network_distribute", network);
    }
}

ipcRenderer.on('stats_wallet_change', (event, message) => {
    console.log('Wallet State Changed : ', message);
    check_wallet_stats(message);
});
$('#wallet').click();


async function singleImport(group_id, privateKey) {
    console.log($(this).attr('data-id'))
    let importWallet = ImportWallet()
    // if (importWallet == "BulkWallets") {
    await ipcRenderer.invoke("importSinglewallet", { 'group_id': group_id, 'privateKey': privateKey }).then((result) => {
        $('#' + result['id']).click();
        $('#import').val('')
    })
}




function singleExport(wallet) {
    iziToast.info({
        timeout: 20000,
        overlay: true,
        displayMode: 'once',
        id: 'inputs',
        zindex: 1000,
        message: 'Export Wallet',
        position: 'center',
        drag: false,
        color: 'green',
        outerHeight: '200',
        buttons: [
            ['<button>Public Key</button>', function (instance, toast) {
                clipboard.writeText(wallet['publicKey']);
                instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
            }, true],
            ['<button>Private Key</button>', function (instance, toast) {
                clipboard.writeText(wallet['privateKey']);
                instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
            }, true]
        ]
    });
}

function ImportWallet() {
    return new Promise(resolve => {
        iziToast.info({
            timeout: 20000,
            overlay: true,
            displayMode: 'once',
            id: 'inputs',
            zindex: 1000,
            message: 'Import Wallet',
            position: 'center',
            drag: false,
            closeOnClick: true,
            color: 'green',
            outerHeight: '200',
            buttons: [
                ['<button>Single Wallet</button>', function (instance, toast) {
                    instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                    resolve('SingleWallet')
                }, true],
                ['<button>Bulk Wallets</button>', function (instance, toast) {
                    instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                    resolve('BulkWallets')
                }, true]
            ]
        });

    })

    // return selected
}



