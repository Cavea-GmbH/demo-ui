import { Box, List, ListItem, ListItemText, Typography, Chip } from '@mui/material';
import type { Fence, Polygon, Point } from '../../types/omlox';

interface FenceListProps {
  fences: Fence[];
}

export default function FenceList({ fences }: FenceListProps) {
  const getFenceType = (region: Point | Polygon): string => {
    if ('type' in region) {
      return region.type === 'Polygon' ? 'Polygon' : 'Point';
    }
    return 'Point';
  };

  const getPointCount = (region: Point | Polygon): number => {
    if ('type' in region && region.type === 'Polygon') {
      return region.coordinates[0]?.length - 1 || 0; // -1 because last point is same as first
    }
    return 1;
  };

  const getRegionSummary = (region: Point | Polygon): string => {
    const type = getFenceType(region);
    if (type === 'Polygon') {
      const pointCount = getPointCount(region);
      return `${pointCount} points`;
    }
    const coords = region as Point;
    return `(${coords.coordinates[0].toFixed(1)}, ${coords.coordinates[1].toFixed(1)})`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 600,
            color: 'text.primary',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
          }}
        >
          Fences
        </Typography>
        <Chip 
          label={`${fences.length} total`}
          size="small"
          sx={{
            fontWeight: 600,
            bgcolor: 'rgba(10, 77, 140, 0.08)',
            color: 'primary.main',
          }}
        />
      </Box>

      <List dense sx={{ p: 0 }}>
        {fences.length === 0 ? (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: 'rgba(10, 77, 140, 0.04)',
              border: '1px solid rgba(10, 77, 140, 0.1)',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              No fences defined yet.
            </Typography>
          </Box>
        ) : (
          fences.map((fence) => (
            <ListItem 
              key={fence.id}
              sx={{
                mb: 1,
                borderRadius: 2,
                bgcolor: 'rgba(10, 77, 140, 0.04)',
                border: '1px solid rgba(10, 77, 140, 0.08)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'rgba(10, 77, 140, 0.08)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {fence.name || fence.id}
                    </Typography>
                    <Chip
                      label={getFenceType(fence.region)}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: 'rgba(139, 92, 246, 0.1)',
                        color: '#8b5cf6',
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace', fontSize: '0.7rem', mb: 0.5 }}>
                      ID: {fence.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                      Region: {getRegionSummary(fence.region)}
                    </Typography>
                    {fence.floor !== undefined && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        Floor: {fence.floor}
                      </Typography>
                    )}
                    {fence.crs && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        CRS: {fence.crs}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
}

