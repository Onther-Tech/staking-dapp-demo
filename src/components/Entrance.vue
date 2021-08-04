<template>
  <div>
    <h1>Tokamak Network Staking dApp Sample</h1>
    <button @click="connect()">Connect</button>
    <div>chainId: {{ chainId }}</div>
    <div>account: {{ account }}</div>
    <div>balance: {{ balance }}</div>
  </div>
</template>

<script>
import { ethers } from 'ethers'

export default {
  data() {
    return {
      chainId: "",
      account: "",
      balance: "",
    }
  },
  methods: {
    async connect () {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' })

          const provider = new ethers.providers.Web3Provider(window.ethereum)
          const signer = provider.getSigner()
          this.chainId = await signer.getChainId()
          this.account = await signer.getAddress()
          this.balance = await signer.getBalance()

          this.$store.state.signer = signer
          this.$store.dispatch('get');
        } catch (err) {
          console.log(err.message)
        }
      }
    },
  },
}
</script>

<style scoped>
button {
  margin-bottom: 20px;
}
</style>