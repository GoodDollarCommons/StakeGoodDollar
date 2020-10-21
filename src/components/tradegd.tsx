import React, { useState, useMemo, useCallback } from "react";
import { useWeb3React } from "@web3-react/core";
import { Card, Paper, TextField, CardHeader, CardContent, Grid, Button } from "@material-ui/core";
import { BigNumberInput } from "big-number-input";
import { AccountItem } from "ethereum-react-components";
import ethers, { Contract } from "ethers";
import GoodReserveABI from "../contracts/GoodReserve.json";
import ERC20ABI from "../contracts/ERC20.json";

const networks: { [key: number]: string } = {
  1: "Mainnet",
  3: "ropsten",
};
const grAddresses: { [key: number]: string } = {
  1: "0x5C16960F2Eeba27b7de4F1F6e84E616C1977e070",
  3: "0x5810950BF9184F286f1C33b2cf80533D2CB274AF",
};
const cdaiAddresses: { [key: number]: string } = {
  1: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
  3: "0x6ce27497a64fffb5517aa4aee908b1e7eb63b9ff",
};

export const TradeGD = () => {
  const { library, chainId, account, connector, active } = useWeb3React();
  const network = networks[chainId || 1];
  const grAddress = grAddresses[chainId || 1];
  const cdaiAddress = cdaiAddresses[chainId || 1];
  console.log({ chainId, network, grAddress, cdaiAddress });
  const tradeContract = useMemo(
    () => {
      if (!active) return {} as Contract
      return new ethers.Contract(
        grAddress,
        GoodReserveABI,
        library.getSigner()
      )
    },
    [library, active, grAddress]
  );
  console.log({ active, connector, library, ethers, GoodReserveABI });
  const cDaiContract = useMemo(
    () => {
      if (!active) return {} as Contract
      return new ethers.Contract(
        cdaiAddress,
        ERC20ABI,
        library.getSigner()
      )
    },
    [library, active, cdaiAddress]
  );

  const [buyValues, setBuyValues] = useState<any>({ minCDai: "0", minGD: "0" });
  const [inputError, setInputError] = useState<string | void>();
  const [currentTxHash, setCurrentTxHash] = useState<string>("None"); //hash of tx in process

  const onInputChange = useCallback((field: string) => {
    return (value: string) => {

      setBuyValues({ ...buyValues, [field]: value })
    }
  }, [buyValues, setBuyValues]);

  const buyReserve = async () => {
    console.log({ buyValues })
    try {
      const gasEstimated = await tradeContract.estimateGas.buy(cdaiAddress, buyValues.minCDai, buyValues.minGD, { value: 0 })

      const tx = await tradeContract.buy(cdaiAddress, buyValues.minCDai, buyValues.minGD, { gasLimit: gasEstimated.toString(), value: 0 })
      setCurrentTxHash("In progress...")
      const receipt = await tx.wait()
      console.log({ tx, receipt, gasEstimated })
    }
    catch (e) {
      setInputError("Transaction failed")
    }
    finally {
      setCurrentTxHash("Finished")
    }
  }
  
  const unlockCDai = async () => {
    console.log({ buyValues })
    try {
      const gasEstimated = await cDaiContract.estimateGas.approve(grAddress, buyValues.minCDai, { value: 0 })

      const tx = await cDaiContract.approve(grAddress, buyValues.minCDai, { gasLimit: gasEstimated.toString(), value: 0 })
      setCurrentTxHash("In progress...")
      const receipt = await tx.wait()
      console.log({ tx, receipt, gasEstimated })
    }
    catch (e) {
      setInputError("Transaction failed")
    }
    finally {
      setCurrentTxHash("Unlocked")
    }
  }

  return (

    <Paper>
      <Grid container justify={"center"}>
        <Card style={styles.card} raised={true}>
          <AccountItem name="Account" address={account} style={{
            padding: '2%'
          }} />

        </Card>
        <Card style={styles.card} raised={true}>
          <CardHeader title="Network" subheader={network}></CardHeader>
        </Card>

        <Card style={styles.card} raised={true}>
          <CardHeader title="Pending TX" subheader={currentTxHash} />
        </Card>
      </Grid>
      <Grid container justify="center">
        <Card style={{ ...styles.card, height: 'auto' }} raised={true}>
          <CardHeader title="Buy G$ with cDAI from Reserve" subheader="Need to unlock cDAI first" />
          <CardContent>
            <Grid container direction='column'>
              <Grid item>
                <BigNumberInput
                  decimals={8}
                  onChange={onInputChange("minCDai")}
                  value={buyValues.minCDai}
                  renderInput={(props: any) => (
                    <TextField label="min cDAI used" helperText="minimum expected amount of cDAI used by GoodReserve" meta={{ error: inputError }} {...props} />
                  )}
                />
              </Grid>
              <Grid item>
                <BigNumberInput
                  decimals={2}
                  onChange={onInputChange("minGD")}
                  value={buyValues.minGD}
                  renderInput={(props: any) => (
                    <TextField label="min GD return" helperText="prevent front running, minimum expected amount of G$ from reserve otherwise revert tx" meta={{ error: inputError }} {...props} />
                  )}
                />

              </Grid>
              <Grid item>
                <Button variant="contained" color="primary" style={{ margin: '5%' }} onClick={unlockCDai}>
                  Unlock
                </Button>
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
