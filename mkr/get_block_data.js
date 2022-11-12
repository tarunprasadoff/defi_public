const { ethers } = require("ethers")
const dfd = require("danfojs-node")
const fs = require("fs")

const INFURA_ID = '01d1cfa3c4a74ff3811461dfdfd1a130'
const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_ID}`)

let blockTimestamps = new Map()
let fromMap = new Map()
let hashMap = new Map()
let dfs = new Map()

async function readBlockData(){
    let blockTimestamps = new Map()
    let fromMap = new Map()
    if (fs.existsSync('../data/blockTimestamps.csv')){
        let btDf = await dfd.readCSV("../data/blockTimestamps.csv")
        for (const [blockNumber, timestamp] of btDf.values) { set_values_blockTimestamp(blockNumber, timestamp, blockTimestamps) }
    }
    if (fs.existsSync('../data/fromMap.csv')){
        let fmDf = await dfd.readCSV("../data/fromMap.csv")
        for (const [blockNumber, transactionIndex, from_val] of fmDf.values) { set_values_fromMap(blockNumber, transactionIndex, from_val, fromMap) }
    }
    return [blockTimestamps, fromMap]
}

function writeBlockData(blockTimestamps, fromMap){

    let newBlockTimestamps = []
    for (let [key, value] of blockTimestamps){
        newBlockTimestamps.push({"blockNumber":key,"timestamp":value})
    }
    let btDf = new dfd.DataFrame(newBlockTimestamps)
    dfd.toCSV(btDf, options={filePath:"../data/blockTimestamps.csv"})

    let newFromMap = []    
    for (let [key, value] of fromMap){
        for (let [valuek, valuev] of value) {
            newFromMap.push({"blockNumber":key,"transactionIndex":valuek,"from":valuev})
        }
    }
    let fmDf = new dfd.DataFrame(newFromMap)
    dfd.toCSV(fmDf, options={filePath:"../data/fromMap.csv"})
    
}

function set_values_fromMap(blockNumber,transactionIndex,from_val,fromMap) {
    let temp
    if (!fromMap.has(Number(blockNumber))) {
        temp = new Map()
    } else {
        temp = fromMap.get(Number(blockNumber))
    }
    temp.set(Number(transactionIndex),from_val)
    fromMap.set(blockNumber,temp)
}

function set_values_hashMap(blockNumber,transactionIndex,hash,hashMap) {
    let temp = new Map()
    temp.set("blockNumber",blockNumber)
    temp.set("transactionIndex",transactionIndex)
    hashMap.set(hash,temp)
}

function set_values_blockTimestamp(blockNumber,timestamp,blockTimestamps) {
    blockTimestamps.set(Number(blockNumber), Number(timestamp))
}

async function async_set_values_blockTimestamp(blockNumber,blockTimestamps) {
    if (!blockTimestamps.has(blockNumber)) {
        const timestamp = (await provider.getBlock(blockNumber))["timestamp"]
        set_values_blockTimestamp(blockNumber,timestamp,blockTimestamps)
    }
}

async function async_set_values_fromMap(blockNumber,transactionIndex,transactionHash,fromMap) {
    if (fromMap.has(blockNumber)) {
        if (fromMap.get(blockNumber).has(transactionIndex)) {
            return
        }
    }
    const from_val = (await provider.getTransaction(transactionHash))["from"]
    set_values_fromMap(blockNumber,transactionIndex,from_val,fromMap,shouldCheck=false)
}

async function async_set_values(transactionHash,blockTimestamps,fromMap,hashMap) {
    const blockData = hashMap.get(transactionHash)
    const blockNumber = blockData.get("blockNumber")
    const transactionIndex = blockData.get("transactionIndex")
    await Promise.all([async_set_values_blockTimestamp(blockNumber,blockTimestamps), async_set_values_fromMap(blockNumber,transactionIndex,transactionHash,fromMap)])
}

const fileNames = ["clip_kick_events.csv","clip_redo_events.csv","clip_take_events.csv","dog_events.csv","ilk_data.csv"].map((fn)=>("../data/mkr/"+fn))

const main = async () => {

    readBlockData()

    for (fn of fileNames) {
        df = await dfd.readCSV(fn)
        dfs.set(fn, df)
        bnInd = df.groupby(["blockNumber"])["colIndex"][0]
        tiInd = df.groupby(["transactionIndex"])["colIndex"][0]
        thInd = df.groupby(["transactionHash"])["colIndex"][0]
        for (val of df.values) {
            set_values_hashMap(val[bnInd],val[tiInd],val[thInd],hashMap)
        }
    }

    hashes = Array.from(hashMap.keys())

    let counter = 0
    let next_counter
    const inc = 100
    let timeout = 0
    let lene = hashes.length

    while (counter < lene) {
        if (timeout > 0) {
            await new Promise(r => setTimeout(r, timeout))
            console.log("Waiting", counter)
        }
        next_counter = counter + inc
        await Promise.all(hashes.slice(counter,Math.min(lene,next_counter)).map((h)=>async_set_values(h,blockTimestamps,fromMap,hashMap)))
        counter = next_counter
        timeout = 30000
    }
    console.log("Done")

    let bts, frs
    for (fn of fileNames) {
        bts = []
        frs = []
        df = dfs.get(fn)
        bns = df.blockNumber.values
        tis = df.transactionIndex.values
        lene = bns.length
        for (let i = 0; i < lene; i++) {
            bn = bns[i]
            ti = tis[i]
            bts.push(blockTimestamps.get(bn))
            frs.push(fromMap.get(bn).get(ti))
        }
        df.addColumn("timestamp", bts, { inplace: true })
        df.addColumn("from", frs, { inplace: true })
        df.print()
        dfd.toCSV(df, options={filePath:fn})
    }

    writeBlockData(blockTimestamps,fromMap)

}

main()