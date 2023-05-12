const abiDecoder = require('abi-decoder')
const webhook = require("webhook-discord");
const fs = require('fs')
let SettingsArray = []
let array_MempoolMonitoring = [];
let Mempool_results = [];
let flip_results = [];
const web3 = require('web3')
const electron = require('electron')
const got = require('got')

const path = require('path');




/**
 * get input settings and push it in SettingsArray for later usage
 */
async function callsettings() {
    let data = await db.readAll()
    SettingsArray.push(data)
}



function extract_between(str, from, to) {
    return str.substring(
        str.indexOf(from) + from.length,
        str.lastIndexOf(to));
}


/**
 *
 * @param {*} contractAddress
 * @param {*} functionName
 */
async function mempoolStart(toContractAddress, fromContractAddress, functionName, flipFunction) {

    if (Mempool_started = false) {
        MempoolMonitoring()
    }

    for (var i = 0; i < array_MempoolMonitoring.length; i++) {
        if (array_MempoolMonitoring[i].functionName == functionName && array_MempoolMonitoring[i].contractAddress == contractAddress) {
            break
        } else {
            array_MempoolMonitoring.push({ 'From_contractAddress': fromContractAddress, 'To_contractAddress': toContractAddress, 'functionName': functionName, 'flipstatus': flipFunction })
        }
    }

}


function CheckIndex(array, contractAddress, functionName) {
    return new Promise(resolve => {
        console.log('Checking Array')
        for (var i = 0; i < array.length; i++) {
            if (array[i].contractAddress == contractAddress && array[i].functionName == functionName) {
                resolve(i)
            }
        }
    })


}


function ABIDecode(_ABI, data) {
    try {
        console.log('Decoding')
        abiDecoder.addABI(_ABI)
        const inputHash = data.input;
        const decodedData = abiDecoder.decodeMethod(inputHash)
        console.log('Decoded Data : ', decodedData.name)
        return decodedData
    } catch (e) {
        console.log('Error decoding : ', e)
    }

}



async function getABI(contractAddress, FlipFunction, nodeapi) {
    return new Promise(async resolve => {
        try {
            let Nodeapi
            if (nodeapi.apikey) {
                Nodeapi = 'https://eth-mainnet.alchemyapi.io/v2/' + nodeapi.apikey
            } else if (nodeapi.rpc) {
                Nodeapi = nodeapi.rpc
            }
            let test = false
            if (Nodeapi.includes('goerli')) {
                test = true
            }
            let Fetched_ABI = await fetchABI(contractAddress, test)
            const new_contract = '';
            let valid = ABI_mint_test(FlipFunction, Fetched_ABI)
            if (valid == 'valid') {
                console.log('ABI Validation success')
                ABI = Fetched_ABI
            }
            else if (valid == 'proxy') {
                console.log('ABI Validation Failed, building ABI')
                new_contract = await Proxy_contract(Fetched_ABI, collectionAddress)
                let new_ABI = await fetchABI(new_contract);
                ABI = new_ABI
            }
            resolve(ABI)
        } catch (e) {
            console.log('Error at Get ABI function  : ', e)
        }
    })
}

function ABI_mint_test(mintfunction, ABI) {
    for (var i = 0; i < ABI.length; i++) {
        if (ABI[i].name === mintfunction)
            return 'valid'

        if (ABI[i].name === 'implementation')
            return 'proxy'
    }
    return 'not_valid'
}

async function Proxy_contract(ABI, contractAddress, nodeapi) {
    let web3Instance = new web3(new web3.providers.HttpProvider(nodeapi));
    const factoryContract = new web3Instance.eth.Contract(
        ABI,
        contractAddress,
    );
    let new_contract = await factoryContract.methods.implementation().call()
    return new_contract
}

async function fetchABI(collectionAddress, test) {
    return new Promise(async resolve => {
        try {
            console.log("fetchABI" + collectionAddress)
            let url = ''
            if (test) {
                url = 'https://api-goerli.etherscan.io/api?module=contract&action=getabi&address=' + collectionAddress + '&apikey=QY3JYSIWAV7SCCGNPZHXPJA415E7P5WWZD'
            } else {
                url = 'https://api.etherscan.io/api?module=contract&action=getabi&address=' + collectionAddress + '&apikey=QY3JYSIWAV7SCCGNPZHXPJA415E7P5WWZD'
            }

            const resp = await got(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                    'Connection': 'keep-alive',
                }
                , responseType: "json"
            })
            if (resp.body.result != 'Contract source code not verified') {
                resolve(JSON.parse(resp.body.result))
            } else {
                resolve('')
            }
        } catch (e) {
            console.log('Error in Fetch ABI : ', e)
        }

    })


}

/**
 *
 * @param {*} ms Delay time in ms
 * @returns Promise
 */
function Delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}


function ConsoleLog(data) {
    let time = new Date();
    // let info = `${time.getDate()}_${data.PID}/Task_${data.Task_ID
    //     }`;
    if (data.Task_ID == '') {
        data.Task_ID = 0
    }
    let message = data.message
    console.log(
        `[Task ID : ${data.Task_ID
        } : ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}:${time.getMilliseconds()}]`, message);
    // LogWriter(FunctionHelper.Footsites_Logs_path + info, `${data}`);
}


async function report(action, status, item) {
    try {
        let data = await db.readAll()
        body = {
            'user_email': data[0]['key'],
            'action': action,
            'item': item,
            'status': status,
            'date': new Date().toUTCString(),
        }
        const options = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        };
        let response = await fetch('http://3.15.239.255:3000/report', options)
        return response
    }
    catch (e) {
        console.log('error reporting')
    }
}


function Error(message) {
    try {
        const userDataPath = (electron.app || electron.remote.app).getPath('userData');
        const logpath = path.join(userDataPath, '/Data/logs.txt');
        let error = fs.appendFileSync(logpath, message + "\n")
    } catch (e) {
        console.log('Error appending logs ', e)
    }
}




async function Minted_SendDiscord(data) {

    const msg = new webhook.MessageBuilder();
    const Hook = new webhook.Webhook(
        "https://discord.com/api/webhooks/1057997323159998538/fenAhTMSFExLyX7qzOXpHMdCOlJ-lKNpnFYUwLmaWfOLB29o8KfkO4r9DwsrW6NoT9Za"
    );
    console.log(data)

    try {
        msg.setTitle("Minted !!!");
        msg.setName("Minted");
        // msg.setAvatar(
        //     "https://pbs.twimg.com/profile_images/1386275885372907520/9Rhzdbxs_400x400.jpg"
        // );
        msg.setAvatar(
            "http://anbbot.xyz/wp-content/uploads/2022/10/data.svg"
        );
        msg.addField("contract address:  ", data.ContractAddress, false);

        msg.addField("Token ID:  ", JSON.stringify(data.Ids), false);
        msg.addField("Price", data.price + ` Eth per NFT `);
        msg.setColor('#7FFFD4');

        await Hook.send(msg);
    } catch (e) {
        console.log(e);
    }
}

async function User_Discord(User_webhook, data) {
    const msg = new webhook.MessageBuilder();
    const Hook = new webhook.Webhook(
        User_webhook
    );
    console.log(data)

    try {
        msg.setTitle("Alpha");
        msg.setName("Alpha BOT");
        msg.setAvatar(
            "http://anbbot.xyz/wp-content/uploads/2022/10/data.svg"
        );
        msg.addField("contract address:  ", data.ContractAddress, false);
        msg.addField("Token ID:  ", JSON.stringify(data.Ids), false);
        msg.addField("Price", data.price + ` Eth per NFT `);
        msg.setColor('#7FFFD4');

        await Hook.send(msg);
    } catch (e) {
        console.log(e);
    }
}

class AWSHelpers {
    static sperationType = process.platform === 'darwin' ? '/' : '\\'
    static accessKeyId = "AKIAZWVJGMYMTS3HI2FF"
    static secretAccessKey = "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"
    static region = "us-west-2"
    static Bucket = 'alpha-bot1'


    static sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    /**
     *
     * @param botSettingsLogger
     * @returns
     */
    static CheckIfNeedsUpdate = (botSettingsLogger) => {
        // const updateInfoData = process.cwd() + AWSHelpers.sperationType + 'Database' + AWSHelpers.sperationType + 'updateInfo.json'
        const userDataPath = (electron.app || electron.remote.app).getPath('userData');
        const dbPath = path.join(userDataPath, '/Data/update.json');
        const doesExist = fs.existsSync(updateInfoData)
        // TODO by blacken fix this so the update wont have to be downloaded twice
        if (!doesExist) {
            fs.writeFileSync(updateInfoData, JSON.stringify({ "version": "0", "updateDetails": "" }))
        }
        return new Promise(resolve => {
            botSettingsLogger('Checking If Bot need Update...')
            const s3 = this.initS3()
            var options = {
                Bucket: this.Bucket,
                Key: 'updateInfo.json',
            };
            s3.getObject(options, async (err, S3object) => {
                if (S3object && S3object.Body) {
                    const objectData = JSON.parse(S3object.Body.toString('utf-8')); // Use the encoding necessary
                    const BotVersion = JSON.parse(fs.readFileSync(updateInfoData, 'utf-8'))
                    if (BotVersion.version !== objectData.version) {
                        botSettingsLogger('NEW VERSION : ' + Number(objectData.version) + ' UPDATE DETAILS : ' + objectData.updateDetails)
                        fs.writeFileSync(updateInfoData, JSON.stringify(objectData))
                        resolve(true)
                    }
                    resolve(false)
                }
                if (err) {
                    botSettingsLogger('Failed to Download Update ' + err)
                    await this.sleep(3000)
                    return this.downloadLatestUpdate(botSettingsLogger)
                }
            }
            );
        })
    }
    /**
     *
     * @returns
     */
    static initS3() {
        AWS.config.update(
            {
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey,
                region: this.region
            }
        );
        var s3 = new AWS.S3();
        return s3
    }
    /**
     *
     * @param botSettingsLogger
     * @returns
     */
    static async downloadLatestUpdate(botSettingsLogger) {
        let needUpdate = true
        const notFirstTimeDownload = fs.existsSync(process.cwd() + AWSHelpers.sperationType + 'Database')
        // FIX HERE
        if (notFirstTimeDownload) {
            needUpdate = await AWSHelpers.CheckIfNeedsUpdate(botSettingsLogger)
        }
        return new Promise(resolve => {
            if (!needUpdate) {
                botSettingsLogger('Bot is on the latest Update!')
                const myCode = fs.readFileSync(AWSHelpers.getTempFile() + AWSHelpers.sperationType + 'Main.bundle.js', 'utf-8')
                return resolve(myCode)
            }
            botSettingsLogger('Downloading Updates...')
            const s3 = this.initS3()
            var options = {
                Bucket: this.Bucket,
                Key: 'nftsMinter.js',
            };
            s3.getObject(options, async (err, S3object) => {
                if (S3object && S3object.Body) {
                    const objectData = S3object.Body.toString('utf-8'); // Use the encoding necessary
                    if (objectData) {
                        botSettingsLogger('New Version Downloaded')
                        if (notFirstTimeDownload) {
                            fs.writeFileSync(AWSHelpers.getTempFile() + AWSHelpers.sperationType + 'Main.bundle.js', objectData)
                        }
                        return resolve(objectData)
                    }
                }
                if (err) {
                    botSettingsLogger('Failed to Download Update ' + err)
                    await this.sleep(3000)
                    return this.downloadLatestUpdate(botSettingsLogger)
                }
            }
            );
        })
    }

    // static getTempFile() {
    //     const tempDir = os.tmpdir()
    //     return tempDir
    // }
}




module.exports = { extract_between, callsettings, SettingsArray, report, ABIDecode, Error, Mempool_results, flip_results, mempoolStart, getABI, CheckIndex, ConsoleLog, Minted_SendDiscord, User_Discord, AWSHelpers }