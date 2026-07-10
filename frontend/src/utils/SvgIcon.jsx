import { Box } from '@mui/material';

export default function SvgIcon({ name, folder, sx, size = 24 }) {
  if (!name) return null;
  const prefix = folder ? `${folder}/` : '';
  return (
    <Box
      component="img"
      src={`/icons/${prefix}${name}.svg`}
      sx={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', ...sx }}
      alt={name}
    />
  );
}
