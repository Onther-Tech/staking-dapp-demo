<template>
  <div id="app">
    Please use Rinkeby network!
    <Entrance />
    <Operators />
  </div>
</template>

<script>
import Entrance from './components/Entrance.vue';
import Operators from './components/Operators.vue';

export default {
  name: 'App',
  components: {
    Entrance,
    Operators,
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
