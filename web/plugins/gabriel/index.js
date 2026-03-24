/**
 * Registers the GABRIEL AI analysis plugin with the OpenQDA plugin API.
 * All tools (Codify, Classify, Extract, Filter, Rate, Deidentify) are housed
 * in a single tabbed view.
 *
 * @param {import('../../resources/js/exchange/OpenQDAPlugins.js').OpenQDAPlugins} api
 */
export default function register(api) {
  api.register({
    key: 'gabriel',
    name: 'GabrielView',
    title: 'GABRIEL (AI)',
    summary: 'AI-powered analysis: codify, classify, extract, filter, rate, and deidentify.',
    type: 'visualization',
    load: () => import('./src/GabrielView.vue'),
    hasOptions: false,
  });
}
