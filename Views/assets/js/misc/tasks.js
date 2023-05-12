/// opensea UI Management \\\
$('#task').on('click', () => {
    $('#task-template').load('./../html/tasks.html', async () => {
        await ipcRenderer.invoke('get_tasks').then((result) => {
            $('#sniper_content').append(result['snipers_ui']);
            $('#lister_content').append(result['listers_ui']);
            fill_select_wallet('wallets_list', result["wallets"]);
            fill_select_wallet('wallets_listing', result["wallets"]);
            $('#wallets_listing').multiselect({
                enableFiltering: true,
                maxHeight: 250
            });
            console.log(result['proxies'])
            //fill_select_wallet('wallets_bidding', result["wallets"]);
            fill_select_proxies('sniper_nft_proxies', result['proxies']);
            fill_select_proxies('list_nft_proxies', result['proxies']);
            handle_tasks_actions();
        });
        $('#createsniper').on('click', async () => {
            $('#create-sniper').removeClass('hide');
            $('#load-traits').removeClass('hide');
            $('#traits_section').addClass('hide');
            $('#edit-sniper').addClass('hide');
            $('#create_sniper').modal('show');
        })
        $('#create-sniper').on('click', async () => {
            data = get_sniper_data(true)
            if (data['marketplace'] == '' || data['collection_name'] == "" || data['wallet'] == "" || data['price'] == "") {
                iziToast.error({
                    title: 'Error',
                    message: 'Make sure all fields are added',
                });
                return;
            }
            else ipcRenderer.invoke('create_sniper', data).then((result) => {
                $('#sniper_content').append(result);
                handle_tasks_actions();
            });
        });
        $('#edit-sniper').on('click', async () => {
            data = { 'id': $('#edit-sniper').attr('data-id'), 'obj': get_sniper_data(false) }
            ipcRenderer.invoke('edit_sniper', data).then((result) => {
                $('#taskobject_' + $('#edit-sniper').attr('data-id')).html(result);
                handle_tasks_actions();
            });
        })
        $('#load-traits').on('click', async () => {
            $('#load-traits').addClass('hide');
            data = { 'collection': $('#collection_name').val(), 'marketplace': $('#marketplace').val() }
            if ($('#collection_name').val() && $('#marketplace').val()) {
                await ipcRenderer.invoke('fetch_traits', data).then((result) => {
                    let array = []
                    for (var key in result) {
                        $('#collection_traits').append($("<optgroup  />").val(key).attr('label', key));
                        for (var key2 in result[key]) {
                            $('#collection_traits').append($("<option />").val(result[key][key2]).text(result[key][key2]).attr('trait-category', key));
                        }
                    }
                    $('#collection_traits').multiselect({
                        disableIfEmpty: true,
                        enableClickableOptGroups: true,
                        enableCollapsibleOptGroups: true,
                        enableFiltering: true,
                        includeSelectAllOption: true,
                        maxHeight: 150
                    });
                    $('#traits_section').removeClass('hide');

                });
            } else {
                iziToast.error({
                    title: 'Error',
                    message: 'Make sure all marketplace and collection name are added',
                });
                return;

            }
        });
        // listing nft management
        $('#wallets_listing').on('change', async function () {
            let wallets = []
            $('#wallets_listing option:selected').each(function () {
                address = $(this).attr('data-address');
                privateKey = $(this).attr('private_key');
                network = $(this).attr('data-network');
                wallets.push({ 'address': address, 'network': network, 'privateKey': privateKey });

            });
            ipcRenderer.invoke('get_nfts', wallets).then((result) => {
                listing = result.Collections
                $('#nfts').html('')
                $('#nfts').append(result.UI)
            });
        });
        $('#list-nfts').on('click', async () => {
            nfts = [];
            marketplace = $('#list_nft_marketplace').val();
            list_time = $('#list_nft_time').val();
            var current = new Date(); 
            var listing_end = parseInt(Math.floor(new Date(current.getTime() + list_time * 24 * 60 * 60 * 1000)) / 1000).toString()

            $('.list-price').each(function (index) {
                if ($(this).val()) {
                    image = $('#img_' + $(this).attr('id')).attr('src');
                    collectionAddress = $(this).attr('id');
                    walletaddress = $(this).attr('data-wallet_address');
                    walletprivateKey = $(this).attr('data-wallet_privateKey');
                    tokenIds = $(this).attr('data-tokenIds');
                    // console.log(tokenIds)
                    tokens = tokenIds.split(',');
                    // console.log('Asset ID :', listing[0].assetId)
                    for (var i = 0; i < tokens.length; i++) {
                        nfts.push({
                            'assetId': tokens[i], 'price': $(this).val(), 'collectionAddress': collectionAddress,
                            'marketplace': marketplace, 'time': list_time, 'taskType': 'lister',
                            'end': listing_end, 'collectionImage': image, 'address': walletaddress, 'privateKey': walletprivateKey
                        });
                    }
                }
            });
            if (marketplace == '' || list_time == 0 || nfts == []) {
                iziToast.error({
                    title: 'Error',
                    message: 'Make sure all fields are added',
                });
                return;
            }

            else ipcRenderer.invoke('add_listers', { 'nfts': nfts, 'proxy_list': $('#list_nft_proxies').val() }).then((result) => {
                $('#lister_content').append(result);
                handle_tasks_actions();
            })
        });
        //bidding nft management
        /*$('#bid-nfts').on('click', async () => {
            let wallets = []
            $('#wallets_bidding option:selected').each(function () {
                address = $(this).attr('data-address');
                privateKey = $(this).attr('private_key');
                network = $(this).attr('data-network');
                wallets.push({ 'address': address, 'network': network, 'privateKey': privateKey });

            });
            let marketplace = $('#bid_nft_marketplace').val();
            let bid_time = $('#bid_nft_time').val();
            let current = new Date(); //'Mar 11 2015' current.getTime() = 1426060964567
            let bidding_end = new Date(current.getDate() + current * 24 * 60 * 60 * 1000); // + 1 day in ms
            let price = $('#bid_price').val();
            let collection = $('#bid_collection').val();
            let bid = { 'marketplace': marketplace, 'time': time, 'end': bidding_end, 'collection': collection, 'price': price, 'taskType': 'bidder', 'wallet': wallets };
            ipcRenderer.invoke('add_bidder', JSON.stringify(bid)).then(async (result) => {
                $('#bidder_content').append(result);
                handle_actions();
            })

        });
        */
    });
});

function get_sniper_data(get_traits) {
    marketplace = $('#marketplace').val();
    collection_name = $('#collection_name').val();
    wallet = {
        'address': $('#wallets_list').val(), 'privateKey': $('#wallets_list').find(':selected').attr('private_key'),
        '_id': $('#wallets_list').find(':selected').attr('id'), 'walletName': $('#wallets_list').find(':selected').attr('data-name')
    };
    price = $('#price').val();
    rarity = 0;

    data = {
        'marketplace': marketplace, 'collection': collection_name, 'wallet': wallet, 'price': price,
        'rarity': rarity, 'taskType': 'sniper', 'status': 'Idle',
        //TODO: review and fetch this from server in controller
        'collectionImage': '../assets/img/placeholder.png',
        'proxy_list': $('#sniper_nft_proxies').val()
    }
    if (get_traits) {
        let traits = [];
        let cat_val_arr = [];
        previous = '';
        let category;
        $('#collection_traits option:selected').each(function () {
            category = $(this).attr('trait-category');
            if (previous != category) {
                cat_val_arr = [];
                previous = category;
            }
            let value = $(this).val();
            cat_val_arr.push(value);
            traits.push({ [category]: cat_val_arr })


        });
        data['traits'] = traits
    }
    return data;
}

function check_status(id) {

    ipcRenderer.invoke('status_check', { 'id': id }).then((result) => {
        $('#sniper_status_' + id).html(result);
    });
}
ipcRenderer.on('status_change', (event, message) => {
    // alert(message)
    check_status(message)
})

function handle_tasks_actions() {
    $('.start_sniper').on('click', async function () {
        sniper_id = $(this).attr('data-sniper');
        ipcRenderer.invoke('start_sniper', { 'id': sniper_id });
        // check_status(sniper_id);
    });
    $('.stop_sniper').on('click', async function () {
        sniper_id = $(this).attr('data-sniper');
        ipcRenderer.invoke('stop_sniper', { 'id': sniper_id });
        //check_status(sniper_id)
    });
    $('.delete_task').on('click', async function () {
        task_id = $(this).attr('data-task');
        ipcRenderer.invoke('delete_task', { 'id': task_id }).then((result) => {
            // console.log(result)
            $('#taskobject_' + task_id).remove();
        });
    });
    $('.edit_sniper').on('click', async function () {
        task_id = $(this).attr('data-sniper'); console.log(task_id)
        ipcRenderer.invoke('fetch_sniper', { 'id': task_id }).then((result) => {
            console.log(result);
            $('#marketplace').val(result['marketplace']);
            $('#collection_name').val(result['collection']);
            $("#wallets_list option[value='" + result['wallet']['address'] + "']").attr('selected', 'selected');
            $('#price').val(result['price']);
            $('#traits_section').addClass('hide');
            $('#edit-sniper').removeClass('hide');
            $('#create-sniper').addClass('hide');
            $('#edit-sniper').attr('data-id', task_id);
            $('#create_sniper').modal('show');
        });
    });
}

function fill_select_proxies(id, proxies) {
    var $dropdown = $("#" + id);
    for (const key in proxies) {
        $dropdown.append($("<option />").val(key).text(key));
    }

}
