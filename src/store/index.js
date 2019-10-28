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
        const firstLetter = row.Word[0];
        if (!state.table.has(firstLetter)) {
          state.table.set(firstLetter, new Map());
        }
        state.table.get(firstLetter).set(row.Word, row);
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
