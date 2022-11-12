const { ethers } = require("ethers")
const dfd = require("danfojs-node")

const INFURA_ID = '01d1cfa3c4a74ff3811461dfdfd1a130'
const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_ID}`)

const addresses = require("../audit/cmp/source.json")

const tokenFileTypesMap = require("./token_file_type.json")
let tokens = new Set(Object.keys(tokenFileTypesMap))
let contract, abi, tokenFileType, res, irm_name, curr_address, imp, dei
let outArray = []

const addressToIrm = new Map()
for ([k,v] of Object.entries(addresses["InterestRateModel"])) {
    addressToIrm.set(v["address"],k)
}

const main = async () => {

    for (let token of tokens) {
        tokenFileType = tokenFileTypesMap[token]
        abi = require(`../abi/cmp/${tokenFileType}_abi.json`)["result"]
        curr_address = addresses["Contracts"][token]
        contract = new ethers.Contract(curr_address, abi, provider)
        res = await contract.interestRateModel()
        imp = contract.implementation

        if (imp) {
            imp = await imp()
        }

        if (addressToIrm.has(res)) {
            irm_name = addressToIrm.get(res)
        } else {
            irm_name = null
        }

        console.log(token, curr_address, irm_name)
        console.log(tokenFileType, imp)
        outArray.push({"token": token, "address": curr_address,"irm_name": irm_name,
                       "irm_address": res, "tokenFileType": tokenFileType, "implementation": imp})
        
    }

    const tokenIrms = new dfd.DataFrame(outArray)
    tokenIrms.print()
    dfd.toCSV(tokenIrms, options={filePath:"./tokenIrms.csv"})

}

main()