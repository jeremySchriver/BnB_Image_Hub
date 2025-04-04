const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    video: false,
    setupNodeEvents(on, config) {
      return config;
    },
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
  env: {
    apiUrl: 'http://localhost:8000'
  },
  viewportWidth: 1280,
  viewportHeight: 720
})