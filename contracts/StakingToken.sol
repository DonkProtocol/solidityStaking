// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Donk is ERC20, Ownable {
    constructor() ERC20("Donk", "DNK") {
        uint256 totalSupply = 10000000000 * 10 ** decimals(); // Atualizado para 10 bilhões
        _mint(msg.sender, totalSupply);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}