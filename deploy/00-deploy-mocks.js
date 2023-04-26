const {network} = require("hardhat")
const {devlopmentChains , DECIMALS , INITIAL_ANSWER} = require("../helper-hardhat-config")




module.exports = async ({getNamedAccounts, deployment}) => {
    const {deploy,log} = deployments 
    const{deployer} = await getNamedAccounts()

    if(devlopmentChains.includes(network.name)){
        log("local network detected .. deploying mocks")
        await deploy("MockV3Aggregator" ,{
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args:[DECIMALS , INITIAL_ANSWER],
        })
        log("mocks deployed!")
        log("---------------------------------------------")

    }

}

module.exports.tags = ["all","mocks"]