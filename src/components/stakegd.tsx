import React, { useState, useMemo, useCallback } from "react";
import { useWeb3React } from "@web3-react/core";
import { Card, Paper, TextField, CardHeader, CardContent, Grid, Button } from "@material-ui/core";
import { BigNumberInput } from "big-number-input";
import { AccountItem } from "ethereum-react-components";
import ethers, { Contract } from "ethers";
import GoodStakingABI from "../contracts/GoodStaking.json";
import ERC20ABI from "../contracts/ERC20.json";

const networks: { [key: number]: string } = {
  1: "Mainnet",
  3: "Ropsten",
};
const gsAddresses: { [key: number]: string } = {
  1: "0xEa12bB3917cf6aE2FDE97cE4756177703426d41F",
  3: "0xE6876231d1a5905Abed03E4C613E427b0357ec0b",
};
const daiAddresses: { [key: number]: string } = {
  1: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  3: "0xB5E5D0F8C0cbA267CD3D7035d6AdC8eBA7Df7Cdd",
};

export const StakeGD = () => {
  const { library, chainId, account, connector, active } = useWeb3React();
  const network = networks[chainId || 1];
  const gsAddress = gsAddresses[chainId || 1];
  const daiAddress = daiAddresses[chainId || 1];
  console.log({ chainId, network, gsAddress, daiAddress });
  const stakeContract = useMemo(
    () => {
      if (!active) return {} as Contract
      return new ethers.Contract(
        gsAddress,
        GoodStakingABI,
        library.getSigner()
      )
    },
    [library, active, gsAddress]
  );
  console.log({ active, connector, library, ethers, GoodStakingABI });
  const daiContract = useMemo(
    () => {
      if (!active) return {} as Contract
      return new ethers.Contract(
        daiAddress,
        ERC20ABI,
        library.getSigner()
      )
    },
    [library, active, daiAddress]
  );

  const [stakeValues, setStakeValues] = useState<any>({ maxDai: "0" });
  const [inputError, setInputError] = useState<string | void>();
  const [currentTxHash, setCurrentTxHash] = useState<string>("None"); //status of tx in process

  const onInputChange = useCallback((field: string) => {
    return (value: string) => {

      setStakeValues({ ...stakeValues, [field]: value })
    }
  }, [stakeValues, setStakeValues]);

  const stakeSimple = async () => {
    console.log({ stakeValues })
    try {
      const gasEstimated = await stakeContract.estimateGas.stakeDAI(stakeValues.maxDai, { value: 0 })
      const tx = await stakeContract.stakeDAI(stakeValues.maxDai, { gasLimit: 500000, value: 0 })
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

  const withdrawStake = async () => {
    console.log({ stakeValues })
    try {
      const gasEstimated = await stakeContract.estimateGas.withdrawStake({ value: 0 })
      const tx = await stakeContract.withdrawStake({ gasLimit: 500000, value: 0 })
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
  
  const unlockDai = async () => {
    console.log({ stakeValues })
    try {
      const gasEstimated = await daiContract.estimateGas.approve(gsAddress, stakeValues.maxDai, { value: 0 })
      const tx = await daiContract.approve(gsAddress, stakeValues.maxDai, { gasLimit: gasEstimated.toString(), value: 0 })
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
          <CardHeader title="Stake DAI in GoodStaking" subheader="Need to unlock DAI first" />
          <CardContent>
            <Grid container direction='column'>
              <Grid item>
                <BigNumberInput
                  decimals={18}
                  onChange={onInputChange("maxDai")}
                  value={stakeValues.maxDai}
                  renderInput={(props: any) => (
                    <TextField label="max DAI used" helperText="maximum expected amount of DAI used by GoodStaking" meta={{ error: inputError }} {...props} />
                  )}
                />
              </Grid>
              <Grid item>
                <Button variant="contained" color="primary" style={{ margin: '5%' }} onClick={unlockDai}>
                  Unlock
                </Button>
              </Grid>
              <Grid item>
                <Button variant="contained" color="primary" style={{ margin: '5%' }} onClick={stakeSimple}>
                  Stake
                </Button>
              </Grid>
              <Grid item>
                <Button variant="contained" color="primary" style={{ margin: '5%' }} onClick={withdrawStake}>
                  Withdraw all
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
