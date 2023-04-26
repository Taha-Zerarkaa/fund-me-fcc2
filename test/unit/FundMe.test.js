//const { EtherSymbol, assert } = require("ethers")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
//const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
const { assert, expect } = require("chai")

describe("FundMe", async function () {
  let fundMe
  let deployer
  let mockV3Aggregator
  const sendValue = ethers.utils.parseEther("1")
  beforeEach(async function () {
    //deploy our fund me contract
    //using hardhat-deploy
    // const accounts = await EtherSymbol.getSigners()
    // const {deployer} = await getNamedAccounts()
    deployer = (await getNamedAccounts()).deployer
    await deployments.fixture(["all"])
    fundMe = await ethers.getContract("FundMe", deployer)
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
  })

  describe("constructor", async () => {
    it("sets the aggregtor addresses corctly", async function () {
      const response = await fundMe._pricefeed()
      assert.equal(response, mockV3Aggregator.address)
    })
  })

  describe("fund", async function () {
    it("fails if you don't send enough ETH", async function () {
      await expect(fundMe.fund()).to.be.revertedWith(
        "You need to spend more ETH!"
      )
    })
    it("updated the amount funded data structure", async function () {
      await fundMe.fund({ value: sendValue })
      const response = await fundMe.s_addressToAmountFunded(deployer)
      assert.equal(response.toString(), sendValue.toString())
    })
    it("adds funder to the array of s_funders", async function () {
      await fundMe.fund({ value: sendValue })
      const funder = await fundMe.s_funders(0)
      assert.equal(funder, deployer)
    })
  })

  describe("withdraw", async function () {
    beforeEach(async function () {
      await fundMe.fund({ value: sendValue })
    })
    it("Withdraw ETH from a single founder", async function () {
      //arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

      //act
      const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait(1)
      const { gasUsed, effectiveGasPrice } = transactionReceipt
      const gasCost = gasUsed.mul(effectiveGasPrice)

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
      //assert
      assert.equal(endingFundMeBalance, 0)
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      )
    })
    it("allows us to withdraw with multiple s_funders", async function () {
      //arrange
      const accounts = await ethers.getSigners()
      for (i=1 ; i<6 ; i++){
      const fundMeConectedContract = await fundMe.connect(accounts[i])
      await fundMeConectedContract.fund({value: sendValue})

      }
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

      //act
      const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait(1)
      const { gasUsed, effectiveGasPrice } = transactionReceipt
      const gasCost = gasUsed.mul(effectiveGasPrice)

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
      //assert
      assert.equal(endingFundMeBalance, 0)
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      )

      //make sure that the s_funders are reset properly
      await expect(fundMe.s_funders(0)).to.be.reverted
      for(i=1 ;i<6 ;i++){
        assert.equal(await fundMe.s_addressToAmountFunded(accounts[i].address), 0)
      }

    })
    it("only allows the owner to withdraw" , async function() {
      const accounts = await ethers.getSigners()
      const attacker = accounts[1]
      const attackerConectedContract = await fundMe.connect(attacker)
      await expect( attackerConectedContract.withdraw() ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");


    })

    it("cheaperWithdraw testing ...", async function () {
      //arrange
      const accounts = await ethers.getSigners()
      for (i=1 ; i<6 ; i++){
      const fundMeConectedContract = await fundMe.connect(accounts[i])
      await fundMeConectedContract.fund({value: sendValue})

      }
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

      //act
      const transactionResponse = await fundMe.cheaperWithdraw()
      const transactionReceipt = await transactionResponse.wait(1)
      const { gasUsed, effectiveGasPrice } = transactionReceipt
      const gasCost = gasUsed.mul(effectiveGasPrice)

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
      //assert
      assert.equal(endingFundMeBalance, 0)
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      )

      //make sure that the s_funders are reset properly
      await expect(fundMe.s_funders(0)).to.be.reverted
      for(i=1 ;i<6 ;i++){
        assert.equal(await fundMe.s_addressToAmountFunded(accounts[i].address), 0)
      }

    })
  })
})
