import next from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...next,
  ...nextTs,
  {
    ignores: ["node_modules/**", ".next/**", "lib/db/migrations/**"],
  },
];

export default eslintConfig;
