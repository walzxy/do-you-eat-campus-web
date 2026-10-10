<template>
  <div id="app-root">
    <router-view />
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: #f5f5f5;
  color: #333;
}
#app-root {
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  background: #fff;
  position: relative;
}
</style>
