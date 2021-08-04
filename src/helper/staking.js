const axios = require('axios');
const { ethers } = require('ethers');
const BigNumber = ethers.BigNumber;

const { Layer2, SeigManager, DepositManager, Coinage, TON, getBlock, getBlockNumber } = require('./helper');
const ray = BigNumber.from(`1${"0".repeat(27)}`);
const toRay = BigNumber.from(`1${"0".repeat(9)}`);
const seigPerBlock = BigNumber.from("3920000000000000000000000000");

async function getOperators () {
  try {
    const res = await axios.get("https://dashboard-api.tokamak.network/rinkeby/operators");
    return res.data;
  } catch (error) {
    console.error(error);
  }
}

async function getManagers () {
  try {
    const res = await axios.get("https://dashboard-api.tokamak.network/rinkeby/managers");
    return res.data;
  } catch (error) {
    console.error(error);
  }
}

async function getTransactions (account) {
  try {
    const res = await axios.get("https://dashboard-api.tokamak.network/rinkeby/transactions", {
      params: {
        from: account,
      },
    });
    return res.data;
  } catch (error) {
    console.error(error);
  }
}

async function getOperator (layer2) {
  try {
    const l2 = Layer2(layer2);
    return await l2.operator();
  } catch (error) {
    console.error(error);
  }
}

async function getRecentCommitBlock (layer2) {
  try {
    const seigManager = SeigManager();
    const lastCommitBlock = await seigManager.lastCommitBlock(layer2);

    return await getBlock(lastCommitBlock.toNumber());
  } catch (error) {
    console.error(error);
  }
}

async function getCommissionRate (layer2) {
  try {
    const seigManager = SeigManager();
    const isCommissionRateNegative = await seigManager.isCommissionRateNegative(layer2);
    const commissionRates = await seigManager.commissionRates(layer2);

    return { isCommissionRateNegative, commissionRates };
  } catch (error) {
    console.error(error);
  }
}

async function getNewCommissionRate (layer2) {
  try {
    const seigManager = SeigManager();
    const delayedCommissionRateNegative = await seigManager.delayedCommissionRateNegative(layer2);
    const delayedCommissionRate = await seigManager.delayedCommissionRate(layer2);

    return { delayedCommissionRateNegative, delayedCommissionRate };
  } catch (error) {
    console.error(error);
  }
}

async function getDeployedAt (layer2) {
  try {
    const l2 = Layer2(layer2);
    const firstEpoch = await l2.getEpoch(0, 0);
    return (firstEpoch.timestamp).toNumber();
  } catch (error) {
    console.error(error);
  }
}

async function getWithdrawalDelay (layer2) {
  try {
    const dm = DepositManager();
    const withdrawalDelay = await dm.withdrawalDelay(layer2);
    const globalWithdrawalDelay = await dm.globalWithdrawalDelay();

    return withdrawalDelay.gt(globalWithdrawalDelay) ? withdrawalDelay.toString() : globalWithdrawalDelay.toString();
  } catch (error) {
    console.error(error);
  }
}

async function calculateExpectedSeig (from, to, userStaked, totalStaked, tos, pseigRate) {
  const n = to.sub(from);
  const maxSeig = n.mul(seigPerBlock);

  const stakedSeig = maxSeig.mul(totalStaked).div(tos);
  const unstakedSeig = maxSeig.sub(stakedSeig);
  const pseig = unstakedSeig.mul(pseigRate).div(ray);

  const userSeig = stakedSeig.mul(userStaked).div(totalStaked);
  const userPseig = userStaked.mul(pseig).div(totalStaked);

  return userSeig.add(userPseig);
}

async function getExpectedSeig (layer2, user, wton) {
  if (!wton) {
    wton = "0x709bef48982Bbfd6F2D4Be24660832665F53406C";
  }

  const sm = SeigManager()
  const t = await sm.tot();
  const c = await sm.coinages(layer2);

  const tot = Coinage(t);
  const coinage = Coinage(c);
  const ton = TON();

  const from = BigNumber.from((await getRecentCommitBlock(layer2)).number);
  const to = BigNumber.from(await getBlockNumber());
  const userStaked = await coinage.balanceOf(user);
  const totalStaked = await tot.totalSupply();

  const tonTotalSupply = (await ton.totalSupply()).mul(toRay);
  const balanceOfWTON = (await ton.balanceOf(wton)).mul(toRay);
  // ton.totalSupply - (balanceOf(WTON) + tot.totalSupply): RAY
  const tos = tonTotalSupply.sub(balanceOfWTON.add(totalStaked));
  const pseigRate = await sm.relativeSeigRate();

  const seig = await calculateExpectedSeig(
    from,
    to,
    userStaked,
    totalStaked,
    tos,
    pseigRate,
  );
  return seig;
}

async function staked (layer2, owner, user) {
  const sm = SeigManager()
  const c = await sm.coinages(layer2);

  const coinage = Coinage(c);
  const totalStaked = await coinage.totalSupply();
  const operatorStaked = await coinage.balanceOf(owner);
  const userStaked = await coinage.balanceOf(user);

  return { totalStaked, operatorStaked, userStaked };
}

async function getRequests (layer2, user) {
  const dm = DepositManager();
  const numPendingRequests = await dm.numPendingRequests(layer2, user);
  if (numPendingRequests.eq(BigNumber.from('0'))) {
    return [];
  }
  const pendingRequests = [];

  let requestIndex = await dm.withdrawalRequestIndex(layer2, user);
  for (let i = 0; i < numPendingRequests.toNumber(); i++) {
    pendingRequests.push(dm.withdrawalRequest(layer2, user, requestIndex));
    requestIndex++;
  }

  return Promise.all(pendingRequests);
}

async function getTonBalance (user) {
  const ton = TON()
  return await ton.balanceOf(user);
}

async function main() {
  // get operators
  const operators = await getOperators();
  console.log("layer2s:", operators);

  const op = operators[0];
  console.log("operator:", op);

  // get manager address
  const managers = await getManagers();
  console.log("managers:", managers);

  if (op) {
    // get operator owner address
    const owner = await getOperator(op.layer2);
    // console.log("owner:", owner);
    
    // get chainId
    console.log("chainId:", op.chainId);

    // get commit count
    const txs = await getTransactions(owner);
    console.log("commitCount:", (txs.filter(tx => tx.type === 'Commit')).length);

    // get recent commit (timestamp)
    const recentCommit = await getRecentCommitBlock(op.layer2)
    console.log("recentCommit(timestamp):", recentCommit.timestamp);

    // get first deployed timestamp 👉 we can calculate running time using this value.
    const deployedAt = await getDeployedAt(op.layer2);
    console.log("deployedAt:", deployedAt);

    // get commission rates
    const { isCommissionRateNegative, commissionRates } = await getCommissionRate(op.layer2);
    console.log("isCommissionRateNegative:", isCommissionRateNegative);
    console.log("commissionRate:", `(${commissionRates.toString()}/${ray.toString()})`);

    // get new commission rates
    const { delayedCommissionRateNegative, delayedCommissionRate } = await getNewCommissionRate(op.layer2);
    console.log("delayedCommissionRateNegative:", delayedCommissionRateNegative);
    console.log("delayedCommissionRate:", `(${delayedCommissionRate.toString()}/${ray.toString()})`);

    // get withdraw delay (block)
    const withdrawalDelay = await getWithdrawalDelay(op.layer2);
    console.log("withdrawalDelay:", withdrawalDelay);

    // expected reward
    const user = "0x695d5db8e279885C791d07f1a0CCA15C79451B3a";
    const expectedSeig = await getExpectedSeig(op.layer2, user);
    console.log("expectedSeig:", expectedSeig.toString());

    // staked
    const { totalStaked, operatorStaked, userStaked } = await staked(op.layer2, owner, user);
    console.log("totalStaked:", totalStaked.toString());
    console.log("operatorStaked:", operatorStaked.toString());
    console.log("userStaked:", userStaked.toString());

    // withdrawable, not withdrawable
    const blockNumber = await getBlockNumber()
    const requests = await getRequests(op.layer2, user);
    const withdrawableRequests = requests.filter(request => parseInt(request.withdrawableBlockNumber) <= parseInt(blockNumber));
    const notWithdrawableRequests = requests.filter(request => parseInt(request.withdrawableBlockNumber) > parseInt(blockNumber));
    console.log("withdrawableRequests:", withdrawableRequests);
    console.log("notWithdrawableRequests:", notWithdrawableRequests);
  }
}

main;

exports.tonBalance = async function (user) {
  return getTonBalance(user);
}

exports.operators = async function () {
  return await getOperators();
}

exports.operator = async function (op, user) {
  if (op && user) {
    const owner = await getOperator(op.layer2);
    const chainId = op.chainId;
    const [
      txs,
      recentCommit,
      deployedAt,
      { isCommissionRateNegative, commissionRates },
      { delayedCommissionRateNegative, delayedCommissionRate },
      withdrawalDelay,
    ] = await Promise.all([
      getTransactions(owner),
      getRecentCommitBlock(op.layer2),
      getDeployedAt(op.layer2),
      getCommissionRate(op.layer2),
      getNewCommissionRate(op.layer2),
      getWithdrawalDelay(op.layer2),
    ]);

    const [
      blockNumber,
      expectedSeig,
      { totalStaked, operatorStaked, userStaked },
      requests,
    ] = await Promise.all([
      getBlockNumber(),
      getExpectedSeig(op.layer2, user),
      staked(op.layer2, owner, user),
      getRequests(op.layer2, user),
    ]);
    const withdrawableRequests = requests.filter(request => parseInt(request.withdrawableBlockNumber) <= parseInt(blockNumber));
    const notWithdrawableRequests = requests.filter(request => parseInt(request.withdrawableBlockNumber) > parseInt(blockNumber));

    return {
      owner,
      chainId,
      commitCount: (txs.filter(tx => tx.type === 'Commit')).length,
      recentCommit: recentCommit.timestamp,
      deployedAt,
      isCommissionRateNegative,
      commissionRates,
      delayedCommissionRateNegative,
      delayedCommissionRate,
      withdrawalDelay,
      expectedSeig,
      totalStaked,
      operatorStaked,
      userStaked,
      withdrawableRequests,
      notWithdrawableRequests,
    }
  }
}