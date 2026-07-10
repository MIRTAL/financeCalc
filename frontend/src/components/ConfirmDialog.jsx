import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

export default function ConfirmDialog({ open, title, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>Вы уверены?</DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Отмена</Button>
        <Button variant="contained" color="error" onClick={onConfirm}>Удалить</Button>
      </DialogActions>
    </Dialog>
  );
}
