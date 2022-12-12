import "./App.css";
import react, { useEffect, useState } from "react";
import { ethers } from "ethers";
import artifact from "./artifacts/contracts/Staking.sol/Staking.json";
import NavBar from "./components/NavBar";
import StakeModal from "./components/StakeModal";
import { FaEthereum, FaRegMoneyBillAlt } from "react-icons/fa";
import { BsFillPersonCheckFill } from "react-icons/bs";
import artifactToken from "./artifacts/contracts/StakingToken.sol/StakingYourToken.json";

const CONTRACT_ADDRESS = "0x085fA7a07245603F89301e5Bc5D69284A357a7Fd";
const TOKEN_CONTRACT = "0x82ed3B2c38547426D634293E95d29F7B541b834c";
function App() {
  // general
  const [provider, setProvider] = useState(undefined);
  const [signer, setSigner] = useState(undefined);
  const [contract, setContract] = useState(undefined);
  const [tokenContract, setTokenContract] = useState(undefined);
  const [signerAddress, setSignerAddress] = useState(undefined);

  // assets
  const [assetIds, setAssetIds] = useState([]);
  const [assets, setAssets] = useState([]);

  // staking
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [stakingLength, setStakingLength] = useState(undefined);
  const [stakingPercent, setStakingPercent] = useState(undefined);
  const [amount, setAmount] = useState(0);

  // helpers
  const toWei = (ether) => ethers.utils.parseEther(ether);
  const toEther = (wei) => ethers.utils.formatEther(wei);

  useEffect(() => {
    const onLoad = async () => {
      const provider = await new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      const contract = await new ethers.Contract(
        CONTRACT_ADDRESS,
        artifact.abi
      );
      setContract(contract);

      const tokenContract = await new ethers.Contract(
        TOKEN_CONTRACT,
        artifactToken.abi
      );
      setTokenContract(tokenContract);
    };
    onLoad();
  }, []);

  const isConnected = () => signer !== undefined;

  const getSigner = async () => {
    provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    return signer;
  };

  const getAssetIds = async (address, signer) => {
    const assetIds = await contract
      .connect(signer)
      .getPositionIdsForAddress(address);

    return assetIds;
  };

  const calcDaysRemaining = (unlockDate) => {
    const timeNow = Date.now() / 1000;
    const secondsRemaining = unlockDate - timeNow;
    return Math.max((secondsRemaining / 60 / 60 / 24).toFixed(0), 0);
  };

  const getAssets = async (ids, signer) => {
    const queriedAssets = await Promise.all(
      ids.map((id) => contract.connect(signer).getPositionByID(id))
    );

    queriedAssets.map(async (asset) => {
      const parsedAsset = {
        positionId: asset.positionId,
        percentInterest: Number(asset.percentInterest) / 100,
        daysRemaining: calcDaysRemaining(Number(asset.unlockDate)),
        etherInterest: toEther(asset.weiInterest),
        etherStaked: toEther(asset.weiStaked),
        open: asset.open,
      };

      setAssets((prev) => [...prev, parsedAsset]);
    });
  };

  const connectAndLoad = async () => {
    const signer = await getSigner(provider);
    setSigner(signer);

    const signerAddress = await signer.getAddress();
    setSignerAddress(signerAddress);

    const assetIds = await getAssetIds(signerAddress, signer);
    setAssetIds(assetIds);

    getAssets(assetIds, signer);
  };

  const openStakingModal = (stakingLength, stakingPercent) => {
    setShowStakeModal(true);
    setStakingLength(stakingLength);
    setStakingPercent(stakingPercent);
  };

  const stake = async () => {
    const wei = toWei(amount);
    const data = { value: wei };

    await tokenContract.connect(signer).approve(CONTRACT_ADDRESS, wei);
    await tokenContract
      .connect(signer)
      .allowance(CONTRACT_ADDRESS, signerAddress);
    contract.connect(signer).stake(stakingLength, wei);
  };

  const withdraw = (positionId) => {
    contract.connect(signer).closePosition(positionId);
  };

  return (
    <div className="App">
      <div className="video-bg">
        <video width="320" height="240" autoPlay loop muted>
          <source
            src="https://assets.codepen.io/3364143/7btrrd.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      </div>
      <div>
        <NavBar isConnected={isConnected} connect={connectAndLoad} />
      </div>

      <div className="appBody">
        <div className="marketContainer">
          <div className="subContainer">
            <span>
              <BsFillPersonCheckFill className="logoImg" />
            </span>
            <span className="marketHeader">Staking</span>
          </div>

          <div className="row">
            <div className="col-md-4">
              <div
                onClick={() => openStakingModal(30, "7%")}
                className="marketOption"
              >
                <div className="glyphContainer hoverButton">
                  <span className="glyph">
                    <FaRegMoneyBillAlt />
                  </span>
                </div>
                <div className="optionData">
                  <span>1 Month</span>
                  <span className="optionPercent">7%</span>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div
                onClick={() => openStakingModal(90, "10%")}
                className="marketOption"
              >
                <div className="glyphContainer hoverButton">
                  <span className="glyph">
                    <FaRegMoneyBillAlt />
                  </span>
                </div>
                <div className="optionData">
                  <span>3 Months</span>
                  <span className="optionPercent">10%</span>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div
                onClick={() => openStakingModal(180, "12%")}
                className="marketOption"
              >
                <div className="glyphContainer hoverButton">
                  <span className="glyph">
                    <FaRegMoneyBillAlt />
                  </span>
                </div>
                <div className="optionData">
                  <span>6 Months</span>
                  <span className="optionPercent">12%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="assetContainer">
          <div className="subContainer">
            <span className="marketHeader">Staked Assets</span>
          </div>
          <div>
            <div className="row columnHeaders">
              <div className="col-md-2">Assets</div>
              <div className="col-md-2">Percent Interest</div>
              <div className="col-md-2">Staked</div>
              <div className="col-md-2">Interest</div>
              <div className="col-md-2">Days Remaining</div>
              <div className="col-md-2"></div>
            </div>
          </div>
          <br />
          {assets.length > 0 &&
            assets.map((a, idx) => (
              <div className="row stakedAssets" key={idx}>
                <div className="col-md-2 ">
                  <span>
                    <FaEthereum className="stakedLogoImg" />
                  </span>
                </div>
                <div className="col-md-2 ">
                  <span className="stakingItem">{a.percentInterest} %</span>
                </div>
                <div className="col-md-2 ">
                  {" "}
                  <span className="stakingItem">{a.etherStaked}</span>
                </div>
                <div className="col-md-2 ">
                  {" "}
                  <span className="stakingItem">{a.etherInterest}</span>
                </div>
                <div className="col-md-2 ">
                  {" "}
                  <span className="stakingItem">{a.daysRemaining}</span>
                </div>
                <div className="col-md-2 ">
                  {a.open ? (
                    <div onClick={() => withdraw(a.positionId)}>
                      <span className="orangeMiniButton"> Withdraw</span>
                    </div>
                  ) : (
                    <span>closed</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
      {showStakeModal && (
        <StakeModal
          onClose={() => setShowStakeModal(false)}
          stakingLength={stakingLength}
          stakingPercent={stakingPercent}
          amount={amount}
          setAmount={setAmount}
          stake={stake}
        />
      )}
    </div>
  );
}

export default App;
