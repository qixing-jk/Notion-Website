module.exports = {
  ci: {
    collect: {
      settings: {
        plugins: ['lighthouse-plugin-field-performance']
      }
    },
    assert: {
      preset: 'lighthouse:recommended'
    }
  }
}
