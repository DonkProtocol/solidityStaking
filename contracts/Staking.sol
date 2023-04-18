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
        uint256 positionId;
        address walletAddress;
        uint256 createdDate;
        uint256 amountStaked;
        uint256 rewardStaked;
        uint256 apr;
        DateTimeLibrary timestamp;
    }

    Position position;

    uint256 public currentPositionId;
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public positionIdsByAddress;

    constructor(address token) {
        owner = msg.sender;
        currentPositionId = 0;
        stakingToken = IERC20(token);
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Only owner may modify staking periods");
        _;
    }

    function stake(uint256 amount) external onlyOwner {
        //add a better form to condition this function to works only with the tiers wanted for the app
        stakingToken.transferFrom(msg.sender, address(this), amount);

        //TODO: CHANGE THAT
        positions[currentPositionId] = Position(
            currentPositionId,
            msg.sender,
            block.timestamp,
            block.timestamp + (numDays * 1 days),
            tiers[numDays],
            amount,
            calculateInterest(tiers[numDays], amount),
            true
        );

        positionIdsByAddress[msg.sender].push(currentPositionId);
        currentPositionId += 1;
    }

    function getPositionByID(
        uint256 positionId
    ) external view returns (Position memory) {
        return positions[positionId];
    }

    function getPositionIdsForAddress(
        address walletAddress
    ) external view returns (uint256[] memory) {
        return positionIdsByAddress[walletAddress];
    }

    function unstake() external onlyOwner {
        require(
            positions[positionId].walletAddress == msg.sender,
            "Only position creator may modify position"
        );

        stakingToken.transfer(msg.sender, amount);
    }

    function harvest() external onlyOwner {
        require(
            positions[positionId].walletAddress == msg.sender,
            "Only position creator may modify position"
        );
        require(positions[positionId].open == true, "Position is closed");

        positions[positionId].open = false;

        if (block.timestamp > positions[positionId].unlockDate) {
            uint256 amount = positions[positionId].weiStaked +
                positions[positionId].weiInterest;

            stakingToken.transfer(msg.sender, amount);
        } else {
            stakingToken.transfer(msg.sender, positions[positionId].weiStaked);
        }
    }
}
