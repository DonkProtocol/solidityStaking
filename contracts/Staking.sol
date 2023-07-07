// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

pragma solidity ^0.8.0;

//contract for staking
contract Staking {
    using SafeMath for uint256;
    address public adminWallet;
    IERC20 public immutable stakingToken;
    uint256 public stakingFee = 0;
    uint256 public daysFee;
    uint256 public currentApr;

    struct Position {
        address walletAddress;
        uint256 createdDate;
        uint256 amountStaked;
        uint256 rewardStaked;
        uint256 savedReward;
        uint256 firstDate;
    }

    struct TotalStaked {
        uint256 amountStaked;
    }

    mapping(address => Position) public positions;
    TotalStaked public stakedAmount;

    constructor(address token, uint256 _daysFee, uint256 _apr) {
        adminWallet = msg.sender;
        stakingToken = IERC20(token);
        daysFee = _daysFee;
        currentApr = _apr;
    }

    modifier onlyOwner() {
        require(
            positions[msg.sender].walletAddress == msg.sender,
            "Only owner may modify an staking position"
        );
        _;
    }

    modifier onlyAdmin() {
        require(adminWallet == msg.sender, "Only admin may modify a Fee taxes");
        _;
    }

    function stake(uint256 amount) external {
        stakingToken.transferFrom(msg.sender, address(this), amount);

        uint256 apr = getAPR();

        uint256 rewardAmount = reward(
            apr,
            positions[msg.sender].amountStaked,
            positions[msg.sender].createdDate
        );

        positions[msg.sender].rewardStaked = rewardAmount;

        if (positions[msg.sender].rewardStaked != 0) {
            positions[msg.sender] = Position({
                walletAddress: msg.sender,
                createdDate: block.timestamp,
                amountStaked: positions[msg.sender].amountStaked += amount,
                rewardStaked: 0,
                savedReward: positions[msg.sender].savedReward += rewardAmount,
                firstDate: block.timestamp
            });
        } else {
            positions[msg.sender] = Position({
                walletAddress: msg.sender,
                createdDate: block.timestamp,
                amountStaked: positions[msg.sender].amountStaked += amount,
                rewardStaked: positions[msg.sender].rewardStaked,
                savedReward: positions[msg.sender].savedReward,
                firstDate: positions[msg.sender].firstDate
            });
        }

        stakedAmount = TotalStaked({
            amountStaked: stakedAmount.amountStaked + amount
        });
    }

    function harvest() external onlyOwner {
        require(
            positions[msg.sender].amountStaked != 0,
            "the user should have an amount reward to have a harvest"
        );

        uint256 apr = getAPR();

        uint256 rewardAmount = reward(
            apr,
            positions[msg.sender].amountStaked,
            positions[msg.sender].createdDate
        );

        positions[msg.sender].rewardStaked = rewardAmount;

        stakingToken.transfer(
            msg.sender,
            positions[msg.sender].rewardStaked +
                positions[msg.sender].savedReward
        );

        positions[msg.sender].createdDate = block.timestamp;

        positions[msg.sender].rewardStaked = 0;
        positions[msg.sender].savedReward = 0;
    }

    function unstake() external onlyOwner {
        require(
            positions[msg.sender].amountStaked != 0,
            "the user should have an amount staked to unstake"
        );

        uint256 apr = getAPR();

        uint256 rewardAmount = reward(
            apr,
            positions[msg.sender].amountStaked,
            positions[msg.sender].createdDate
        );

        uint256 amount = positions[msg.sender].amountStaked +
            rewardAmount +
            positions[msg.sender].savedReward;

        uint256 feeValue = amount.mul(stakingFee).div(10000);
        uint256 feeApplied = amount.sub(feeValue);

        uint fee0 = hasPassedSevenDays(feeApplied);

        stakingToken.transfer(msg.sender, feeApplied.sub(fee0));

        stakedAmount = TotalStaked({
            amountStaked: stakedAmount.amountStaked -
                positions[msg.sender].amountStaked
        });

        positions[msg.sender].createdDate = 0;
        positions[msg.sender].rewardStaked = 0;
        positions[msg.sender].amountStaked = 0;
        positions[msg.sender].savedReward = 0;

        if (feeValue > 0) {
            stakingToken.transfer(adminWallet, feeValue);
        }

        if (fee0 > 0) {
            stakingToken.transfer(adminWallet, fee0);
        }
    }

    function reward(
        uint256 apr,
        uint256 amountStaked,
        uint256 startDate
    ) public view returns (uint256) {
        if (positions[msg.sender].amountStaked != 0) {
            uint256 secondsElapsed = block.timestamp - startDate;
            uint256 minutesElapsed = secondsElapsed.div(60);

            uint256 yearlyRate = apr.mul(10 ** 16); // convert APR to wei/year
            uint256 ratePerMinute = yearlyRate.div(365 * 24 * 60); // divide by total number of minutes in a year

            uint256 rewardPerMinute = amountStaked.mul(ratePerMinute).div(
                10 ** 18
            );
            uint256 rewardAmount = rewardPerMinute.mul(minutesElapsed);

            return rewardAmount;
        }

        return positions[msg.sender].rewardStaked;
    }

    function getRewards() external view returns (uint256) {
        uint256 apr = getAPR();
        uint256 rewardAmount = reward(
            apr,
            positions[msg.sender].amountStaked,
            positions[msg.sender].createdDate
        );

        uint256 savedReward = positions[msg.sender].savedReward;

        return rewardAmount + savedReward;
    }

    /*
    function calculateAPR(
        uint256 totalStakedPercentage
    ) public pure returns (uint256) {
        uint256 apr = 0;
        if (totalStakedPercentage <= 20) {
            // 20% do supply
            apr = 2400 - (((2400 - 15) * totalStakedPercentage) / 20);
        } else if (totalStakedPercentage <= 40) {
            // 40% do supply
            apr = 15 - (((15 - 7) * (totalStakedPercentage - 20)) / 20);
        } else if (totalStakedPercentage < 50) {
            // 50% do supply
            apr = 7 - ((7 * (totalStakedPercentage - 40)) / 10);
        } else {
            apr = (7 * (totalStakedPercentage - 50)) / 50;
        }

        return apr;
    }
*/
    //calculating the 7 days fee
    function hasPassedSevenDays(uint amount) private view returns (uint fee0) {
        require(daysFee <= 100, "INSUFFICIENT_FEES");
        uint256 currentTimestamp = block.timestamp;
        uint256 sevenDaysInSeconds = 7 days;
        uint256 fee = daysFee;

        if (
            currentTimestamp >=
            positions[msg.sender].firstDate + sevenDaysInSeconds
        ) {
            fee0 = (amount * fee) / 10000; //0.5%
        } else {
            fee0 = 0;
        }
    }

    function getAPR() public view returns (uint256) {
        // uint256 balance = stakedAmount.amountStaked;
        // uint256 totalSupply = stakingToken.totalSupply();
        // uint256 percentage = (balance.mul(100)).div(totalSupply);

        return currentApr;
    }

    function checkBalance(address account) external view returns (uint256) {
        return stakingToken.balanceOf(account);
    }

    function getPositions() external view returns (Position memory) {
        return positions[msg.sender];
    }

    function getTotalStakedAmount() external view returns (uint256) {
        return stakedAmount.amountStaked;
    }

    function getStakingFee() external view returns (uint256) {
        return stakingFee;
    }

    function setStakingFee(uint256 fee) external onlyAdmin returns (uint256) {
        return stakingFee = fee;
    }

    function setDaysFee(uint256 _daysFee) external onlyAdmin returns (uint256) {
        return daysFee = _daysFee;
    }

    function setApr(uint256 _apr) external onlyAdmin returns (uint256) {
        return currentApr = _apr;
    }

    function setAdminWallet(
        address _adminWallet
    ) external onlyAdmin returns (address) {
        return adminWallet = _adminWallet;
    }
}
