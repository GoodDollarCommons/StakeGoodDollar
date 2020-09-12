import React, { useState, useMemo, useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import { Card, Paper } from "@material-ui/core";
import { BigNumberInput } from "big-number-input";
import { NodeInfoBox } from "ethereum-react-components";
import ethers from "ethers";
import tradegdABI from "../contracts/tradegd.json";

const networks = {
  1: "Mainnet",
  2: "kovan",
  3: "ropsten",
  122: "fuse"
};
export const TradeGD = () => {
  const web3 = useWeb3React();
  const network = networks[web3.chainId];
  const tradeContract = useMemo(
    () =>
      new ethers.Contract(
        "0x863720706e3391e17ad673f5D7A51B74528a35A9",
        tradegdABI.abi,
        web3.library
      ),
    [web3]
  );
  console.log({ web3, ethers, tradegdABI });
  useEffect(() => {
    const getContracts = async () => {
      const [GD, uniswap, DAI] = await Promise.all([
        tradeContract.GD(),
        tradeContract.uniswap(),
        tradeContract.DAI()
      ]).catch((e) => console.log("failed fetching network contracts", e));
      console.log({ GD, uniswap, DAI });
    };
    getContracts();
  }, [web3]);

  const onInputChange = (value) => {
    setInputValue(value);
  };
  const [inputValue, setInputValue] = useState(0);
  const [inputError, setInputError] = useState();

  return (
    <Paper>
      {/* <NodeInfoBox
        active="remote"
        network={network || "none"}
        changingNetwork={false}
        remote={{
          client: "infura",
          blockNumber: 100000,
          timestamp: 1599935851
        }}
        sycnMode="nosync"
      /> */}
      <Card>
        <BigNumberInput
          decimals={18}
          onChange={onInputChange}
          value={inputValue}
          renderInput={(props: any) => (
            <TextField label="Amount" meta={{ error: inputError }} {...props} />
          )}
        />
      </Card>
    </Paper>
  ); // return <Text size={5}>Hey</Text>;
};
