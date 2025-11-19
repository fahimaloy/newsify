<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Categories</h1>
        <v-list density="compact">
          <template v-for="(category, index) in categories" :key="index">
            <v-list-group v-if="category.children && category.children.length > 0" :value="category.slug">
              <template v-slot:activator="{ props }">
                <v-list-item
                  v-bind="props"
                  :title="category.name"
                  :to="`/category/${category.slug}`"
                  color="#C62828"
                ></v-list-item>
              </template>
              <v-list-item
                v-for="(child, i) in category.children"
                :key="i"
                :title="child.name"
                :to="`/category/${child.slug}`"
                color="#C62828"
                class="pl-8"
              ></v-list-item>
            </v-list-group>
            <v-list-item
              v-else
              :title="category.name"
              :to="`/category/${category.slug}`"
              color="#C62828"
            ></v-list-item>
          </template>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import categoriesData from '../data/categories.json';

const categories = ref(categoriesData);
</script>
