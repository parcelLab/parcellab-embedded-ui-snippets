module.exports = {
  content: [`${__dirname}/index.html`, `${__dirname}/main.js`],
  theme: {
    "extend": {
      "colors": {
        "navy": {
          "50": "#f5f7fa",
          "100": "#eaeef4",
          "200": "#d4dcea",
          "300": "#a8b8d0",
          "400": "#7a93b4",
          "500": "#41536f",
          "600": "#2d3e58",
          "700": "#1e2f48",
          "800": "#10203c",
          "900": "#0b1729"
        },
        "brand": {
          "DEFAULT": "#3D3AD3",
          "light": "#ededfc",
          "dark": "#2e2ba5"
        }
      }
    }
  }
};
