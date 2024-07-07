<template>
  <div class="h-[50px]" :class="{ 'collapse': collapse }" :style="{ backgroundColor: sideTheme === 'theme-dark' ? variables.menuBackground : variables.menuLightBackground }">
    <transition class="flex items-center h-full justify-center gap-2" name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="!flex !flex-row" to="/">
        <img v-if="logo" :src="logo" class="w-7 h-7" />
        <h1 v-else class="text-lg whitespace-nowrap" :style="{ color: sideTheme === 'theme-dark' ? variables.logoTitleColor : variables.logoLightTitleColor }">{{ title }}</h1>
      </router-link>
      <router-link v-else key="expand" class="!flex !flex-row items-center" to="/">
        <img v-if="logo" :src="logo" class="w-7 h-7" />
        <h1 class="text-lg whitespace-nowrap" :style="{ color: sideTheme === 'theme-dark' ? variables.logoTitleColor : variables.logoLightTitleColor }">{{ title }}</h1>
      </router-link>
    </transition>
  </div>
</template>

<script setup>
import variables from '@/assets/styles/variables.module.scss'
import useSettingsStore from '@/store/modules/settings'

defineProps({
  collapse: {
    type: Boolean,
    required: true
  }
})
const logo = '/nest.svg'
const title = import.meta.env.VITE_APP_TITLE;
const settingsStore = useSettingsStore();
const sideTheme = computed(() => settingsStore.sideTheme);
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  line-height: 50px;
  background: #2b2f3a;
  text-align: center;
  overflow: hidden;

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;

    & .sidebar-logo {
      width: 32px;
      height: 32px;
      vertical-align: middle;
      margin-right: 12px;
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      color: #fff;
      font-weight: 600;
      line-height: 50px;
      font-size: 14px;
      font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
      vertical-align: middle;
    }
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0px;
    }
  }
}
</style>