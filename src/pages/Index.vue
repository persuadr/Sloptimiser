<template>
  <q-page>
    <h2 class="text-center q-mb-md">Sloptimiser</h2>
    <h5 class="text-center q-mt-none">Find the best formulation for your slogan given your target.</h5>
    <div class="row">
      <div class="col-lg-6 offset-lg-1">
        <h6 class="q-mb-sm">Enter a sentence, enter synonyms for each meaningful word,
          select a target audience, enjoy.</h6>
        <span>More information on how it's working can be found in
          <a href="https://medium.com/persuadr-ai/optimise-the-emotion-of-your-slogan-using-ai-7725b2576d38">this</a>
          Medium post.</span>
      </div>
    </div>
    <div class="row q-mt-xl">
      <div class="col-lg-10 offset-lg-1">
        <q-stepper v-model="step" color="primary" animated keep-alive header-nav>
          <q-step :name="1" title="Enter your sentence" icon="create">
            <q-input outlined label="Enter your sentence" v-model="sentence" />
            <div class="q-mt-lg">
              <q-btn label="Next" size="md" color="primary" @click="splitSentence"/>
            </div>
          </q-step>

          <q-step :name="2" title="Remove meaningless words" icon="delete">
            <div class="text-subtitle-1">Remove meaningless words (like the, a, etc.)</div>
            <div>
              <q-chip v-for="w in filtered" :key="w.it" removable :label="w.word" @remove="words[w.it].show = false"/>
            </div>
            <div class="q-mt-lg">
              <q-btn label="Next" size="md" color="primary" @click="checkDownloaded" :loading="loading" />
            </div>
          </q-step>

          <q-step :name="3" title="Enter synonyms to evaluate" icon="create">
            <div class="text-subtitle-1">Start typing under each word, suggestions of synonyms will be presented.
              Only words from the suggestions can be used. Note that verbs are in the infinitive form
              and nouns are singular.</div>
            <q-markup-table class="q-mt-md" flat>
              <thead>
                <tr>
                  <th class="text-left" v-for="w in filtered" :key="w.it">{{ w.word }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td v-for="w in filtered" :key="w.it">
                    <q-select outlined multiple use-chips :options="options" v-model="w.selected"
                      use-input @filter="filterFn"
                    />
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-step>
        </q-stepper>
      </div>
    </div>
  </q-page>
</template>

<script>
import Papa from 'papaparse';

export default {
  name: 'PageIndex',
  data() {
    return {
      sentence: null,
      words: [],
      step: 1,
      options: [],
      loading: false,
    };
  },
  computed: {
    filtered() {
      return this.words.filter(w => w.show);
    },
  },
  mounted() {
    const filename = 'https://persuadr.github.io/Sloptimiser/table.csv';
    Papa.parse(filename, {
      download: true,
      worker: true,
      dynamicTyping: true,
      delimiter: ',',
      header: true,
      fastMode: true,
      step: (row, parser) => {
        this.$store.dispatch('addRow', row.data);
        if (row.errors) {
          console.error('Row errors:', row.errors);
          parser.abort();
        }
      },
      complete: () => {
        this.$store.dispatch('setDownloadComplete');
      },
      error(err) {
        console.error(err);
      },
    });
  },
  methods: {
    splitSentence() {
      const regex = /[,.;:?!()]/gi;
      const replaced = this.sentence.replace(regex, '');
      this.words = replaced.split(' ').map((w, it) => ({
        word: w,
        show: true,
        it,
        selected: [],
      }));
      this.step += 1;
    },
    filterFn(val, update, abort) {
      if (val.length < 3) {
        abort();
        return;
      }

      update(() => {
        const needle = val.toLowerCase();
        this.options = this.$store.state.table.keys().filter(v => v.startsWith(needle));
      });
    },
    checkDownloaded() {
      if (!this.$store.state.csvcomplete) {
        this.loading = true;
        const interval = setInterval(() => {
          if (this.$store.state.csvcomplete) {
            this.loading = false;
            this.step += 1;
            clearInterval(interval);
          }
        }, 500);
      } else {
        this.step += 1;
      }
    },
  },
};
</script>
