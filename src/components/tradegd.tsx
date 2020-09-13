import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useWeb3React } from "@web3-react/core";
import { Card, Paper, TextField, CardHeader, CardContent, Typography, Grid, Button, CircularProgress } from "@material-ui/core";
import { BigNumberInput } from "big-number-input";
import { NodeInfoBox, AccountItem } from "ethereum-react-components";
import ethers, { Contract } from "ethers";
import tradegdABI from "../contracts/tradegd.json";
import { LogDescription } from "ethers/lib/utils";

const networks: { [key: number]: string } = {
  1: "Mainnet",
  2: "kovan",
  3: "ropsten",
  122: "fuse"
};

const tradegdInterface = new ethers.utils.Interface(tradegdABI.abi)
export const TradeGD = () => {
  const { library, chainId, account, connector, active } = useWeb3React();
  const network = networks[chainId || 1];
  const tradeContract = useMemo(
    () => {
      if (!active) return {} as Contract
      return new ethers.Contract(
        "0x863720706e3391e17ad673f5D7A51B74528a35A9",
        tradegdABI.abi,
        library.getSigner()
      )
    },
    [library, active]
  );
  console.log({ active, connector, library, ethers, tradegdABI });
  useEffect(() => {
    const getContracts = async () => {
      if (!active) return [];
      const [GD, uniswap, DAI] = await Promise.all([
        tradeContract.GD() as string,
        tradeContract.uniswap() as string,
        tradeContract.DAI() as string
      ]).catch((e) => {
        console.log("failed fetching network contracts", e)
        return []
      });
      console.log({ GD, uniswap, DAI });
    };
    getContracts();
  }, [library]);


  const [inputValue, setInputValue] = useState<string>("0");
  const [buyValues, setBuyValues] = useState<any>({ eth: "0", minDai: "0", minGD: "0" });
  const [inputError, setInputError] = useState<string | void>();
  const [currentTX, setCurrentTX] = useState<any>(); //tx in process
  const [tradeEvent, setTradeEvent] = useState<LogDescription>(); //TradeGD event from tx result

  const onInputChange = useCallback((field: string) => {
    return (value: string) => {

      setBuyValues({ ...buyValues, [field]: value })
    }
  }, [buyValues, setBuyValues]);

  const getTradeEvent = (receipt: any) =>
    receipt.logs.find((_: any) => _.topics.includes("0xad8e10549027a588946bc8eccabef0697a3e827043ef830aa88fad8e470fd57f"))

  const buyReserve = async () => {
    console.log({ buyValues })
    try {
      const gasEstimated = await tradeContract.estimateGas.buyGDFromReserve(buyValues.minDai, buyValues.minGD, { value: buyValues.eth })

      const tx = await tradeContract.buyGDFromReserve(buyValues.minDai, buyValues.minGD, { gasLimit: gasEstimated.toString(), value: buyValues.eth })
      setCurrentTX(tx)
      const receipt = await tx.wait()
      const tradeEvent = getTradeEvent(receipt)
      const event = tradeEvent && tradegdInterface.parseLog(receipt.events)
      console.log({ tx, receipt, gasEstimated, event })
      setTradeEvent(event)
    }
    catch (e) {
      setInputError("Transaction failed")
    }
    finally {
      setCurrentTX(undefined)
    }
  }

  return (

    <Paper>
      <Grid container justify={"center"}>
        <Card style={styles.card} raised={true}>
          <AccountItem name="Account 1" address={account} style={{
            padding: '2%'
          }} />

        </Card>
        <Card style={styles.card} raised={true}>
          <CardHeader title="Network" subheader={network}></CardHeader>
        </Card>

        <Card style={styles.card} raised={true}>
          <CardHeader title="Pending TX" subheader={currentTX.txHash} />
          <CircularProgress />
        </Card>
      </Grid>
      <Grid container justify="center">
        <Card style={{ ...styles.card, height: 'auto' }} raised={true}>
          <CardHeader title="Buy G$ with ETH from Reserve" subheader="Will convert ETH->DAI->cDAI->GD" />
          <CardContent>
            <Grid container direction='column'>
              <Grid item>

                <BigNumberInput
                  decimals={18}
                  onChange={onInputChange("eth")}
                  value={buyValues.eth}
                  renderInput={(props: any) => (
                    <TextField style={{ width: '100%' }} label="ETH Amount" meta={{ error: inputError }} {...props} />
                  )}
                />
              </Grid>
              <Grid item>
                <BigNumberInput
                  decimals={18}
                  onChange={onInputChange("minDai")}
                  value={buyValues.minDai}
                  renderInput={(props: any) => (
                    <TextField label="min DAI return" helperText="prevent front running, minimum expected amount of DAI from uniswap otherwise revert tx" meta={{ error: inputError }} {...props} />
                  )}
                />
              </Grid>
              <Grid item>
                <BigNumberInput
                  decimals={18}
                  onChange={onInputChange("minGD")}
                  value={buyValues.minGD}
                  renderInput={(props: any) => (
                    <TextField label="min GD return" helperText="prevent front running, minimum expected amount of G$ from reserve otherwise revert tx" meta={{ error: inputError }} {...props} />
                  )}
                />

              </Grid>
              <Grid item>
                <Button variant="contained" color="primary" style={{ margin: '5%' }} onClick={buyReserve}>
                  Buy
                </Button>
              </Grid>
            </Grid>

          </CardContent>
        </Card>
      </Grid>
    </Paper>
  ); // return <Text size={5}>Hey</Text>;
};

const styles = {
  card: {
    margin: '1%',
    padding: '1%',
    height: '80px'
  }
} 