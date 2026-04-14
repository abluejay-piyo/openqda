<template>
  <div class="p-4 space-y-4">
    <!-- Tab bar -->
    <div class="flex flex-wrap gap-1 border-b border-border pb-2">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        @click="switchTab(tab.key)"
        class="px-3 py-1 rounded text-xs font-medium transition-colors"
        :class="
          activeTab === tab.key
            ? 'bg-foreground text-background'
            : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
        "
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Description -->
    <div class="flex items-center justify-between gap-2">
      <p class="text-sm text-foreground/60">{{ currentTab.desc }}</p>
      <span class="text-[11px] px-2 py-0.5 rounded border border-border text-foreground/50 bg-surface/50">
        Plugin v{{ GABRIEL_PLUGIN_VERSION }}
      </span>
    </div>

    <!-- Config form -->
    <form @submit.prevent="run" class="space-y-3">

      <!-- ── Codify ── -->
      <template v-if="activeTab === 'codify'">
        <!-- Code -->
        <div>
          <label class="block text-xs font-medium uppercase mb-1">Code</label>
          <p
            v-if="availableCodes.length === 0"
            class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2"
          >
            No codes available in this project yet.
          </p>
          <div
            v-else
            class="max-h-56 overflow-auto border border-border rounded bg-surface divide-y divide-border"
          >
            <button
              v-for="c in availableCodes"
              :key="c.id"
              type="button"
              @click="codify.selectedCodeId = String(c.id)"
              class="w-full text-left px-3 py-2 text-sm transition-colors"
              :class="String(codify.selectedCodeId) === String(c.id)
                ? 'bg-foreground text-background'
                : 'text-foreground hover:bg-foreground/5'"
            >
              {{ c.name }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium uppercase mb-1">
            Code description
            <span class="normal-case font-normal text-foreground/50 ml-1">(auto-filled from code - helps GABRIEL find the right passages)</span>
          </label>
          <textarea
            v-model="codify.codeDescription"
            rows="3"
            placeholder="Optional but recommended: describe what this code means, e.g. &quot;Statements about perceived ease-of-use or usefulness of a technology&quot;"
            class="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary bg-surface text-foreground"
          />
        </div>

        <div>
          <label class="block text-xs font-medium uppercase mb-1">Instructions</label>
          <textarea
            v-model="codify.instructions"
            rows="2"
            placeholder="Tell GABRIEL exactly which speaker to focus on, e.g. only Participant/User utterances."
            class="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary bg-surface text-foreground"
          />
        </div>
      </template>

      <!-- ── Classify ── -->
      <template v-else-if="activeTab === 'classify'">
        <div>
          <label class="block text-xs font-medium uppercase mb-2">Labels</label>
          <div
            v-for="(lbl, i) in classify.labels"
            :key="i"
            class="flex gap-2 mb-2 items-start"
          >
            <input
              v-model="lbl.name"
              type="text"
              placeholder="Label name"
              class="flex-1 border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1"
            />
            <input
              v-model="lbl.description"
              type="text"
              placeholder="Description"
              class="flex-[2] border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1"
            />
            <button
              type="button"
              @click="classify.labels.splice(i, 1)"
              class="text-foreground/40 hover:text-foreground text-xl leading-none mt-0.5"
            >×</button>
          </div>
          <button
            type="button"
            @click="classify.labels.push({ name: '', description: '' })"
            class="text-xs text-foreground/60 underline"
          >+ Add label</button>
        </div>
        <div class="flex items-center gap-3">
          <input id="multi_label" v-model="classify.multiLabel" type="checkbox" class="cursor-pointer" />
          <label for="multi_label" class="text-sm cursor-pointer">Multi-label (multiple labels per passage)</label>
        </div>
      </template>

      <!-- ── Extract ── -->
      <template v-else-if="activeTab === 'extract'">
        <div>
          <label class="block text-xs font-medium uppercase mb-2">Fields to extract</label>
          <div
            v-for="(field, i) in extract.fields"
            :key="i"
            class="flex gap-2 mb-2 items-start"
          >
            <input
              v-model="field.name"
              type="text"
              placeholder="Field name (e.g. speaker)"
              class="flex-1 border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1"
            />
            <input
              v-model="field.description"
              type="text"
              placeholder="What to extract"
              class="flex-[2] border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1"
            />
            <button
              type="button"
              @click="extract.fields.splice(i, 1)"
              class="text-foreground/40 hover:text-foreground text-xl leading-none mt-0.5"
            >×</button>
          </div>
          <button
            type="button"
            @click="extract.fields.push({ name: '', description: '' })"
            class="text-xs text-foreground/60 underline"
          >+ Add field</button>
        </div>
      </template>

      <!-- ── Filter ── -->
      <template v-else-if="activeTab === 'filter'">
        <div>
          <label class="block text-xs font-medium uppercase mb-1">Condition</label>
          <textarea
            v-model="filter.condition"
            required
            rows="2"
            placeholder="e.g. mentions a specific person by name"
            class="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary bg-surface text-foreground"
          />
        </div>
      </template>

      <!-- ── Rate ── -->
      <template v-else-if="activeTab === 'rate'">
        <div>
          <label class="block text-xs font-medium uppercase mb-2">Attributes</label>
          <div
            v-for="(attr, i) in rate.attributes"
            :key="i"
            class="flex gap-2 mb-2 items-start"
          >
            <input
              v-model="attr.name"
              type="text"
              placeholder="Attribute name"
              class="flex-1 border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1"
            />
            <input
              v-model="attr.description"
              type="text"
              placeholder="Description"
              class="flex-[2] border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1"
            />
            <button
              type="button"
              @click="rate.attributes.splice(i, 1)"
              class="text-foreground/40 hover:text-foreground text-xl leading-none mt-0.5"
              title="Remove"
            >×</button>
          </div>
          <button
            type="button"
            @click="rate.attributes.push({ name: '', description: '' })"
            class="text-xs text-foreground/60 underline"
          >+ Add attribute</button>
        </div>
      </template>

      <!-- ── Deidentify ── (no extra config) ── -->

      <details class="border border-border rounded p-3 bg-surface/40">
        <summary class="cursor-pointer text-sm font-medium">Advanced options</summary>
        <div class="space-y-3 mt-3">
          <div>
            <label class="block text-xs font-medium uppercase mb-1">Model</label>
            <div class="flex gap-2">
              <select v-model="modelProvider" class="w-36 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary bg-surface text-foreground">
                <option value="openai">OpenAI</option>
                <option value="google">Google</option>
              </select>
              <input
                v-model.trim="customModel"
                type="text"
                class="flex-1 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary bg-surface text-foreground"
              />
              <span class="self-center text-xs text-foreground/50 whitespace-nowrap">
                Autofilled, override with model names e.g. "gpt-5.4-mini"
              </span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium uppercase mb-1">Advanced (optional)</label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                v-model.number="nRuns"
                type="number"
                min="1"
                step="1"
                placeholder="n_runs"
                class="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary bg-surface text-foreground"
              />
              <input
                v-model.number="nRounds"
                type="number"
                min="1"
                step="1"
                placeholder="n_rounds"
                class="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary bg-surface text-foreground"
              />
              <input
                v-model.number="nParallels"
                type="number"
                min="1"
                step="1"
                placeholder="n_parallels"
                class="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary bg-surface text-foreground"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium uppercase mb-1">Additional params (JSON, optional)</label>
            <textarea
              v-model="extraParamsJson"
              rows="2"
              placeholder='{"max_workers": 32}'
              class="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary bg-surface text-foreground"
            />
          </div>
        </div>
      </details>

      <div class="flex items-center gap-3">
        <button
          type="submit"
          :disabled="loading || !canRun"
          class="px-4 py-2 bg-foreground text-background rounded text-sm font-medium disabled:opacity-40"
        >{{ loading ? 'Running…' : `Run ${currentTab.label}` }}</button>
        <span class="text-xs text-foreground/50">{{ statusLine }}</span>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="activeTab === 'codify' && codifyAppliedCount !== null && !error" class="text-sm text-green-700">
        {{ codifyAppliedCount === 0
          ? 'GABRIEL found no matching passages for this code.'
          : `${codifyAppliedCount} passage${codifyAppliedCount !== 1 ? 's' : ''} applied to "${selectedCodeName}".` }}
      </p>
    </form>

    <!-- ── Results ── -->
    <template v-if="results.length">
      <h3 class="text-sm font-semibold uppercase tracking-wide">Results</h3>

      <!-- Classify results -->
      <div v-if="activeTab === 'classify'" class="space-y-3">
        <div
          v-for="item in results"
          :key="item.id"
          class="border border-border rounded p-3 text-sm"
        >
          <p class="text-foreground/50 text-xs mb-1 truncate">
            {{ getOriginalText(item.id).substring(0, 120) }}{{ getOriginalText(item.id).length > 120 ? '…' : '' }}
          </p>
          <div class="flex flex-wrap gap-1 mt-1">
            <span v-if="!item.labels || item.labels.length === 0" class="text-xs text-foreground/40">No labels assigned</span>
            <span
              v-for="lbl in item.labels"
              :key="lbl"
              class="text-xs px-2 py-0.5 rounded-full bg-foreground/10 border border-border"
            >{{ lbl }}</span>
          </div>
        </div>
      </div>

      <!-- Extract results -->
      <div v-else-if="activeTab === 'extract'" class="overflow-auto">
        <table class="min-w-full text-sm border-collapse">
          <thead>
            <tr>
              <th class="border border-border px-3 py-1 text-left text-xs font-medium bg-silver-100">Passage</th>
              <th
                v-for="field in activeExtractFields"
                :key="field.name"
                class="border border-border px-3 py-1 text-left text-xs font-medium bg-silver-100"
              >{{ field.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in results" :key="item.id">
              <td class="border border-border px-3 py-1 max-w-xs truncate" :title="getOriginalText(item.id)">
                {{ getOriginalText(item.id).substring(0, 80) }}{{ getOriginalText(item.id).length > 80 ? '…' : '' }}
              </td>
              <td
                v-for="field in activeExtractFields"
                :key="field.name"
                class="border border-border px-3 py-1"
              >{{ item.values?.[field.name] ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Filter results -->
      <div v-else-if="activeTab === 'filter'" class="space-y-2">
        <p class="text-sm text-foreground/60">{{ passCount }} of {{ results.length }} passages meet the condition.</p>
        <div
          v-for="item in results"
          :key="item.id"
          class="flex items-start gap-3 border border-border rounded p-3 text-sm"
          :class="item.meets_condition ? 'border-green-300 bg-green-50' : 'opacity-50'"
        >
          <span
            class="mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded"
            :class="item.meets_condition ? 'bg-green-100 text-green-800' : 'bg-silver-100 text-foreground/40'"
          >{{ item.meets_condition ? 'PASS' : 'FAIL' }}</span>
          <p class="flex-1 text-foreground">{{ getOriginalText(item.id) }}</p>
        </div>
      </div>

      <!-- Rate results -->
      <div v-else-if="activeTab === 'rate'" class="overflow-auto">
        <table class="min-w-full text-sm border-collapse">
          <thead>
            <tr>
              <th class="border border-border px-3 py-1 text-left text-xs font-medium bg-silver-100">Passage</th>
              <th
                v-for="attr in activeRateAttributes"
                :key="attr.name"
                class="border border-border px-3 py-1 text-center text-xs font-medium bg-silver-100"
              >{{ attr.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in results" :key="item.id">
              <td class="border border-border px-3 py-1 max-w-xs truncate" :title="getOriginalText(item.id)">
                {{ getOriginalText(item.id).substring(0, 80) }}{{ getOriginalText(item.id).length > 80 ? '…' : '' }}
              </td>
              <td
                v-for="attr in activeRateAttributes"
                :key="attr.name"
                class="border border-border px-3 py-1 text-center"
              >{{ item.scores?.[attr.name] ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Deidentify results -->
      <div v-else-if="activeTab === 'deidentify'" class="space-y-3">
        <div
          v-for="item in results"
          :key="item.id"
          class="border border-border rounded p-3 text-sm space-y-2"
        >
          <div>
            <p class="text-xs font-medium uppercase text-foreground/40 mb-0.5">Original</p>
            <p class="text-foreground/70 italic">{{ getOriginalText(item.id) }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase text-foreground/40 mb-0.5">Anonymized</p>
            <p class="text-foreground">{{ item.anonymized_text }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, inject, computed, watch, reactive } from 'vue';
import gabrielPackage from '../package.json';

const GABRIEL_PLUGIN_VERSION = gabrielPackage?.version ?? 'dev';

const props = defineProps([
  'codes',
  'selections',
  'sources',
  'checkedCodes',
  'checkedSources',
  'menu',
  'showMenu',
]);

const injectedApi = inject('api', null);
const fallbackApi = {
  sources: [],
  codes: [],
  getAllSelections: () => [],
  eachCheckedSources: () => {},
};
const analyzeApi = injectedApi ?? fallbackApi;

const readArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.value)) return value.value;
  return [];
};

const createOpenQdaInputAdapter = (api) => {
  const getSelections = () => {
    if (props.selections) return Array.isArray(props.selections) ? props.selections : Array.from(props.selections);
    if (typeof api.getAllSelections === 'function') return api.getAllSelections();
    return [];
  };

  const getCodes = () => {
    if (props.codes) return Array.isArray(props.codes) ? props.codes : Array.from(props.codes);
    return readArray(api.codes);
  };

  const getCheckedSources = () => {
    if (props.sources && props.checkedSources && typeof props.checkedSources.get === 'function') {
      return props.sources.filter(source => props.checkedSources.get(source.id));
    }
    // Fallback for context outside visualization (e.g. Codify source view)
    if (typeof api.eachCheckedSources === 'function') {
      const out = [];
      api.eachCheckedSources((source) => out.push(source));
      return out;
    }
    return readArray(api.sources);
  };

  return {
    getSelections,
    getCodes,
    getCheckedSources,
  };
};

const parseExtraParams = (raw) => {
  const input = (raw ?? '').trim();
  if (!input) return { value: {}, error: null };

  try {
    const parsed = JSON.parse(input);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return {
        value: null,
        error: 'Additional params must be a JSON object.',
      };
    }
    return { value: parsed, error: null };
  } catch {
    return { value: null, error: 'Invalid JSON in additional params.' };
  }
};

const buildCommonRequestBody = ({
  model,
  nRuns,
  nRounds,
  nParallels,
  extraParams,
}) => {
  const body = { ...extraParams };

  if (model) body.model = model;

  if (nRuns !== null && nRuns !== '') body.n_runs = Number(nRuns);
  if (nRounds !== null && nRounds !== '') body.n_rounds = Number(nRounds);
  if (nParallels !== null && nParallels !== '') body.n_parallels = Number(nParallels);

  return body;
};

const requestJson = async ({ requestFn, url, body }) => {
  if (typeof requestFn === 'function') {
    return requestFn(url, body);
  }

  const axiosClient = window?.axios;
  if (axiosClient && typeof axiosClient.post === 'function') {
    try {
      const response = await axiosClient.post(url, body, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      return {
        response: {
          status: response.status,
          data: response.data,
        },
        error: null,
      };
    } catch (error) {
      return {
        response: error?.response
          ? {
              status: error.response.status,
              data: error.response.data,
            }
          : null,
        error,
      };
    }
  }

  try {
    const csrf = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute('content');

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
      },
      body: JSON.stringify(body),
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return {
      response: {
        status: response.status,
        data,
      },
      error: null,
    };
  } catch (error) {
    return {
      response: null,
      error,
    };
  }
};

const normalizeError = (res) => {
  const data = res?.response?.data;
  let detail =
    (Array.isArray(data?.detail)
      ? data.detail.map((entry) => entry.msg ?? JSON.stringify(entry)).join('; ')
      : data?.detail) ||
    data?.message ||
    data?.error ||
    res?.error?.message ||
    'Unknown error';

  if (data?.errors && typeof data.errors === 'object') {
    detail += ` - ${Object.values(data.errors).flat().join('; ')}`;
  }

  if (res?.response?.status === 524 || /status code 524/i.test(res?.error?.message ?? '')) {
    return 'Request timed out while Gabriel was processing the batch. Try fewer passages or lower n_parallels in Advanced options.';
  }

  return `Request failed: ${detail}`;
};

const GABRIEL_FUNCTIONS = [
  {
    key: 'codify',
    label: 'Codify',
    group: 'coding',
    endpoint: '/api/gabriel/codify',
    desc: 'Highlight passages that match a specific qualitative code.',
  },
  {
    key: 'classify',
    label: 'Classify',
    group: 'measure',
    endpoint: '/api/gabriel/classify',
    desc: 'Assign one or more labels to each passage.',
  },
  {
    key: 'extract',
    label: 'Extract',
    group: 'measure',
    endpoint: '/api/gabriel/extract',
    desc: 'Pull structured field values from each passage.',
  },
  {
    key: 'filter',
    label: 'Filter',
    group: 'measure',
    endpoint: '/api/gabriel/filter',
    desc: 'Boolean screening: which passages satisfy a natural-language condition?',
  },
  {
    key: 'rate',
    label: 'Rate',
    group: 'measure',
    endpoint: '/api/gabriel/rate',
    desc: 'Score each passage 0-100 on natural-language attributes.',
  },
  {
    key: 'deidentify',
    label: 'Deidentify',
    group: 'clean',
    endpoint: '/api/gabriel/deidentify',
    desc: 'Replace names, addresses and other PII with realistic stand-ins.',
  },
];

const FUNCTION_MAP = Object.fromEntries(
  GABRIEL_FUNCTIONS.map((fn) => [fn.key, fn])
);

const getGabrielFunction = (key) => FUNCTION_MAP[key] ?? GABRIEL_FUNCTIONS[0];

const buildFunctionPayload = ({
  functionKey,
  selections,
  selectedCodeName,
  codify,
  classify,
  extract,
  filter,
  rate,
}) => {
  if (functionKey === 'codify') {
    return {
      texts: selections.map((selection) => ({
        id: String(selection.id),
        text: selection.text,
      })),
      code_name: selectedCodeName,
      code_description: codify.codeDescription ?? '',
      instructions: codify.instructions?.trim() || undefined,
      additional_instructions: codify.instructions?.trim() || undefined,
    };
  }

  const texts = selections.map((selection) => ({
    id: String(selection.id),
    text: selection.text,
  }));

  if (functionKey === 'classify') {
    return {
      texts,
      labels: Object.fromEntries(
        classify.labels
          .filter((label) => label.name.trim())
          .map((label) => [label.name, label.description])
      ),
      multi_label: classify.multiLabel,
    };
  }

  if (functionKey === 'extract') {
    return {
      texts,
      fields: Object.fromEntries(
        extract.fields
          .filter((field) => field.name.trim())
          .map((field) => [field.name, field.description])
      ),
    };
  }

  if (functionKey === 'filter') {
    return {
      texts,
      condition: filter.condition,
    };
  }

  if (functionKey === 'rate') {
    return {
      texts,
      attributes: Object.fromEntries(
        rate.attributes
          .filter((attribute) => attribute.name.trim())
          .map((attribute) => [attribute.name, attribute.description])
      ),
    };
  }

  return { texts };
};

const inputAdapter = createOpenQdaInputAdapter(analyzeApi);

// ── Tab definitions ────────────────────────────────────────────────────────

const tabs = GABRIEL_FUNCTIONS.map((entry) => ({
  key: entry.key,
  label: entry.label,
  desc: entry.desc,
}));

const activeTab = ref('codify');
const currentTab = computed(() => getGabrielFunction(activeTab.value));

const switchTab = (key) => {
  activeTab.value = key;
  error.value = null;
  results.value = [];
};

// ── All selections (for non-Codify tools) ─────────────────────────────────
const selections = computed(() => inputAdapter.getSelections());

// ── Shared state ──────────────────────────────────────────────────────────
const modelProvider = ref('openai');
const customModel = ref('');
const nRuns = ref(null);
const nRounds = ref(null);
const nParallels = ref(null);
const extraParamsJson = ref('');
const loading = ref(false);
const error = ref(null);
const results = ref([]);

const effectiveModel = computed(() => {
  const explicit = (customModel.value ?? '').trim();
  return explicit || undefined;
});

// ── Codify ────────────────────────────────────────────────────────────────
const availableCodes = computed(() => inputAdapter.getCodes());

const codifySources = ref([]);

const updateCheckedSources = () => {
  // If we have props and the Map, use our deep watcher strategy
  if (props.sources && props.checkedSources) {
    const list = props.sources.filter(source => {
      // Force dependency tracking if reactivity applies natively
      const isChecked = typeof props.checkedSources.get === 'function' && props.checkedSources.get(source.id);
      return isChecked;
    });
    codifySources.value = list;
    return;
  }

  // Fallback for standalone/CodifyView contexts
  if (typeof analyzeApi.eachCheckedSources === 'function') {
    const out = [];
    analyzeApi.eachCheckedSources((s) => out.push(s));
    codifySources.value = out;
    return;
  }
  codifySources.value = readArray(analyzeApi.sources);
};

// Listen to deep changes on props so adding new checks forces UI refresh
watch(() => props, () => {
  updateCheckedSources();
}, { deep: true, immediate: true });
const codify = reactive({
  selectedSourceId: '',
  selectedCodeId: '',
  codeDescription: '',
  instructions: 'Focus only on statements made by the participant/user. Ignore interviewer, facilitator, or AI assistant prompts.',
});

const selectedCode = computed(() =>
  availableCodes.value.find((c) => String(c.id) === String(codify.selectedCodeId))
);
const selectedCodeName = computed(() => selectedCode.value?.name ?? '');

const getCodeDescription = (code) => {
  if (!code || typeof code !== 'object') return null;

  // Support common field variants and legacy typo variants.
  const candidates = [
    code.description,
    code.desciption,
    code.code_description,
  ];

  for (const value of candidates) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized.length > 0) return normalized;
  }

  return null;
};

// Stores the paragraphs fetched from the source so results can show original text
const codifyTextsPool = ref([]);
const codifyAppliedCount = ref(null);

// Auto-fill description when a code is selected (immediate so it fires on first pick)
watch(
  selectedCode,
  (c) => {
    const description = getCodeDescription(c);
    if (description !== null) {
      codify.codeDescription = description;
    }
  },
  { immediate: true }
);

watch(
  availableCodes,
  (codes) => {
    if (!codes.length) {
      codify.selectedCodeId = '';
      return;
    }

    const exists = codes.some(
      (code) => String(code.id) === String(codify.selectedCodeId)
    );
    if (!exists) {
      codify.selectedCodeId = String(codes[0].id);
    }
  },
  { immediate: true }
);

// ── Classify ──────────────────────────────────────────────────────────────
const classify = reactive({
  labels: [{ name: '', description: '' }],
  multiLabel: false,
});
const activeClassifyLabels = computed(() => classify.labels.filter((l) => l.name.trim()));
const hasValidLabels = computed(() => activeClassifyLabels.value.length > 0);

// ── Extract ───────────────────────────────────────────────────────────────
const extract = reactive({ fields: [{ name: '', description: '' }] });
const activeExtractFields = computed(() => extract.fields.filter((f) => f.name.trim()));
const hasValidFields = computed(() => activeExtractFields.value.length > 0);

// ── Filter ────────────────────────────────────────────────────────────────
const filter = reactive({ condition: '' });
const passCount = computed(() => results.value.filter((r) => r.meets_condition).length);

// ── Rate ──────────────────────────────────────────────────────────────────
const rate = reactive({ attributes: [{ name: '', description: '' }] });
const activeRateAttributes = computed(() => rate.attributes.filter((a) => a.name.trim()));
const hasValidAttributes = computed(() => activeRateAttributes.value.length > 0);

// ── canRun + status line ──────────────────────────────────────────────────
const canRun = computed(() => {
  switch (activeTab.value) {
    case 'codify':
      return codifySources.value.length > 0 && !!codify.selectedCodeId;
    case 'classify':
      return selections.value.length > 0 && hasValidLabels.value;
    case 'extract':
      return selections.value.length > 0 && hasValidFields.value;
    case 'filter':
      return selections.value.length > 0 && filter.condition.trim().length > 0;
    case 'rate':
      return selections.value.length > 0 && hasValidAttributes.value;
    case 'deidentify':
      return selections.value.length > 0;
    default:
      return false;
  }
});

const statusLine = computed(() => {
  if (activeTab.value === 'codify') {
    if (codifySources.value.length === 0) return 'Please check a source in the sidebar first.';
    if (!codify.selectedCodeId) return 'Select a code above.';

    const sourceCount = codifySources.value.length;
    const srcName = sourceCount === 1
      ? `“${codifySources.value[0].name}”`
      : `${sourceCount} sources`;
    return `Ready — GABRIEL will scan ${srcName} for “${selectedCodeName.value}”`;
  }
  if (selections.value.length === 0) return 'No coded passages found.';
  return `${selections.value.length} passage${selections.value.length !== 1 ? 's' : ''} selected`;
});

// ── getOriginalText ───────────────────────────────────────────────────────
const getOriginalText = (id) => {
  if (activeTab.value === 'codify') {
    const t = codifyTextsPool.value.find((s) => String(s.id) === String(id));
    return t ? t.text : '';
  }
  const sel = selections.value.find((s) => String(s.id) === String(id));
  return sel ? sel.text : '';
};

const htmlToPlainText = (html) => {
  if (!html || typeof html !== 'string') return '';
  const root = document.createElement('div');
  root.innerHTML = html;
  return (root.textContent || root.innerText || '').trim();
};

const fetchSourceTranscript = async (sourceId) => {
  const csrf = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content');

  const response = await fetch(`/files/${sourceId}`, {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load source text [${response.status}]`);
  }

  const payload = await response.json();
  return htmlToPlainText(payload?.content ?? '');
};

const randomTextId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `gabriel-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getProjectIdFromPath = () => {
  const pathname = window?.location?.pathname ?? '';
  const match = pathname.match(/\/projects\/(\d+)/);
  return match?.[1] ?? null;
};

const findPassageRange = (text, passage, fromIndex = 0) => {
  if (!text || !passage) return null;

  const normalizedPassage = String(passage).trim();
  if (!normalizedPassage) return null;

  const directIndex = text.indexOf(normalizedPassage, Math.max(0, fromIndex));
  if (directIndex >= 0) {
    return {
      start: directIndex,
      end: directIndex + normalizedPassage.length,
    };
  }

  const fallbackIndex = text.indexOf(normalizedPassage);
  if (fallbackIndex >= 0) {
    return {
      start: fallbackIndex,
      end: fallbackIndex + normalizedPassage.length,
    };
  }

  return null;
};

const persistCodifySelections = async ({ transcript, items, sourceId }) => {
  const projectId = getProjectIdFromPath();
  const codeId = String(codify.selectedCodeId ?? '');

  if (!projectId || !sourceId || !codeId) {
    return { saved: 0, skipped: 0, failed: 0 };
  }

  const existingSelections = selections.value.filter((selection) => {
    const selectionSourceId = String(selection.source_id ?? selection.sourceId ?? '');
    const selectionCodeId = String(selection.code_id ?? selection.code?.id ?? '');
    return selectionSourceId === sourceId && selectionCodeId === codeId;
  });

  const existingRanges = new Set(
    existingSelections.map((selection) => {
      const start = Number(selection.start ?? selection.start_position ?? -1);
      const end = Number(selection.end ?? selection.end_position ?? -1);
      return `${start}:${end}`;
    })
  );

  const passages = items
    .flatMap((item) => (Array.isArray(item?.passages) ? item.passages : []))
    .filter((passage) => typeof passage === 'string' && passage.trim().length > 0);

  let saved = 0;
  let skipped = 0;
  let failed = 0;
  let searchFrom = 0;
  let firstFailure = null;

  for (const passage of passages) {
    const range = findPassageRange(transcript, passage, searchFrom);
    if (!range) {
      skipped += 1;
      continue;
    }

    const rangeKey = `${range.start}:${range.end}`;
    if (existingRanges.has(rangeKey)) {
      skipped += 1;
      searchFrom = range.end;
      continue;
    }

    const payload = {
      textId: randomTextId(),
      text: passage,
      start_position: range.start,
      end_position: range.end,
    };

    const writeRes = await requestJson({
      requestFn: analyzeApi.request,
      url: `/projects/${projectId}/sources/${sourceId}/codes/${codeId}`,
      body: payload,
    });

    if (writeRes.error || !writeRes.response || writeRes.response.status >= 400) {
      failed += 1;
      if (firstFailure === null) {
        firstFailure = normalizeError(writeRes);
      }
    } else {
      saved += 1;
      existingRanges.add(rangeKey);
    }

    searchFrom = range.end;
  }

  return { saved, skipped, failed, firstFailure };
};

// ── Run ───────────────────────────────────────────────────────────────────
const run = async () => {
  error.value = null;
  results.value = [];
  loading.value = true;
  codifyAppliedCount.value = null;

  const extraParamsResult = parseExtraParams(extraParamsJson.value);
  if (extraParamsResult.error) {
    error.value = extraParamsResult.error;
    loading.value = false;
    return;
  }

  if (nRuns.value !== null && Number(nRuns.value) < 1) {
    error.value = 'n_runs must be at least 1.';
    loading.value = false;
    return;
  }

  if (nRounds.value !== null && Number(nRounds.value) < 1) {
    error.value = 'n_rounds must be at least 1.';
    loading.value = false;
    return;
  }

  if (nParallels.value !== null && Number(nParallels.value) < 1) {
    error.value = 'n_parallels must be at least 1.';
    loading.value = false;
    return;
  }

  const currentFunction = getGabrielFunction(activeTab.value);
  const body = buildCommonRequestBody({
    model: effectiveModel.value,
    nRuns: nRuns.value,
    nRounds: nRounds.value,
    nParallels: nParallels.value,
    extraParams: extraParamsResult.value,
  });

  if (activeTab.value === 'codify') {
    if (codifySources.value.length === 0) {
      error.value = 'No sources selected.';
      loading.value = false;
      return;
    }

    codifyTextsPool.value = [];
    results.value = [];
    let totalAppliedCount = 0;
    let hasFailure = false;
    let failMessage = '';

    for (const source of codifySources.value) {
      let transcript = htmlToPlainText(source.content ?? '');
      if (!transcript) {
        try {
          transcript = await fetchSourceTranscript(source.id);
        } catch (e) {
          error.value = e?.message || 'Could not load source text for codify.';
          hasFailure = true;
          break;
        }
      }

      if (!transcript) continue;

      codifyTextsPool.value.push({
        id: String(source.id),
        text: transcript,
      });

      const singleBody = { ...body };
      Object.assign(
        singleBody,
        buildFunctionPayload({
          functionKey: activeTab.value,
          selections: [{ id: String(source.id), text: transcript }],
          selectedCodeName: selectedCodeName.value,
          codify,
          classify,
          extract,
          filter,
          rate,
        })
      );

      const res = await requestJson({
        requestFn: analyzeApi.request,
        url: currentFunction.endpoint,
        body: singleBody,
      });

      if (res.error || !res.response || res.response.status >= 400) {
        error.value = normalizeError(res);
        hasFailure = true;
        break;
      }

      const items = res.response.data ?? [];
      const appliedInSource = items.reduce(
        (count, item) => count + (Array.isArray(item.passages) ? item.passages.length : 0),
        0
      );
      totalAppliedCount += appliedInSource;

      if (transcript && items.length > 0) {
        const persisted = await persistCodifySelections({ transcript, items, sourceId: String(source.id) });
        if (persisted.failed > 0 && persisted.saved === 0) {
          failMessage = persisted.firstFailure
            ? `Codify matched passages, but some were not saved to OpenQDA selections. ${persisted.firstFailure}`
            : 'Codify matched passages, but some were not saved to OpenQDA selections.';
        }
      }

      results.value.push(...items);
    }

    if (failMessage && !error.value) {
      error.value = failMessage;
    }

    codifyAppliedCount.value = totalAppliedCount;
    loading.value = false;
  } else {
    Object.assign(
      body,
      buildFunctionPayload({
        functionKey: activeTab.value,
        selections: selections.value,
        selectedCodeName: selectedCodeName.value,
        codify,
        classify,
        extract,
        filter,
        rate,
      })
    );

    const res = await requestJson({
      requestFn: analyzeApi.request,
      url: currentFunction.endpoint,
      body,
    });

    if (res.error || !res.response || res.response.status >= 400) {
      error.value = normalizeError(res);
      loading.value = false;
      return;
    }

    const items = res.response.data ?? [];
    results.value = items;
    loading.value = false;
  }
};
</script>

