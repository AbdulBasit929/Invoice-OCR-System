// src/components/Section.jsx
import { Box, Container } from '@mui/material';
import PropTypes from 'prop-types';

const Section = ({ id, children, bg = 'transparent', py = 12, ...rest }) => (
  <Box
    id={id}
    sx={{
      bgcolor: bg,
      py: (theme) => theme.spacing(py),
      overflow: 'hidden',
    }}
  >
    <Container maxWidth="xl" {...rest}>
      {children}
    </Container>
  </Box>
);

Section.propTypes = {
  id: PropTypes.string,
  children: PropTypes.node.isRequired,
  bg: PropTypes.string,
  py: PropTypes.number,
};

export default Section;