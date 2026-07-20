import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';

const root = process.cwd();
const sourceExtensions = new Set(['.css', '.js', '.jsx', '.ts', '.tsx']);
const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);
const defaultLimit = 500;

// Legacy ceilings keep current debt visible while preventing new oversized modules.
const legacyLimits = new Map([
  ['src/components/attendance/AttendanceCalendarTab.tsx', 1059],
  ['src/components/attendance/EmployeeAttendancePage.tsx', 895],
  ['src/components/attendance/LeavePage.tsx', 1471],
  ['src/components/attendance/OvertimePage.tsx', 529],
  ['src/components/attendance/hr/HrAttendanceCheckInsPage.tsx', 751],
  ['src/components/businesses/BusinessesView.tsx', 977],
  ['src/components/finance/EmployeeSalaryTable.tsx', 1433],
  ['src/components/finance/PayrollTemplatePanel.tsx', 919],
  ['src/components/finance/WorkforceFinanceView.tsx', 1424],
  ['src/components/offboarding/ExitOffboardingView.tsx', 942],
  ['src/components/offer-letters/OfferLetterCreateModal.tsx', 518],
  ['src/components/onboarding/tabs/OnboardingContractTab.tsx', 1222],
  ['src/components/people/CreateEmployeeModal.tsx', 1826],
  ['src/components/people/EventsTab.tsx', 690],
  ['src/components/people/PeopleProfilesView.tsx', 2021],
  ['src/components/performance/DisciplineTab.tsx', 774],
  ['src/components/recruitment/InterviewManagementView.tsx', 517],
  ['src/components/recruitment/JobRecruitmentWorkspace.tsx', 1033],
  ['src/components/recruitment/RecruitmentApplicantForms.tsx', 511],
  ['src/pages/CandidateOnboardingPage.tsx', 999],
  ['src/pages/PublicRegisterPage.tsx', 1840],
]);

async function collect(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(path)));
    else if (sourceExtensions.has(extname(entry.name))) files.push(path);
  }

  return files;
}

const violations = [];
const legacyDebt = [];

for (const path of await collect(root)) {
  const name = relative(root, path).split(sep).join('/');
  const lines = (await readFile(path, 'utf8')).split(/\r?\n/).length;
  const legacyLimit = legacyLimits.get(name);
  const limit = legacyLimit ?? defaultLimit;

  if (lines > limit) violations.push({ name, lines, limit });
  else if (lines > defaultLimit) legacyDebt.push({ name, lines });
}

if (violations.length) {
  console.error('Source-size limit exceeded:');
  for (const item of violations) {
    console.error(`- ${item.name}: ${item.lines} lines (limit ${item.limit})`);
  }
  process.exit(1);
}

console.log(
  `Source-size guard passed. ${legacyDebt.length} legacy modules remain above ${defaultLimit} lines.`,
);
