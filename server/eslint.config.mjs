import antfu from '@antfu/eslint-config';

export default antfu({
  // 开启格式化工具
  formatters: true,
  rules: {
    // 禁用对TypeScript中一致类型导入的强制要求
    'ts/consistent-type-imports': 'off',
    // 要求使用2个空格作为缩进，switch语句中的case子句也应该额外缩进2个空格
    'style/indent': ['error', 2, { SwitchCase: 2 }],
    // 要求使用单引号来包围字符串
    'style/quotes': ['error', 'single'],
    // 要求每个语句的末尾必须有分号
    'style/semi': ['error', 'always'],
    // 禁用对使用new Error()抛出错误的检查
    'unicorn/throw-new-error': 'off',
    // 关闭对使用严格等于(===)和严格不等于(!==)的强制要求
    'eqeqeq': 'off',
    // 关闭对在Node.js中优先使用全局process对象的检查
    'node/prefer-global/process': 'off',
    // 要求如果语句占用多行，则必须使用大括号包围，单行语句可以省略大括号
    'curly': ['error', 'multi-line'],
    // 要求如果函数参数数量至少为3，则参数必须每个占一行
    'function-paren-newline': ['error', { minItems: 4 }],
    // 要求在对象字面量、导入声明、导出声明中，如果是单行，则不允许在大括号内换行
    'object-curly-newline': ['error', { ImportDeclaration: 'never', ExportDeclaration: 'never' }],
    // 配置大括号风格
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
    // 同上，但适用于特定的代码风格规则
    'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    // 关闭对在Node.js中优先使用全局Buffer对象的检查
    'node/prefer-global/buffer': 'off',
    // 关闭case必须有大括号包围的检查
    'no-case-declarations': 'off',
    // 关闭对未使用的表达式的检查
    'ts/no-unused-expressions': 'off',
    // 关闭对使用不安全的函数类型的检查
    'ts/no-unsafe-function-type': 'off',
    // 关闭对单行最大语句数量的检查
    'style/max-statements-per-line': 'off',
  },
  ignores: ['**/prisma-client'],
});
