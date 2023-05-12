
const e = require("express");

$('#account').on('click', () => {
    $('#account-template').load('./../html/accounts.html', async () => {
        ipcRenderer.invoke('get_accounts').then((result) => {
            console.log(result);
            $('#account_content').append(result['full_ui']['full_ui']);
            $('#account_groups').append(result['group_accounts']);
            handle_actions()
            group_account_ui();
            fill_account_group_stats(result['groupstats']);
        });
        create_group_account();
        open_create_account();
        $('#delete_all_account').on("click", async () => {
            let group_id = $('#selected_account_group').val();
            if (group_id == "") {
                iziToast.error({
                    title: 'Error',
                    message: 'Make sure you have a group selected first',
                });
                return;
            }
            ipcRenderer.invoke('delete_accounts_by_group', { 'group_id': group_id }).then((result) => {
                console.log(result);
                $('#account_content').html('&nbsp;');
                $('#' + group_id + '_total').html(0);
            });
        });
    });

});

function fill_account_group_stats(stats) {
    if (stats) {
        for (const [key, value] of Object.entries(stats)) {
            if (key != '') {
                $('#' + key + '_total').html(value['count']);
            }
        }
    }
}

function create_group_account() {
    $('#create-group-account').on('click', async function () {
        groupname = $('#group_name').val();
        ipcRenderer.invoke('create_group', { 'group_name': groupname, 'type': 'account' }).then((result) => {
            console.log(result);
            $('#account_groups').append(result['ui']['ui']);
            group_account_ui();
            $('#' + result['id']).click();
        });
    });
}

function group_account_ui() {
    /* Switch between tools */
    let groupButtons = $('.account-group');
    $('.account-group').on('click', function () {
        for (var i = 0; i < groupButtons.length; i++) {
            if (groupButtons[i] != $(this)[0]) {
                groupButtons[i].className = 'align-items-center justify-content-between  account-group';
            } else {
                groupButtons[i].className = 'align-items-center justify-content-between  account-group active';
                // get related minters
                $('#selected_account_group').val($(this).attr('id'));
                ipcRenderer.invoke('get_account_bygroup', { 'id': $(this).attr('id') }).then((result) => {
                    //console.log(result)
                    $('#account_content').html(result['full_ui']['full_ui']);
                    handle_actions();
                });

            }
        }

    });
    $('.delete-account-group').on('click', function () {
        ipcRenderer.invoke('delete_group', { 'group_id': $(this).attr('data-id'), 'type': 'account' }).then((result) => {
            alert(result);
            if (result == 'yes') {
                $('#' + $(this).attr('data-id')).remove();
                $('#account_content').html('&nbsp;');
                $('#selected_account_group').val('');
            }
        });
    });
}

function open_create_account() {
    $('#open_create_account').on('click', async () => {
        let group_id = $('#selected_account_group').val();
        if (group_id == "") {
            iziToast.error({
                title: 'Error',
                message: 'Make sure you have a group selected first',
            });
            return;
        }
        $('#create_account').modal('show');
    });
    $('#create-account').on('click', async () => {
        let group_id = $('#selected_account_group').val();
        let account_id = $('#account_id').val();
        data = {
            'group_id': group_id, 'name': $('#account_name').val(), 'discord': $('#account_discord').val(), 'twitter': $('#account_twitter').val(),
            'private_key': $('#account_private_key').val(), 'account_email': $('#account_private_key').val(), 'email': $('#account_email').val(),
            'proxy': $('#account_proxy').val(), 'account_id': account_id
        }
        ipcRenderer.invoke('add_edit_account', data).then((result) => {
            if (account_id != '')
                $('#account_content').append(result['full_ui']);
            else
                $('#accountobject_' + account_id).html(result['full_ui'])
            handle_actions();
        });
    });
}

function handle_actions() {
    $('.delete_account').on('click', async function () {
        account_id = $(this).attr('data-account');
        ipcRenderer.invoke('delete_account', { 'id': account_id }).then((result) => {
            // console.log(result)
            $('#accountobject_' + account_id).remove();
        });
    });
    $('.edit_account').on('click', async function () {
        account_id = $(this).attr('data-account');
        alert(account_id)
        $('#account_id').val(account_id);
        ipcRenderer.invoke('get_account', { 'id': account_id }).then((result) => {
            console.log(result);
            $('#account_name').val(result['name']);
            $('#account_discord').val(result['discord']);
            $('#account_twitter').val(result['twitter']);
            $('#account_private_key').val(result['private_key']);
            $('#account_email').val(result['email']);
            $('#account_proxy').val(result['proxy']);
        });
        $('#create_account').modal('show');
    });

}


