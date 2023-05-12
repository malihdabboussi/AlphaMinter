const { ipcRenderer, ipcMain } = require("electron");
const functionHelpers = require('../../Helpers/lib')
// const path = require('path')

// const functionHelpers = require(path.resolve(__dirname, '../../../../' + 'Helpers/lib.js'))

const web3 = require('web3');
let array_flipMonitoring = []
let array_result_flipMonitoring = [];
var Error_mempool_counter = 0
let subscription;
let restarting_state = false
let Mempool_started = false

let handleError = false
ipcRenderer.on('start_flip_monitoring', (e, data) => {
    StartMempool(data.owner, data.contractAddress, data.flipFunction, data.nodeapi, data.startLoop, data.Websocket_node)
})

ipcRenderer.on('stop_mempool', async (e, data) => {
    console.log('Stoping Mempool')
    array_flipMonitoring = array_flipMonitoring.filter(x => {
        return x.contractAddress != data.contractAddress.toLowerCase()
    })
    if (array_flipMonitoring.length == 0) {
        Unsubscribe()
    }
})

function CheckResults() {
    for (var i = 0; i < array_result_flipMonitoring.length; i++) {
        for (var j = 0; j < array_flipMonitoring.length; j++) {
            if (array_result_flipMonitoring[i].owner === array_flipMonitoring[j].owner && array_result_flipMonitoring[i].contractAddress === array_flipMonitoring[j].contractAddress) {
                let _data = [{ 'owner': array_result_flipMonitoring[i].owner, 'contractAddress': array_result_flipMonitoring[i].contractAddress, 'flipFunction': array_result_flipMonitoring[i].flipFunction, pushed: true }]
                Stop_mempool(array_result_flipMonitoring[i].contractAddress)
                ipcRenderer.send('monitor_result', _data)
                return true
            }
        }

    }
}

function CompareAttributes(data, array2) {

    let filtered = [data].map(object1 => {
        return array2.some(object2 => {
            return object1.contractAddress === object2.contractAddress;
        });
    });
    if (filtered.includes(true)) {
        // Attributed are identical
        return true
    } else {
        // Attributed are not identical
        return false
    }
}


async function watchForData(Data) {
    let exists = CompareAttributes(Data, array_flipMonitoring)
    if (!exists) {
        array_flipMonitoring.push({ 'owner': Data.owner, 'contractAddress': Data.contractAddress, 'flipFunction': Data.flipFunction })
    }
    while (true) {
        CheckResults()
        await delay(500)
        if (true) {
            break;
        }

    }

}


function StartMempool(owner, contractAddress, flipFunction, nodeapi, startLoop, Websocket_node) {
    ipcRenderer.send('showNotification', { title: 'Mempool', body: 'Mempool Started' })
    console.log(startLoop)
    if (startLoop) {
        // first mempool run
        let data = { 'owner': owner.toLowerCase(), 'contractAddress': contractAddress.toLowerCase(), 'flipFunction': flipFunction, 'nodeapi': nodeapi, 'websocket_node': Websocket_node }
        console.log(data)
        FlipMonitoring(data);
    } else if (!startLoop) {
        console.log('already started')// if already mempool is running just push the new data
        watchForData({ 'owner': owner.toLowerCase(), 'contractAddress': contractAddress.toLowerCase(), 'flipFunction': flipFunction, 'nodeapi': nodeapi })
    }
}

function delay(ms) {
    return new Promise(resolve => { setTimeout(resolve, ms) })
}

function Stop_mempool(contractAddress) {//will be used for any stop calling from other function
    array_flipMonitoring = array_flipMonitoring.filter(x => {
        return x.contractAddress != contractAddress
    })
    if (array_flipMonitoring.length == 0) {//only if the array is empty will Unsubscribe
        Unsubscribe()
    }
}

function Unsubscribe() {
    if (Mempool_started) {
        subscription.unsubscribe((err, success) => {
            console.log('Unsubscribing ')
            if (err) throw err
            if (success) {
                console.log('Closing Websocket')
                array_flipMonitoring = []
            }
        })
    } else if (!Mempool_started) {
        console.log('Mempool not started clearing array')
        array_flipMonitoring = []
    }

}

async function FlipMonitoring(data, retry = null) {
    try {
        if (retry == null) {
            array_flipMonitoring.push({ 'owner': data.owner, 'contractAddress': data.contractAddress, 'flipFunction': data.flipFunction })
        }

        let nodeapi;
        if (data.nodeapi.apikey) {
            nodeapi = data.nodeapi
        } else {
            nodeapi = data.nodeapi
        }

        if (data.websocket_node) {
            return new Promise(resolve => {
                Mempool_started = true
                const Web3 = new web3(
                    new web3.providers.WebsocketProvider(
                        // 'wss://bold-holy-panorama.ethereum-goerli.discover.quiknode.pro/41cb54f3b46f23216486fc6ebf729733c2b0033c/'
                        // 'wss://eth-mainnet.g.alchemy.com/v2/lPXMpfA1Jyv66ClftoDOssRJxzauhh65'
                        // 'wss://late-muddy-theorem.discover.quiknode.pro/f2ed030410d683c7416e8fe8c1f4ca76fdc69c68/'
                        data.websocket_node
                    )
                );
                subscription = Web3.eth.subscribe('pendingTransactions',
                    (err, event) => {
                        if (err && !handleError) {
                            handleError = true
                            console.log('Websocket subscribe Error : ', err)
                            if (Error_mempool_counter !== 5) {
                                FlipMonitoring(data, retry = true)
                            } else {
                                Unsubscribe()
                            }
                        }
                    });
                let trxDetails, gas
                subscription.on('data', async event => {
                    try {
                        await Web3.eth.getTransaction(event).then(async trxDetails => {
                            let Owners = array_flipMonitoring.map(x => { return x.owner.toLowerCase() })
                            console.log(trxDetails?.from)
                            if (Owners.includes(trxDetails?.from.toLowerCase())) {
                                ipcRenderer.send('showNotification', { title: 'Mempool', body: 'Flip signal detected' })
                                IsPending(event, nodeapi).then(async resolve => {
                                    console.log('Success : ', resolve)
                                    let data = array_flipMonitoring.map(x => {
                                        if (x.owner.toLowerCase() === trxDetails.from.toLowerCase() && x.contractAddress.toLowerCase() === trxDetails.to.toLowerCase()) {
                                            return { owner: x.owner, contractAddress: x.contractAddress, flipFunction: x.flipFunction }
                                        }
                                    })
                                    console.log(data)
                                    let ABI = await functionHelpers.getABI(trxDetails.to, data[0]['flipFunction'], nodeapi)
                                    if (data[0]['owner'].toLowerCase() === trxDetails.from.toLowerCase()) {
                                        Decoded_name = await functionHelpers.ABIDecode(ABI, trxDetails)
                                        if (data[0].flipFunction.includes(Decoded_name.name)) {
                                            console.log('Got Transaction Details')
                                            console.log('success')
                                            let object = { owner: data[0].owner, 'contractAddress': data[0].contractAddress, 'flipFunction': data[0].flipFunction, toggled: true }
                                            array_result_flipMonitoring.push(object)
                                            CheckResults()
                                        }
                                    }
                                })
                            }
                        });

                    } catch (e) {
                        console.log('Error flip function : ', e.message)
                        if (!handleError) {
                            handleError = true
                            restartMempool(data)
                        }

                    }
                })
                subscription.on('error', async event => {
                    console.log('On Error ', event.message)
                    if (!handleError) {
                        handleError = true
                        restartMempool(data)
                    }

                })
            })
        } else {
            // iziToastError('Websocket RPC node not given,please check settings')
            ipcRenderer.send('websocketNodeError', [])
        }
    } catch (e) {
        // console.log('Flip Monitoring Error : ', e)
        iziToast.error({ //iziToast
            title: 'Error',
            message: 'message',
        });
    }
}



async function restartMempool(data) {
    Unsubscribe()
    if (restarting_state == true) {
        console.log('restarting')
    } else {
        restarting_state = true
        await delay(3000)
        restarting_state = false
        handleError = false
        FlipMonitoring(data, true)
    }

}

async function IsPending(tx, nodeapi) {
    console.log('is Pending')
    return new Promise(async resolve => {
        let Nodeapi
        if (nodeapi.api) {
            Nodeapi = "https://eth-mainnet.alchemyapi.io/v2/" + nodeapi.apikey
        } else if (nodeapi.rpc) {
            Nodeapi = nodeapi.rpc
        }
        let isPending = true
        while (isPending) {
            let web3Instance = new web3(new web3.providers.HttpProvider(Nodeapi))
            let response = await web3Instance.eth.getTransactionReceipt(tx)
            if (response?.status == true) {
                isPending = false
            }
        }
        resolve(isPending)
    })

}

// function iziToastError(message) {
//     console.log('message')
//     iziToast.error({ //iziToast
//         title: 'Error',
//         message: message
//     });
// }






