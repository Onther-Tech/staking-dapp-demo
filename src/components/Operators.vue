<template>
  <div style="margin-top: 120px;">
    <h1>Operator List</h1>
    <div class="container" v-for="operator in operators" :key="operator.layer2">
      <div>
        <h2 class="title" @click="selectOperator(operator.name)">👉 {{ operator.name }}</h2>
        <Operator v-if="operator.name === name" :operator="operator" />
      </div>
    </div>
  </div>
</template>

<script>
import Operator from '../components/Operator.vue';
import { mapState } from 'vuex';

export default {
  components: {
    Operator,
  },
  data() {
    return {
      name: ""
    }
  },
  computed: {
    ...mapState([
      'operators',
    ]),
  },
  methods: {
    selectOperator (name) {
      this.name = name;
    }
  },
}
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
}

.title {
  cursor: pointer;
  text-decoration: underline;
}
</style>
