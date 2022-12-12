// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity ^0.8.0;

//contract for staking
contract Staking {
    address public owner;
    IERC20 public stakingToken;

    struct Position {
        uint256 positionId;
        address walletAddress;
        uint256 createdDate;
        uint256 unlockDate;
        uint256 percentInterest;
        uint256 weiStaked;
        uint256 weiInterest;
        bool open;
    }

    Position position;

    uint256 public currentPositionId;
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public positionIdsByAddress;
    mapping(uint256 => uint256) public tiers;
    uint256[] public lockPeriods;

    constructor(address token) {
        owner = msg.sender;
        currentPositionId = 0;

        tiers[30] = 700;
        tiers[90] = 1000;
        tiers[180] = 1200;

        lockPeriods.push(30);
        lockPeriods.push(90);
        lockPeriods.push(180);

        stakingToken = IERC20(token);
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Only owner may modify staking periods");
        _;
    }

    function stakeEther(uint256 numDays, uint256 amount) external {
        require(tiers[numDays] > 0, "Mapping not found");
        //add a better form to condition this function to works only with the tiers wanted for the app
        stakingToken.transferFrom(msg.sender, address(this), amount);

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

    function calculateInterest(uint256 basisPoints, uint256 weiAmount)
        private
        pure
        returns (uint256)
    {
        return (basisPoints * weiAmount) / 10000; //700 /10000 => 0.07 convert
    }

    function modifyLockPeriods(uint256 numDays, uint256 basisPoints)
        external
        onlyOwner
    {
        tiers[numDays] = basisPoints;
        lockPeriods.push(numDays);
    }

    function getLockPeriods() external view returns (uint256[] memory) {
        return lockPeriods;
    }

    function getInterestRate(uint256 numDays) external view returns (uint256) {
        return tiers[numDays];
    }

    function getPositionByID(uint256 positionId)
        external
        view
        returns (Position memory)
    {
        return positions[positionId];
    }

    function getPositionIdsForAddress(address walletAddress)
        external
        view
        returns (uint256[] memory)
    {
        return positionIdsByAddress[walletAddress];
    }

    function changeUnlockDate(uint256 positionId, uint256 newUnlockDate)
        external
        onlyOwner
    {
        positions[positionId].unlockDate = newUnlockDate;
    }

    function closePosition(uint256 positionId) external {
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
