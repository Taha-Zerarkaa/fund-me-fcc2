//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FundMe__NotOwner();

contract FundMe {
    using PriceConverter for uint256;
    mapping(address => uint256) public s_addressToAmountFunded;
    address[] public s_funders;
    address public immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 10 ** 18;
    AggregatorV3Interface public getPriceFeed;

    modifier onlyOwner() {
        // require(msg.sender == owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    constructor(address getPriceFeedAddress) {
        getPriceFeed = AggregatorV3Interface(getPriceFeedAddress);
        i_owner = msg.sender;
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function _pricefeed() public view returns (AggregatorV3Interface) {
        return getPriceFeed;
    }

    function fund() public payable {
        require(
            msg.value.getConversionRate(getPriceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // // transfer
        // payable(msg.sender).transfer(address(this).balance);
        // // send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        //mapping can't be in memory
        for(uint256 funderIndex=0 ; funderIndex < funders.length ; funderIndex++) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }





    
    // Explainer from: https://solidity-by-example.org/fallback/
    // Ether is sent to contract
    //      is msg.data empty?
    //          /   \
    //         yes  no
    //         /     \
    //    receive()?  fallback()
    //     /   \
    //   yes   no
    //  /        \
    //receive()  fallback()
}

// Concepts we didn't cover yet (will cover in later sections)
// 1. Enum
// 2. Events
// 3. Try / Catch
// 4. Function Selector
// 5. abi.encode / decode
// 6. Hash with keccak256
// 7. Yul / Assembly

/*This is a Solidity smart contract for a crowdfunding platform called FundMe.
 The contract enables users to fund projects by sending Ether (the native cryptocurrency of the Ethereum network)
  to the contract's address. The contract uses a price feed from an external source 
  (represented by the AggregatorV3Interface) to determine the conversion rate of the Ether to USD. It also
   sets a minimum amount of USD that a user must spend when funding a project.

The contract has a mapping that keeps track of how much each address has funded and an array that stores the addresses
 of all the s_funders. There is a function called fund() that users can call to send Ether to the contract, and a modifier
  called onlyOwner that restricts the withdrawal of funds to the contract owner.

The contract has a fallback function that is triggered when a user sends Ether to the contract without calling a specific
 function. In this case, the fallback function calls the fund() function to add the user's contribution to the mapping 
 and array.

One important change that should be made is to replace the address public i_owner; variable with address public immutable
 owner; to ensure that the contract owner cannot be changed once the contract is deployed. Another change that could be
  made is to include a function that allows the contract owner to update the AggregatorV3Interface address in case the
   price feed source changes.*/
