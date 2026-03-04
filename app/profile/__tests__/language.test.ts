/**
 * Story 1.7: Contract tests for language screen.
 * Verifies language selector calls api.data.updateProfile with preferredLanguage when user changes language.
 * No direct Supabase/adapter imports.
 */
const fs = require('fs');
const path = require('path');

const languagePath = path.join(__dirname, '..', 'language.tsx');
const languageSource = fs.readFileSync(languagePath, 'utf8');

describe('LanguageScreen contract', () => {
  it('uses api.data.updateProfile for persisting language choice', () => {
    expect(languageSource).toMatch(/api\.data\.updateProfile\s*\(/);
  });

  it('passes preferredLanguage in update payload', () => {
    expect(languageSource).toMatch(/\{\s*preferredLanguage:\s*next\s*\}/);
  });

  it('uses getUserFacingError and isApiError from @/lib/api for error handling', () => {
    expect(languageSource).toMatch(/getUserFacingError|isApiError/);
    expect(languageSource).toMatch(/from\s+['"]@\/lib\/api['"]/);
  });

  it('does not import from Supabase or adapters', () => {
    expect(languageSource).not.toMatch(/@supabase/);
    expect(languageSource).not.toMatch(/lib\/api\/adapters/);
  });

  it('exports a default component', () => {
    expect(languageSource).toMatch(/export\s+default\s+function\s+LanguageScreen/);
  });
});
