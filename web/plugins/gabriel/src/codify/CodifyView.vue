<template>
  <div class="p-4 space-y-4">
    <!-- Header -->
    <div>
      <h2 class="text-lg font-semibold">Codify</h2>
      <p class="text-sm text-foreground/60 mt-1">
        GABRIEL scans the source file and automatically codes the matching passages for the selected code.
      </p>
    </div>

    <!-- Config form -->
    <form @submit.prevent="run" class="space-y-3">
      <!-- Source file — driven by the sidebar selection -->
      <div>
        <label class="block text-xs font-medium uppercase mb-1">Source file</label>
        <p v-if="codifySources.length === 0"
           class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Please check a source in the sidebar first.
        </p>
        <div v-else-if="codifySources.length === 1"
             class="w-full border border-border rounded px-3 py-2 text-sm bg-surface/60 text-foreground">
          {{ codifySources[0].name }}
        </div>
        <select v-else
          v-model="selectedSourceId"
          required
          class="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary bg-surface text-foreground"
        >
          <option value="" disabled>(Select a source file)</option>
          <option v-for="s in codifySources" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>

      <!-- Code picker -->
      <div>
        <label class="block text-xs font-medium uppercase mb-1">Code</label>
        <select
          v-model="selectedCodeId"
          required
          class="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary bg-surface text-foreground"
        >
          <option value="" disabled>(Select a code to assign)</option>
          <option
            v-for="c in availableCodes"
            :key="c.id"
            :value="c.id"
          >{{ c.name }}</option>
        </select>
      </div>

      <details class="border border-border rounded p-3 bg-surface/40">
        <summary class="cursor-pointer text-sm font-medium">Advanced options</summary>
        <div class="space-y-3 mt-3">
          <div>
            <label class="block text-xs font-medium uppercase mb-1">
              Code description
              <span class="normal-case font-normal text-foreground/50 ml-1">(auto-filled — helps GABRIEL identify matching passages)</span>
            </label>
            <textarea
              v-model="codeDescription"
              rows="3"
              placeholder="Optional: describe what this code means, e.g. &quot;Statements about perceived ease-of-use or usefulness of a technology&quot;"
              class="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary bg-surface text-foreground"
            />
          </div>

          <div>
            <label class="block text-xs font-medium uppercase mb-1">Instructions</label>
            <textarea
              v-model="instructions"
              rows="2"
              placeholder="Tell GABRIEL exactly which speaker to focus on, e.g. only Participant/User utterances."
              class="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary bg-surface text-foreground"
            />
          </div>

          <div>
            <label class="block text-xs font-medium uppercase mb-1">Model</label>
            <select
              v-model="model"
              class="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none bg-surface text-foreground"
            >
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4.1-mini">gpt-4.1-mini</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium uppercase mb-1">Additional params (JSON, optional)</label>
            <textarea
              v-model="additionalParamsJson"
              rows="2"
              placeholder='{"max_workers": 8}'
              class="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary bg-surface text-foreground"
            />
          </div>
        </div>
      </details>

      <div class="flex items-center gap-3">
        <button
          type="submit"
          :disabled="loading || !effectiveSourceId || !selectedCodeId"
          class="px-4 py-2 bg-foreground text-background rounded text-sm font-medium disabled:opacity-40"
        >
          {{ loading ? 'Running…' : 'Run Codify' }}
        </button>
        <span v-if="codifySources.length === 0" class="text-xs text-foreground/50">
          Check a source in the sidebar first.
        </span>
        <span v-else-if="!selectedCodeId" class="text-xs text-foreground/50">
          Select a code above.
        </span>
        <span v-else class="text-xs text-foreground/50">
          Ready — GABRIEL will scan "{{ codifySources.find(s => s.id === effectiveSourceId)?.name ?? '' }}" for "{{ selectedCodeName }}"
        </span>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="appliedCount !== null && !error" class="text-sm text-green-700">
        {{ appliedCount === 0
          ? 'GABRIEL found no matching passages for this code.'
          : `${appliedCount} passage${appliedCount !== 1 ? 's' : ''} applied to "${selectedCodeName}".` }}
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref, inject, computed, watch } from 'vue';

const analyzeApi = inject('analyzeApi');

// Sources: in CodingPage (prepare view), always use the active source so it
// updates when the user switches files. Fall back to sidebar-checked sources
// for the AnalysisPage context.
const codifySources = computed(() => {
  const active = analyzeApi.getActiveSource();
  return active ? [active] : analyzeApi.getCheckedSources();
});
const availableCodes = computed(() => analyzeApi.getCodes());

// Source: auto-resolved when only one is checked, otherwise driven by dropdown
const selectedSourceId = ref('');
const effectiveSourceId = computed(() =>
  codifySources.value.length === 1 ? codifySources.value[0].id : selectedSourceId.value
);

// Selected code
const selectedCodeId = ref('');
const selectedCode = computed(() =>
  availableCodes.value.find((c) => String(c.id) === String(selectedCodeId.value))
);
const selectedCodeName = computed(() => selectedCode.value?.name ?? '');

// Auto-fill description when the user picks a code (immediate fires on first selection)
const codeDescription = ref('');
watch(selectedCode, (c) => {
  if (c) codeDescription.value = c.description ?? '';
}, { immediate: true });
const instructions = ref('Focus only on statements made by the participant/user. Ignore interviewer, facilitator, or AI assistant prompts.');

const model = ref('gpt-4o-mini');
const additionalParamsJson = ref('');
const loading = ref(false);
const error = ref(null);
const appliedCount = ref(null);

const run = async () => {
  error.value = null;
  appliedCount.value = null;
  loading.value = true;

  const textBlocks = await analyzeApi.fetchSourceText(effectiveSourceId.value);
  if (textBlocks.length === 0) {
    error.value = 'Could not load the source file text. Make sure the file has been converted.';
    loading.value = false;
    return;
  }

  const transcript = textBlocks.map((item) => item.text).join('\n\n').trim();
  if (!transcript) {
    error.value = 'The selected source has no readable transcript text.';
    loading.value = false;
    return;
  }

  const texts = [{ id: String(effectiveSourceId.value), text: transcript }];

  let additionalParams = {};
  const rawAdditionalParams = additionalParamsJson.value?.trim();
  if (rawAdditionalParams) {
    try {
      const parsed = JSON.parse(rawAdditionalParams);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        error.value = 'Additional params must be a valid JSON object.';
        loading.value = false;
        return;
      }
      additionalParams = parsed;
    } catch {
      error.value = 'Invalid JSON in Additional params.';
      loading.value = false;
      return;
    }
  }

  const res = await analyzeApi.request('/api/gabriel/codify', {
    ...additionalParams,
    texts,
    code_name: selectedCodeName.value,
    code_description: codeDescription.value ?? '',
    instructions: instructions.value?.trim() || undefined,
    additional_instructions: instructions.value?.trim() || undefined,
    model: model.value,
  });

  loading.value = false;

  if (res.error || !res.response || res.response.status >= 400) {
    const d = res.response?.data;
    let detail =
      (Array.isArray(d?.detail) ? d.detail.map((e) => e.msg ?? JSON.stringify(e)).join('; ') : d?.detail) ||
      d?.message ||
      d?.error ||
      res.error?.message ||
      'Unknown error';
    if (d?.errors && typeof d.errors === 'object') {
      detail += ' — ' + Object.values(d.errors).flat().join('; ');
    }
    error.value = `Request failed: ${detail}`;
    return;
  }

  // Auto-apply: create a coding selection for every passage GABRIEL matched.
  const items = res.response.data ?? [];
  const projectId = analyzeApi.getProjectId();
  const code = selectedCode.value;
  let applied = 0;

  for (const item of items) {
    const content = String(item.id) === String(effectiveSourceId.value) ? transcript : '';
    if (!content) continue;
    let searchFrom = 0;
    for (const passage of (item.passages ?? [])) {
      const localIdx = content.indexOf(passage, searchFrom);
      if (localIdx === -1) continue;
      const start = localIdx;
      const end = start + passage.length;
      await analyzeApi.storeSelection({
        projectId,
        sourceId: effectiveSourceId.value,
        codeId: code.id,
        text: passage,
        start,
        end,
      });
      applied++;
      searchFrom = end;
    }
  }

  appliedCount.value = applied;
};
</script>
