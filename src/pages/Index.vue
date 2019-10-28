<template>
  <q-page>
    <h2 class="text-center q-mb-md">Sloptimiser</h2>
    <h5 class="text-center q-mt-none">Find the best formulation for your slogan given your target.</h5>
    <div class="row">
      <div class="col-lg-8 offset-md-1">
        <h6 class="q-mb-sm">Enter a sentence, enter synonyms for each meaningful word,
          select a target audience, enjoy.</h6>
        <span>More information on how it's working can be found in
          <a href="https://medium.com/persuadr-ai/optimise-the-emotion-of-your-slogan-using-ai-7725b2576d38">this</a>
          Medium post.</span>
      </div>
    </div>
    <div class="row q-mt-xl justify-center">
      <div class="col-xs-10">
        <q-stepper v-model="step" color="primary" animated keep-alive header-nav>
          <q-step :name="1" title="Enter your sentence" icon="create">
            <q-input outlined label="Enter your sentence" v-model="sentence" @keypress.enter="splitSentence"/>
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
              and nouns are singular.<br>To be sure your words are in the database,
              you need to enter them as synonym of themselves.</div>
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
            <q-btn label="Next" size="md" color="primary" @click="step += 1" class="q-mt-sm"/>
          </q-step>

          <q-step :name="4" title="Select your conditions" icon="fas fa-user">
            <div class="text-subtitle-1 q-mb-md">Select your target audience and valence (see
              <a href="https://medium.com/persuadr-ai/optimise-the-emotion-of-your-slogan-using-ai-7725b2576d38">
              the Medium post</a> for more information about valence).</div>
            <q-option-group v-model="group"
              :options="[{
                label: 'all',
                value: 'all',
              }, {
                label: 'mostly men',
                value: 'M',
              }, {
                label: 'mostly women',
                value: 'W',
              }, {
                label: 'mostly < 30yo',
                value: 'Y',
              }, {
                label: 'mostly > 30yo',
                value: 'O',
              }]"
              color="primary" inline />
            <q-toggle v-model="positivevalence" color="primary"
              :label="`${positivevalence ? 'Positive' : 'Negative'} valence`" /><br>
            <q-btn label="Next" size="md" color="primary" @click="calculateCombinations" class="q-mt-sm"/>
          </q-step>

          <q-step :name="5" title="Best slogan calculation">
            <div class="text-subtitle-1 q-mb-md">Summary:<br>
            Original sentence: {{ sentence }}<br>
            Filter: {{ filterLabel }}, {{ positivevalence ? 'positive' : 'negative'}} valence<br>
            {{ allcomb.length }} combinations to calculate</div>
            <q-btn label="Let's go!" side="md" color="primary" @click="calculate" />
          </q-step>

          <q-step :name="6" title="Results">
            <div class="text-subtitle-1 q-mb-md">Best 3 formulations (if at least 3 combinations):</div>
            <div>
              <div v-for="(s, it) in threebest" :key="it">{{s.comb}}</div>
            </div>
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
      sentence: '',
      words: [],
      step: 1,
      options: [],
      loading: false,
      group: null,
      positivevalence: true,
      allcomb: [],
      threebest: [],
    };
  },
  computed: {
    filtered() {
      return this.words.filter(w => w.show);
    },
    filterLabel() {
      switch (this.group) {
        case 'all':
          return 'All people';
        case 'M':
          return 'Mostly men';
        case 'F':
          return 'Mostly women';
        case 'Y':
          return 'Mostly < 30yo';
        default:
          return 'Mostly > 30yo';
      }
    },
  },
  async mounted() {
    const filename = (process.env.NODE_ENV === 'production')
      ? 'https://persuadr.github.io/Sloptimiser/statics/table.csv'
      : 'http://localhost:8080/statics/table.csv';
    Papa.parse(filename, {
      download: true,
      worker: true,
      dynamicTyping: true,
      delimiter: ',',
      header: true,
      fastMode: true,
      step: (row, parser) => {
        this.$store.dispatch('addRow', row.data);
        if (row.errors.length) {
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
      if (!this.sentence.trim()) {
        return;
      }
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
        this.options = [];
        const needle = val.toLowerCase();
        const firstLetter = needle[0];
        const it = this.$store.state.table.get(firstLetter).keys();
        let w = it.next();
        while (!w.done) {
          if (w.value.startsWith(needle)) {
            this.options.push(w.value);
          }
          w = it.next();
        }
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
    f(a, b) {
      return [].concat(...a.map(d => b.map(e => [].concat(d, e))));
    },
    cartesian(a, b, ...c) {
      if (b) {
        return this.cartesian(this.f(a, b), ...c);
      }
      return a;
    },
    calculateCombinations() {
      this.allcomb = this.cartesian(...this.words.filter(w => w.show).map(w => w.selected));
      this.step += 1;
    },
    calculate() {
      let valenceF;
      let arousalF;
      switch (this.group) {
        case 'all':
          valenceF = 'V.Mean.Sum';
          arousalF = 'A.Mean.Sum';
          break;
        case 'M':
          valenceF = 'V.Mean.M';
          arousalF = 'A.Mean.M';
          break;
        case 'F':
          valenceF = 'V.Mean.F';
          arousalF = 'A.Mean.F';
          break;
        case 'O':
          valenceF = 'V.Mean.O';
          arousalF = 'A.Mean.O';
          break;
        default:
          valenceF = 'V.Mean.Y';
          arousalF = 'A.Mean.Y';
          break;
      }
      const struct = this.allcomb.map(comb => ({
        comb,
        valence: comb.reduce((w, acc) => Math.min(this.$store.state.table.get(acc[0]).get(acc)[valenceF],
          this.$store.state.table.get(w[0]).get(w)[valenceF])),
        arousal: comb.reduce((w, acc) => Math.max(Math.abs(this.$store.state.table.get(acc[0]).get(acc)[arousalF] - 5),
          Math.abs(this.$store.state.table.get(w[0]).get(w)[arousalF] - 5))),
      }));
      struct.sort((a, b) => {
        if (a.arousal < b.arousal) {
          return (this.positivevalence ? -1 : 1);
        }
        if (a.arousal > b.arousal) {
          return (this.positivevalence ? 1 : -1);
        }
        if (this.positivevalence) {
          return (a.valence > b.valence ? -1 : 1);
        }
        return (a.valence < b.valence ? -1 : 1);
      });
      this.step += 1;
      this.threebest = struct.slice(0, 3);
    },
  },
};
</script>
