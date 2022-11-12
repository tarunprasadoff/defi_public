const { ethers } = require("ethers")
const dfd = require("danfojs-node")

const INFURA_ID = '01d1cfa3c4a74ff3811461dfdfd1a130'
const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_ID}`)

const data = require('../abi/mkr/clip_abi.json')

const ERC20_ABI = data["result"]
let ilk_to_symb = {}
let ilk_to_xlip = {}

function formatKickEvent(event) {
    const dogEventKeys = ["blockNumber","transactionIndex","transactionHash","address","logIndex","args"]
    let ret = {"event_ilk": event["ilk"], "event_symb": event["symb"]}
    for (const [key, value] of Object.entries(event)) {
        if (dogEventKeys.includes(key)) {
            if (key == "args") {
                ret["event_id"] = ethers.utils.formatEther(value[0])
                ret["event_top"] = ethers.utils.formatEther(value[1])
                ret["event_tab"] = ethers.utils.formatEther(value[2])
                ret["event_lot"] = ethers.utils.formatEther(value[3])
                ret["event_usr"] = value[4]
                ret["event_kpr"] = value[5]
                ret["event_coin"] = ethers.utils.formatEther(value[6])
            } else {
                ret[key] = value
            }
        }
    }
    return ret
}

function formatTakeEvent(event) {
    const dogEventKeys = ["blockNumber","transactionIndex","transactionHash","address","logIndex","args"]
    let ret = {"event_ilk": event["ilk"], "event_symb": event["symb"]}
    for (const [key, value] of Object.entries(event)) {
        if (dogEventKeys.includes(key)) {
            if (key == "args") {
                ret["event_id"] = ethers.utils.formatEther(value[0])
                ret["event_max"] = ethers.utils.formatEther(value[1])
                ret["event_price"] = ethers.utils.formatEther(value[2])
                ret["event_owe"] = ethers.utils.formatEther(value[3])
                ret["event_tab"] = ethers.utils.formatEther(value[4])
                ret["event_lot"] = ethers.utils.formatEther(value[5])
                ret["event_usr"] = value[6]
            } else {
                ret[key] = value
            }
        }
    }
    return ret
}

function formatRedoEvent(event) {
    const dogEventKeys = ["blockNumber","transactionIndex","transactionHash","address","logIndex","args"]
    let ret = {"event_ilk": event["ilk"], "event_symb": event["symb"]}
    for (const [key, value] of Object.entries(event)) {
        if (dogEventKeys.includes(key)) {
            if (key == "args") {
                ret["event_id"] = ethers.utils.formatEther(value[0])
                ret["event_top"] = ethers.utils.formatEther(value[1])
                ret["event_tab"] = ethers.utils.formatEther(value[2])
                ret["event_lot"] = ethers.utils.formatEther(value[3])
                ret["event_usr"] = value[4]
                ret["event_kpr"] = value[5]
                ret["event_coin"] = ethers.utils.formatEther(value[6])
            } else {
                ret[key] = value
            }
        }
    }
    return ret
}

const formatFunctions = {"Kick": formatKickEvent, "Take": formatTakeEvent, "Redo": formatRedoEvent}

async function get_clip_event(ilk, symb, contract, eventName) {
    const formatClipEvent = formatFunctions[eventName]
    const clipEvents = (await contract.queryFilter(eventName)).map((e) => {
        e["ilk"]=ilk
        e["symb"]=symb
        return e
    })
    let df
    console.log(eventName)
    if (clipEvents.length > 0) {
        df = new dfd.DataFrame(clipEvents.map(formatClipEvent))
    } else {
        df = new dfd.DataFrame()
    }
    console.log(df.shape)
    return df
}

async function handle_dfs(val, eventName, contract, ilk, symb) {
    if (val["isStart"]) {
        val["df"] = await get_clip_event(ilk, symb, contract, eventName)
        if (val["df"].shape[0]>0) {
            val["isStart"] = false
        }
    } else {
        let ndf = await get_clip_event(ilk, symb, contract, eventName)
        if (ndf.shape[0] > 0) {
            val["df"] = dfd.concat({dfList: [val["df"],ndf], axis: 0})
        }
    }
        
}

const main = async () => {

    let df = await dfd.readCSV("../data/mkr/ilk_data.csv")
    const ilks = df.column('ilk').values
    const xlips = df.column('xlip').values
    const symbs = df.column('symbol').values
    let vals = {}
    const eventNames = ["Kick", "Take", "Redo"]
    for (let eventName of eventNames) {
        vals[eventName] = {"isStart": true, "df": null}
    }
    for (let i=0; i<ilks.length; i++) {
        let xlip = xlips[i]
        if (xlip != '0x0000000000000000000000000000000000000000') {
            let contract = new ethers.Contract(xlip, ERC20_ABI, provider)
            let ilk = ilks[i]
            let symb = symbs[i]
            ilk_to_symb[ilk] = symb
            ilk_to_xlip[ilk] = xlip
            console.log(ilk, symb)
            for (let eventName of eventNames) { await handle_dfs(vals[eventName], eventName, contract, ilk, symb) }
        }
    }
    console.log("Ilk Count", Object.keys(ilk_to_symb).length)

    for (let eventName of eventNames) {
        console.log(eventName)
        df = vals[eventName]["df"]
        df.print()
        console.log("Count", df.shape[0])
        dfd.toCSV(df, options={filePath:`../data/mkr/clip_${eventName.toLowerCase()}_events.csv`})
    }
}

main()