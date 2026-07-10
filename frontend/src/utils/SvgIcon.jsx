import { Box } from '@mui/material';

export default function SvgIcon({ name, sx, size = 24 }) {
  if (!name) return null;
  return (
    <Box
      component="img"
      src={`/icons/${name}.svg`}
      sx={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', ...sx }}
      alt={name}
    />
  );
}
