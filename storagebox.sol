// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

contract SimpleStorage {

    uint256 number;

    constructor(uint256 initialNumber) {
        number = initialNumber;
    }

    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function getNumber() public view returns (uint256) {
        return number;
    }
}