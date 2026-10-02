import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PATHS } from './paths';

import RootLayout from '../components/layout/RootLayout';
import RequireAuth from '../components/layout/RequireAuth';
import RequireRole from '../components/layout/RequireRole';

import LoginPage from '../pages/Login/LoginPage';
import UnauthorizedPage from '../pages/Unauthorized/UnauthorizedPage';
import DownloadFormPage from '../pages/DownloadForm/DownloadFormPage';
import ContractDocumentsPage from '../pages/ContractDocuments/ContractDocumentsPage';

import HomeLayout from '../pages/Home/HomeLayout';
import FindContractTab from '../pages/Home/FindContractTab';
import ContractMakingTab from '../pages/Home/ContractMakingTab';
import UploadContractTab from '../pages/Home/UploadContractTab';
import NewRequestTab from '../pages/NewRequest/NewRequestTab';

import JobStatusLayout from '../pages/JobStatus/JobStatusLayout';
import JobStatusMyJobTab from '../pages/JobStatus/MyJobTab';
import JobStatusMyHistoryTab from '../pages/JobStatus/MyHistoryTab';
import AllJobTab from '../pages/JobStatus/AllJobTab';

import ApprovalLayout from '../pages/Approval/ApprovalLayout';
import WaitingApproveTab from '../pages/Approval/WaitingApproveTab';
import ApprovalMyHistoryTab from '../pages/Approval/MyHistoryTab';

import LegalLayout from '../pages/Legal/LegalLayout';
import WaitingCheckTab from '../pages/Legal/WaitingCheckTab';
import LegalHistoryTab from '../pages/Legal/LegalHistoryTab';
import ScheduledEmailMonitorTab from '../pages/Legal/ScheduledEmailMonitorTab';

import SettingsLayout from '../pages/Settings/SettingsLayout';
import RoleTab from '../pages/Settings/RoleTab';
import ContractTypeTab from '../pages/Settings/ContractTypeTab';
import ActivityLogTab from '../pages/Settings/ActivityLogTab';

// All protected pages live under RequireAuth -> RootLayout (header + content).
// Child `path` values below are relative segments of their PATHS.* counterpart,
// e.g. 'my-job' here is the tail of PATHS.JOB_STATUS_MY_JOB.
export const router = createBrowserRouter([
  { path: PATHS.LOGIN, element: <LoginPage /> },
  // Public — outside RequireAuth on purpose (see ContractDocumentsPage.jsx and
  // contract-server's contractDocuments.routes.js): a non-confidential contract's
  // documents must be reachable by a logged-out visitor clicking the link straight
  // from an email; the page itself redirects to Login only when the specific
  // contract turns out to be HIGH CONFIDENTIAL.
  { path: PATHS.CONTRACT_DOCUMENTS, element: <ContractDocumentsPage /> },

  {
    element: <RequireAuth />,
    children: [
      {
        element: <RootLayout />,
        children: [
          {
            path: PATHS.HOME,
            element: <HomeLayout />,
            children: [
              { index: true, element: <FindContractTab /> },
              { path: 'new-request', element: <NewRequestTab /> },
              { path: 'contract-making', element: <ContractMakingTab /> },
              { path: 'upload-contract', element: <UploadContractTab /> },
            ],
          },

          { path: 'download-form', element: <DownloadFormPage /> },
          { path: 'unauthorized', element: <UnauthorizedPage /> },

          {
            path: 'job-status',
            element: <JobStatusLayout />,
            children: [
              { index: true, element: <Navigate to="my-job" replace /> },
              { path: 'my-job', element: <JobStatusMyJobTab /> },
              { path: 'my-history', element: <JobStatusMyHistoryTab /> },
              { path: 'all-job', element: <AllJobTab /> },
            ],
          },

          {
            path: 'approval',
            element: <ApprovalLayout />,
            children: [
              { index: true, element: <Navigate to="waiting" replace /> },
              { path: 'waiting', element: <WaitingApproveTab /> },
              { path: 'history', element: <ApprovalMyHistoryTab /> },
            ],
          },

          {
            path: 'legal',
            element: <RequireRole allow={user => !!user?.legal} />,
            children: [
              {
                element: <LegalLayout />,
                children: [
                  { index: true, element: <Navigate to="waiting" replace /> },
                  { path: 'waiting', element: <WaitingCheckTab /> },
                  { path: 'history', element: <LegalHistoryTab /> },
                  { path: 'scheduled-emails', element: <ScheduledEmailMonitorTab /> },
                ],
              },
            ],
          },

          {
            path: 'settings',
            element: <RequireRole allow={user => !!user?.admin} />,
            children: [
              {
                element: <SettingsLayout />,
                children: [
                  { index: true, element: <Navigate to="contract-types" replace /> },
                  { path: 'contract-types', element: <ContractTypeTab /> },
                  { path: 'role', element: <RoleTab /> },
                  { path: 'activity-log', element: <ActivityLogTab /> },
                ],
              },
            ],
          },

          { path: '*', element: <Navigate to={PATHS.HOME} replace /> },
        ],
      },
    ],
  },
]);
