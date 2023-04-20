// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

pragma solidity ^0.8.0;

//contract for staking
contract Staking {
    using SafeMath for uint256;
    address public owner;
    IERC20 public stakingToken;
    uint256 _aprReward = 25000;

    struct Position {
        address walletAddress;
        uint256 createdDate;
        uint256 amountStaked;
        uint256 rewardStaked;
    }

    Position position;

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

    function stake(uint256 amount) external {
        stakingToken.transferFrom(msg.sender, address(this), amount);

        position = Position({
            walletAddress: msg.sender,
            createdDate: block.timestamp,
            amountStaked: position.amountStaked + amount,
            rewardStaked: position.rewardStaked
        });
    }

    function harvest() external {
        uint256 apr = _aprReward;

        uint256 rewardAmount = reward(
            apr,
            position.amountStaked,
            position.createdDate
        );

        position.rewardStaked = rewardAmount;

        require(
            position.walletAddress == msg.sender,
            "Only position creator may modify position"
        );

        require(
            position.rewardStaked != 0,
            "the user should have an amount reward to have a harvest"
        );

        stakingToken.transfer(msg.sender, position.rewardStaked);

        position.createdDate = 0;
        position.rewardStaked = 0;
    }

    function unstake() external {
        require(
            position.walletAddress == msg.sender,
            "Only position creator may modify position"
        );

        require(
            position.amountStaked != 0,
            "the user should have an amount staked to unstake"
        );

        stakingToken.transfer(msg.sender, position.amountStaked);

        position.amountStaked = 0;
    }

    function reward(
        uint256 apr,
        uint256 amountStaked,
        uint256 startDate
    ) public view returns (uint256) {
        uint256 secondsElapsed = block.timestamp - startDate;
        uint256 minutesElapsed = secondsElapsed.div(60);

        uint256 yearlyRate = apr.mul(10 ** 16); // convert APR to wei/year
        uint256 ratePerMinute = yearlyRate.div(365 * 24 * 60); // divide by total number of minutes in a year

        uint256 rewardPerMinute = amountStaked.mul(ratePerMinute).div(10 ** 18);
        uint256 rewardAmount = rewardPerMinute.mul(minutesElapsed);

        return rewardAmount;
    }

    function getRewards() external view returns (uint256) {
        uint256 apr = _aprReward;
        uint256 rewardAmount = reward(
            apr,
            position.amountStaked,
            position.createdDate
        );

        return rewardAmount;
    }

    function checkBalance(address account) external view returns (uint256) {
        return stakingToken.balanceOf(account);
    }

    function getPositions() external view returns (Position memory) {
        return position;
    }
}
