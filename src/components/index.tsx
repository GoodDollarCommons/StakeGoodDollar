import React from "react";
import {
  Web3ReactProvider,
  useWeb3React,
  UnsupportedChainIdError
} from "@web3-react/core";
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected
} from "@web3-react/injected-connector";
import { UserRejectedRequestError as UserRejectedRequestErrorWalletConnect } from "@web3-react/walletconnect-connector";
import { UserRejectedRequestError as UserRejectedRequestErrorFrame } from "@web3-react/frame-connector";
import { Web3Provider } from "@ethersproject/providers";

import { useEagerConnect, useInactiveListener } from "../hooks";
import {
  injected,
  network,
  walletconnect,
  walletlink,
  trezor,
  frame,
  authereum,
  fortmatic,
  portis,
  squarelink,
  torus
} from "../connectors";
import { TradeGD } from "./tradegd";

enum ConnectorNames {
  Injected = "Injected",
  Network = "Network",
  WalletConnect = "WalletConnect",
  WalletLink = "WalletLink",
  Ledger = "Ledger",
  Trezor = "Trezor",
  Frame = "Frame",
  Authereum = "Authereum",
  Fortmatic = "Fortmatic",
  Magic = "Magic",
  Portis = "Portis",
  Squarelink = "Squarelink",
  Torus = "Torus"
}

const connectorsByName: any = {
  [ConnectorNames.Injected]: injected,
  [ConnectorNames.Network]: network,
  [ConnectorNames.WalletConnect]: walletconnect,
  [ConnectorNames.WalletLink]: walletlink,
  [ConnectorNames.Trezor]: trezor,
  [ConnectorNames.Frame]: frame,
  [ConnectorNames.Authereum]: authereum,
  [ConnectorNames.Fortmatic]: fortmatic,
  [ConnectorNames.Portis]: portis,
  [ConnectorNames.Squarelink]: squarelink,
  [ConnectorNames.Torus]: torus
};

function getErrorMessage(error: Error) {
  if (error instanceof NoEthereumProviderError) {
    return "No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.";
  } else if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network.";
  } else if (
    error instanceof UserRejectedRequestErrorInjected ||
    error instanceof UserRejectedRequestErrorWalletConnect ||
    error instanceof UserRejectedRequestErrorFrame
  ) {
    return "Please authorize this website to access your Ethereum account.";
  } else {
    console.error(error);
    return "An unknown error occurred. Check the console for more details.";
  }
}

function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

export default function () {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <App />
    </Web3ReactProvider>
  );
}

function App() {
  const context = useWeb3React<Web3Provider>();
  const {
    connector,
    library,
    chainId,
    account,
    activate,
    deactivate,
    active,
    error
  } = context;

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = React.useState<any>();
  React.useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect();

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector);

  return (
    <>
      <TradeGD/>
      <hr style={{ margin: "1rem" }} />
      <div
        style={{
          display: "grid",
          gridGap: "1rem",
          gridTemplateColumns: "1fr 1fr",
          maxWidth: "20rem",
          margin: "auto"
        }}
      >
        {Object.keys(connectorsByName).map((name) => {
          const currentConnector = connectorsByName[name];
          const activating = currentConnector === activatingConnector;
          const connected = currentConnector === connector;
          const disabled =
            !triedEager || !!activatingConnector || connected || !!error;

          return (
            <button
              style={{
                height: "3rem",
                borderRadius: "1rem",
                borderColor: activating
                  ? "orange"
                  : connected
                  ? "green"
                  : "unset",
                cursor: disabled ? "unset" : "pointer",
                position: "relative"
              }}
              disabled={disabled}
              key={name}
              onClick={() => {
                setActivatingConnector(currentConnector);
                activate(connectorsByName[name]);
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  color: "black",
                  margin: "0 0 0 1rem"
                }}
              >
                {connected && (
                  <span role="img" aria-label="check">
                    ✅
                  </span>
                )}
              </div>
              {name}
            </button>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        {(active || error) && (
          <button
            style={{
              height: "3rem",
              marginTop: "2rem",
              borderRadius: "1rem",
              borderColor: "red",
              cursor: "pointer"
            }}
            onClick={() => {
              deactivate();
            }}
          >
            Deactivate
          </button>
        )}

        {!!error && (
          <h4 style={{ marginTop: "1rem", marginBottom: "0" }}>
            {getErrorMessage(error)}
          </h4>
        )}
      </div>

      <hr style={{ margin: "1rem" }} />

      <div
        style={{
          display: "grid",
          gridGap: "1rem",
          gridTemplateColumns: "fit-content",
          maxWidth: "20rem",
          margin: "auto"
        }}
      >
        {!!(library && account) && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer"
            }}
            onClick={() => {
              library
                .getSigner(account)
                .signMessage("👋")
                .then((signature: any) => {
                  window.alert(`Success!\n\n${signature}`);
                })
                .catch((error: any) => {
                  window.alert(
                    "Failure!" +
                      (error && error.message ? `\n\n${error.message}` : "")
                  );
                });
            }}
          >
            Sign Message
          </button>
        )}
        {!!(
          connector === connectorsByName[ConnectorNames.Network] && chainId
        ) && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer"
            }}
            onClick={() => {
              (connector as any).changeChainId(chainId === 1 ? 4 : 1);
            }}
          >
            Switch Networks
          </button>
        )}
        {connector === connectorsByName[ConnectorNames.WalletConnect] && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer"
            }}
            onClick={() => {
              (connector as any).close();
            }}
          >
            Kill WalletConnect Session
          </button>
        )}
        {connector === connectorsByName[ConnectorNames.WalletLink] && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer"
            }}
            onClick={() => {
              (connector as any).close();
            }}
          >
            Kill WalletLink Session
          </button>
        )}
        {connector === connectorsByName[ConnectorNames.Fortmatic] && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer"
            }}
            onClick={() => {
              (connector as any).close();
            }}
          >
            Kill Fortmatic Session
          </button>
        )}
        {connector === connectorsByName[ConnectorNames.Portis] && (
          <>
            {chainId !== undefined && (
              <button
                style={{
                  height: "3rem",
                  borderRadius: "1rem",
                  cursor: "pointer"
                }}
                onClick={() => {
                  (connector as any).changeNetwork(chainId === 1 ? 100 : 1);
                }}
              >
                Switch Networks
              </button>
            )}
            <button
              style={{
                height: "3rem",
                borderRadius: "1rem",
                cursor: "pointer"
              }}
              onClick={() => {
                (connector as any).close();
              }}
            >
              Kill Portis Session
            </button>
          </>
        )}
        {connector === connectorsByName[ConnectorNames.Torus] && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer"
            }}
            onClick={() => {
              (connector as any).close();
            }}
          >
            Kill Torus Session
          </button>
        )}
      </div>
    </>
  );
}
