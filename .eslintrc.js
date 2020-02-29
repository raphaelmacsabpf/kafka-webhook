module.exports = {
    "env": {
        "browser": false,
        "commonjs": true,
        "es6": true,
        "node": true
    },
    "extends": ["eslint:recommended", "prettier"],
    "plugins": ["prettier"],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "prettier/prettier": [
            "error",
            {
              singleQuote: true, 
              trailingComma: 'all',
              tabWidth: 4,
            },
        ],
        "semi": ["error", "always"],
        "quotes": [2, "single", { "avoidEscape": true }],
        "no-unused-vars": ["error", { "vars": "all", "args": "none"}],
        "eol-last": ["error", "always"],
        "no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 0 }],
    },
};
