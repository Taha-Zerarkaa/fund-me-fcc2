const {networkConfig, devlopmentChains} = require("../helper-hardhat-config")
const {network} = require ("hardhat")
const {verify} = require("../utils/verify")
require("dotenv").config()





module.exports = async ({getNamedAccount, deployments}) => {
    const { deploy, log ,get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId


    let ethUsdPriceFeedAddress
     if (devlopmentChains.includes(network.name)) {
        const ethUsdAggregator = await get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
        
     }else {
         ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
     }


     const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log:true,
        waitConfirmation: network.config.blockConfirmation || 1,
     })

     if(!devlopmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
      await verify(fundMe.address ,[ethUsdPriceFeedAddress])
     }


     log("----------------------------------------")
}

module.exports.tags = ["all","fundme"]