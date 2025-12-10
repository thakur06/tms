export const projects = [
  {
    id: 'p1',
    name: 'Website relaunch',
    owner: 'Avery',
    progress: 76,
    health: 'on-track',
    due: 'Mar 28',
    automation: ['Daily digest', 'Overdue pings'],
    location: 'New York, USA',
  },
  {
    id: 'p2',
    name: 'Mobile app revamp',
    owner: 'Jordan',
    progress: 48,
    health: 'at-risk',
    due: 'Apr 9',
    automation: ['Stage approvals', 'Slack updates'],
    location: 'San Francisco, USA',
  },
  {
    id: 'p3',
    name: 'Marketing sprint',
    owner: 'Riley',
    progress: 22,
    health: 'off-track',
    due: 'Apr 2',
    automation: ['Auto-assign intake'],
    location: 'London, UK',
  },
]

export const users = [
  { id: 'u1', name: 'Sam', email: 'sam@example.com' },
  { id: 'u2', name: 'Avery', email: 'avery@example.com' },
  { id: 'u3', name: 'Taylor', email: 'taylor@example.com' },
  { id: 'u4', name: 'Riley', email: 'riley@example.com' },
  { id: 'u5', name: 'Jordan', email: 'jordan@example.com' },
  { id: 'u6', name: 'Alex', email: 'alex@example.com' },
  { id: 'u7', name: 'Morgan', email: 'morgan@example.com' },
]

export const tasks = [
  {
    id: 't1',
    title: 'Wireframes v2',
    project: 'Website relaunch',
    assignee: 'Sam',
    status: 'In Progress',
    due: 'Mar 12',
    estimate: 10,
    logged: 6,
    approvals: ['Design lead'],
    tags: ['UX', 'Priority'],
  },
  {
    id: 't2',
    title: 'API integration',
    project: 'Mobile app revamp',
    assignee: 'Avery',
    status: 'Blocked',
    due: 'Mar 15',
    estimate: 16,
    logged: 4,
    approvals: [],
    tags: ['Backend'],
  },
  {
    id: 't3',
    title: 'Campaign copy',
    project: 'Marketing sprint',
    assignee: 'Taylor',
    status: 'Review',
    due: 'Mar 10',
    estimate: 8,
    logged: 3,
    approvals: ['Legal'],
    tags: ['Content'],
  },
  {
    id: 't4',
    title: 'QA regression',
    project: 'Mobile app revamp',
    assignee: 'Riley',
    status: 'Not Started',
    due: 'Mar 18',
    estimate: 12,
    logged: 0,
    approvals: [],
    tags: ['QA'],
  },
]

export const timeline = [
  { id: 'tl1', label: 'Discovery', start: '2025-03-01', end: '2025-03-06', owner: 'Design' },
  { id: 'tl2', label: 'Build', start: '2025-03-04', end: '2025-03-18', owner: 'Engineering' },
  { id: 'tl3', label: 'QA', start: '2025-03-16', end: '2025-03-22', owner: 'QA' },
  { id: 'tl4', label: 'Launch', start: '2025-03-24', end: '2025-03-28', owner: 'Go-to-market' },
]

export const calendarEvents = [
  { date: '2025-03-03', title: 'Sprint planning' },
  { date: '2025-03-07', title: 'Design review' },
  { date: '2025-03-12', title: 'Client approval' },
  { date: '2025-03-18', title: 'Release train' },
]

