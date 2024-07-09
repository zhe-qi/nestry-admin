const { execSync } = require('node:child_process');
const { readFileSync, writeFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const _ = require('lodash');

const prismaPath = join(__dirname, '../../../prisma/introspected.prisma');

function runPrismaCommand(command) {
  execSync(`npx prisma ${command}`);
}

function toPascalCase(str = '') {
  return str[0].toUpperCase() + _.camelCase(str).slice(1);
}

function generatePrismaModel() {
  try {
    if (existsSync(prismaPath)) {
      throw new Error(`${prismaPath} 文件已存在！`);
    }
    runPrismaCommand('db pull');
    if (!existsSync(prismaPath)) {
      runPrismaCommand('generate');
      return;
    }
    let content = readFileSync(prismaPath, 'utf8').replaceAll(/\/\/\/.*\n/g, '');
    if (!content) { return; }

    content = content.replace(/model\s([a-zA-Z-_]+)\s\{([^}]+)\}/g, (
      match,
      modelName,
      modelBody,
    ) => {
      const formattedModelName = toPascalCase(modelName);
      // eslint-disable-next-line regexp/no-misleading-capturing-group, regexp/optimal-quantifier-concatenation
      const formattedModelBody = modelBody.replace(/^\s*([a-z-_]+)[^\n]+/gim, (fieldMatch, fieldName) => {
        return `${fieldMatch.replace(fieldName, _.camelCase(fieldName))}  @map("${fieldName}")`;
      }).replace(/\[([^\]]+)\]/g, (relationMatch, relationFields) => {
        return `[${relationFields.split(',').map(v => _.camelCase(v.trim())).join(',')}]`;
      });
      return `model ${formattedModelName}  {\n${formattedModelBody}\n  @@map("${modelName}")\n}`;
    });

    writeFileSync(prismaPath, content);
    runPrismaCommand('generate');
  } catch (error) {
    console.error('Prisma 代码生成失败：', error);
  }
}

function updatePrismaModel() {
  runPrismaCommand('db pull');
  runPrismaCommand('generate');
}

function main() {
  const mode = process.argv[2] || '-generate';
  // eslint-disable-next-line no-console
  console.log(`${mode === '-update' ? '更新' : '生成'}中...`);
  mode === '-update' ? updatePrismaModel() : generatePrismaModel();
  // eslint-disable-next-line no-console
  console.log('操作完毕！');
  setTimeout(() => process.exit(0), 500);
}

main();
