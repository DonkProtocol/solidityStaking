// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/DateTime.sol";

pragma solidity ^0.8.0;

//contract for staking
contract Staking {
    using DateTime for uint256;
    address public owner;
    IERC20 public stakingToken;

    struct Position {
        address walletAddress;
        uint256 createdDate;
        uint256 amountStaked;
        uint256 rewardStaked;
        uint256 apr;
        DateTimeLibrary timestamp;
    }

    Position position;

    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public positionIdsByAddress;

    constructor(address token) {
        owner = msg.sender;
        stakingToken = IERC20(token);
    }

    modifier onlyOwner() {
        require(
            owner == msg.sender,
            "Only owner may modify an staking position"
        );
        _;
    }

    function stake(uint256 amount) external onlyOwner {
        //add a better form to condition this function to works only with the tiers wanted for the app
        stakingToken.transferFrom(msg.sender, address(this), amount);

        position = Position(
            msg.sender,
            position.amountStaked += amount,
           //calculateInterest(tiers[numDays], amount),
        );
    }

    function getPositionIdsForAddress(
        address walletAddress
    ) external view returns (uint256[] memory) {
        return positionIdsByAddress[walletAddress];
    }

    function unstake() external onlyOwner {
        require(
            position.walletAddress == msg.sender,
            "Only position creator may modify position"
        );

        let amount = positions.amountStaked

        stakingToken.transfer(msg.sender, amount);
    }

    function harvest() external onlyOwner {
        require(
            position[positionId].walletAddress == msg.sender,
            "Only position creator may modify position"
        );

        let amount = positions.rewardStaked

        stakingToken.transfer(msg.sender, amount);
        
    }
}
