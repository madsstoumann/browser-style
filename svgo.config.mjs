export default {
  multipass: true, // boolean
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
        },
      },
      
    },
    'removeDimensions'
  ],
};