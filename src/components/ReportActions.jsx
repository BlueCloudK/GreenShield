import { useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { Button } from './ui/Button';
import { maskSensitiveText } from '../utils/maskSensitiveText';

export function ReportActions({ report }) {
  function download() {
    const data = JSON.stringify(report, (_key, value) => typeof value === 'string' ? maskSensitiveText(value) : value, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = `greenshield-${report.scan.id}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <Button onClick={download} variant="secondary"><Download size={16} />Xuất JSON</Button>;
}

export function CopyFix({ finding }) {
  const [message, setMessage] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(maskSensitiveText(`${finding.title}\n\n${finding.mitigation}\n\n${finding.implementation_guidance}\n\nXác nhận: ${finding.validation_criteria}`));
      setMessage('Đã sao chép');
    } catch { setMessage('Trình duyệt chưa cho phép sao chép.'); }
  }
  return <div className="mt-3 print:hidden"><Button onClick={copy} variant="secondary"><Copy size={16} />Sao chép hướng sửa</Button><p role="status" className="mt-2 text-xs text-slate-400">{message}</p></div>;
}
