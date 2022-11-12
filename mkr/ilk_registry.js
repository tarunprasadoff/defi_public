const { ethers } = require("ethers")
const dfd = require("danfojs-node")
const fs = require("fs")

const INFURA_ID = '01d1cfa3c4a74ff3811461dfdfd1a130'
const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_ID}`)

const data = require('../abi/mkr/ilk_registry_abi.json');

const ERC20_ABI = data["result"]

const address = '0x5a464C28D19848f44199D003BeF5ecc87d090F87' // Dog Contract
const contract = new ethers.Contract(address, ERC20_ABI, provider)

function formatIlkInfo(ilk, bn, ti, th, ilkInfo) {
    return {
        "ilk": ilk,
        "name": ilkInfo[0],
        "symbol": ilkInfo[1],
        "class": ethers.utils.formatEther(ilkInfo[2]),
        "dec": ethers.utils.formatEther(ilkInfo[3]),
        "gem": ilkInfo[4],
        "pip": ilkInfo[5],
        "join": ilkInfo[6],
        "xlip": ilkInfo[7],
        "blockNumber": bn,
        "transactionIndex": ti,
        "transactionHash": th
    }
}

const main = async () => {

    let ilk_data = []
    let ilk
    let ilks = []
    let bns = []
    let tis = []
    let ths = []

    const eves = (await contract.queryFilter('AddIlk'))
    eves.forEach((event) => {
        ilks.push(event['args'][0])
        bns.push(event["blockNumber"])
        tis.push(event["transactionIndex"])
        ths.push(event["transactionHash"])
    })

    const ilks_length = ilks.length
    for (let counter = 0; counter < ilks_length; counter++) {
        ilk = ilks[counter]
        ilk_data.push(formatIlkInfo(ilk, bns[counter], tis[counter], ths[counter], (await contract.info(ilk))))
        await new Promise(r => setTimeout(r, 1000))
        console.log((counter+1),"/",ilks_length)
    }

    if (ilk_data.length > 0) {
        console.log("New Data")
        console.log(ilk_data)
        df = new dfd.DataFrame(ilk_data)
        df.print()
        console.log(ilk_data.length)
        dfd.toCSV(df, options={filePath:"../data/mkr/ilk_data.csv"})
    }
}

main()