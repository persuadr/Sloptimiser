<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>
    <q-footer class="bg-grey-1 text-black q-py-md q-pl-md">
      This app is supported by <a href="https://persuadr.ai">Persuadr.ai</a>
    </q-footer>
  </q-layout>
</template>

<script>
export default {
  name: 'Layout',
};
</script>
