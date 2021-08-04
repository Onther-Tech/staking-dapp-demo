import Vue from 'vue'
import Vuex from 'vuex'
import { operators, tonBalance } from '../helper/staking'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    connected: false,
    operators: [],

    user: "",
    signer: null,

    ethBalance: "",
    tonBalance: "",
  },
  mutations: {
  },
  actions: {
    async get ({ state }) {
      const account = await state.signer.getAddress();
      const balance = await state.signer.getBalance();

      state.operators = await operators();
      state.user = account;
      state.ethBalance = balance;
      state.tonBalance = await tonBalance(state.user);
    },
  },
})
