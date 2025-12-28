import * as fs from 'fs';
import * as path from 'path';

interface AccessibilityIssue {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  code: string;
  suggestion: string;
}

interface AuditReport {
  totalFiles: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  issues: AccessibilityIssue[];
  summary: {
    hardcodedColors: number;
    missingDarkMode: number;
    poorContrast: number;
    hardcodedWhite: number;
    hardcodedBlack: number;
    chartColors: number;
  };
}

// ============================================
// PATTERNS TO DETECT
// ============================================

const ISSUE_PATTERNS: Array<{
  pattern: RegExp;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  suggestion: string;
}> = [
  // CRITICAL: Hardcoded white text (may be invisible on light backgrounds)
  {
    pattern: /\btext-white\b/g,
    category: 'hardcoded-white',
    severity: 'critical',
    issue: 'Hardcoded white text - may be invisible on light backgrounds',
    suggestion: 'Use text-foreground or ensure it\'s on a colored background',
  },

  // CRITICAL: Hardcoded dark text without dark mode
  {
    pattern: /\btext-gray-900\b(?!\s*dark:)/g,
    category: 'hardcoded-black',
    severity: 'critical',
    issue: 'Hardcoded dark text - invisible in dark mode',
    suggestion: 'Use style={{ color: \'rgb(var(--foreground))\' }} or text-foreground',
  },
  {
    pattern: /\btext-black\b(?!\s*dark:)/g,
    category: 'hardcoded-black',
    severity: 'critical',
    issue: 'Hardcoded black text - invisible in dark mode',
    suggestion: 'Use style={{ color: \'rgb(var(--foreground))\' }} or text-foreground',
  },

  // HIGH: Gray text that may fail contrast
  {
    pattern: /\btext-gray-[3-5]\d{2}\b(?!\s*dark:)/g,
    category: 'poor-contrast',
    severity: 'high',
    issue: 'Gray text may have poor contrast without dark mode variant',
    suggestion: 'Use style={{ color: \'rgb(var(--foreground-muted))\' }}',
  },
  {
    pattern: /\btext-gray-[6-7]\d{2}\b(?!\s*dark:)/g,
    category: 'missing-dark',
    severity: 'medium',
    issue: 'Text color without dark mode variant',
    suggestion: 'Use style={{ color: \'rgb(var(--foreground-secondary))\' }}',
  },

  // HIGH: White backgrounds without dark mode
  {
    pattern: /\bbg-white\b(?!\s*dark:)/g,
    category: 'hardcoded-white-bg',
    severity: 'high',
    issue: 'Hardcoded white background - no dark mode support',
    suggestion: 'Use style={{ backgroundColor: \'rgb(var(--surface))\' }} or bg-surface',
  },

  // HIGH: Gray backgrounds without dark variants
  {
    pattern: /\bbg-gray-[0-2]\d{2}\b(?!\s*dark:)/g,
    category: 'missing-dark-bg',
    severity: 'high',
    issue: 'Light gray background without dark mode variant',
    suggestion: 'Use style={{ backgroundColor: \'rgb(var(--background-secondary))\' }}',
  },

  // MEDIUM: Border colors without dark mode
  {
    pattern: /\bborder-gray-[1-3]\d{2}\b(?!\s*dark:)/g,
    category: 'missing-dark-border',
    severity: 'medium',
    issue: 'Border color without dark mode variant',
    suggestion: 'Use style={{ borderColor: \'rgb(var(--border))\' }} or border-border',
  },

  // HIGH: Hardcoded hex colors in charts
  {
    pattern: /stroke=["']#[0-9a-fA-F]{3,6}["']/g,
    category: 'chart-hardcoded',
    severity: 'high',
    issue: 'Hardcoded stroke color in chart - does not respect theme',
    suggestion: 'Use CSS variable or theme-aware color hook',
  },
  {
    pattern: /fill=["']#[0-9a-fA-F]{3,6}["']/g,
    category: 'chart-hardcoded',
    severity: 'high',
    issue: 'Hardcoded fill color in chart - does not respect theme',
    suggestion: 'Use CSS variable or theme-aware color hook',
  },

  // MEDIUM: Hover states without dark variants
  {
    pattern: /\bhover:bg-gray-[0-2]\d{2}\b(?!\s*dark:)/g,
    category: 'missing-dark-hover',
    severity: 'medium',
    issue: 'Hover state without dark mode variant',
    suggestion: 'Add dark:hover: variant or use theme-aware class',
  },
];

// ============================================
// AUDIT FUNCTIONS
// ============================================

const IGNORE_DIRS = ['node_modules', '.git', '.next', 'dist', 'coverage', 'firecrawl'];
const COMPONENT_EXTENSIONS = ['.tsx', '.jsx'];

function walkDirectory(dir: string, extensions: string[], files: string[] = []): string[] {
  try {
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!IGNORE_DIRS.includes(entry) && !entry.startsWith('.')) {
          walkDirectory(fullPath, extensions, files);
        }
      } else if (extensions.includes(path.extname(entry))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore errors for inaccessible directories
  }

  return files;
}

function analyzeFile(filePath: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    for (const { pattern, category, severity, issue, suggestion } of ISSUE_PATTERNS) {
      // Reset regex lastIndex for global patterns
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(line)) !== null) {
        issues.push({
          file: filePath,
          line: lineNum,
          severity,
          category,
          issue,
          code: match[0],
          suggestion,
        });
      }
    }
  }

  return issues;
}

function generateReport(projectRoot: string): AuditReport {
  // Collect all component files
  const componentFiles = walkDirectory(projectRoot, COMPONENT_EXTENSIONS);

  const allIssues: AccessibilityIssue[] = [];

  // Analyze components
  for (const file of componentFiles) {
    const issues = analyzeFile(file);
    allIssues.push(...issues);
  }

  // Categorize
  const summary = {
    hardcodedColors: allIssues.filter(i => i.category.includes('hardcoded')).length,
    missingDarkMode: allIssues.filter(i => i.category.includes('missing-dark')).length,
    poorContrast: allIssues.filter(i => i.category.includes('contrast')).length,
    hardcodedWhite: allIssues.filter(i => i.category.includes('white')).length,
    hardcodedBlack: allIssues.filter(i => i.category.includes('black')).length,
    chartColors: allIssues.filter(i => i.category.includes('chart')).length,
  };

  return {
    totalFiles: componentFiles.length,
    totalIssues: allIssues.length,
    criticalIssues: allIssues.filter(i => i.severity === 'critical').length,
    highIssues: allIssues.filter(i => i.severity === 'high').length,
    issues: allIssues.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    summary,
  };
}

// ============================================
// RUN AUDIT
// ============================================

const projectRoot = process.cwd();

console.log('\n' + '='.repeat(70));
console.log('VISTRALAI ACCESSIBILITY AUDIT REPORT');
console.log('='.repeat(70) + '\n');

const report = generateReport(projectRoot);

console.log('SUMMARY');
console.log('-'.repeat(50));
console.log(`Total Files Analyzed:    ${report.totalFiles}`);
console.log(`Total Issues Found:      ${report.totalIssues}`);
console.log(`  🔴 Critical:           ${report.criticalIssues}`);
console.log(`  🟠 High:               ${report.highIssues}`);
console.log(`  🟡 Medium:             ${report.issues.filter(i => i.severity === 'medium').length}`);
console.log(`  🟢 Low:                ${report.issues.filter(i => i.severity === 'low').length}`);

console.log('\nISSUE BREAKDOWN');
console.log('-'.repeat(50));
console.log(`  Hardcoded White:       ${report.summary.hardcodedWhite}`);
console.log(`  Hardcoded Black:       ${report.summary.hardcodedBlack}`);
console.log(`  Missing Dark Mode:     ${report.summary.missingDarkMode}`);
console.log(`  Poor Contrast:         ${report.summary.poorContrast}`);
console.log(`  Chart Colors:          ${report.summary.chartColors}`);

// Group issues by file
const issuesByFile = new Map<string, AccessibilityIssue[]>();
for (const issue of report.issues) {
  const relPath = issue.file.replace(projectRoot + '/', '');
  if (!issuesByFile.has(relPath)) {
    issuesByFile.set(relPath, []);
  }
  issuesByFile.get(relPath)!.push(issue);
}

console.log('\n\n' + '='.repeat(70));
console.log('CRITICAL & HIGH PRIORITY ISSUES (Fix First!)');
console.log('='.repeat(70));

const criticalAndHigh = report.issues.filter(i =>
  i.severity === 'critical' || i.severity === 'high'
);

// Group by file for readability
const criticalByFile = new Map<string, AccessibilityIssue[]>();
for (const issue of criticalAndHigh) {
  const relPath = issue.file.replace(projectRoot + '/', '');
  if (!criticalByFile.has(relPath)) {
    criticalByFile.set(relPath, []);
  }
  criticalByFile.get(relPath)!.push(issue);
}

for (const [file, issues] of criticalByFile) {
  console.log(`\n📁 ${file}`);
  console.log('-'.repeat(60));

  for (const issue of issues) {
    const icon = issue.severity === 'critical' ? '🔴' : '🟠';
    console.log(`  ${icon} Line ${issue.line}: ${issue.issue}`);
    console.log(`     Code: ${issue.code}`);
    console.log(`     Fix:  ${issue.suggestion}`);
  }
}

console.log('\n\n' + '='.repeat(70));
console.log('FILES REQUIRING FIXES (sorted by issue count)');
console.log('='.repeat(70));

const sortedFiles = [...issuesByFile.entries()].sort((a, b) => b[1].length - a[1].length);

for (const [file, issues] of sortedFiles.slice(0, 20)) {
  const critical = issues.filter(i => i.severity === 'critical').length;
  const high = issues.filter(i => i.severity === 'high').length;
  const medium = issues.filter(i => i.severity === 'medium').length;

  console.log(`📁 ${file}`);
  console.log(`   Total: ${issues.length} | Critical: ${critical} | High: ${high} | Medium: ${medium}`);
}

// Save full report
fs.writeFileSync('accessibility-audit.json', JSON.stringify(report, null, 2));
console.log('\n\n✅ Full report saved to: accessibility-audit.json');

// Generate fix priority
const fixPriority = `
================================================================================
VISTRALAI ACCESSIBILITY FIX PRIORITY ORDER
================================================================================

Date: ${new Date().toISOString()}
Total Issues: ${report.totalIssues}

1. CRITICAL: Text Visibility Issues (${report.criticalIssues} issues)
   - Hardcoded white text (text-white) on potentially light backgrounds
   - Hardcoded dark text (text-gray-900, text-black) invisible in dark mode

   IMMEDIATE FIX:
   - Replace text-gray-900 with style={{ color: 'rgb(var(--foreground))' }}
   - Ensure text-white is only used on colored/primary backgrounds

2. HIGH: Missing Dark Mode Support (${report.highIssues} issues)
   - White backgrounds (bg-white) without dark variants
   - Light gray backgrounds (bg-gray-50/100/200) without dark variants
   - Chart colors with hardcoded hex values

   FIX APPROACH:
   - Replace bg-white with style={{ backgroundColor: 'rgb(var(--surface))' }}
   - Replace bg-gray-100 with style={{ backgroundColor: 'rgb(var(--background-secondary))' }}
   - Create useChartTheme() hook for chart colors

3. MEDIUM: Contrast & Border Issues (${report.issues.filter(i => i.severity === 'medium').length} issues)
   - Border colors without dark variants
   - Hover states without dark variants

   FIX APPROACH:
   - Replace border-gray-200 with style={{ borderColor: 'rgb(var(--border))' }}
   - Add dark: variants to hover states

================================================================================
TOP 10 FILES TO FIX FIRST:
================================================================================
${sortedFiles.slice(0, 10).map(([file, issues], idx) =>
  `${idx + 1}. ${file} (${issues.length} issues)`
).join('\n')}

================================================================================
`;

console.log(fixPriority);
fs.writeFileSync('accessibility-fix-priority.txt', fixPriority);
console.log('✅ Fix priority saved to: accessibility-fix-priority.txt');
