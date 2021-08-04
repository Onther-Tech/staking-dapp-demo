<template>
  <div class="container">
    <div v-if="sended" class="centered">
      <vue-loading type="bars" color="#d9544e" :size="{ width: '50px', height: '50px' }"></vue-loading>
      <h3>Waiting for Confirmation</h3>
    </div>
    <div style="text-align: left; max-width: 500px;">
      <div>operator: {{o.owner}}</div>
      <div>operatorContract: {{ operator.layer2 }}</div>
      <div>commitCount: {{ o.commitCount }}</div>
      <div>recentCommit: {{ o.recentCommit }}</div>
      <div>deployedAt: {{ o.deployedAt }}</div>
      <div>isCommissionRateNegative: {{ o.isCommissionRateNegative }}</div>
      <div>commissionRate: {{ o.commissionRates }}</div>
      <div>delayedCommissionRateNegative: {{ o.delayedCommissionRateNegative }}</div>
      <div>delayedCommissionRate: {{ o.delayedCommissionRate }}</div>
      <div>withdrawalDelay: {{ o.withdrawalDelay }}</div>
      <div style="margin-top: 16px;">totalStaked (ray): {{ o.totalStaked }}</div>
      <div>operatorStaked (ray): {{ o.operatorStaked }}</div>
      <div style="margin-top: 16px;">ethBalance (wei): {{ $store.state.ethBalance }}</div>
      <div>tonBalance (wei): {{ $store.state.tonBalance }}</div>
      <div>expectedSeig (ray): {{ o.expectedSeig }}</div>
      <div>userStaked (ray): {{ o.userStaked }}</div>
      <div>withdrawableRequests: {{ o.withdrawableRequests }}</div>
      <div>notWithdrawableRequests: {{ o.notWithdrawableRequests }}</div>
    </div>
    <div style="display: flex; flex-direction: column; margin-left: 50px; text-align: left;">
      <button @click="stake">1 TON stake (wei)</button>
      <button @click="unstake">1 WTON unstake (ray)</button>
      <button @click="restake">restake (1 request)</button>
      <button @click="process">process (1 request)</button>
    </div>
  </div>
</template>

<script>
import { TON, DepositManager } from '../helper/helper'
import { operator } from '../helper/staking'
import { ethers } from 'ethers'
import { VueLoading } from 'vue-loading-template'

export default {
  components: {
    VueLoading,
  },
  data() {
    return {
      o: {},
      sended: false,
    }
  },
  props: {
    operator: {
      type: Object,
      default: () => {},
    },
  },
  async mounted () {
    this.o = await operator(this.operator, this.$store.state.user);
  },
  methods: {
    async stake () {
      const layer2 = this.operator.layer2;
      const DepositManager = "0x57F5CD759A5652A697D539F1D9333ba38C615FC2";
      const WTON = "0x709bef48982Bbfd6F2D4Be24660832665F53406C";

      const d1 = ethers.utils.hexZeroPad(DepositManager, 32);
      const d2 = ethers.utils.hexZeroPad(layer2, 32);
      const data = ethers.utils.hexConcat([d1, d2]);
      const amount = ethers.BigNumber.from(`1${"0".repeat(18)}`);
      
      const ton = TON("", this.$store.state.signer);

      const tx = await ton.approveAndCall(
        WTON,
        amount,
        data
      );
      this.sended = true;
      await tx.wait();

      this.o = await operator(this.operator, this.$store.state.user);
      await this.$store.dispatch('get');
      this.sended = false;
      alert('success!');
    },
    async unstake () {
      const layer2 = this.operator.layer2;
      const amount = ethers.BigNumber.from(`1${"0".repeat(27)}`);

      const depositManager = DepositManager("", this.$store.state.signer);
      const tx = await depositManager.requestWithdrawal(
        layer2,
        amount,
      );
      this.sended = true;
      await tx.wait();

      this.o = await operator(this.operator, this.$store.state.user);
      await this.$store.dispatch('get');
      this.sended = false;
      alert('success');
    },
    async restake () {
      const layer2 = this.operator.layer2;
      const depositManager = DepositManager("", this.$store.state.signer);
      const tx = await depositManager.redeposit(
        layer2,
      );
      this.sended = true;
      await tx.wait();

      this.o = await operator(this.operator, this.$store.state.user);
      await this.$store.dispatch('get');
      this.sended = false;
      alert('success');
    },
    async process () {
      const layer2 = this.operator.layer2;
      const depositManager = DepositManager("", this.$store.state.signer);
      const tx = await depositManager.processRequest(
        layer2,
        true,
      );
      this.sended = true;
      await tx.wait();

      this.o = await operator(this.operator, this.$store.state.user);
      await this.$store.dispatch('get');
      this.sended = false;
      alert('success');
    },
  },
}
</script>

<style scoped>
button {
  margin: 10px;
}

.container {
  max-width: 960px;
  display: flex;
  margin-bottom: 60px;
}

.centered {
  position: fixed;
  left: 50%;
  transform: translate(-50%, 0);
}
</style>