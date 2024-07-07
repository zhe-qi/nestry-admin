import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwindcss,
    autoprefixer,
    {
      postcssPlugin: 'internal:charset-removal',
      AtRule: {
        charset: (atRule) => {
          if (atRule.name === 'charset') {
            atRule.remove();
          }
        },
      },
    },
  ],
};
