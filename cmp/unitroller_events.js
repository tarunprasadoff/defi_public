const { ethers } = require("ethers")

const INFURA_ID = '01d1cfa3c4a74ff3811461dfdfd1a130'
const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_ID}`)

const data = require('../abi/cmp/unitroller_abi.json')
const contract_address = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B"

const ERC20_ABI = data["result"]

const main = async () => {
    const contract = new ethers.Contract(contract_address, ERC20_ABI, provider)
    // // const blockNumber = await provider.getBlockNumber()
    // const blockNumber = 10809458
    // console.log(blockNumber)
    // const startBlock = 7710672
    // console.log(startBlock)
    // // startBlock = Math.min(0,startBlock)
    // const unitrollerEvents = (await contract.queryFilter("NewImplementation", startBlock, blockNumber))
    // console.log(unitrollerEvents.length)
    // unitrollerEvents.map((e)=>console.log(e["args"][0],e["args"][1],e["blockNumber"]))
    // // console.log(unitrollerEvents)
    const admin = await contract.comptrollerImplementation()
    console.log(admin)
    // console.log((await provider.getBlockNumber()))
}

main()