/**
 * Story 2.3: Contract tests for OrgStructureRow pattern.
 * Verifies component exports, props, and type labels.
 */
const fs = require('fs');
const path = require('path');

const componentPath = path.join(__dirname, '..', 'OrgStructureRow.tsx');
const source = fs.readFileSync(componentPath, 'utf8');

describe('OrgStructureRow contract', () => {
  it('exports OrgStructureRow and type OrgStructureType', () => {
    expect(source).toContain('export function OrgStructureRow');
    expect(source).toContain("export type OrgStructureType = 'org' | 'ministry' | 'group'");
  });

  it('accepts name, type, onPress, accessibilityLabel, accessibilityHint', () => {
    expect(source).toMatch(/name:\s*string/);
    expect(source).toMatch(/type:\s*OrgStructureType/);
    expect(source).toMatch(/onPress\?/);
    expect(source).toMatch(/accessibilityLabel\?/);
    expect(source).toMatch(/accessibilityHint\?/);
  });

  it('has type labels for org, ministry, group', () => {
    expect(source).toMatch(/org.*Org/);
    expect(source).toMatch(/ministry.*Ministry/);
    expect(source).toMatch(/group.*Group/);
  });

  it('uses ListItem and Badge from primitives', () => {
    expect(source).toContain('ListItem');
    expect(source).toContain('Badge');
  });
});
