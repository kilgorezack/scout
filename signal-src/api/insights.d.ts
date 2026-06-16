// Type stubs for the JS prompt builders so Scout's Next.js route handler
// can import them without enabling allowJs project-wide.

export type Properties = Record<string, unknown>;

export function buildPrompt(p: Properties): string;
export function buildBusinessPrompt(p: Properties): string;
export function buildCaPrompt(p: Properties): string;
export function buildCaBizPrompt(p: Properties): string;
export function buildZaPrompt(p: Properties): string;
export function buildZaBizPrompt(p: Properties): string;
