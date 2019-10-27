import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation
 */

export default function (/* { ssrContext } */) {
  const Store = new Vuex.Store({
    state: {
      table: new Map(),
      csvcomplete: false,
    },

    mutations: {
      setDownloadComplete(state) {
        state.csvcomplete = true;
      },
      addRow(state, row) {
        state.table.set(row.Word, row);
      },
    },

    actions: {
      setDownloadComplete({ commit }) {
        commit('setDownloadComplete');
      },
      addRow({ commit }, row) {
        commit('addRow', row);
      },
    },

    // enable strict mode (adds overhead!)
    // for dev mode only
    strict: process.env.DEV,
  });

  return Store;
}
