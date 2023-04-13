import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/RadarPie/RadarContainer.js', // Path to your main input file
  output: {
    file: 'src/RadarPie/RadarPie.min.js', // Path to the output bundle/minified file
    format: 'es',
  },
  plugins: [terser()],
};
