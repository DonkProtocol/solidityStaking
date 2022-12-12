import React from "react";

const NavBar = (props) => {
  return (
    <>
      <div className="navBar">
        {props.isConnected() ? (
          <div className="connectButton">Connected</div>
        ) : (
          <div onClick={() => props.connect()} className="connectButton">
            CONNECT WALLET
          </div>
        )}
      </div>
    </>
  );
};

export default NavBar;
