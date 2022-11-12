const { ethers } = require("ethers")
const dfd = require("danfojs-node")

const INFURA_ID = '01d1cfa3c4a74ff3811461dfdfd1a130'
const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_ID}`)

const data = require('../abi/mkr/dog_abi.json');

const ERC20_ABI = data["result"]

const address = '0x135954d155898D42C90D2a57824C690e0c7BEf1B' // Dog Contract
const contract = new ethers.Contract(address, ERC20_ABI, provider)

function formatDogEvent(event) {
    const dogEventKeys = ["blockNumber","transactionIndex","transactionHash","address","logIndex","args"]
    let ret = {}
    for (const [key, value] of Object.entries(event)) {
        if (dogEventKeys.includes(key)) {
            if (key == "args") {
                ret["event_ilk"] = value[0]
                ret["event_urn"] = value[1]
                ret["event_ink"] = ethers.utils.formatEther(value[2])
                ret["event_art"] = ethers.utils.formatEther(value[3])
                ret["event_due"] = ethers.utils.formatEther(value[4])
                ret["event_clip"] = value[5]
                ret["event_id"] = ethers.utils.formatEther(value[6])
            } else {
                ret[key] = value
            }
        }
    }
    return ret
}

const main = async () => {
    const dogEvents = (await contract.queryFilter('Bark'))
    const df = new dfd.DataFrame(dogEvents.map(formatDogEvent))
    df.print()
    dfd.toCSV(df, options={filePath:"../data/mkr/dog_events.csv"})
    console.log(df.shape)
}

main()