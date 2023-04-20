// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

pragma solidity ^0.8.0;

//contract for staking
contract Staking {
    using SafeMath for uint256;
    address public owner;
    IERC20 public stakingToken;

    struct Position {
        address walletAddress;
        uint256 createdDate;
        uint256 amountStaked;
        uint256 rewardStaked;
    }

    mapping(address => Position) public positions;

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

        positions[msg.sender] = Position({
            walletAddress: msg.sender,
            createdDate: block.timestamp,
            amountStaked: positions[msg.sender].amountStaked.add(amount),
            rewardStaked: positions[msg.sender].rewardStaked
        });
    }

    function harvest() external {
        uint256 apr = getAPR();

        uint256 rewardAmount = reward(
            apr,
            positions[msg.sender].amountStaked,
            positions[msg.sender].createdDate
        );

        positions[msg.sender].rewardStaked = rewardAmount;

        require(
            positions[msg.sender].walletAddress == msg.sender,
            "Only position creator may modify position"
        );

        require(
            positions[msg.sender].rewardStaked != 0,
            "the user should have an amount reward to have a harvest"
        );

        stakingToken.transfer(msg.sender, positions[msg.sender].rewardStaked);

        positions[msg.sender].createdDate = 0;
        positions[msg.sender].rewardStaked = 0;
    }

    function unstake() external {
        require(
            positions[msg.sender].walletAddress == msg.sender,
            "Only position creator may modify position"
        );

        require(
            positions[msg.sender].amountStaked != 0,
            "the user should have an amount staked to unstake"
        );

        stakingToken.transfer(msg.sender, positions[msg.sender].amountStaked);

        positions[msg.sender].amountStaked = 0;
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
        uint256 apr = getAPR();
        uint256 rewardAmount = reward(
            apr,
            positions[msg.sender].amountStaked,
            positions[msg.sender].createdDate
        );

        return rewardAmount;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        return a - b;
    }

    function calculateAPR(
        uint256 totalStakedPercentage
    ) public pure returns (uint256) {
        uint256 apr = 0;
        if (totalStakedPercentage <= 20) {
            // 20% do supply
            apr = 24000 - (24000 - 1500) * (totalStakedPercentage / 20);
        } else if (totalStakedPercentage <= 40) {
            // 40% do supply
            apr = 1500 - (1500 - 750) * ((totalStakedPercentage - 20) / 20);
        } else if (totalStakedPercentage < 50) {
            // 50% do supply
            apr = 750 - (750 / 10) * ((totalStakedPercentage - 40) / 10);
        } else {
            apr = 750 - (750 / 50) * (totalStakedPercentage - 50);
            if (apr < 0) {
                apr = 0;
            }
        }
        return apr;
    }

    function getAPR() public view returns (uint256) {
        uint256 balance = stakingToken.balanceOf(address(this));
        uint256 totalSupply = stakingToken.totalSupply();
        uint256 percentage = (balance.mul(100)).div(totalSupply);

        return calculateAPR(percentage);
    }

    function checkBalance(address account) external view returns (uint256) {
        return stakingToken.balanceOf(account);
    }

    function getPositions() external view returns (Position memory) {
        return positions[msg.sender];
    }
}
