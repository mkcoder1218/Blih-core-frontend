# Blih ERP — Shared UI Component Library

## Rule: Always use Blih shared components

When writing or editing any component in this project, **always import from `@/components/ui/blih`** instead of building raw Tailwind equivalent patterns.

```ts
import {
  StatCard, StatCardGrid,
  PageHeader,
  StatusBadge,
  SectionCard,
  UserAvatar,
  TabSwitcher,
  EmptyState,
  DataTable,
  FormField, FormRow,
  ConfirmDialog,
  LoadingSpinner, PageLoadingSpinner, SkeletonLine, SkeletonBlock,
  FilterBar,
  InfoAlert,
} from '@/components/ui/blih';
```

---

## Component Reference

### StatCard + StatCardGrid
Replace any hand-rolled metric card with white bg + icon + value:
```tsx
<StatCardGrid cols={4}>
  <StatCard label="Total Employees" value={412} icon={<Users />} tone="blue" />
  <StatCard label="Pending" value={7} icon={<Clock />} tone="amber" trend="+3 this week" />
</StatCardGrid>
```
Tones: `blue | emerald | amber | rose | violet | cyan | slate`

---

### PageHeader
Replace any hand-rolled page/section title area:
```tsx
<PageHeader
  eyebrow="Attendance"
  title="Check-ins Monitoring"
  description="Daily attendance overview for all employees."
  actions={<Button onClick={handleExport}><Download /> Export</Button>}
/>
```

---

### StatusBadge
Replace ALL hand-rolled colored pills (attendance status, leave stage, recruitment status, etc.):
```tsx
<StatusBadge status="COMPLETED" />     // uses built-in map
<StatusBadge status="pending" />
<StatusBadge label="Custom" tone="violet" />  // override
```
Built-in statuses: `COMPLETED, IN_PROGRESS, ON_BREAK, LATE, MISSED, NOT_STARTED, OUTSIDE_RADIUS_ATTEMPT, approved, pending, rejected, cancelled, dept_head, admin, draft, active, closed, published, declined, not_started, in_progress, completed, passed, failed, extended, on_track, at_risk, off_track, exceeded, paid, unpaid, processing`

---

### SectionCard
Replace `<div className="bg-white rounded-2xl border ...">` content panels:
```tsx
<SectionCard title="Salary Adjustments" icon={<DollarSign />} accent="blue" action={<Button>...</Button>}>
  content here
</SectionCard>
```

---

### UserAvatar
Replace any initials avatar div:
```tsx
<UserAvatar name="Aisha Kemunto" />                           // just avatar
<UserAvatar name="John Doe" subtitle="john@blih.com" />       // with name+email
<UserAvatar name="HR" size="lg" color="blue" />
```

---

### TabSwitcher
Replace ALL hand-rolled tab button groups:
```tsx
<TabSwitcher
  tabs={[
    { id: 'salary', label: 'Salary' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'requests', label: 'Requests', badge: 4 },
  ]}
  active={tab}
  onChange={setTab}
/>
// Variants: 'pill' (default) | 'underline'
```

---

### EmptyState
Replace any empty content placeholder:
```tsx
<EmptyState
  icon={<Inbox />}
  title="No requests yet"
  description="Leave requests will appear here."
  action={<Button onClick={open}>New Request</Button>}
/>
<EmptyState title="No records" compact />  // inside table cells
```

---

### DataTable
Replace any `<table>` + empty state + loading skeleton pattern:
```tsx
<DataTable
  title="Daily Check-ins"
  subtitle={`${rows.length} employees`}
  columns={['Employee', 'Department', 'Status']}
  rows={rows}
  loading={isLoading}
  emptyMessage="No employees match filters."
  renderRow={(row) => (
    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer">
      ...cells...
    </tr>
  )}
/>
```

---

### FormField + FormRow
Replace label + input wrapper patterns in forms/modals:
```tsx
<FormRow cols={2}>
  <FormField label="Start Date" required>
    <Input type="date" ... />
  </FormField>
  <FormField label="End Date" error={errors.endDate}>
    <Input type="date" ... />
  </FormField>
</FormRow>
```

---

### ConfirmDialog
Replace any inline confirm UI or destructive action confirmation:
```tsx
<ConfirmDialog
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  onConfirm={handleDelete}
  title="Delete Template"
  description="This cannot be undone."
  confirmLabel="Delete"
  variant="destructive"
  loading={deleteMut.isPending}
/>
```

---

### LoadingSpinner / SkeletonBlock
Replace hand-rolled loading states:
```tsx
{isLoading ? <LoadingSpinner label="Loading data…" /> : <Content />}
<SkeletonBlock rows={3} />   // card skeleton
<LoadingSpinner size="sm" inline />  // button spinner
```

---

### FilterBar
Replace search + filter rows at the top of list views:
```tsx
<FilterBar
  search={search}
  onSearchChange={setSearch}
  searchPlaceholder="Search employees..."
  filters={[
    { value: status, onChange: setStatus, placeholder: 'All Statuses',
      options: [{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }] }
  ]}
  actions={<Button onClick={open}><Plus /> New</Button>}
/>
```

---

### InfoAlert
Replace hand-rolled amber/red/blue info boxes:
```tsx
<InfoAlert variant="warning" message="No active leave types. Contact HR." />
<InfoAlert variant="error" message={error} />
<InfoAlert variant="success" message="Changes saved." />
<InfoAlert variant="info" icon={<Calendar />} message="12 days remaining." />
```

---

## Design Tokens (do not override)

- Primary: `blue-600`
- Border radius: `rounded-2xl` / `rounded-3xl` for cards, `rounded-xl` for inputs/buttons
- Card bg: `bg-white`, border: `border-slate-100`
- Shadow: `shadow-xs`
- Body text: `text-xs`/`text-[12px]` + `font-semibold`
- Headings: `font-black` + `text-slate-900`
- Labels: `text-[10px] font-bold uppercase tracking-wider text-slate-400`
- Neutrals: `slate-*` palette throughout
