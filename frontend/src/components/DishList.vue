<template>
  <div class="dish-list">
    <DishCard v-for="dish in dishes" :key="dish.dish_id" :dish="dish" />
  </div>
</template>

<script>
import DishCard from './DishCard.vue';
export default {
  name: 'DishList',
  components: { DishCard },
  props: { dishes: { type: Array, default: () => [] } },
};
</script>

<style scoped>
.dish-list { padding-bottom: 16px; }
</style>