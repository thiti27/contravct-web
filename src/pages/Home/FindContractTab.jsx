import ContractListPage from '../../components/contracts/ContractListPage';

export default function FindContractTab() {
  return <ContractListPage variant="browse" showYear showBrowse showExport requireContractNo enableEdit showStatus={false} />;
}
