// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity ^0.8.0;

//contract for staking
contract Staking {
    address public owner;
    IERC20 public stakingToken;
    uint256 _aprReward = 250000000000000000;

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
        require(
            position.walletAddress == msg.sender,
            "Only position creator may modify position"
        );

        require(
            position.rewardStaked != 0,
            "the user should have an amount reward to have a harvest"
        );

        //uint256 tokenBalance = stakingToken.balanceOf(address(this));

        uint256 apr = _aprReward;

        uint256 rewardAmount = reward(
            apr,
            block.timestamp,
            position.amountStaked,
            position.createdDate
        );

        stakingToken.transfer(msg.sender, rewardAmount);

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

    function getPositions() external view returns (Position memory) {
        return position;
    }

    function reward(
        uint256 apr,
        uint256 current_time,
        uint256 amount,
        uint256 start_time
    ) public pure returns (uint256) {
        uint256 time_diff = current_time - start_time;
        uint256 apr_per_second = apr / 100 / 31536000; // 1 year in seconds
        uint256 apr_per_time_diff = apr_per_second * time_diff;
        uint256 rewardAmount = (amount * apr_per_time_diff) / 1e18; // divide by 1e18 to convert back to integer

        return rewardAmount;
    }
}
