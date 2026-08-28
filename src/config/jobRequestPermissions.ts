import { MODULE_PERMISSIONS, RECRUITMENT_TAB_PERMISSIONS } from './tabPermissions';

const JOB_REQUEST_PERMISSION = 'job.request';

function addPermission(list: string[] | undefined) {
  if (list && !list.includes(JOB_REQUEST_PERMISSION)) {
    list.push(JOB_REQUEST_PERMISSION);
  }
}

// A hiring requester should be able to reach the Recruitment module and the
// Requests tab without receiving job-management or publishing permissions.
addPermission(RECRUITMENT_TAB_PERMISSIONS.requests?.requires);
addPermission(MODULE_PERMISSIONS.recruitment);
addPermission(MODULE_PERMISSIONS.talent);
