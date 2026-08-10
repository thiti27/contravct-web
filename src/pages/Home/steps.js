import { Search, FilePlus2, CircleCheck, Upload } from 'lucide-react';
import { PATHS } from '../../routes/paths';

export const HOME_STEPS = [
  { path: PATHS.HOME, icon: Search, title: '01 FIND CONTRACT', desc: 'ตรวจสอบว่ามีสัญญาแล้วหรือไม่' },
  { path: PATHS.NEW_REQUEST, icon: FilePlus2, title: '02 NEW REQUEST', desc: 'ร้องขอจัดทำสัญญาและแนบเอกสาร' },
  { path: PATHS.CONTRACT_MAKING, icon: CircleCheck, title: '03 CONTRACT MAKING', desc: 'จัดทำสัญญาและติดตามสถานะ' },
  { path: PATHS.UPLOAD_CONTRACT, icon: Upload, title: '04 UPLOAD CONTRACT', desc: 'จัดเก็บสัญญาที่ลงนามเรียบร้อยแล้ว' },
];
