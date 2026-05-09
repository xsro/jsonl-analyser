/** @type {import("prettier").Config} */
module.exports={
  // 每行最大字符数
  printWidth: 100,
  // 缩进空格数
  tabWidth: 2,
  // 用空格而非 tab
  useTabs: false,
  // 语句末尾加分号
  semi: true,
  // 优先单引号
  singleQuote: true,
  // 数组/对象尾逗号（ES5 兼容）
  trailingComma: "es5",
  // 对象括号内侧空格
  bracketSpacing: true,
  // 箭头函数参数括号（单个参数时省略）
  arrowParens: "avoid",
  // 换行符统一为 LF
  endOfLine: "lf",
  // 针对 TS 文件强制用 typescript 解析器
  overrides: [
    {
      files: "*.ts",
      options: { parser: "typescript" }
    }
  ]
};