// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity ^0.8.0;

//contract for staking
contract Staking {
    address public owner;
    IERC20 public stakingToken;
    uint256 _aprReward = 2500;

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

        stakingToken.transfer(msg.sender, position.rewardStaked);

        //TODO: reset harvest first time
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
}
