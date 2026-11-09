import Modal from './Modal';
export default function ConfirmDialog({ open, title = 'Are you sure?', message, confirmText = 'Delete', onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-danger" onClick={() => { onConfirm(); onClose(); }}>{confirmText}</button></>}>
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}
